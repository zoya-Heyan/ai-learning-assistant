"""
FAISS vector store: fast similarity search with incremental updates.
- Default: IVF Flat (IndexIVFFlat) over L2-normalized vectors (cosine similarity).
- Fallback to FlatIP when vector数量较少（未达 FAISS_MIN_TRAIN）或 faiss 不可用。
- Atomic snapshot: write to .tmp then rename; version file for process-level freshness.
- Incremental add_chunks_to_index(doc_id); full rebuild on delete/update.
- Thread-safe; other processes reload when on-disk version is newer.
"""
import json
import os
import threading
import time
from pathlib import Path
from typing import Any

import numpy as np

from app.core.config import settings

def _get_chunks_for_index():
    if settings.DATABASE_URL:
        from app.db.postgres_sync import get_all_chunks_with_document_info
        return get_all_chunks_with_document_info()
    from app.db.database import get_all_chunks_with_document_info
    return get_all_chunks_with_document_info()

def _get_chunks_by_doc_id(doc_id: int):
    if settings.DATABASE_URL:
        from app.db.postgres_sync import get_chunks_by_document_id
        return get_chunks_by_document_id(doc_id)
    from app.db.database import get_chunks_by_document_id
    return get_chunks_by_document_id(doc_id)

try:
    import faiss
except ImportError:
    faiss = None

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
INDEX_PATH = DATA_DIR / "rag.faiss"
META_PATH = DATA_DIR / "rag_meta.json"
VERSION_PATH = DATA_DIR / "rag_index_version.txt"

_lock = threading.Lock()
_index: Any = None
_chunk_infos: list[dict[str, Any]] = []
_last_loaded_version: float = 0.0


def _normalize(vec: np.ndarray) -> np.ndarray:
    n = np.linalg.norm(vec)
    if n <= 0:
        return vec
    return vec.astype(np.float32) / n


def _chunk_info_row(ch: dict[str, Any]) -> dict[str, Any]:
    return {
        "chunk_id": ch["id"],
        "document_id": ch["document_id"],
        "chunk_index": ch["chunk_index"],
        "document_title": ch["document_title"],
        "content": ch["content"],
    }


def _save_index_atomic(index: Any, chunk_infos: list[dict[str, Any]]) -> None:
    """Write index and meta to .tmp then atomic rename; bump version file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    index_tmp = INDEX_PATH.with_suffix(INDEX_PATH.suffix + ".tmp")
    meta_tmp = META_PATH.with_suffix(META_PATH.suffix + ".tmp")
    version = time.time()
    if faiss is not None:
        faiss.write_index(index, str(index_tmp))
    meta = {"chunk_count": len(chunk_infos), "chunk_infos": chunk_infos}
    meta_tmp.write_text(json.dumps(meta, ensure_ascii=False), encoding="utf-8")
    if faiss is not None and index_tmp.exists():
        os.replace(index_tmp, INDEX_PATH)
    os.replace(meta_tmp, META_PATH)
    VERSION_PATH.write_text(str(version), encoding="utf-8")


def _load_version_from_disk() -> float:
    if not VERSION_PATH.exists():
        return 0.0
    try:
        return float(VERSION_PATH.read_text(encoding="utf-8").strip())
    except (ValueError, OSError):
        return 0.0


def build_index_from_db() -> bool:
    global _index, _chunk_infos, _last_loaded_version
    if faiss is None:
        return False
    chunks = _get_chunks_for_index()
    chunks = [c for c in chunks if c.get("embedding")]
    if not chunks:
        _index = None
        _chunk_infos = []
        _last_loaded_version = 0.0
        return False
    dim = settings.EMBEDDING_DIM
    vectors = np.array([c["embedding"] for c in chunks], dtype=np.float32)
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    vectors = (vectors / norms).astype(np.float32)

    # Choose index type: IVF for large collections, Flat for small.
    if len(chunks) >= settings.FAISS_MIN_TRAIN:
        # IVF Flat over inner-product (cosine on normalized vectors)
        quantizer = faiss.IndexFlatIP(dim)
        nlist = settings.FAISS_NLIST
        index = faiss.IndexIVFFlat(quantizer, dim, nlist, faiss.METRIC_INNER_PRODUCT)
        index.train(vectors)
        index.add(vectors)
        index.nprobe = settings.FAISS_NPROBE
    else:
        # Small dataset: keep exact search with FlatIP
        index = faiss.IndexFlatIP(dim)
        index.add(vectors)

    _chunk_infos = [_chunk_info_row(c) for c in chunks]
    _index = index
    _save_index_atomic(index, _chunk_infos)
    _last_loaded_version = _load_version_from_disk()
    return True


def load_index_from_disk() -> bool:
    global _index, _chunk_infos, _last_loaded_version
    if faiss is None or not INDEX_PATH.exists() or not META_PATH.exists():
        return False
    try:
        _index = faiss.read_index(str(INDEX_PATH))
        meta = json.loads(META_PATH.read_text(encoding="utf-8"))
        _chunk_infos = meta.get("chunk_infos", [])
        _last_loaded_version = _load_version_from_disk()
        return len(_chunk_infos) > 0
    except Exception:
        return False


def _reload_if_disk_newer() -> bool:
    """If on-disk version > in-memory, reload. Caller must hold _lock."""
    global _index, _chunk_infos, _last_loaded_version
    disk_ver = _load_version_from_disk()
    if disk_ver > _last_loaded_version and INDEX_PATH.exists() and META_PATH.exists():
        return load_index_from_disk()
    return False


def ensure_index() -> bool:
    """
    Ensure in-memory index is ready. Reload from disk if another process wrote a newer version.
    Thread-safe.
    """
    with _lock:
        _reload_if_disk_newer()
        if _index is not None and len(_chunk_infos) > 0:
            return True
        if load_index_from_disk():
            return True
        return build_index_from_db()


def rebuild_index() -> bool:
    """Full rebuild from DB and atomic save. Thread-safe."""
    with _lock:
        return build_index_from_db()


def add_chunks_to_index(doc_id: int) -> bool:
    """
    Incremental update: append chunks for one document to the index.
    Loads current index from disk if not in memory, then adds and saves atomically.
    Thread-safe. Returns True if chunks were added.
    """
    with _lock:
        if faiss is None:
            return False
        chunks = _get_chunks_by_doc_id(doc_id)
        chunks = [c for c in chunks if c.get("embedding")]
        if not chunks:
            return False
        dim = settings.EMBEDDING_DIM
        vectors = np.array([c["embedding"] for c in chunks], dtype=np.float32)
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1.0, norms)
        vectors = (vectors / norms).astype(np.float32)

        # Ensure we have a trained index. If没有索引则回退到全量重建（会根据数据规模选择 IVF/Flat）。
        if _index is None or len(_chunk_infos) == 0:
            # 尝试从磁盘加载；若仍无则全量重建
            if not load_index_from_disk():
                return build_index_from_db()

        # 追加向量到现有索引（IVF / Flat 均支持 add）
        _index.add(vectors)
        _chunk_infos.extend(_chunk_info_row(c) for c in chunks)
        _save_index_atomic(_index, _chunk_infos)
        _last_loaded_version = _load_version_from_disk()
        return True


def search(query_embedding: list[float], top_k: int) -> list[tuple[dict[str, Any], float]]:
    with _lock:
        if _index is None or not _chunk_infos:
            return []
        dim = settings.EMBEDDING_DIM
        q = np.array([query_embedding], dtype=np.float32)
        q = _normalize(q[0]).reshape(1, -1)
        k = min(top_k, _index.ntotal)
        if k <= 0:
            return []
        scores, indices = _index.search(q, k)
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(_chunk_infos):
                continue
            results.append((_chunk_infos[idx].copy(), float(scores[0][i])))
        return results


def get_index_stats() -> dict[str, Any]:
    with _lock:
        if _index is None:
            return {"ready": False, "ntotal": 0, "version": _last_loaded_version}
        return {"ready": True, "ntotal": _index.ntotal, "version": _last_loaded_version}
