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

// ---------------- New Extended Cloud Capabilities ----------------
export interface CronJob {
  id: number;
  schedule: string;
  command: string;
  raw: string;
}

export interface ThrottlingFlags {
  hex: string;
  under_voltage_now: boolean;
  arm_freq_capped_now: boolean;
  currently_throttled: boolean;
  soft_temp_limit_now: boolean;
  under_voltage_past: boolean;
  arm_freq_capped_past: boolean;
  throttled_past: boolean;
  soft_temp_limit_past: boolean;
  healthy: boolean;
}

export interface HardwareDiagnostics {
  throttling: ThrottlingFlags;
  arm_clock_mhz: number;
  core_volts: string;
  scaling_governor: string;
  eeprom_status: string;
}

export interface ComposeStack {
  name: string;
  path: string;
  directory: string;
  services: any[];
  service_count: number;
  status: string;
}

export interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: string;
  mode: string;
}

export interface DirectoryListing {
  path: string;
  items: FileItem[];
  success: boolean;
  error?: string;
}

export interface PingResult {
  host: string;
  output: string;
  success: boolean;
}

export interface DnsResult {
  domain: string;
  record_type: string;
  output: string;
  success: boolean;
}

export interface CurlTestResult {
  url: string;
  status_code?: string;
  dns_lookup_s?: string;
  connect_time_s?: string;
  ttfb_s?: string;
  total_time_s?: string;
  success: boolean;
  error?: string;
}

export interface NetworkInfo {
  interfaces: string;
  default_gateway: string;
  public_ip: string;
}
