from fastapi import APIRouter, HTTPException, Query
from driver import driver
from typing import Optional

router = APIRouter(prefix="/api/system", tags=["System & Infrastructure"])

@router.get("/stats")
def get_system_stats():
    """Retrieve full hardware telemetry, temperatures, memory, and CPU metrics."""
    return driver.get_system_telemetry()

@router.get("/services")
def get_system_services():
    """List systemd services and active states."""
    return driver.get_services_status()

@router.post("/services/{service}/{action}")
def control_service(service: str, action: str):
    """Start, stop, or restart a system service (e.g. cloudflared, docker)."""
    res = driver.service_action(service, action)
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Action failed")
    return res

@router.get("/journal")
def get_journal_logs(service: Optional[str] = "cloudflared", lines: int = Query(default=100, le=500)):
    """Fetch live journalctl logs for system service."""
    cmd = f"journalctl -u {service} -n {lines} --no-pager 2>&1"
    res = driver.execute(cmd)
    return {
        "service": service,
        "logs": res["stdout"] if res["success"] else res["stderr"]
    }

@router.post("/power/{action}")
def trigger_power(action: str):
    """Trigger system reboot or shutdown."""
    if action == "reboot":
        res = driver.execute("sudo reboot")
        return {"status": "reboot initiated", "result": res}
    elif action == "shutdown":
        res = driver.execute("sudo shutdown -h now")
        return {"status": "shutdown initiated", "result": res}
    raise HTTPException(status_code=400, detail="Invalid power action. Use 'reboot' or 'shutdown'.")
