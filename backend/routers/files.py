from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from driver import driver

router = APIRouter(prefix="/api/files", tags=["Cloud File Explorer & Editor"])

class SaveFileRequest(BaseModel):
    path: str
    content: str

class DeleteItemRequest(BaseModel):
    path: str

class CreateItemRequest(BaseModel):
    path: str
    is_dir: bool = False

@router.get("/list")
def list_directory(path: str = "/home/pavankumarpotta"):
    """List directory contents."""
    res = driver.list_directory(path)
    if not res.get("success", False):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to list directory"))
    return res

@router.get("/read")
def read_file(path: str):
    """Read file content."""
    res = driver.read_file(path)
    if not res.get("success", False):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to read file"))
    return res

@router.post("/save")
def save_file(req: SaveFileRequest):
    """Save content to file."""
    res = driver.save_file(req.path, req.content)
    if not res.get("success", False):
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to save file")
    return {"status": "saved", "path": req.path}

@router.delete("/delete")
def delete_item(req: DeleteItemRequest):
    """Delete file or directory."""
    res = driver.delete_item(req.path)
    if not res.get("success", False):
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to delete item")
    return {"status": "deleted", "path": req.path}

@router.post("/create")
def create_item(req: CreateItemRequest):
    """Create empty file or directory."""
    res = driver.create_item(req.path, req.is_dir)
    if not res.get("success", False):
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to create item")
    return {"status": "created", "path": req.path}
