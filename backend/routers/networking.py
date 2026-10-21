import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from driver import driver

router = APIRouter(prefix="/api/networking", tags=["Networking & Ingress"])

class IngressRouteRequest(BaseModel):
    hostname: str
    service_url: str

@router.get("/ingress")
def get_ingress_routes():
    """Retrieve all active Cloudflare Tunnel ingress routing rules."""
    config_info = driver.get_ingress_config()
    if "error" in config_info and "config" not in config_info:
        raise HTTPException(status_code=500, detail=config_info.get("error"))
    
    cfg = config_info.get("config", {})
    rules = []
    for r in cfg.get("ingress", []):
        rules.append({
            "hostname": r.get("hostname", "Fallback / Catch-all"),
            "service": r.get("service", ""),
            "is_fallback": "hostname" not in r
        })
    return {
        "path": config_info.get("path"),
        "tunnel_id": cfg.get("tunnel"),
        "rules": rules
    }

@router.post("/ingress")
def add_or_update_ingress_route(req: IngressRouteRequest):
    """Add or update a Cloudflare Tunnel ingress subdomain route and reload."""
    res = driver.add_ingress_route(req.hostname, req.service_url)
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("error") or "Failed to update ingress")
    return res

@router.delete("/ingress/{hostname}")
def delete_ingress_route(hostname: str):
    """Delete a Cloudflare Tunnel ingress route and reload."""
    res = driver.delete_ingress_route(hostname)
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("error") or "Failed to delete route")
    return res

@router.get("/ports")
def scan_ports():
    """Scan all listening TCP ports and identify processes and conflicts."""
    ports = driver.scan_listening_ports()
    # Match with running containers
    containers = driver.list_containers()
    for p in ports:
        port_num = p.get("port")
        # Check if container port maps here
        matched_containers = []
        for c in containers:
            if port_num and str(port_num) in str(c.get("ports", "")):
                matched_containers.append(c.get("name"))
        p["containers"] = matched_containers
    return ports

@router.post("/ports/kill/{pid}")
def kill_process_on_port(pid: int):
    """Terminate a process holding a port."""
    if pid <= 1:
        raise HTTPException(status_code=400, detail="Cannot kill system init PID")
    res = driver.execute(f"sudo kill -9 {pid}")
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or f"Failed to kill PID {pid}")
    return {"status": "killed", "pid": pid}

@router.get("/healthcheck")
async def check_endpoints():
    """Check live HTTPS response status for active subdomains."""
    cfg_info = driver.get_ingress_config()
    cfg = cfg_info.get("config", {})
    rules = [r for r in cfg.get("ingress", []) if "hostname" in r]
    
    results = []
    async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
        for r in rules:
            hostname = r.get("hostname")
            url = f"https://{hostname}"
            try:
                resp = await client.get(url)
                results.append({
                    "hostname": hostname,
                    "url": url,
                    "status_code": resp.status_code,
                    "alive": resp.status_code < 500
                })
            except Exception as e:
                results.append({
                    "hostname": hostname,
                    "url": url,
                    "status_code": 0,
                    "alive": False,
                    "error": str(e)
                })
    return results
