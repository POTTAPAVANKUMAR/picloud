from fastapi import APIRouter
from driver import driver

router = APIRouter(prefix="/api/hardware", tags=["Raspberry Pi Hardware Telemetry"])

@router.get("/diagnostics")
def get_hardware_diagnostics():
    """Retrieve deep hardware telemetry, vcgencmd throttling flags, clocks and voltage."""
    return driver.get_pi_hardware()
