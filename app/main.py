import queue
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db import init_db
from app.routers import health, documents, search, tools, settings as settings_router, study_plan
from app.services.faiss_store import ensure_index
from app.services.index_queue import start_index_worker
from pathlib import Path

STATIC_DIR = Path(__file__).parent / "static"

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DATABASE_URL:
        from app.db.postgres import init_pool, init_db_async, close_pool
        await init_pool()
        await init_db_async()
        app.state.use_postgres = True
    else:
        init_db()
        app.state.use_postgres = False
    ensure_index()
    app.state.executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="rag")
    index_queue: queue.Queue = queue.Queue()
    start_index_worker(index_queue)
    app.state.index_queue = index_queue
    try:
        yield
    finally:
        app.state.executor.shutdown(wait=False)
        if getattr(app.state, "use_postgres", False):
            from app.db.postgres import close_pool
            await close_pool()

app = FastAPI(title="AI RAG system", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(settings_router.router)
app.include_router(health.router)
app.include_router(documents.router)
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(tools.router)
app.include_router(study_plan.router)

@app.get("/")
def root():
    home = STATIC_DIR / "home.html"
    if home.exists():
        return FileResponse(home)
    return {"message": "Welcome to AI RAG system"}
