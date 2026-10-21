"use client";

import React, { useState } from "react";
import {
  Boxes,
  Play,
  Square,
  RotateCw,
  Trash2,
  Terminal,
  ExternalLink,
  PlusCircle,
  Search,
  Activity,
  Cpu,
  Layers,
  Globe
} from "lucide-react";
import { AppService, IngressRule } from "@/lib/types";

interface AppsViewProps {
  apps: AppService[];
  ingressRules: IngressRule[];
  onOpenDeploy: () => void;
  onOpenLogs: (name: string) => void;
  onAction: (name: string, action: "start" | "stop" | "restart" | "delete") => void;
  onExec: (name: string, cmd: string) => Promise<any>;
}

export function AppsView({
  apps,
  ingressRules,
  onOpenDeploy,
  onOpenLogs,
  onAction,
  onExec
}: AppsViewProps) {
  const [filter, setFilter] = useState("");
  const [executingApp, setExecutingApp] = useState<string | null>(null);
  const [execCmd, setExecCmd] = useState("");
  const [execResult, setExecResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const filtered = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(filter.toLowerCase()) ||
      a.image.toLowerCase().includes(filter.toLowerCase()) ||
      a.ports.toLowerCase().includes(filter.toLowerCase())
  );

  const handleRunExec = async (appName: string) => {
    if (!execCmd.trim()) return;
    setIsExecuting(true);
    try {
      const res = await onExec(appName, execCmd);
      setExecResult(res);
    } catch (e: any) {
      setExecResult({ stderr: e.message, exit_code: -1 });
    } finally {
      setIsExecuting(false);
    }
  };

  // Find if app has an ingress subdomain mapped
  const getSubdomainForApp = (app: AppService) => {
    const ports = app.ports;
    if (!ports) return null;
    for (const rule of ingressRules) {
      if (!rule.is_fallback && rule.service) {
        // extract port from rule.service (e.g. http://localhost:8080)
        const match = rule.service.match(/:(\d+)/);
        if (match && ports.includes(match[1])) {
          return rule.hostname;
        }
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Boxes className="h-5 w-5 text-blue-400" />
            <span>App Services (Compute)</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Containerized services, APIs, and background processes running on the Raspberry Pi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter app services..."
              className="h-8 w-56 rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={onOpenDeploy}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500 transition shadow"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Deploy App</span>
          </button>
        </div>
      </div>

      {/* Grid of App Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((app) => {
          const isRunning = app.state === "running" || app.status.startsWith("Up");
          const subdomain = getSubdomainForApp(app);

          return (
            <div
              key={app.id}
              className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-700 shadow-lg"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isRunning ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-rose-500"
                      }`}
                    />
                    <div>
                      <h3 className="font-semibold text-sm text-white">{app.name}</h3>
                      <p className="text-[10px] font-mono text-zinc-400 truncate max-w-[200px]">
                        {app.image}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                      isRunning
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {isRunning ? "RUNNING" : "STOPPED"}
                  </span>
                </div>

                {/* Subdomain link badge */}
                {subdomain && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-1 rounded-md">
                    <Globe className="h-3 w-3" />
                    <a
                      href={`https://${subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono hover:underline flex items-center gap-1 truncate"
                    >
                      <span>https://{subdomain}</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}

                {/* Ports & Uptime */}
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                    <span>Host Port:</span>
                    <span className="text-zinc-200">{app.ports || "Internal network"}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                    <span>Status:</span>
                    <span className="text-zinc-300">{app.status}</span>
                  </div>
                </div>

                {/* Live Stats */}
                <div className="mt-3 rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-2.5 space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-cyan-400" />
                      <span>CPU Usage</span>
                    </span>
                    <span className="text-zinc-200 font-semibold">{app.stats?.cpu || "0.0%"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Activity className="h-3 w-3 text-blue-400" />
                      <span>Memory</span>
                    </span>
                    <span className="text-zinc-200">{app.stats?.mem || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Net I/O</span>
                    <span className="text-zinc-300">{app.stats?.net_io || "0B / 0B"}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Toolbar */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenLogs(app.name)}
                    className="flex items-center gap-1 rounded bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
                  >
                    <span>Logs</span>
                  </button>
                  <button
                    onClick={() => {
                      setExecutingApp(executingApp === app.name ? null : app.name);
                      setExecResult(null);
                      setExecCmd("");
                    }}
                    className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] font-medium text-amber-400 hover:bg-zinc-700 transition"
                    title="Run command in container"
                  >
                    <Terminal className="h-3 w-3" />
                    <span>Exec</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {isRunning ? (
                    <>
                      <button
                        onClick={() => onAction(app.name, "restart")}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400 transition"
                        title="Restart App"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onAction(app.name, "stop")}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition"
                        title="Stop App"
                      >
                        <Square className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onAction(app.name, "start")}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400 transition"
                      title="Start App"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete container ${app.name}?`)) {
                        onAction(app.name, "delete");
                      }
                    }}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400 transition"
                    title="Delete App"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Inline In-Container Exec Drawer */}
              {executingApp === app.name && (
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-zinc-950 p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-amber-400 font-mono">
                    <span>docker exec -i {app.name}</span>
                    <button
                      onClick={() => setExecutingApp(null)}
                      className="text-zinc-500 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={execCmd}
                      onChange={(e) => setExecCmd(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRunExec(app.name)}
                      placeholder="e.g. ls -la, node -v, env..."
                      className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none"
                    />
                    <button
                      onClick={() => handleRunExec(app.name)}
                      disabled={isExecuting || !execCmd.trim()}
                      className="rounded bg-amber-500 px-2.5 py-1 text-[10px] font-semibold text-black hover:bg-amber-400 disabled:opacity-40"
                    >
                      {isExecuting ? "..." : "Run"}
                    </button>
                  </div>
                  {execResult && (
                    <pre className="max-h-28 overflow-y-auto rounded bg-black p-2 font-mono text-[10px] text-zinc-300">
                      {execResult.stdout || execResult.stderr || "(No output)"}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
