from fastapi import APIRouter
from pydantic import BaseModel
from driver import driver

router = APIRouter(prefix="/api/diagnostics", tags=["Network Diagnostics"])

class PingRequest(BaseModel):
    host: str
    count: int = 4

class DnsRequest(BaseModel):
    domain: str
    record_type: str = "A"

class CurlTestRequest(BaseModel):
    url: str

@router.post("/ping")
def ping_endpoint(req: PingRequest):
    """Ping a host or IP."""
    return driver.ping_host(req.host, req.count)

@router.post("/dns")
def dns_query(req: DnsRequest):
    """DNS lookup for domain."""
    return driver.dns_lookup(req.domain, req.record_type)

@router.post("/curl")
def curl_endpoint_test(req: CurlTestRequest):
    """Measure HTTP latency and TTFB."""
    return driver.curl_test(req.url)

@router.get("/network-info")
def get_network_interfaces():
    """Get IP interfaces, gateway, and public IP."""
    return driver.get_network_interfaces()
