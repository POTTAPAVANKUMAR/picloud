import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import {
  SystemTelemetry,
  AppService,
  DatabaseInstance,
  DatabaseItem,
  DatabaseTable,
  ConnectionStrings,
  IngressConfig,
  IngressRule,
  ListeningPort,
  StorageInfo,
  SystemdService,
  DeployAppRequest,
  CronJob,
  HardwareDiagnostics,
  ComposeStack,
  FileItem,
  DirectoryListing,
  PingResult,
  DnsResult,
  CurlTestResult,
  NetworkInfo
} from './models/types';
import { Subscription, interval, switchMap } from 'rxjs';

export type NavTab = 'home' | 'dashboard' | 'apps' | 'sql' | 'networking' | 'storage' | 'monitoring' | 'compose' | 'cron' | 'files' | 'hardware' | 'diagnostics' | 'shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Potta Cloud';
  activeTab: NavTab = 'home';

  // Azure Theme System (Dark Mode & Light Mode)
  theme: 'light' | 'dark' = 'dark';
  isSettingsOpen = false;

  // Azure Navigation & Blades
  isSidebarCollapsed = false;
  appViewMode: 'grid' | 'cards' = 'grid';
  activeSqlTab: 'overview' | 'query' | 'strings' | 'tables' = 'overview';
  activeNetTab: 'ingress' | 'ports' = 'ingress';
  activeStorageTab: 'disks' | 'docker' = 'disks';

  // Core Data
  stats: SystemTelemetry | null = null;
  apps: AppService[] = [];
  databases: DatabaseItem[] = [];
  tables: DatabaseTable[] = [];
  dbInstance: DatabaseInstance | null = null;
  connectionStrings: ConnectionStrings | null = null;
  ingressConfig: IngressConfig | null = null;
  ports: ListeningPort[] = [];
  storage: StorageInfo | null = null;
  services: SystemdService[] = [];

  // Extended Modules Data
  cronJobs: CronJob[] = [];
  newCronSchedule = '0 3 * * *';
  newCronCommand = '';
  isAddingCron = false;
  cronRunOutput: any = null;
  isRunningCron = false;

  hwDiagnostics: HardwareDiagnostics | null = null;
  isLoadingHw = false;

  composeStacks: ComposeStack[] = [];
  activeComposePath = '';
  activeComposeContent = '';
  isViewingComposeFile = false;
  isSavingCompose = false;
  composeActionMsg = '';

  currentDirPath = '/home/pavankumarpotta';
  fileItems: FileItem[] = [];
  isLoadingFiles = false;
  editingFilePath = '';
  editingFileContent = '';
  isEditorOpen = false;
  isSavingFile = false;
  newItemName = '';
  isNewItemFolder = false;
  isCreatingItem = false;

  pingTarget = '1.1.1.1';
  pingResult: any = null;
  isPinging = false;
  dnsDomain = 'pottapk.win';
  dnsType = 'A';
  dnsResult: any = null;
  isQueryingDns = false;
  curlUrl = 'https://portal.pottapk.win';
  curlResult: any = null;
  isCurling = false;
  networkInfo: any = null;

  // Polling
  refreshIntervalMs = 5000;
  isRefreshing = false;
  private pollSub?: Subscription;

  // Search
  searchQuery = '';
  isSearchModalOpen = false;

  // App Deploy Modal
  isDeployModalOpen = false;
  deployForm: DeployAppRequest = {
    name: '',
    image: 'nginx:alpine',
    host_port: 8095,
    container_port: 80,
    restart_policy: 'unless-stopped',
    subdomain: '',
    env_vars: {}
  };
  deployEnvKey = '';
  deployEnvValue = '';
  deployEnvList: Array<{ key: string; value: string }> = [];
  isDeploying = false;
  deployError = '';

  // Container Logs Modal
  activeLogApp: string | null = null;
  logLines = '';
  isLoadingLogs = false;
  logFilter = '';
  private logPollSub?: Subscription;

  // In-Container Exec Modal
  activeExecApp: string | null = null;
  execCmd = '';
  execResult: any = null;
  isExecuting = false;

  // SQL Studio
  selectedDb = 'picloud';
  sqlQuery = 'SELECT table_name FROM information_schema.tables WHERE table_schema=\'public\';';
  queryOutput: string | null = null;
  queryError: string | null = null;
  queryDuration: number | null = null;
  isRunningQuery = false;
  showPassword = false;
  newDbName = '';
  isCreatingDb = false;
  copiedKey: string | null = null;
  sqlBackupMsg: string | null = null;

  // Ingress & Networking
  isAddingRoute = false;
  newRouteHost = '';
  newRouteService = '';
  isSavingRoute = false;
  routeMsg: string | null = null;
  healthMap: Record<string, { alive: boolean; status: number }> = {};
  isCheckingHealth = false;

  // Storage
  isPruning = false;
  pruneOutput: string | null = null;

  // Monitoring
  selectedJournalService = 'cloudflared';
  journalLogs = '';
  isLoadingJournal = false;
  serviceActionMsg: string | null = null;

  // Cloud Shell
  isShellOpen = false;
  shellInput = '';
  shellHistory: Array<{ cmd: string; output: string; exitCode: number; isError: boolean }> = [
    {
      cmd: 'uname -a',
      output: 'Linux pavankumarpotta 6.6.20+rpt-rpi-2712 #1 SMP PREEMPT Debian 1:6.6.20-1+rpt1 aarch64 GNU/Linux',
      exitCode: 0,
      isError: false
    }
  ];
  isRunningShell = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.initTheme();
    this.loadAllData();
    this.startPolling();
  }

  initTheme(): void {
    const saved = localStorage.getItem('picloud-azure-theme') as 'light' | 'dark' | null;
    if (saved) {
      this.setTheme(saved);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  }

  toggleTheme(): void {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.theme = theme;
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.body.setAttribute('data-azure-theme', theme);
    localStorage.setItem('picloud-azure-theme', theme);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.logPollSub?.unsubscribe();
  }

  startPolling(): void {
    this.stopPolling();
    if (this.refreshIntervalMs > 0) {
      this.pollSub = interval(this.refreshIntervalMs).subscribe(() => {
        this.loadAllData(false);
      });
    }
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
  }

  onRefreshIntervalChange(): void {
    this.startPolling();
  }

  loadAllData(showSpinner = true): void {
    if (showSpinner) this.isRefreshing = true;

    this.api.getStats().subscribe({
      next: (data) => (this.stats = data),
      error: () => {}
    });

    this.api.getApps().subscribe({
      next: (data) => (this.apps = data),
      error: () => {}
    });

    this.api.getDbInstance().subscribe({
      next: (data) => (this.dbInstance = data),
      error: () => {}
    });

    this.api.getDatabases().subscribe({
      next: (data) => (this.databases = data),
      error: () => {}
    });

    this.api.getTables(this.selectedDb).subscribe({
      next: (data) => (this.tables = data),
      error: () => {}
    });

    this.api.getConnectionStrings(this.selectedDb).subscribe({
      next: (data) => (this.connectionStrings = data),
      error: () => {}
    });

    this.api.getIngressRoutes().subscribe({
      next: (data) => (this.ingressConfig = data),
      error: () => {}
    });

    this.api.scanPorts().subscribe({
      next: (data) => (this.ports = data),
      error: () => {}
    });

    this.api.getStorage().subscribe({
      next: (data) => (this.storage = data),
      error: () => {}
    });

    this.api.getServices().subscribe({
      next: (data) => {
        this.services = data;
        if (showSpinner) this.isRefreshing = false;
      },
      error: () => {
        if (showSpinner) this.isRefreshing = false;
      }
    });

    this.loadCronJobs();
    this.loadHardwareDiagnostics();
    this.loadComposeStacks();
    this.loadDirectory(this.currentDirPath);
    this.loadNetworkInfo();
  }

  // ---------------- Extended Modules Handlers ----------------

  // Cron
  loadCronJobs(): void {
    this.api.getCronJobs().subscribe({
      next: (jobs) => (this.cronJobs = jobs),
      error: () => {}
    });
  }

  submitNewCron(): void {
    if (!this.newCronSchedule.trim() || !this.newCronCommand.trim()) return;
    this.api.addCronJob(this.newCronSchedule, this.newCronCommand).subscribe({
      next: () => {
        this.isAddingCron = false;
        this.newCronCommand = '';
        this.loadCronJobs();
      },
      error: (err) => alert(`Failed to add cron: ${err.message}`)
    });
  }

  deleteCron(job: CronJob): void {
    if (!confirm(`Delete cron job: ${job.schedule} ${job.command}?`)) return;
    this.api.deleteCronJob(job.raw).subscribe({
      next: () => this.loadCronJobs(),
      error: (err) => alert(`Failed to delete cron: ${err.message}`)
    });
  }

  testRunCron(cmd: string): void {
    this.isRunningCron = true;
    this.cronRunOutput = null;
    this.api.runCronJob(cmd).subscribe({
      next: (res) => {
        this.cronRunOutput = res;
        this.isRunningCron = false;
      },
      error: (err) => {
        this.cronRunOutput = { stderr: err.message, success: false };
        this.isRunningCron = false;
      }
    });
  }

  // Hardware Diagnostics
  loadHardwareDiagnostics(): void {
    this.isLoadingHw = true;
    this.api.getHardwareDiagnostics().subscribe({
      next: (data) => {
        this.hwDiagnostics = data;
        this.isLoadingHw = false;
      },
      error: () => (this.isLoadingHw = false)
    });
  }

  // Docker Compose Stacks
  loadComposeStacks(): void {
    this.api.getComposeStacks().subscribe({
      next: (stacks) => (this.composeStacks = stacks),
      error: () => {}
    });
  }

  viewComposeFile(path: string): void {
    this.activeComposePath = path;
    this.api.getComposeFile(path).subscribe({
      next: (res) => {
        this.activeComposeContent = res.content;
        this.isViewingComposeFile = true;
      },
      error: (err) => alert(`Failed to read compose file: ${err.message}`)
    });
  }

  saveComposeFile(): void {
    if (!this.activeComposePath) return;
    this.isSavingCompose = true;
    this.api.saveComposeFile(this.activeComposePath, this.activeComposeContent).subscribe({
      next: () => {
        this.isSavingCompose = false;
        this.isViewingComposeFile = false;
        this.loadComposeStacks();
        alert('Compose file saved successfully!');
      },
      error: (err) => {
        this.isSavingCompose = false;
        alert(`Failed to save compose: ${err.message}`);
      }
    });
  }

  controlCompose(path: string, action: string): void {
    if (action === 'down' && !confirm(`Stop and remove containers for this stack?`)) return;
    this.composeActionMsg = `Executing 'docker compose ${action}'...`;
    this.api.controlComposeStack(path, action).subscribe({
      next: (res) => {
        this.composeActionMsg = `Stack ${action} completed: ${res.stdout || res.stderr || 'Success'}`;
        setTimeout(() => (this.composeActionMsg = ''), 5000);
        this.loadComposeStacks();
        this.loadAllData(false);
      },
      error: (err) => {
        this.composeActionMsg = `Action failed: ${err.message}`;
      }
    });
  }

  // File Explorer & Editor
  loadDirectory(path: string): void {
    this.isLoadingFiles = true;
    this.currentDirPath = path;
    this.api.listDirectory(path).subscribe({
      next: (res) => {
        this.fileItems = res.items || [];
        this.isLoadingFiles = false;
      },
      error: (err) => {
        this.isLoadingFiles = false;
        alert(`Failed to list directory: ${err.message}`);
      }
    });
  }

  navigateUpDir(): void {
    const parent = this.currentDirPath.substring(0, this.currentDirPath.lastIndexOf('/')) || '/';
    this.loadDirectory(parent);
  }

  openFileEditor(item: FileItem): void {
    if (item.is_dir) {
      this.loadDirectory(item.path);
      return;
    }
    this.editingFilePath = item.path;
    this.api.readFile(item.path).subscribe({
      next: (res) => {
        this.editingFileContent = res.content;
        this.isEditorOpen = true;
      },
      error: (err) => alert(`Cannot open file: ${err.message}`)
    });
  }

  saveCurrentFile(): void {
    this.isSavingFile = true;
    this.api.saveFile(this.editingFilePath, this.editingFileContent).subscribe({
      next: () => {
        this.isSavingFile = false;
        this.isEditorOpen = false;
        this.loadDirectory(this.currentDirPath);
        alert('File saved successfully!');
      },
      error: (err) => {
        this.isSavingFile = false;
        alert(`Failed to save file: ${err.message}`);
      }
    });
  }

  deleteFile(item: FileItem): void {
    if (!confirm(`Delete ${item.is_dir ? 'folder' : 'file'}: ${item.name}?`)) return;
    this.api.deleteFileItem(item.path).subscribe({
      next: () => this.loadDirectory(this.currentDirPath),
      error: (err) => alert(`Failed to delete: ${err.message}`)
    });
  }

  createNewItem(): void {
    if (!this.newItemName.trim()) return;
    const fullPath = `${this.currentDirPath.replace(/\/$/, '')}/${this.newItemName.trim()}`;
    this.api.createFileItem(fullPath, this.isNewItemFolder).subscribe({
      next: () => {
        this.isCreatingItem = false;
        this.newItemName = '';
        this.loadDirectory(this.currentDirPath);
      },
      error: (err) => alert(`Creation failed: ${err.message}`)
    });
  }

  // Network Diagnostics
  runPing(): void {
    if (!this.pingTarget.trim()) return;
    this.isPinging = true;
    this.pingResult = null;
    this.api.pingHost(this.pingTarget).subscribe({
      next: (res) => {
        this.pingResult = res;
        this.isPinging = false;
      },
      error: (err) => {
        this.pingResult = { output: err.message, success: false };
        this.isPinging = false;
      }
    });
  }

  runDns(): void {
    if (!this.dnsDomain.trim()) return;
    this.isQueryingDns = true;
    this.dnsResult = null;
    this.api.dnsLookup(this.dnsDomain, this.dnsType).subscribe({
      next: (res) => {
        this.dnsResult = res;
        this.isQueryingDns = false;
      },
      error: (err) => {
        this.dnsResult = { output: err.message, success: false };
        this.isQueryingDns = false;
      }
    });
  }

  runCurl(): void {
    if (!this.curlUrl.trim()) return;
    this.isCurling = true;
    this.curlResult = null;
    this.api.curlTest(this.curlUrl).subscribe({
      next: (res) => {
        this.curlResult = res;
        this.isCurling = false;
      },
      error: (err) => {
        this.curlResult = { error: err.message, success: false };
        this.isCurling = false;
      }
    });
  }

  loadNetworkInfo(): void {
    this.api.getNetworkInfo().subscribe({
      next: (data) => (this.networkInfo = data),
      error: () => {}
    });
  }

  // Navigation
  setTab(tab: NavTab): void {
    this.activeTab = tab;
  }

  // App Controls
  onControlApp(name: string, action: 'start' | 'stop' | 'restart' | 'delete'): void {
    if (action === 'delete' && !confirm(`Are you sure you want to delete container ${name}?`)) {
      return;
    }
    this.api.controlApp(name, action).subscribe({
      next: () => this.loadAllData(false),
      error: (err) => alert(`Action failed: ${err.message}`)
    });
  }

  openLogsModal(appName: string): void {
    this.activeLogApp = appName;
    this.fetchAppLogs();
    this.logPollSub?.unsubscribe();
    this.logPollSub = interval(4000).subscribe(() => this.fetchAppLogs());
  }

  closeLogsModal(): void {
    this.activeLogApp = null;
    this.logPollSub?.unsubscribe();
  }

  fetchAppLogs(): void {
    if (!this.activeLogApp) return;
    this.isLoadingLogs = true;
    this.api.getAppLogs(this.activeLogApp, 250).subscribe({
      next: (res) => {
        this.logLines = res.logs || 'No logs available.';
        this.isLoadingLogs = false;
      },
      error: (err) => {
        this.logLines = `Error fetching logs: ${err.message}`;
        this.isLoadingLogs = false;
      }
    });
  }

  openExecModal(appName: string): void {
    this.activeExecApp = appName;
    this.execCmd = '';
    this.execResult = null;
  }

  closeExecModal(): void {
    this.activeExecApp = null;
  }

  runExec(): void {
    if (!this.activeExecApp || !this.execCmd.trim()) return;
    this.isExecuting = true;
    this.api.execInApp(this.activeExecApp, this.execCmd).subscribe({
      next: (res) => {
        this.execResult = res;
        this.isExecuting = false;
      },
      error: (err) => {
        this.execResult = { stderr: err.message, exit_code: -1 };
        this.isExecuting = false;
      }
    });
  }

  // Deploy Modal
  openDeployModal(): void {
    this.isDeployModalOpen = true;
    this.deployError = '';
    this.deployEnvList = [];
    this.deployForm = {
      name: '',
      image: 'nginx:alpine',
      host_port: 8095,
      container_port: 80,
      restart_policy: 'unless-stopped',
      subdomain: '',
      env_vars: {}
    };
  }

  closeDeployModal(): void {
    this.isDeployModalOpen = false;
  }

  applyTemplate(type: string): void {
    if (type === 'nextjs') {
      this.deployForm.image = 'node:20-alpine';
      this.deployForm.container_port = 3000;
      this.deployEnvList = [{ key: 'NODE_ENV', value: 'production' }];
    } else if (type === 'fastapi') {
      this.deployForm.image = 'tiangolo/uvicorn-gunicorn-fastapi:python3.11';
      this.deployForm.container_port = 80;
      this.deployEnvList = [{ key: 'APP_ENV', value: 'production' }];
    } else if (type === 'nginx') {
      this.deployForm.image = 'nginx:alpine';
      this.deployForm.container_port = 80;
      this.deployEnvList = [];
    } else if (type === 'go') {
      this.deployForm.image = 'golang:1.22-alpine';
      this.deployForm.container_port = 8080;
      this.deployEnvList = [];
    }
  }

  addEnvVar(): void {
    if (this.deployEnvKey.trim()) {
      this.deployEnvList.push({ key: this.deployEnvKey.trim(), value: this.deployEnvValue });
      this.deployEnvKey = '';
      this.deployEnvValue = '';
    }
  }

  removeEnvVar(index: number): void {
    this.deployEnvList.splice(index, 1);
  }

  submitDeploy(): void {
    if (!this.deployForm.name.trim() || !this.deployForm.image.trim()) {
      this.deployError = 'Application Name and Docker Image are required.';
      return;
    }

    this.isDeploying = true;
    this.deployError = '';

    const envMap: Record<string, string> = {};
    this.deployEnvList.forEach((e) => (envMap[e.key] = e.value));
    this.deployForm.env_vars = envMap;

    this.api.deployApp(this.deployForm).subscribe({
      next: () => {
        this.isDeploying = false;
        this.closeDeployModal();
        this.loadAllData(false);
      },
      error: (err) => {
        this.deployError = err.message || 'Deployment failed';
        this.isDeploying = false;
      }
    });
  }

  // SQL Studio
  selectDatabase(name: string): void {
    this.selectedDb = name;
    this.api.getTables(name).subscribe({ next: (t) => (this.tables = t) });
    this.api.getConnectionStrings(name).subscribe({ next: (c) => (this.connectionStrings = c) });
  }

  runSqlQuery(): void {
    if (!this.sqlQuery.trim() || this.isRunningQuery) return;
    this.isRunningQuery = true;
    this.queryOutput = null;
    this.queryError = null;

    this.api.runQuery(this.sqlQuery, this.selectedDb).subscribe({
      next: (res) => {
        this.queryDuration = res.duration_ms;
        if (res.success) {
          this.queryOutput = res.output || '(Query executed, no rows returned)';
        } else {
          this.queryError = res.error || 'SQL Execution error';
        }
        this.isRunningQuery = false;
      },
      error: (err) => {
        this.queryError = err.message;
        this.isRunningQuery = false;
      }
    });
  }

  createDatabase(): void {
    if (!this.newDbName.trim()) return;
    this.api.createDatabase(this.newDbName.trim()).subscribe({
      next: () => {
        this.newDbName = '';
        this.isCreatingDb = false;
        this.loadAllData(false);
      },
      error: (err) => alert(`Failed to create DB: ${err.message}`)
    });
  }

  backupDb(name: string): void {
    this.sqlBackupMsg = `Taking pg_dump snapshot of database ${name}...`;
    this.api.backupDatabase(name).subscribe({
      next: (res) => {
        this.sqlBackupMsg = `Snapshot created: ${res.file}`;
        setTimeout(() => (this.sqlBackupMsg = null), 6000);
      },
      error: (err) => {
        this.sqlBackupMsg = `Backup failed: ${err.message}`;
      }
    });
  }

  copyText(text: string, key: string): void {
    navigator.clipboard.writeText(text);
    this.copiedKey = key;
    setTimeout(() => (this.copiedKey = null), 2000);
  }

  // Ingress & Networking
  saveRoute(): void {
    if (!this.newRouteHost.trim() || !this.newRouteService.trim()) return;
    this.isSavingRoute = true;
    this.routeMsg = null;

    const hostname = this.newRouteHost.includes('.') ? this.newRouteHost.trim() : `${this.newRouteHost.trim()}.pottapk.win`;
    const serviceUrl = this.newRouteService.startsWith('http') ? this.newRouteService.trim() : `http://localhost:${this.newRouteService.trim()}`;

    this.api.addIngressRoute(hostname, serviceUrl).subscribe({
      next: () => {
        this.isSavingRoute = false;
        this.isAddingRoute = false;
        this.newRouteHost = '';
        this.newRouteService = '';
        this.routeMsg = `Route ${hostname} registered successfully.`;
        this.loadAllData(false);
      },
      error: (err) => {
        this.isSavingRoute = false;
        this.routeMsg = `Error: ${err.message}`;
      }
    });
  }

  deleteRoute(hostname: string): void {
    if (!confirm(`Delete ingress rule for ${hostname}?`)) return;
    this.api.deleteIngressRoute(hostname).subscribe({
      next: () => {
        this.routeMsg = `Route ${hostname} deleted.`;
        this.loadAllData(false);
      },
      error: (err) => (this.routeMsg = `Delete failed: ${err.message}`)
    });
  }

  testEndpoints(): void {
    this.isCheckingHealth = true;
    this.api.checkEndpointsHealth().subscribe({
      next: (results) => {
        const map: Record<string, { alive: boolean; status: number }> = {};
        results.forEach((r) => (map[r.hostname] = { alive: r.alive, status: r.status_code }));
        this.healthMap = map;
        this.isCheckingHealth = false;
      },
      error: () => (this.isCheckingHealth = false)
    });
  }

  killPid(pidStr: string): void {
    const pid = parseInt(pidStr, 10);
    if (!confirm(`Terminate process PID ${pid}?`)) return;
    this.api.killPortProcess(pid).subscribe({
      next: () => this.loadAllData(false),
      error: (err) => alert(`Failed to kill process: ${err.message}`)
    });
  }

  // Storage
  pruneDocker(): void {
    if (!confirm('This will safely delete dangling images, stopped containers, and build cache. Proceed?')) return;
    this.isPruning = true;
    this.pruneOutput = null;
    this.api.pruneDocker().subscribe({
      next: (res) => {
        this.pruneOutput = res.output || 'Docker prune complete.';
        this.isPruning = false;
        this.loadAllData(false);
      },
      error: (err) => {
        this.pruneOutput = `Prune error: ${err.message}`;
        this.isPruning = false;
      }
    });
  }

  // Monitoring
  onControlService(name: string, action: string): void {
    this.api.controlService(name, action).subscribe({
      next: () => {
        this.serviceActionMsg = `Service ${name} ${action} triggered.`;
        setTimeout(() => (this.serviceActionMsg = null), 4000);
        this.loadAllData(false);
      },
      error: (err) => alert(`Action failed: ${err.message}`)
    });
  }

  loadJournalLogs(service?: string): void {
    const s = service || this.selectedJournalService;
    this.isLoadingJournal = true;
    this.api.getJournalLogs(s, 100).subscribe({
      next: (res) => {
        this.journalLogs = res.logs || 'No logs found.';
        this.isLoadingJournal = false;
      },
      error: (err) => {
        this.journalLogs = `Failed to fetch journal: ${err.message}`;
        this.isLoadingJournal = false;
      }
    });
  }

  triggerPower(action: 'reboot' | 'shutdown'): void {
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} the Raspberry Pi?`)) return;
    this.api.powerAction(action).subscribe({
      next: () => alert(`Raspberry Pi ${action} triggered.`),
      error: (err) => alert(`Failed to ${action}: ${err.message}`)
    });
  }

  // Cloud Shell
  runShellCommand(cmdToRun?: string): void {
    const cmd = cmdToRun !== undefined ? cmdToRun : this.shellInput;
    if (!cmd.trim() || this.isRunningShell) return;

    this.isRunningShell = true;
    this.shellInput = '';

    this.api.executeShell(cmd).subscribe({
      next: (res) => {
        this.shellHistory.push({
          cmd,
          output: res.stdout || res.stderr || '(No output returned)',
          exitCode: res.exit_code,
          isError: !res.success
        });
        this.isRunningShell = false;
      },
      error: (err) => {
        this.shellHistory.push({
          cmd,
          output: `Command failed: ${err.message}`,
          exitCode: -1,
          isError: true
        });
        this.isRunningShell = false;
      }
    });
  }

  // Computed Helpers
  get runningAppsCount(): number {
    return this.apps.filter((a) => a.state === 'running' || a.status.startsWith('Up')).length;
  }

  get filteredApps(): AppService[] {
    const q = this.searchQuery.toLowerCase();
    if (!q) return this.apps;
    return this.apps.filter(
      (a) => a.name.toLowerCase().includes(q) || a.image.toLowerCase().includes(q) || a.ports.toLowerCase().includes(q)
    );
  }

  get filteredLogLines(): string[] {
    if (!this.logLines) return [];
    const filter = this.logFilter.toLowerCase();
    return this.logLines.split('\n').filter((l) => l.toLowerCase().includes(filter));
  }
}
