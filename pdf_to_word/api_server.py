import os
import shutil
import logging
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from pdf_converter import PDFToWordConverter, LogManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF to Word Converter", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

converter = PDFToWordConverter(output_dir=str(OUTPUT_DIR))
log_manager = LogManager(logs_dir=str(OUTPUT_DIR / "logs"))

ORIGINAL_DIR = OUTPUT_DIR / "original"
CONVERTED_DIR = OUTPUT_DIR / "converted"
ORIGINAL_DIR.mkdir(parents=True, exist_ok=True)
CONVERTED_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the main HTML page"""
    html_path = BASE_DIR / "index.html"
    if html_path.exists():
        return HTMLResponse(content=html_path.read_text(encoding="utf-8"), status_code=200)
    return HTMLResponse(content="<h1>PDF to Word Converter</h1><p>index.html not found</p>", status_code=404)


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and process file
    Supports drag-and-drop from Word plugin
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        file_path = Path(file.filename)
        ext = file_path.suffix.lower()

        if ext not in ['.pdf', '.doc', '.docx']:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}. Only PDF and Word files are supported."
            )

        original_path = ORIGINAL_DIR / file.filename
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        logger.info(f"File uploaded: {file.filename}")
        log_manager.log_operation("upload", file.filename, "success", f"Saved to {original_path}")

        if ext == '.pdf':
            return await process_pdf_file(file.filename, original_path)
        else:
            return await process_word_file(file.filename, original_path)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        log_manager.log_operation("upload", file.filename if 'file' in dir() else "unknown", "failed", str(e))
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


async def process_pdf_file(original_filename: str, original_path: Path):
    """Process PDF file - convert to Word"""
    try:
        success, output_path, message = converter.convert_pdf_to_word(str(original_path))

        if success:
            log_manager.log_operation("convert", original_filename, "success", message)
            converted_filename = Path(output_path).name
            return JSONResponse({
                "success": True,
                "type": "pdf_converted",
                "original_file": original_filename,
                "converted_file": converted_filename,
                "message": message,
                "output_path": str(output_path)
            })
        else:
            log_manager.log_operation("convert", original_filename, "failed", message)
            return JSONResponse({
                "success": False,
                "type": "pdf_converted",
                "original_file": original_filename,
                "message": message
            }, status_code=500)
    except Exception as e:
        logger.error(f"PDF processing error: {e}")
        log_manager.log_operation("convert", original_filename, "failed", str(e))
        return JSONResponse({
            "success": False,
            "message": str(e)
        }, status_code=500)


async def process_word_file(original_filename: str, original_path: Path):
    """Process Word file - extract text for search"""
    try:
        from docx import Document
        doc = Document(str(original_path))
        text_content = []
        for para in doc.paragraphs:
            if para.text.strip():
                text_content.append(para.text)

        full_text = "\n".join(text_content)
        log_manager.log_operation("process_word", original_filename, "success", f"Extracted {len(full_text)} characters")

        return JSONResponse({
            "success": True,
            "type": "word_processed",
            "original_file": original_filename,
            "text_length": len(full_text),
            "preview": full_text[:500] if len(full_text) > 500 else full_text,
            "message": "Word file processed successfully"
        })
    except Exception as e:
        logger.error(f"Word processing error: {e}")
        log_manager.log_operation("process_word", original_filename, "failed", str(e))
        return JSONResponse({
            "success": False,
            "message": str(e)
        }, status_code=500)


@app.get("/api/status")
async def get_status():
    """Get converter status and output directories"""
    return JSONResponse({
        "status": "running",
        "libraries": {
            "pdf2docx": converter.pdf2docx_AVAILABLE if hasattr(converter, 'pdf2docx_AVAILABLE') else False,
            "PyPDF2": converter.PYPDF2_AVAILABLE if hasattr(converter, 'PYPDF2_AVAILABLE') else False
        },
        "output_dirs": converter.get_output_dirs()
    })


@app.get("/api/logs")
async def get_logs(limit: int = 50):
    """Get recent operation logs"""
    logs = log_manager.get_recent_logs(limit=limit)
    return JSONResponse({
        "logs": logs
    })


@app.get("/api/files")
async def list_files():
    """List all processed files"""
    original_files = [f.name for f in ORIGINAL_DIR.glob("*")]
    converted_files = [f.name for f in CONVERTED_DIR.glob("*")]

    return JSONResponse({
        "original_files": original_files,
        "converted_files": converted_files
    })


if __name__ == "__main__":
    port = 8765
    logger.info(f"Starting PDF to Word Converter on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
