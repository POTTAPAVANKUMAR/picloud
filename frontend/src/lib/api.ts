import {
  SystemTelemetry,
  AppService,
  DatabaseInstance,
  DatabaseItem,
  DatabaseTable,
  ConnectionStrings,
  IngressConfig,
  ListeningPort,
  StorageInfo,
  SystemdService
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// Fallback Mock Data in case backend is offline
const MOCK_STATS: SystemTelemetry = {
  temperature: "52.8",
  uptime: "up 7 weeks, 2 days",
  load_avg: "0.45 0.38 0.35",
  memory: {
    total: 8062,
    used: 3608,
    free: 432,
    available: 4454,
    percent: 44.8
  },
  disk: {
    total: 1007204433920,
    used: 24696061952,
    avail: 932508371968,
    percent: "3%"
  },
  hostname: "pavankumarpotta",
  arch: "aarch64 (Raspberry Pi 5)",
  kernel: "Linux 6.6.20+rpt-rpi-2712",
  cpu_cores: 4
};

const MOCK_APPS: AppService[] = [
  { id: "c1", name: "pkpmusic-backend-web-1", status: "Up 7 weeks", state: "running", image: "nginx:alpine", ports: "0.0.0.0:3001->80/tcp", created: "7 weeks ago", stats: { name: "pkpmusic-backend-web-1", cpu: "0.12%", mem: "18.4MB / 8GB", mem_perc: "0.2%", net_io: "1.2MB / 4.5MB" } },
  { id: "c2", name: "pkpmusic-backend-api-1", status: "Up 7 weeks", state: "running", image: "python:3.11", ports: "0.0.0.0:8000->8000/tcp", created: "7 weeks ago", stats: { name: "pkpmusic-backend-api-1", cpu: "0.34%", mem: "72.1MB / 8GB", mem_perc: "0.9%", net_io: "4.8MB / 12MB" } },
  { id: "c3", name: "picloud-web", status: "Up 2 months", state: "running", image: "picloud-web:latest", ports: "0.0.0.0:8080->80/tcp", created: "2 months ago", stats: { name: "picloud-web", cpu: "0.05%", mem: "32.0MB / 8GB", mem_perc: "0.4%", net_io: "8.1MB / 15MB" } },
  { id: "c4", name: "picloud-api", status: "Up 7 weeks", state: "running", image: "picloud-api:latest", ports: "0.0.0.0:5000->5000/tcp", created: "7 weeks ago", stats: { name: "picloud-api", cpu: "0.18%", mem: "45.2MB / 8GB", mem_perc: "0.5%", net_io: "6.2MB / 18MB" } },
  { id: "c5", name: "picloud-db", status: "Up 4 months", state: "running", image: "postgres:15-alpine", ports: "0.0.0.0:5432->5432/tcp", created: "4 months ago", stats: { name: "picloud-db", cpu: "0.45%", mem: "112.5MB / 8GB", mem_perc: "1.4%", net_io: "14MB / 28MB" } },
  { id: "c6", name: "landing", status: "Up 4 months", state: "running", image: "nginx:alpine", ports: "0.0.0.0:3000->80/tcp", created: "4 months ago", stats: { name: "landing", cpu: "0.02%", mem: "12.0MB / 8GB", mem_perc: "0.1%", net_io: "2.4MB / 7.1MB" } },
  { id: "c7", name: "portainer", status: "Up 4 months", state: "running", image: "portainer/portainer-ce:latest", ports: "0.0.0.0:9000->9000/tcp", created: "4 months ago", stats: { name: "portainer", cpu: "0.22%", mem: "84.3MB / 8GB", mem_perc: "1.0%", net_io: "19MB / 42MB" } },
  { id: "c8", name: "pkpmusic-backend-pgadmin-1", status: "Up 4 months", state: "running", image: "dpage/pgadmin4", ports: "0.0.0.0:5050->80/tcp", created: "4 months ago", stats: { name: "pkpmusic-backend-pgadmin-1", cpu: "0.15%", mem: "195.0MB / 8GB", mem_perc: "2.4%", net_io: "11MB / 22MB" } }
];

async function apiFetch<T>(endpoint: string, options?: RequestInit, fallback?: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Request failed");
    }
    return await res.json();
  } catch (e) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw e;
  }
}

export const api = {
  // System Telemetry
  getStats: () => apiFetch<SystemTelemetry>("/system/stats", {}, MOCK_STATS),
  getServices: () => apiFetch<SystemdService[]>("/system/services", {}, [
    { name: "cloudflared", active: true, status: "active", enabled: "enabled" },
    { name: "docker", active: true, status: "active", enabled: "enabled" },
    { name: "ssh", active: true, status: "active", enabled: "enabled" },
    { name: "cron", active: true, status: "active", enabled: "enabled" }
  ]),
  controlService: (service: string, action: string) =>
    apiFetch<{ success: boolean }>(`/system/services/${service}/${action}`, { method: "POST" }),
  getJournalLogs: (service: string = "cloudflared", lines: number = 100) =>
    apiFetch<{ service: string; logs: string }>(`/system/journal?service=${service}&lines=${lines}`),
  powerAction: (action: "reboot" | "shutdown") =>
    apiFetch<{ status: string }>(`/system/power/${action}`, { method: "POST" }),

  // App Services (Compute)
  getApps: () => apiFetch<AppService[]>("/apps", {}, MOCK_APPS),
  getAppLogs: (name: string, lines: number = 150) =>
    apiFetch<{ name: string; logs: string }>(`/apps/${name}/logs?lines=${lines}`),
  controlApp: (name: string, action: "start" | "stop" | "restart" | "delete") =>
    apiFetch<{ success: boolean }>(`/apps/${name}/${action}`, { method: "POST" }),
  execInApp: (name: string, command: string) =>
    apiFetch<{ stdout: string; stderr: string; exit_code: number }>(`/apps/${name}/exec`, {
      method: "POST",
      body: JSON.stringify({ command })
    }),
  deployApp: (data: {
    name: string;
    image: string;
    host_port?: number;
    container_port?: number;
    env_vars?: Record<string, string>;
    restart_policy?: string;
    subdomain?: string;
  }) => apiFetch<{ status: string; container_id: string }>("/apps/deploy", {
    method: "POST",
    body: JSON.stringify(data)
  }),

  // SQL & Databases
  getDbInstance: () => apiFetch<DatabaseInstance>("/sql/instances", {}, {
    instance_id: "picloud-db",
    engine: "PostgreSQL",
    version: "PostgreSQL 15.6 on aarch64",
    status: "running",
    host: "192.168.1.151",
    port: 5432,
    default_user: "picloud",
    default_db: "picloud",
    adminer_url: "https://postgresql.pottapk.win"
  }),
  getDatabases: () => apiFetch<DatabaseItem[]>("/sql/databases", {}, [
    { name: "picloud", size: "8015 kB", connections: "1" },
    { name: "postgres", size: "7479 kB", connections: "0" }
  ]),
  getTables: (db?: string) => apiFetch<DatabaseTable[]>(`/sql/tables${db ? `?database=${db}` : ""}`, {}, [
    { name: "users", size: "32 kB" },
    { name: "auth_tokens", size: "16 kB" },
    { name: "cloud_resources", size: "48 kB" }
  ]),
  createDatabase: (name: string) =>
    apiFetch<{ status: string; database: string }>("/sql/databases", {
      method: "POST",
      body: JSON.stringify({ name })
    }),
  dropDatabase: (name: string) =>
    apiFetch<{ status: string }>(`/sql/databases/${name}`, { method: "DELETE" }),
  runQuery: (query: string, database?: string) =>
    apiFetch<{ success: boolean; output?: string; error?: string; duration_ms: number }>("/sql/query", {
      method: "POST",
      body: JSON.stringify({ query, database })
    }),
  getConnectionStrings: (database?: string) =>
    apiFetch<ConnectionStrings>(`/sql/connection-strings${database ? `?database=${database}` : ""}`, {}, {
      uri: "postgresql://picloud:Varunbike@1234@192.168.1.151:5432/picloud",
      psql_cli: "PGPASSWORD='Varunbike@1234' psql -h 192.168.1.151 -p 5432 -U picloud -d picloud",
      docker_psql: "docker exec -it picloud-db psql -U picloud -d picloud",
      python_asyncpg: "postgresql+asyncpg://picloud:Varunbike@1234@192.168.1.151:5432/picloud",
      prisma: 'DATABASE_URL="postgresql://picloud:Varunbike@1234@192.168.1.151:5432/picloud?schema=public"',
      dotnet: "Host=192.168.1.151;Port=5432;Database=picloud;Username=picloud;Password=Varunbike@1234;",
      node_pg: {
        user: "picloud",
        host: "192.168.1.151",
        database: "picloud",
        port: 5432
      }
    }),
  backupDatabase: (database?: string) =>
    apiFetch<{ status: string; file: string; database: string }>("/sql/backup", {
      method: "POST",
      body: JSON.stringify({ database })
    }),

  // Networking & Ingress
  getIngressRoutes: () => apiFetch<IngressConfig>("/networking/ingress", {}, {
    path: "/etc/cloudflared/config.yml",
    tunnel_id: "f49cf9d5-aee5-4d96-a2ae-a6356c901c7e",
    rules: [
      { hostname: "pottapk.win", service: "http://localhost:3000", is_fallback: false },
      { hostname: "app.pottapk.win", service: "http://localhost:8080", is_fallback: false },
      { hostname: "api.pottapk.win", service: "http://localhost:5000", is_fallback: false },
      { hostname: "cloud.pottapk.win", service: "http://localhost:80", is_fallback: false },
      { hostname: "pkpmusic.pottapk.win", service: "http://localhost:8000", is_fallback: false },
      { hostname: "portainer.pottapk.win", service: "http://localhost:9000", is_fallback: false },
      { hostname: "postgresql.pottapk.win", service: "http://localhost:5050", is_fallback: false },
      { hostname: "pkpmusicweb.pottapk.win", service: "http://localhost:3001", is_fallback: false },
      { hostname: "pkpmusiclogs.pottapk.win", service: "http://localhost:8888", is_fallback: false },
      { hostname: "Fallback / Catch-all", service: "http_status:404", is_fallback: true }
    ]
  }),
  addIngressRoute: (hostname: string, service_url: string) =>
    apiFetch<{ success: boolean }>("/networking/ingress", {
      method: "POST",
      body: JSON.stringify({ hostname, service_url })
    }),
  deleteIngressRoute: (hostname: string) =>
    apiFetch<{ success: boolean }>(`/networking/ingress/${hostname}`, { method: "DELETE" }),
  scanPorts: () => apiFetch<ListeningPort[]>("/networking/ports", {}, [
    { port: "3000", process: "docker-proxy", pid: "1284", user: "root", address: "0.0.0.0:3000", containers: ["landing"] },
    { port: "3001", process: "docker-proxy", pid: "1492", user: "root", address: "0.0.0.0:3001", containers: ["pkpmusic-backend-web-1"] },
    { port: "5000", process: "docker-proxy", pid: "1350", user: "root", address: "0.0.0.0:5000", containers: ["picloud-api"] },
    { port: "5050", process: "docker-proxy", pid: "1894", user: "root", address: "0.0.0.0:5050", containers: ["pkpmusic-backend-pgadmin-1"] },
    { port: "5432", process: "docker-proxy", pid: "1120", user: "root", address: "0.0.0.0:5432", containers: ["picloud-db"] },
    { port: "8000", process: "docker-proxy", pid: "1421", user: "root", address: "0.0.0.0:8000", containers: ["pkpmusic-backend-api-1"] },
    { port: "8080", process: "docker-proxy", pid: "1302", user: "root", address: "0.0.0.0:8080", containers: ["picloud-web"] },
    { port: "8888", process: "docker-proxy", pid: "1720", user: "root", address: "0.0.0.0:8888", containers: ["pkpmusic-backend-dozzle-1"] },
    { port: "9000", process: "docker-proxy", pid: "1098", user: "root", address: "0.0.0.0:9000", containers: ["portainer"] }
  ]),
  killPortProcess: (pid: number) =>
    apiFetch<{ status: string; pid: number }>(`/networking/ports/kill/${pid}`, { method: "POST" }),
  checkEndpointsHealth: () =>
    apiFetch<Array<{ hostname: string; url: string; status_code: number; alive: boolean }>>("/networking/healthcheck", {}, []),

  // Storage
  getStorage: () => apiFetch<StorageInfo>("/storage/info", {}, {
    disks: [
      { filesystem: "/dev/nvme0n1p2", size: "938G", used: "23G", avail: "868G", use_percent: "3%", mounted_on: "/" }
    ],
    docker_usage: [
      { Type: "Images", TotalCount: 14, Active: 10, Size: "4.8GB", Reclaimable: "1.2GB (25%)" },
      { Type: "Containers", TotalCount: 10, Active: 10, Size: "142MB", Reclaimable: "0B" },
      { Type: "Local Volumes", TotalCount: 8, Active: 6, Size: "1.4GB", Reclaimable: "250MB (17%)" },
      { Type: "Build Cache", TotalCount: 22, Active: 0, Size: "2.8GB", Reclaimable: "2.8GB (100%)" }
    ]
  }),
  pruneDocker: () =>
    apiFetch<{ success: boolean; output: string }>("/storage/prune", { method: "POST" }),

  // Cloud Shell
  executeShell: (command: string, timeout: number = 30) =>
    apiFetch<{ command: string; stdout: string; stderr: string; exit_code: number; success: boolean }>("/terminal/exec", {
      method: "POST",
      body: JSON.stringify({ command, timeout })
    })
};
