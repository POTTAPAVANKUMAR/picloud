from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from driver import driver

router = APIRouter(prefix="/api/compose", tags=["Docker Compose Stacks"])

class ComposeActionRequest(BaseModel):
    path: str
    action: str  # up, down, restart, pull

class SaveComposeRequest(BaseModel):
    path: str
    content: str

@router.get("/stacks")
def list_compose_stacks():
    """List all discoverable docker compose stacks on the Pi."""
    return driver.list_compose_stacks()

@router.get("/file")
def get_compose_file(path: str):
    """Get content of a docker-compose.yml file."""
    res = driver.get_compose_file(path)
    if not res["success"]:
        raise HTTPException(status_code=404, detail=res.get("error") or "File not found")
    return res

@router.post("/file")
def save_compose_file(req: SaveComposeRequest):
    """Save content of a docker-compose.yml file."""
    res = driver.save_compose_file(req.path, req.content)
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to save compose file")
    return {"status": "saved"}

@router.post("/action")
def control_compose_stack(req: ComposeActionRequest):
    """Trigger compose up, down, restart, pull."""
    res = driver.control_compose_stack(req.path, req.action)
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Action failed")
    return {
        "status": "success",
        "action": req.action,
        "stdout": res["stdout"],
        "stderr": res["stderr"]
    }
