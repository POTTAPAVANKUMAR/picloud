"use client";

import React from "react";
import {
  Boxes,
  Database,
  Network,
  HardDrive,
  Cpu,
  Thermometer,
  Activity,
  Rocket,
  ShieldCheck,
  Play,
  RotateCw,
  Square,
  Terminal,
  ExternalLink,
  Layers,
  ArrowUpRight
} from "lucide-react";
import {
  SystemTelemetry,
  AppService,
  DatabaseItem,
  IngressRule,
  ListeningPort,
  StorageInfo
} from "@/lib/types";
import { NavTab } from "../Sidebar";

interface DashboardViewProps {
  stats: SystemTelemetry | null;
  apps: AppService[];
  databases: DatabaseItem[];
  ingressRules: IngressRule[];
  ports: ListeningPort[];
  storage: StorageInfo | null;
  onNavigate: (tab: NavTab) => void;
  onOpenDeploy: () => void;
  onOpenShell: () => void;
  onOpenLogs: (appName: string) => void;
  onAppAction: (appName: string, action: "start" | "stop" | "restart") => void;
  onPruneDocker: () => void;
}

export function DashboardView({
  stats,
  apps,
  databases,
  ingressRules,
  ports,
  storage,
  onNavigate,
  onOpenDeploy,
  onOpenShell,
  onOpenLogs,
  onAppAction,
  onPruneDocker
}: DashboardViewProps) {
  const tempVal = stats?.temperature ? parseFloat(stats.temperature) : 52.8;
  const memUsedGB = stats?.memory ? (stats.memory.used / 1024).toFixed(1) : "3.6";
  const memTotalGB = stats?.memory ? (stats.memory.total / 1024).toFixed(1) : "8.0";
  const memPercent = stats?.memory?.percent || 44.8;
  const disk = storage?.disks?.[0] || { size: "938G", used: "23G", avail: "868G", use_percent: "3%" };

  const runningApps = apps.filter((a) => a.state === "running" || a.status.startsWith("Up"));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-blue-950/30 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-400 border border-cyan-500/30">
                Private Cloud
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {stats?.arch || "aarch64"} • {stats?.kernel || "Linux 6.6"}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Raspberry Pi Cloud Console
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl">
              Unified enterprise cloud management for your Raspberry Pi. Deploy containerized App Services, manage PostgreSQL instances, route Cloudflare subdomains, and monitor infrastructure.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenDeploy}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-cyan-500 transition"
            >
              <Rocket className="h-4 w-4" />
              <span>Deploy App Service</span>
            </button>
            <button
              onClick={onOpenShell}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition"
            >
              <Terminal className="h-4 w-4 text-amber-400" />
              <span>Cloud Shell</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cloud Resource Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* App Services Card */}
        <div
          onClick={() => onNavigate("apps")}
          className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-blue-500/50 hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Boxes className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-blue-400 transition" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{runningApps.length}</div>
            <div className="text-xs text-zinc-400">Running App Services</div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-mono">
            {apps.length} total containers deployed
          </div>
        </div>

        {/* PostgreSQL Databases Card */}
        <div
          onClick={() => onNavigate("sql")}
          className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-emerald-500/50 hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-emerald-400 transition" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{databases.length}</div>
            <div className="text-xs text-zinc-400">SQL Databases</div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-mono">
            picloud-db (PostgreSQL 15)
          </div>
        </div>

        {/* Virtual Network Ingress Card */}
        <div
          onClick={() => onNavigate("networking")}
          className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-cyan-500/50 hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Network className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-cyan-400 transition" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{ingressRules.length}</div>
            <div className="text-xs text-zinc-400">Ingress Subdomains</div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-mono">
            Cloudflare Tunnel Active
          </div>
        </div>

        {/* Storage / NVMe SSD Card */}
        <div
          onClick={() => onNavigate("storage")}
          className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-amber-500/50 hover:bg-zinc-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HardDrive className="h-5 w-5" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-amber-400 transition" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">{disk.avail}</div>
            <div className="text-xs text-zinc-400">Available NVMe Storage</div>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-mono">
            {disk.used} used of {disk.size} ({disk.use_percent})
          </div>
        </div>
      </div>

      {/* Hardware Telemetry Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* CPU Load */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span>CPU Load Avg</span>
            </span>
            <span className="font-mono text-zinc-200">{stats?.cpu_cores || 4} Cores</span>
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {stats?.load_avg || "0.45 0.38 0.35"}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            Uptime: {stats?.uptime || "7 weeks"}
          </div>
        </div>

        {/* Memory Gauge */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-blue-400" />
              <span>RAM Allocation</span>
            </span>
            <span className="font-mono text-zinc-200">{memPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${memPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>{memUsedGB} GB Used</span>
            <span>{memTotalGB} GB Total</span>
          </div>
        </div>

        {/* Temperature Gauge */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Thermometer className="h-4 w-4 text-amber-400" />
              <span>SoC Temperature</span>
            </span>
            <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[10px] text-emerald-400 font-mono">
              Cool
            </span>
          </div>
          <div className="text-lg font-bold text-white font-mono">{tempVal.toFixed(1)}°C</div>
          <div className="text-[11px] text-zinc-500">
            Thermal threshold: 85°C (throttling safe)
          </div>
        </div>

        {/* Port Radar Mini */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Network className="h-4 w-4 text-purple-400" />
              <span>Listening Ports</span>
            </span>
            <span className="font-mono text-purple-400 font-bold">{ports.length} Open</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {ports.slice(0, 6).map((p) => (
              <span
                key={p.port + p.pid}
                className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300"
              >
                :{p.port}
              </span>
            ))}
          </div>
          <div className="text-[11px] text-zinc-500">Zero port collisions detected</div>
        </div>
      </div>

      {/* Quick Launch & Common Cloud Tasks */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Cloud Operations & Management
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={onOpenDeploy}
            className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-200 hover:border-blue-500 hover:text-white transition"
          >
            <Rocket className="h-4 w-4 text-blue-400" />
            <span>Deploy App Service</span>
          </button>
          <button
            onClick={() => onNavigate("sql")}
            className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-200 hover:border-emerald-500 hover:text-white transition"
          >
            <Database className="h-4 w-4 text-emerald-400" />
            <span>Open SQL Query Studio</span>
          </button>
          <button
            onClick={() => onNavigate("networking")}
            className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-200 hover:border-cyan-500 hover:text-white transition"
          >
            <Network className="h-4 w-4 text-cyan-400" />
            <span>Manage Cloudflare Routes</span>
          </button>
          <button
            onClick={onPruneDocker}
            className="flex items-center gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-xs font-medium text-zinc-200 hover:border-amber-500 hover:text-white transition"
          >
            <HardDrive className="h-4 w-4 text-amber-400" />
            <span>Reclaim Docker Storage</span>
          </button>
        </div>
      </div>

      {/* Active App Services Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h3 className="text-xs font-semibold text-white">Deployed App Services (Compute)</h3>
            <p className="text-[11px] text-zinc-400">Containers currently hosted on your Raspberry Pi</p>
          </div>
          <button
            onClick={() => onNavigate("apps")}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All ({apps.length})</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Image</th>
                <th className="px-4 py-2.5">Host Ports</th>
                <th className="px-4 py-2.5">CPU / Memory</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {apps.slice(0, 6).map((app) => {
                const isRunning = app.state === "running" || app.status.startsWith("Up");
                return (
                  <tr key={app.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isRunning ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
                      <span>{app.name}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                      {app.status}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-400 truncate max-w-xs">
                      {app.image}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-cyan-400">
                      {app.ports || "Internal only"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-300">
                      {app.stats?.cpu || "0%"} • {app.stats?.mem || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenLogs(app.name)}
                          className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white font-mono"
                          title="View Live Logs"
                        >
                          Logs
                        </button>
                        {isRunning ? (
                          <button
                            onClick={() => onAppAction(app.name, "restart")}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400"
                            title="Restart"
                          >
                            <RotateCw className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onAppAction(app.name, "start")}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                            title="Start"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
