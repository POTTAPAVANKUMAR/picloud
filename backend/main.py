from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import system, apps, sql, networking, storage, terminal
from config import settings

app = FastAPI(
    title="PiCloud Management Console API",
    description="Enterprise-grade control plane API for Raspberry Pi - Private Edge Cloud",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Modular Routers
app.include_router(system.router)
app.include_router(apps.router)
app.include_router(sql.router)
app.include_router(networking.router)
app.include_router(storage.router)
app.include_router(terminal.router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "PiCloud Management Console API",
        "mode": settings.EXEC_MODE,
        "target_host": settings.RPI_HOST
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
