from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title="Campus Carpool API",
    description="College-only carpooling platform API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.on_event("startup")
def on_startup():
    if settings.ENVIRONMENT != "testing":
        from app.core.database import Base, engine
        import app.models  # ensure models are registered
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            print(f"[DB Notice] Auto-create tables skipped or failed: {e}")


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Campus Carpool API"}


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"[SERVER ERROR] {request.method} {request.url.path}: {exc}")
    msg = str(exc) if settings.ENVIRONMENT != "production" else "An unexpected error occurred"
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": msg}},
    )
