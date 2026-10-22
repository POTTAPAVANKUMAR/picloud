from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from driver import driver

router = APIRouter(prefix="/api/cron", tags=["Cron & Scheduled Tasks"])

class AddCronRequest(BaseModel):
    schedule: str
    command: str

class DeleteCronRequest(BaseModel):
    raw_line: str

class RunCronRequest(BaseModel):
    command: str

@router.get("")
def list_cron_jobs():
    """List all scheduled crontab jobs."""
    return driver.get_cron_jobs()

@router.post("")
def add_cron_job(req: AddCronRequest):
    """Create a new cron job."""
    if not req.schedule.strip() or not req.command.strip():
        raise HTTPException(status_code=400, detail="Schedule and command are required.")
    res = driver.add_cron_job(req.schedule, req.command)
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to add cron job.")
    return {"status": "created", "job": f"{req.schedule} {req.command}"}

@router.delete("")
def delete_cron_job(req: DeleteCronRequest):
    """Delete a cron job."""
    res = driver.delete_cron_job(req.raw_line)
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Failed to delete cron job.")
    return {"status": "deleted"}

@router.post("/run")
def run_cron_job_now(req: RunCronRequest):
    """Run cron job command immediately for testing."""
    res = driver.run_cron_job(req.command)
    return {
        "stdout": res["stdout"],
        "stderr": res["stderr"],
        "exit_code": res["exit_code"],
        "success": res["success"]
    }
