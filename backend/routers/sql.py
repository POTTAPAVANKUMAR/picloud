import time
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from driver import driver
from config import settings

router = APIRouter(prefix="/api/sql", tags=["SQL & Managed Databases"])

class QueryRequest(BaseModel):
    query: str
    database: Optional[str] = None

class CreateDbRequest(BaseModel):
    name: str

@router.get("/instances")
def get_db_instance():
    """Get metadata and operational status of the managed PostgreSQL instance."""
    # Check if picloud-db container is active
    res = driver.execute(f"docker inspect --format '{{{{.State.Status}}}}' {settings.PG_CONTAINER}")
    status = res["stdout"].strip() if res["success"] else "stopped"
    
    version_res = driver.run_sql("SELECT version();")
    version = version_res["stdout"].split("\n")[2].strip() if version_res["success"] and len(version_res["stdout"].split("\n")) > 2 else "PostgreSQL (Containerized)"
    
    return {
        "instance_id": settings.PG_CONTAINER,
        "engine": "PostgreSQL",
        "version": version,
        "status": status,
        "host": "localhost",
        "port": 5432,
        "default_user": settings.PG_USER,
        "default_db": settings.PG_DB,
        "adminer_url": "https://postgresql.pottapk.win"
    }

@router.get("/databases")
def list_databases():
    """List all user databases on the PostgreSQL server with sizes and connection counts."""
    return driver.list_pg_databases()

@router.post("/databases")
def create_database(req: CreateDbRequest):
    """Create a new PostgreSQL database."""
    # Validate DB name: only alphanumeric and underscores
    clean_name = "".join(c for c in req.name if c.isalnum() or c == "_")
    if not clean_name:
        raise HTTPException(status_code=400, detail="Invalid database name")
    
    query = f"CREATE DATABASE {clean_name};"
    res = driver.run_sql(query, database="postgres")
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to create database")
    return {"status": "created", "database": clean_name}

@router.delete("/databases/{name}")
def drop_database(name: str):
    """Drop a PostgreSQL database."""
    if name in ("postgres", "template0", "template1"):
        raise HTTPException(status_code=400, detail=f"Cannot drop system database '{name}'")
    
    clean_name = "".join(c for c in name if c.isalnum() or c == "_")
    query = f"DROP DATABASE IF EXISTS {clean_name};"
    res = driver.run_sql(query, database="postgres")
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to drop database")
    return {"status": "dropped", "database": clean_name}

@router.get("/tables")
def list_tables(database: Optional[str] = None):
    """List all public tables inside the chosen database with sizes."""
    db = database or settings.PG_DB
    return driver.list_pg_tables(database=db)

@router.post("/query")
def execute_query(req: QueryRequest):
    """Execute arbitrary SQL query against the selected database."""
    start_time = time.time()
    res = driver.run_sql(req.query, database=req.database or settings.PG_DB)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    
    if not res["success"]:
        return {
            "success": False,
            "error": res.get("stderr") or "SQL execution error",
            "duration_ms": duration_ms
        }
    
    return {
        "success": True,
        "output": res["stdout"],
        "duration_ms": duration_ms
    }

@router.get("/connection-strings")
def get_connection_strings(database: Optional[str] = None):
    """Generate ready-to-copy connection strings for various language frameworks."""
    db = database or settings.PG_DB
    user = settings.PG_USER
    pwd = settings.PG_PASSWORD
    pi_ip = settings.RPI_HOST
    port = 5432
    
    return {
        "uri": f"postgresql://{user}:{pwd}@{pi_ip}:{port}/{db}",
        "psql_cli": f"PGPASSWORD='{pwd}' psql -h {pi_ip} -p {port} -U {user} -d {db}",
        "docker_psql": f"docker exec -it {settings.PG_CONTAINER} psql -U {user} -d {db}",
        "python_asyncpg": f"postgresql+asyncpg://{user}:{pwd}@{pi_ip}:{port}/{db}",
        "prisma": f'DATABASE_URL="postgresql://{user}:{pwd}@{pi_ip}:{port}/{db}?schema=public"',
        "dotnet": f"Host={pi_ip};Port={port};Database={db};Username={user};Password={pwd};",
        "node_pg": {
            "user": user,
            "host": pi_ip,
            "database": db,
            "password": pwd,
            "port": port
        }
    }

@router.post("/backup")
def create_backup(database: Optional[str] = None):
    """Execute pg_dump to produce an instantaneous snapshot."""
    db = database or settings.PG_DB
    timestamp = int(time.time())
    backup_file = f"/tmp/backup_{db}_{timestamp}.sql"
    cmd = f"docker exec -i {settings.PG_CONTAINER} pg_dump -U {settings.PG_USER} -d {db} > {backup_file}"
    res = driver.execute(cmd)
    
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Backup creation failed")
    
    return {
        "status": "success",
        "file": backup_file,
        "database": db,
        "timestamp": timestamp
    }
