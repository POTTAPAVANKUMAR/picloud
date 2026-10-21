import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    # Execution mode: "auto", "local", or "ssh"
    # In "auto", if running on Linux with /var/run/docker.sock it uses local; otherwise SSH to Pi.
    EXEC_MODE: str = os.getenv("EXEC_MODE", "auto")
    
    # Raspberry Pi connection info (for SSH remote mode)
    RPI_HOST: str = os.getenv("RPI_HOST", "192.168.1.151")
    RPI_USER: str = os.getenv("RPI_USER", "pavankumarpotta")
    RPI_SSH_PORT: int = int(os.getenv("RPI_SSH_PORT", "22"))
    RPI_KEY_PATH: str = os.getenv("RPI_KEY_PATH", os.path.expanduser("~/.ssh/id_rsa"))
    
    # PostgreSQL Configuration inside Docker
    PG_CONTAINER: str = os.getenv("PG_CONTAINER", "picloud-db")
    PG_USER: str = os.getenv("PG_USER", "picloud")
    PG_DB: str = os.getenv("PG_DB", "picloud")
    PG_PASSWORD: str = os.getenv("PG_PASSWORD", "Varunbike@1234")
    
    # Cloudflare Config Path on Pi
    CLOUDFLARED_CONFIG: str = os.getenv("CLOUDFLARED_CONFIG", "/etc/cloudflared/config.yml")
    CLOUDFLARED_USER_CONFIG: str = os.getenv("CLOUDFLARED_USER_CONFIG", "/home/pavankumarpotta/.cloudflared/config.yml")
    
    # Server port
    PORT: int = int(os.getenv("PORT", "5005"))

settings = Settings()
