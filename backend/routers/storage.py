from fastapi import APIRouter, HTTPException
from driver import driver
from typing import Dict, Any

router = APIRouter(prefix="/api/storage", tags=["Storage & Disks"])

@router.get("/info")
def get_storage():
    """Retrieve host mount points, NVMe SSD usage, and Docker disk footprint."""
    return driver.get_storage_info()

@router.get("/volumes")
def list_volumes():
    """List Docker storage volumes."""
    res = driver.execute("docker volume ls --format '{{json .}}'")
    volumes = []
    if res["success"] and res["stdout"].strip():
        import json
        for line in res["stdout"].strip().split("\n"):
            try:
                volumes.append(json.loads(line))
            except Exception:
                pass
    return volumes

@router.post("/prune")
def prune_storage():
    """Execute Docker System Prune to reclaim disk space from unused layers & caches."""
    res = driver.docker_prune()
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("error") or "Prune failed")
    return res

@router.delete("/volumes/{name}")
def remove_volume(name: str):
    """Remove a Docker volume."""
    res = driver.execute(f"docker volume rm {name}")
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to remove volume")
    return {"status": "removed", "volume": name}
