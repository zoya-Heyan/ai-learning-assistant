from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

STATIC_DIR = Path(__file__).parent.parent / "static"

PAGE_ROUTES = {
    "/documents": "documents.html",
    "/qa": "qa.html",
    "/questions": "questions.html",
    "/notes": "notes.html",
    "/analysis": "analysis.html",
    "/settings": "settings.html",
}


def make_page_handler(filename):
    async def page_route():
        return FileResponse(STATIC_DIR / filename)
    return page_route

for route_path, filename in PAGE_ROUTES.items():
    router.get(route_path)(make_page_handler(filename))
