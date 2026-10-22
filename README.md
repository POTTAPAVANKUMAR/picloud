# ☁️ Potta Cloud Management Console

An enterprise-grade, private edge cloud control plane for your Raspberry Pi 5 (`192.168.1.151` / `pottapk.win`), modeled after **Microsoft Azure Portal**, **AWS Management Console**, and **Google Cloud Platform (GCP)**.

Built with **Angular 17**, **Bootstrap 5.3**, and **Python FastAPI**, featuring native **Dark Mode** and **Light Mode**.

---

## 🌟 Key Capabilities

### 1. 🚀 App Services (Compute & Containers)
* **One-Click Deployments**: Deploy apps using pre-configured templates (Next.js, Python FastAPI, Go microservices, Nginx static, Node.js) or any custom Docker image.
* **Service Lifecycle**: Start, stop, restart, inspect, and delete containers in real-time.
* **Live Telemetry & Logs**: Stream stdout/stderr container logs with regex filtering, auto-scroll, and export.
* **In-Container Execution**: Execute arbitrary commands directly inside running containers (`docker exec`).
* **Instant Ingress Binding**: Automatically bind new deployments to public Cloudflare subdomains (`app.pottapk.win`).

### 2. 🗄️ SQL & Managed Databases (PostgreSQL)
* **PostgreSQL Engine Explorer**: Discover containerized PostgreSQL (`picloud-db`) instances and active client connections.
* **Interactive SQL Studio**: Run queries (`SELECT`, `INSERT`, `UPDATE`, DDL) directly from your browser with query timing metrics.
* **Connection String Hub**: Instant pre-formatted connection strings with copy-to-clipboard for Node.js (`pg`), Python (`asyncpg`/`SQLAlchemy`), CLI (`psql`), Prisma ORM, and .NET.
* **Automated Snapshots**: Trigger 1-click `pg_dump` backups saved to Pi NVMe storage.
* **Web GUI Integration**: Direct link to Adminer/pgAdmin web console (`postgresql.pottapk.win`).

### 3. 🌐 Virtual Network & Ingress Routing
* **Cloudflare Tunnel Ingress Manager**: View, add, and remove routing rules directly in `/etc/cloudflared/config.yml` with automated YAML syntax validation and zero-downtime service reload.
* **Port Radar & Conflict Inspector**: Visual scan of all open & listening TCP ports on the Pi (`ss -tulpn`), mapping each port to its PID, host user, and Docker container.
* **Process Terminator**: Terminate rogue or orphaned processes holding ports directly from the UI.
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
picloud/
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
│   │   ├── app/                  # Angular 17 standalone components
│   │   │   ├── models/           # TypeScript interfaces & API models
│   │   │   └── services/         # Angular HttpClient API service
│   │   └── styles.scss           # Azure Portal Dark & Light theme system
│   ├── package.json
│   ├── nginx.conf                # Nginx SPA proxy & static asset server
│   └── Dockerfile
├── docker-compose.yml            # Multi-container production deployment
├── dev.sh                        # 1-Click local development script
└── deploy-to-pi.sh               # 1-Click deployment script to Raspberry Pi
```

---

## 🚀 Getting Started

### Local Development
```bash
./dev.sh
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deploy to Raspberry Pi
```bash
./deploy-to-pi.sh
```
Live URL: **https://portal.pottapk.win** (or `http://192.168.1.151:3005`).
