"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { DeployModal } from "@/components/DeployModal";
import { LogsDrawer } from "@/components/LogsDrawer";
import { CloudShell } from "@/components/CloudShell";

// Views
import { DashboardView } from "@/components/views/DashboardView";
import { AppsView } from "@/components/views/AppsView";
import { SqlView } from "@/components/views/SqlView";
import { NetworkingView } from "@/components/views/NetworkingView";
import { StorageView } from "@/components/views/StorageView";
import { MonitoringView } from "@/components/views/MonitoringView";

import { api } from "@/lib/api";
import {
  SystemTelemetry,
  AppService,
  DatabaseItem,
  DatabaseTable,
  DatabaseInstance,
  ConnectionStrings,
  IngressConfig,
  ListeningPort,
  StorageInfo,
  SystemdService
} from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");

  // Core Data States
  const [stats, setStats] = useState<SystemTelemetry | null>(null);
  const [apps, setApps] = useState<AppService[]>([]);
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [dbInstance, setDbInstance] = useState<DatabaseInstance | null>(null);
  const [connectionStrings, setConnectionStrings] = useState<ConnectionStrings | null>(null);
  const [ingressConfig, setIngressConfig] = useState<IngressConfig | null>(null);
  const [ports, setPorts] = useState<ListeningPort[]>([]);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [services, setServices] = useState<SystemdService[]>([]);

  // UI Overlays
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isShellOpen, setIsShellOpen] = useState(false);
  const [logsAppName, setLogsAppName] = useState<string | null>(null);

  // Polling
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data Fetching
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        statsData,
        appsData,
        dbData,
        tablesData,
        instanceData,
        connData,
        ingressData,
        portsData,
        storageData,
        servicesData
      ] = await Promise.all([
        api.getStats().catch(() => null),
        api.getApps().catch(() => []),
        api.getDatabases().catch(() => []),
        api.getTables().catch(() => []),
        api.getDbInstance().catch(() => null),
        api.getConnectionStrings().catch(() => null),
        api.getIngressRoutes().catch(() => null),
        api.scanPorts().catch(() => []),
        api.getStorage().catch(() => null),
        api.getServices().catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      if (appsData) setApps(appsData);
      if (dbData) setDatabases(dbData);
      if (tablesData) setTables(tablesData);
      if (instanceData) setDbInstance(instanceData);
      if (connData) setConnectionStrings(connData);
      if (ingressData) setIngressConfig(ingressData);
      if (portsData) setPorts(portsData);
      if (storageData) setStorage(storageData);
      if (servicesData) setServices(servicesData);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Polling interval
  useEffect(() => {
    if (refreshInterval <= 0) return;
    const interval = setInterval(() => {
      loadAllData();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, loadAllData]);

  // Handlers
  const handleAppAction = async (appName: string, action: "start" | "stop" | "restart" | "delete") => {
    try {
      await api.controlApp(appName, action);
      loadAllData();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handlePruneDocker = async () => {
    if (confirm("Clean up unused Docker images, containers, and build cache to free NVMe disk space?")) {
      try {
        const res = await api.pruneDocker();
        alert(res.output || "Docker pruned successfully.");
        loadAllData();
      } catch (err: any) {
        alert(`Prune failed: ${err.message}`);
      }
    }
  };

  const handleExecInApp = async (appName: string, cmd: string) => {
    return await api.execInApp(appName, cmd);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-950 font-sans text-zinc-100 overflow-hidden antialiased">
      {/* Top Global Portal Header */}
      <Header
        stats={stats}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenDeploy={() => setIsDeployOpen(true)}
        onToggleTerminal={() => setIsShellOpen(!isShellOpen)}
        onRefresh={loadAllData}
        refreshInterval={refreshInterval}
        setRefreshInterval={setRefreshInterval}
        isRefreshing={isRefreshing}
        activeAppsCount={apps.filter((a) => a.state === "running" || a.status.startsWith("Up")).length}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === "shell") {
              setIsShellOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          appsCount={apps.length}
          ingressCount={ingressConfig?.rules?.length || 0}
          dbCount={databases.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6">
          <div className="mx-auto max-w-7xl">
            {activeTab === "dashboard" && (
              <DashboardView
                stats={stats}
                apps={apps}
                databases={databases}
                ingressRules={ingressConfig?.rules || []}
                ports={ports}
                storage={storage}
                onNavigate={(tab) => {
                  if (tab === "shell") setIsShellOpen(true);
                  else setActiveTab(tab);
                }}
                onOpenDeploy={() => setIsDeployOpen(true)}
                onOpenShell={() => setIsShellOpen(true)}
                onOpenLogs={(appName) => setLogsAppName(appName)}
                onAppAction={handleAppAction}
                onPruneDocker={handlePruneDocker}
              />
            )}

            {activeTab === "apps" && (
              <AppsView
                apps={apps}
                ingressRules={ingressConfig?.rules || []}
                onOpenDeploy={() => setIsDeployOpen(true)}
                onOpenLogs={(appName) => setLogsAppName(appName)}
                onAction={handleAppAction}
                onExec={handleExecInApp}
              />
            )}

            {activeTab === "sql" && (
              <SqlView
                instance={dbInstance}
                databases={databases}
                tables={tables}
                connectionStrings={connectionStrings}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === "networking" && (
              <NetworkingView
                ingressConfig={ingressConfig}
                ports={ports}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === "storage" && (
              <StorageView
                storage={storage}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === "monitoring" && (
              <MonitoringView
                stats={stats}
                services={services}
                onRefresh={loadAllData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Command / Resource Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        apps={apps}
        databases={databases}
        ingressRules={ingressConfig?.rules || []}
        ports={ports}
        onSelectTab={(tab) => {
          if (tab === "shell") setIsShellOpen(true);
          else setActiveTab(tab);
        }}
      />

      {/* Deploy App Service Modal */}
      <DeployModal
        isOpen={isDeployOpen}
        onClose={() => setIsDeployOpen(false)}
        onDeployed={loadAllData}
      />

      {/* Live Logs Drawer */}
      <LogsDrawer
        appName={logsAppName}
        onClose={() => setLogsAppName(null)}
      />

      {/* Interactive Pi Cloud Shell Terminal */}
      <CloudShell
        isOpen={isShellOpen}
        onClose={() => setIsShellOpen(false)}
      />
    </div>
  );
}
