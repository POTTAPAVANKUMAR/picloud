from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from driver import driver

router = APIRouter(prefix="/api/terminal", tags=["Cloud Shell"])

class CommandRequest(BaseModel):
    command: str
    timeout: int = 30

@router.post("/exec")
def execute_shell(req: CommandRequest):
    """Execute arbitrary shell command on the Raspberry Pi host."""
    res = driver.execute(req.command, timeout=req.timeout)
    return {
        "command": req.command,
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "exit_code": res["exit_code"],
        "success": res["success"]
    }
