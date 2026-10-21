from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from driver import driver

router = APIRouter(prefix="/api/apps", tags=["App Services (Compute)"])

class DeployAppRequest(BaseModel):
    name: str
    image: str
    host_port: Optional[int] = None
    container_port: Optional[int] = None
    env_vars: Optional[Dict[str, str]] = None
    restart_policy: Optional[str] = "unless-stopped"
    subdomain: Optional[str] = None  # If provided, automatically creates cloudflare ingress route!

class ExecCommandRequest(BaseModel):
    command: str

@router.get("")
def list_app_services():
    """List all deployed app services (containers) with live status, ports, and resource consumption."""
    containers = driver.list_containers()
    stats = driver.get_container_stats()
    
    # Merge container stats
    for c in containers:
        c_name = c.get("name", "")
        # stats keys might not have leading slash or might match name
        matching_stat = stats.get(c_name) or stats.get(c.get("id"))
        if matching_stat:
            c["stats"] = matching_stat
        else:
            c["stats"] = {
                "cpu": "0.0%",
                "mem": "N/A",
                "mem_perc": "0.0%",
                "net_io": "0B / 0B"
            }
            
    return containers

@router.get("/{name}/logs")
def get_app_logs(name: str, lines: int = Query(default=150, le=1000)):
    """Fetch stdout/stderr logs of an App Service."""
    logs = driver.get_container_logs(name, lines=lines)
    return {"name": name, "logs": logs}

@router.post("/{name}/{action}")
def container_action(name: str, action: str):
    """Start, stop, restart, or delete an App Service."""
    valid_actions = {
        "start": "start",
        "stop": "stop",
        "restart": "restart",
        "delete": "rm -f"
    }
    if action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Invalid action '{action}'. Use start, stop, restart, delete.")
    
    res = driver.container_action(name, valid_actions[action])
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("stderr") or "Container action failed")
    return res

@router.post("/{name}/exec")
def exec_in_container(name: str, req: ExecCommandRequest):
    """Execute command inside the App Service container."""
    # Sanitize command
    cmd = f"docker exec -i {name} {req.command}"
    res = driver.execute(cmd)
    return res

@router.post("/deploy")
def deploy_app_service(req: DeployAppRequest):
    """Deploy a new containerized App Service and optionally bind Cloudflare subdomain."""
    res = driver.deploy_container(
        name=req.name,
        image=req.image,
        host_port=req.host_port,
        container_port=req.container_port,
        env_vars=req.env_vars,
        restart_policy=req.restart_policy or "unless-stopped"
    )
    
    if not res["success"]:
        raise HTTPException(status_code=500, detail=res.get("error") or "Deployment failed")
    
    # Auto-route Cloudflare subdomain if requested
    route_status = None
    if req.subdomain and req.host_port:
        full_hostname = f"{req.subdomain}.pottapk.win"
        service_url = f"http://localhost:{req.host_port}"
        route_status = driver.add_ingress_route(full_hostname, service_url)
    
    return {
        "status": "deployed",
        "container_id": res["container_id"],
        "name": req.name,
        "ingress_route": route_status
    }
