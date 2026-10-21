export interface SystemTelemetry {
  temperature: string;
  uptime: string;
  load_avg: string;
  memory: {
    total: number;
    used: number;
    free: number;
    available: number;
    percent?: number;
  };
  disk: {
    total: number;
    used: number;
    avail: number;
    percent: string;
  };
  hostname: string;
  arch: string;
  kernel: string;
  cpu_cores: number;
}

export interface ContainerStats {
  name: string;
  cpu: string;
  mem: string;
  mem_perc: string;
  net_io: string;
}

export interface AppService {
  id: string;
  name: string;
  status: string;
  state: string;
  image: string;
  ports: string;
  created: string;
  stats?: ContainerStats;
}

export interface DatabaseInstance {
  instance_id: string;
  engine: string;
  version: string;
  status: string;
  host: string;
  port: number;
  default_user: string;
  default_db: string;
  adminer_url: string;
}

export interface DatabaseItem {
  name: string;
  size: string;
  connections: string;
}

export interface DatabaseTable {
  name: string;
  size: string;
}

export interface ConnectionStrings {
  uri: string;
  psql_cli: string;
  docker_psql: string;
  python_asyncpg: string;
  prisma: string;
  dotnet: string;
  node_pg: {
    user: string;
    host: string;
    database: string;
    password?: string;
    port: number;
  };
}

export interface IngressRule {
  hostname: string;
  service: string;
  is_fallback: boolean;
  status?: string;
}

export interface IngressConfig {
  path: string;
  tunnel_id: string;
  rules: IngressRule[];
}

export interface ListeningPort {
  port: string;
  protocol?: string;
  process: string;
  pid: string;
  user: string;
  address: string;
  containers?: string[];
  raw?: string;
}

export interface StorageDisk {
  filesystem: string;
  size: string;
  used: string;
  avail: string;
  use_percent: string;
  mounted_on: string;
}

export interface StorageInfo {
  disks: StorageDisk[];
  docker_usage: Array<{
    Type: string;
    TotalCount: number;
    Active: number;
    Size: string;
    Reclaimable: string;
  }>;
}

export interface SystemdService {
  name: string;
  active: boolean;
  status: string;
  enabled: string;
}

export interface DeployAppRequest {
  name: string;
  image: string;
  host_port?: number;
  container_port?: number;
  env_vars?: Record<string, string>;
  restart_policy?: string;
  subdomain?: string;
}
