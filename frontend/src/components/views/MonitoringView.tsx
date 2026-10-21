"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Play,
  Square,
  RotateCw,
  Power,
  RefreshCw,
  Thermometer,
  Cpu,
  AlertOctagon,
  FileText,
  Copy,
  Check
} from "lucide-react";
import { SystemTelemetry, SystemdService } from "@/lib/types";
import { api } from "@/lib/api";

interface MonitoringViewProps {
  stats: SystemTelemetry | null;
  services: SystemdService[];
  onRefresh: () => void;
}

export function MonitoringView({ stats, services, onRefresh }: MonitoringViewProps) {
  const [selectedService, setSelectedService] = useState<string>("cloudflared");
  const [journalLogs, setJournalLogs] = useState<string>("");
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchJournal = async (srv?: string) => {
    const s = srv || selectedService;
    setIsLoadingLogs(true);
    try {
      const res = await api.getJournalLogs(s, 100);
      setJournalLogs(res.logs || "No logs available.");
    } catch (err: any) {
      setJournalLogs(`Failed to load journal logs: ${err.message}`);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchJournal();
  }, [selectedService]);

  const handleServiceAction = async (serviceName: string, action: string) => {
    try {
      await api.controlService(serviceName, action);
      setActionMsg(`Service ${serviceName} ${action} triggered successfully.`);
      setTimeout(() => setActionMsg(null), 4000);
      onRefresh();
    } catch (err: any) {
      setActionMsg(`Failed to ${action} ${serviceName}: ${err.message}`);
    }
  };

  const handlePower = async (action: "reboot" | "shutdown") => {
    if (!confirm(`Are you absolutely sure you want to ${action.toUpperCase()} the Raspberry Pi?`)) {
      return;
    }
    try {
      await api.powerAction(action);
      alert(`Raspberry Pi ${action} initiated.`);
    } catch (err: any) {
      alert(`Error triggering ${action}: ${err.message}`);
    }
  };

  const tempVal = stats?.temperature ? parseFloat(stats.temperature) : 52.8;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            <span>Monitoring & System Services</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Systemd services management, real-time journalctl log inspection, and host power actions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handlePower("reboot")}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-semibold text-amber-400 hover:bg-amber-500 hover:text-black transition"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Reboot Pi</span>
          </button>
          <button
            onClick={() => handlePower("shutdown")}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition"
          >
            <Power className="h-3.5 w-3.5" />
            <span>Shutdown</span>
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs font-mono text-zinc-200">
          {actionMsg}
        </div>
      )}

      {/* Systemd Services Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((s) => (
          <div
            key={s.name}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-sm font-semibold text-white">
                <Server className="h-4 w-4 text-purple-400" />
                <span>{s.name}</span>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-mono font-medium ${
                  s.active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {s.status.toUpperCase()}
              </span>
            </div>

            <div className="text-[11px] text-zinc-500 font-mono">
              Boot State: <span className="text-zinc-300">{s.enabled}</span>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedService(s.name);
                  fetchJournal(s.name);
                }}
                className="text-[11px] text-purple-400 hover:underline"
              >
                View Journal
              </button>

              <div className="flex items-center gap-1">
                {s.active ? (
                  <>
                    <button
                      onClick={() => handleServiceAction(s.name, "restart")}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400"
                      title="Restart Service"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleServiceAction(s.name, "stop")}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400"
                      title="Stop Service"
                    >
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleServiceAction(s.name, "start")}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-emerald-400"
                    title="Start Service"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live System Journal Log Viewer */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-400" />
            <h3 className="text-xs font-semibold text-white">System Journal Logs (journalctl)</h3>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none"
            >
              <option value="cloudflared">cloudflared.service</option>
              <option value="docker">docker.service</option>
              <option value="ssh">ssh.service</option>
              <option value="cron">cron.service</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(journalLogs);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:text-white"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? "Copied" : "Copy Logs"}</span>
            </button>
            <button
              onClick={() => fetchJournal()}
              disabled={isLoadingLogs}
              className="flex h-7 w-7 items-center justify-center rounded bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLogs ? "animate-spin text-purple-400" : ""}`} />
            </button>
          </div>
        </div>

        <pre className="max-h-96 overflow-x-auto overflow-y-auto bg-black p-4 font-mono text-[11px] leading-relaxed text-zinc-300 whitespace-pre">
          {journalLogs}
        </pre>
      </div>
    </div>
  );
}
