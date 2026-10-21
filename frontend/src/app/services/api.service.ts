import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
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
  SystemdService,
  DeployAppRequest
} from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  // System
  getStats(): Observable<SystemTelemetry> {
    return this.http.get<SystemTelemetry>(`${this.baseUrl}/system/stats`);
  }

  getServices(): Observable<SystemdService[]> {
    return this.http.get<SystemdService[]>(`${this.baseUrl}/system/services`);
  }

  controlService(service: string, action: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/system/services/${service}/${action}`, {});
  }

  getJournalLogs(service: string = 'cloudflared', lines: number = 100): Observable<{ service: string; logs: string }> {
    return this.http.get<{ service: string; logs: string }>(`${this.baseUrl}/system/journal?service=${service}&lines=${lines}`);
  }

  powerAction(action: 'reboot' | 'shutdown'): Observable<{ status: string }> {
    return this.http.post<{ status: string }>(`${this.baseUrl}/system/power/${action}`, {});
  }

  // App Services (Compute)
  getApps(): Observable<AppService[]> {
    return this.http.get<AppService[]>(`${this.baseUrl}/apps`);
  }

  getAppLogs(name: string, lines: number = 150): Observable<{ name: string; logs: string }> {
    return this.http.get<{ name: string; logs: string }>(`${this.baseUrl}/apps/${name}/logs?lines=${lines}`);
  }

  controlApp(name: string, action: 'start' | 'stop' | 'restart' | 'delete'): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/apps/${name}/${action}`, {});
  }

  execInApp(name: string, command: string): Observable<{ stdout: string; stderr: string; exit_code: number; success: boolean }> {
    return this.http.post<{ stdout: string; stderr: string; exit_code: number; success: boolean }>(
      `${this.baseUrl}/apps/${name}/exec`,
      { command }
    );
  }

  deployApp(req: DeployAppRequest): Observable<{ status: string; container_id: string; name: string }> {
    return this.http.post<{ status: string; container_id: string; name: string }>(
      `${this.baseUrl}/apps/deploy`,
      req
    );
  }

  // SQL & Managed Databases
  getDbInstance(): Observable<DatabaseInstance> {
    return this.http.get<DatabaseInstance>(`${this.baseUrl}/sql/instances`);
  }

  getDatabases(): Observable<DatabaseItem[]> {
    return this.http.get<DatabaseItem[]>(`${this.baseUrl}/sql/databases`);
  }

  getTables(database?: string): Observable<DatabaseTable[]> {
    const q = database ? `?database=${database}` : '';
    return this.http.get<DatabaseTable[]>(`${this.baseUrl}/sql/tables${q}`);
  }

  createDatabase(name: string): Observable<{ status: string; database: string }> {
    return this.http.post<{ status: string; database: string }>(`${this.baseUrl}/sql/databases`, { name });
  }

  dropDatabase(name: string): Observable<{ status: string; database: string }> {
    return this.http.delete<{ status: string; database: string }>(`${this.baseUrl}/sql/databases/${name}`);
  }

  runQuery(query: string, database?: string): Observable<{ success: boolean; output?: string; error?: string; duration_ms: number }> {
    return this.http.post<{ success: boolean; output?: string; error?: string; duration_ms: number }>(
      `${this.baseUrl}/sql/query`,
      { query, database }
    );
  }

  getConnectionStrings(database?: string): Observable<ConnectionStrings> {
    const q = database ? `?database=${database}` : '';
    return this.http.get<ConnectionStrings>(`${this.baseUrl}/sql/connection-strings${q}`);
  }

  backupDatabase(database?: string): Observable<{ status: string; file: string; database: string }> {
    return this.http.post<{ status: string; file: string; database: string }>(`${this.baseUrl}/sql/backup`, { database });
  }

  // Networking & Ingress
  getIngressRoutes(): Observable<IngressConfig> {
    return this.http.get<IngressConfig>(`${this.baseUrl}/networking/ingress`);
  }

  addIngressRoute(hostname: string, service_url: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/networking/ingress`, { hostname, service_url });
  }

  deleteIngressRoute(hostname: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/networking/ingress/${hostname}`);
  }

  scanPorts(): Observable<ListeningPort[]> {
    return this.http.get<ListeningPort[]>(`${this.baseUrl}/networking/ports`);
  }

  killPortProcess(pid: number): Observable<{ status: string; pid: number }> {
    return this.http.post<{ status: string; pid: number }>(`${this.baseUrl}/networking/ports/kill/${pid}`, {});
  }

  checkEndpointsHealth(): Observable<Array<{ hostname: string; url: string; status_code: number; alive: boolean }>> {
    return this.http.get<Array<{ hostname: string; url: string; status_code: number; alive: boolean }>>(
      `${this.baseUrl}/networking/healthcheck`
    );
  }

  // Storage
  getStorage(): Observable<StorageInfo> {
    return this.http.get<StorageInfo>(`${this.baseUrl}/storage/info`);
  }

  pruneDocker(): Observable<{ success: boolean; output: string }> {
    return this.http.post<{ success: boolean; output: string }>(`${this.baseUrl}/storage/prune`, {});
  }

  // Cloud Shell
  executeShell(command: string, timeout: number = 30): Observable<{ command: string; stdout: string; stderr: string; exit_code: number; success: boolean }> {
    return this.http.post<{ command: string; stdout: string; stderr: string; exit_code: number; success: boolean }>(
      `${this.baseUrl}/terminal/exec`,
      { command, timeout }
    );
  }
}
