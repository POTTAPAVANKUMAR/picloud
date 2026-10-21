# ☁️ PiCloud Management Console

An enterprise-grade, private edge cloud control plane for your Raspberry Pi (`192.168.1.151` / `pottapk.win`), modeled after **Azure Portal**, **AWS Management Console**, and **Google Cloud Platform (GCP)**.

---

## 🌟 Key Capabilities

### 1. 🚀 App Services (Compute & Containers)
* **One-Click Deployments**: Deploy apps using pre-configured templates (Next.js, Python FastAPI, Go microservices, Nginx static, Node.js) or any custom Docker image.
* **Service Management**: Start, stop, restart, inspect, and delete containers in real-time.
* **Live Telemetry & Logs**: Stream stdout/stderr container logs with regex filtering, auto-scroll, and export.
* **In-Container Execution**: Execute arbitrary commands directly inside running containers (`docker exec`).
* **Instant Ingress Binding**: Automatically bind new deployments to public Cloudflare subdomains (`app.pottapk.win`).

### 2. 🗄️ SQL & Managed Databases (PostgreSQL)
* **PostgreSQL Engine Explorer**: Discover containerized PostgreSQL (`picloud-db`) instances and active client connections.
* **Interactive SQL Studio**: Run queries (`SELECT`, `INSERT`, `UPDATE`, DDL) directly from your browser with query timing metrics.
* **Connection String Hub**: Instant pre-formatted connection strings with copy-to-clipboard for Node.js (`pg`), Python (`asyncpg`/`SQLAlchemy`), CLI (`psql`), Prisma ORM, and .NET.
* **Automated Snapshots**: Trigger 1-click `pg_dump` backups.
* **Single Sign-On Link**: Launch Adminer/pgAdmin web console (`postgresql.pottapk.win`).

### 3. 🌐 Virtual Network & Ingress Routing
* **Cloudflare Tunnel Ingress Manager**: View, add, and remove routing rules directly in `/etc/cloudflared/config.yml` with automated YAML syntax validation and zero-downtime service reload.
* **Port Radar & Conflict Inspector**: Visual scan of all open & listening TCP ports on the Pi (`lsof -iTCP -sTCP:LISTEN -P -n`), mapping each port to its PID, host user, and Docker container.
* **Process Terminator**: Terminate rogue or orphaned processes holding ports.
* **Edge Health Checker**: Dynamically test external HTTPS availability across all registered subdomains.

### 4. 💾 Disks & Persistent Storage
* **High-Speed NVMe SSD Gauges**: Monitor `/dev/nvme0n1p2` 1TB NVMe SSD storage space, usage percentages, and mount points.
* **Docker Disk Consumption**: Detailed breakdown of images, containers, volumes, and build cache.
* **1-Click Storage Reclaimer**: Safely run `docker system prune` to clear dangling layers and reclaim gigabytes of disk space.

### 5. 📈 Monitoring & System Services
* **Systemd Service Controller**: Start, stop, and restart core daemons (`cloudflared`, `docker`, `ssh`, `cron`).
* **Live Journalctl Streamer**: View live system journal logs for any service.
* **Thermal Health**: Monitor real-time Raspberry Pi 5 SoC temperatures (`vcgencmd measure_temp`) with thermal throttling indicators.
* **Host Power Actions**: Safe remote reboot and shutdown commands.

### 6. 💻 Pi Cloud Shell
* **In-Browser Web Terminal**: Direct SSH/Bash terminal connected to `pavankumarpotta@192.168.1.151`.
* **Command History**: Arrow up/down command history, exit code badges, and quick shortcut snippets (`docker ps`, `free -h`, `df -h`, `vcgencmd measure_temp`).

---

## 🛠️ Project Structure

```
picloud-portal/
├── backend/
│   ├── config.py                 # Configuration & environment variables
│   ├── driver.py                 # Hardware, Docker, PostgreSQL & SSH execution engine
│   ├── main.py                   # FastAPI application & router mounting
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Backend container definition
│   └── routers/
│       ├── system.py             # Hardware telemetry & systemd services
│       ├── apps.py               # App Services (Docker compute)
│       ├── sql.py                # PostgreSQL instances, queries & connection strings
│       ├── networking.py         # Cloudflare ingress & port radar
│       ├── storage.py            # NVMe SSD mounts & Docker prune
│       └── terminal.py           # Pi Cloud Shell execution
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js 16 app router
│   │   ├── components/           # UI components (Header, Sidebar, Search, Deploy, Shell, Logs)
│   │   │   └── views/            # Dashboard, Apps, SQL, Networking, Storage, Monitoring
│   │   └── lib/                  # TypeScript interfaces & API client
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml            # Multi-container production deployment
├── dev.sh                        # 1-Click local development script
└── deploy-to-pi.sh               # 1-Click deployment script to Raspberry Pi
```

---

## 🚀 Getting Started

### Local Development (Connects to Raspberry Pi via SSH)
```bash
cd /Users/pavankumarpotta/Workspace/picloud-portal
./dev.sh
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Raspberry Pi
```bash
cd /Users/pavankumarpotta/Workspace/picloud-portal
./deploy-to-pi.sh
```
Once deployed, open `http://192.168.1.151:3005` or route through Cloudflare tunnel to `https://console.pottapk.win`.
