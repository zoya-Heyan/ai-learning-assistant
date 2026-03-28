import asyncio
from typing import List

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from pydantic import BaseModel

from app.core.config import settings
from app.db import (
    get_all_documents,
    get_document_by_id,
    db_create_document,
    update_document,
    delete_document,
    delete_chunks_by_document_id,
    insert_chunks,
)
from app.schemas.response import APIResponse
from app.services.chunking import chunk_text
from app.services.embedding import get_embedding_async
from app.services.index_queue import enqueue_add_chunks, enqueue_rebuild_index

router = APIRouter(prefix="/documents", tags=["documents"])


def _use_postgres(request: Request) -> bool:
    return getattr(request.app.state, "use_postgres", False)


class DocumentSchema(BaseModel):
    id: int
    title: str
    content: str
    embedding: List[float] | None = None


class CreateDocumentSchema(BaseModel):
    title: str
    content: str


class UpdateDocumentSchema(BaseModel):
    title: str | None = None
    content: str | None = None


async def _embed_chunks_concurrent(texts: list[str]) -> list[list[float]]:
    """Embed multiple texts concurrently with rate limit (semaphore)."""
    sem = asyncio.Semaphore(settings.EMBEDDING_CONCURRENCY)

    async def one(text: str):
        async with sem:
            return await get_embedding_async(text)

    return await asyncio.gather(*[one(t) for t in texts])


async def _create_document_with_chunks(request: Request, title: str, content: str) -> dict:
    chunk_size = settings.CHUNK_SIZE
    overlap = settings.CHUNK_OVERLAP
    chunks_list = chunk_text(content, chunk_size=chunk_size, overlap=overlap)
    if not chunks_list:
        chunks_list = [content.strip() or content]
    try:
        chunk_embeddings = await _embed_chunks_concurrent(chunks_list)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Embedding error: {e}")
    chunk_rows = [(i, chunks_list[i], chunk_embeddings[i]) for i in range(len(chunks_list))]
    if _use_postgres(request):
        from app.db.postgres import create_document_async, insert_chunks_async
        doc = await create_document_async(title, content, None)
        await insert_chunks_async(doc["id"], chunk_rows)
    else:
        loop = asyncio.get_event_loop()
        executor = request.app.state.executor
        doc = await loop.run_in_executor(
            executor,
            lambda: db_create_document(title=title, content=content, embedding=None),
        )
        await loop.run_in_executor(executor, lambda: insert_chunks(doc["id"], chunk_rows))
    enqueue_add_chunks(request.app.state.index_queue, doc["id"])
    return doc


@router.post("/", response_model=DocumentSchema)
async def create_document(request: Request, body: CreateDocumentSchema):
    doc = await _create_document_with_chunks(request, body.title, body.content)
    return DocumentSchema(**doc)


_MAX_DOCX_BYTES = 20 * 1024 * 1024


@router.post("/import-docx", response_model=DocumentSchema)
async def import_docx(request: Request, file: UploadFile = File(...)):
    """Upload a .docx file; extract text server-side and create a document (chunk + embed + index)."""
    name = (file.filename or "").strip()
    if not name.lower().endswith(".docx"):
        raise HTTPException(status_code=400, detail="请上传 .docx 文件")
    data = await file.read()
    if len(data) > _MAX_DOCX_BYTES:
        raise HTTPException(status_code=400, detail="文件过大（上限 20MB）")
    if not data:
        raise HTTPException(status_code=400, detail="空文件")

    loop = asyncio.get_event_loop()
    executor = request.app.state.executor

    def _parse() -> str:
        from app.services.docx_text import extract_plain_text_from_docx

        return extract_plain_text_from_docx(data)

    try:
        text = await loop.run_in_executor(executor, _parse)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"无法解析 docx：{e}") from e
    if not text.strip():
        raise HTTPException(status_code=400, detail="文档中未解析到有效文本")

    base = name.rsplit("/", 1)[-1]
    title = base[:-5] if base.lower().endswith(".docx") else base
    title = title.strip() or "未命名"

    doc = await _create_document_with_chunks(request, title, text)
    return DocumentSchema(**doc)


@router.post("/import-file", response_model=DocumentSchema)
async def import_file(request: Request, file: UploadFile = File(...)):
    """Upload .docx or .pdf file; extract text and create document.
    For PDF files, automatically convert to Word first.
    """
    name = (file.filename or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = name.lower().split('.')[-1]
    if ext not in ('docx', 'pdf'):
        raise HTTPException(status_code=400, detail="Only .docx and .pdf files are supported")

    data = await file.read()
    if len(data) > _MAX_DOCX_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    loop = asyncio.get_event_loop()
    executor = request.app.state.executor

    def _parse() -> str:
        if ext == 'docx':
            from app.services.docx_text import extract_plain_text_from_docx
            return extract_plain_text_from_docx(data)
        else:
            import tempfile
            import os
            try:
                from pdf2docx import Converter
                has_pdf2docx = True
            except ImportError:
                has_pdf2docx = False

            if has_pdf2docx:
                with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_pdf:
                    tmp_pdf.write(data)
                    tmp_pdf_path = tmp_pdf.name

                with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp_docx:
                    tmp_docx_path = tmp_docx.name

                try:
                    cv = Converter(tmp_pdf_path)
                    cv.convert(tmp_docx_path, start=0, end=None)
                    cv.close()

                    with open(tmp_docx_path, 'rb') as f:
                        docx_data = f.read()

                    from app.services.docx_text import extract_plain_text_from_docx
                    text = extract_plain_text_from_docx(docx_data)
                    return text
                finally:
                    try:
                        os.unlink(tmp_pdf_path)
                    except:
                        pass
                    try:
                        os.unlink(tmp_docx_path)
                    except:
                        pass
            else:
                from PyPDF2 import PdfReader
                import io
                reader = PdfReader(io.BytesIO(data))
                text_parts = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                return '\n\n'.join(text_parts)

    try:
        text = await loop.run_in_executor(executor, _parse)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {e}") from e

    if not text.strip():
        raise HTTPException(status_code=400, detail="No valid text extracted from file")

    base = name.rsplit("/", 1)[-1]
    if base.lower().endswith(('.docx', '.pdf')):
        title = base.rsplit('.', 1)[0]
    else:
        title = base
    title = title.strip() or "未命名"

    doc = await _create_document_with_chunks(request, title, text)
    return DocumentSchema(**doc)


@router.get("/", response_model=APIResponse)
async def list_documents(request: Request):
    if _use_postgres(request):
        from app.db.postgres import get_all_documents_async
        docs = await get_all_documents_async()
    else:
        docs = await asyncio.get_event_loop().run_in_executor(
            request.app.state.executor, get_all_documents
        )
    return APIResponse(success=True, data=docs)


@router.get("/{id}", response_model=DocumentSchema)
async def get_document(request: Request, id: int):
    if _use_postgres(request):
        from app.db.postgres import get_document_by_id_async
        doc = await get_document_by_id_async(id)
    else:
        doc = await asyncio.get_event_loop().run_in_executor(
            request.app.state.executor, lambda: get_document_by_id(id)
        )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentSchema(**doc)


@router.put("/{id}", response_model=DocumentSchema)
async def update_document_route(request: Request, id: int, body: UpdateDocumentSchema):
    if _use_postgres(request):
        from app.db.postgres import (
            get_document_by_id_async,
            update_document_async,
            delete_chunks_by_document_id_async,
            insert_chunks_async,
        )
        doc = await get_document_by_id_async(id)
    else:
        doc = await asyncio.get_event_loop().run_in_executor(
            request.app.state.executor, lambda: get_document_by_id(id)
        )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    updates = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.content is not None:
        updates["content"] = body.content
        chunk_size = settings.CHUNK_SIZE
        overlap = settings.CHUNK_OVERLAP
        chunks_list = chunk_text(body.content, chunk_size=chunk_size, overlap=overlap)
        if not chunks_list:
            chunks_list = [body.content.strip() or body.content]
        try:
            chunk_embeddings = await _embed_chunks_concurrent(chunks_list)
        except ValueError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Embedding error: {e}")
        chunk_rows = [(i, chunks_list[i], chunk_embeddings[i]) for i in range(len(chunks_list))]
        if _use_postgres(request):
            await delete_chunks_by_document_id_async(id)
            await insert_chunks_async(id, chunk_rows)
        else:
            def _replace():
                delete_chunks_by_document_id(id)
                insert_chunks(id, chunk_rows)
            await asyncio.get_event_loop().run_in_executor(
                request.app.state.executor, _replace
            )
        enqueue_rebuild_index(request.app.state.index_queue)
    if not updates:
        return DocumentSchema(**doc)
    if _use_postgres(request):
        updated = await update_document_async(
            id, title=updates.get("title"), content=updates.get("content"), embedding=None
        )
    else:
        updated = await asyncio.get_event_loop().run_in_executor(
            request.app.state.executor,
            lambda: update_document(
                id,
                title=updates.get("title"),
                content=updates.get("content"),
                embedding=None,
            ),
        )
    return DocumentSchema(**updated)


@router.delete("/{id}", status_code=204)
async def delete_document_route(request: Request, id: int):
    if _use_postgres(request):
        from app.db.postgres import delete_document_async
        ok = await delete_document_async(id)
    else:
        ok = await asyncio.get_event_loop().run_in_executor(
            request.app.state.executor, lambda: delete_document(id)
        )
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found")
    enqueue_rebuild_index(request.app.state.index_queue)
