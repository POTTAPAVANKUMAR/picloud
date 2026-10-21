"use client";

import React, { useState } from "react";
import {
  Network,
  Globe,
  PlusCircle,
  Trash2,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
  Zap
} from "lucide-react";
import { IngressConfig, IngressRule, ListeningPort } from "@/lib/types";
import { api } from "@/lib/api";

interface NetworkingViewProps {
  ingressConfig: IngressConfig | null;
  ports: ListeningPort[];
  onRefresh: () => void;
}

export function NetworkingView({
  ingressConfig,
  ports,
  onRefresh
}: NetworkingViewProps) {
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [targetPort, setTargetPort] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Healthcheck states
  const [healthMap, setHealthMap] = useState<Record<string, { alive: boolean; status: number }>>({});
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const rules = ingressConfig?.rules || [];

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain.trim() || !targetPort.trim()) return;

    setIsSubmitting(true);
    setStatusMsg(null);

    const fullHostname = subdomain.includes(".") ? subdomain.trim() : `${subdomain.trim()}.pottapk.win`;
    const serviceUrl = targetPort.startsWith("http")
      ? targetPort.trim()
      : `http://localhost:${targetPort.trim()}`;

    try {
      await api.addIngressRoute(fullHostname, serviceUrl);
      setStatusMsg({ text: `Route successfully registered: ${fullHostname} → ${serviceUrl}` });
      setSubdomain("");
      setTargetPort("");
      setIsAddingRoute(false);
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: `Failed to add route: ${err.message}`, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoute = async (hostname: string) => {
    if (!confirm(`Are you sure you want to remove routing for ${hostname}?`)) return;
    setStatusMsg(null);
    try {
      await api.deleteIngressRoute(hostname);
      setStatusMsg({ text: `Removed ingress rule for ${hostname}` });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: `Failed to delete route: ${err.message}`, isError: true });
    }
  };

  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const results = await api.checkEndpointsHealth();
      const map: Record<string, { alive: boolean; status: number }> = {};
      results.forEach((r) => {
        map[r.hostname] = { alive: r.alive, status: r.status_code };
      });
      setHealthMap(map);
    } catch (err) {
      // ignore
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleKillPid = async (pidStr: string, portStr: string) => {
    const pid = parseInt(pidStr);
    if (!confirm(`Terminate process PID ${pid} holding port ${portStr}?`)) return;
    try {
      await api.killPortProcess(pid);
      setStatusMsg({ text: `Process PID ${pid} terminated.` });
      onRefresh();
    } catch (err: any) {
      setStatusMsg({ text: `Failed to kill process: ${err.message}`, isError: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Network className="h-5 w-5 text-cyan-400" />
            <span>Virtual Network & Ingress</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Cloudflare Tunnel ingress routing, edge DNS, and local port conflict radar
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCheckHealth}
            disabled={isCheckingHealth}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
          >
            <Zap className={`h-3.5 w-3.5 text-amber-400 ${isCheckingHealth ? "animate-pulse" : ""}`} />
            <span>{isCheckingHealth ? "Testing Endpoints..." : "Test Edge Endpoints"}</span>
          </button>
          <button
            onClick={() => setIsAddingRoute(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-cyan-600 px-3 text-xs font-semibold text-white hover:bg-cyan-500 transition shadow"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add Ingress Route</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`rounded-lg border p-3 text-xs font-mono ${
            statusMsg.isError
              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Cloudflare Tunnel Status Card */}
      <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-zinc-900 to-cyan-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Cloudflare Tunnel: pottapk-tunnel</h3>
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
              Tunnel ID: {ingressConfig?.tunnel_id || "f49cf9d5-aee5-4d96-a2ae-a6356c901c7e"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            Config: /etc/cloudflared/config.yml
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-cyan-400">
            {rules.length} Rules Active
          </div>
        </div>
      </div>

      {/* Add Route Form Modal / Collapsible */}
      {isAddingRoute && (
        <div className="rounded-xl border border-cyan-500/40 bg-zinc-900 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>Register New Cloudflare Subdomain Route</span>
            </h3>
            <button
              onClick={() => setIsAddingRoute(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleAddRoute} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Subdomain (Hostname)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  placeholder="e.g. portal or myapp"
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                  required
                />
                <span className="text-xs font-mono text-zinc-400">.pottapk.win</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Target Port / Service URL
              </label>
              <input
                type="text"
                value={targetPort}
                onChange={(e) => setTargetPort(e.target.value)}
                placeholder="e.g. 8095 or http://localhost:8095"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingRoute(false)}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {isSubmitting ? "Writing config & reloading tunnel..." : "Save Route & Reload Tunnel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ingress Subdomains Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h3 className="text-xs font-semibold text-white">Active Subdomain Routing Table</h3>
            <p className="text-[11px] text-zinc-400">
              Incoming web traffic routed via Cloudflare Edge to local containers & ports
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">{rules.length} Active Rules</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
              <tr>
                <th className="px-4 py-2.5">Hostname</th>
                <th className="px-4 py-2.5">Local Destination Service</th>
                <th className="px-4 py-2.5">Edge Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {rules.map((rule, idx) => {
                const health = healthMap[rule.hostname];
                const isCatchAll = rule.is_fallback;

                return (
                  <tr key={idx} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3 font-medium">
                      {isCatchAll ? (
                        <span className="font-mono text-zinc-500 italic">Catch-all (Fallback)</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-cyan-400" />
                          <a
                            href={`https://${rule.hostname}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-cyan-300 hover:underline flex items-center gap-1"
                          >
                            <span>https://{rule.hostname}</span>
                            <ExternalLink className="h-3 w-3 text-zinc-500" />
                          </a>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-zinc-300">
                      {rule.service}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      {health ? (
                        health.alive ? (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>HTTP {health.status}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-400">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Failed ({health.status || "unreachable"})</span>
                          </span>
                        )
                      ) : (
                        <span className="text-zinc-500">Cloudflare Edge (HTTPS)</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {!isCatchAll && (
                        <button
                          onClick={() => handleDeleteRoute(rule.hostname)}
                          className="rounded p-1 text-zinc-500 hover:text-rose-400 transition"
                          title="Delete route"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Port Radar & Conflict Scanner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg space-y-0">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-purple-400" />
              <span>Port Radar & Conflict Inspector</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Live inspection of all listening TCP sockets on the Raspberry Pi
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 text-xs text-purple-400 hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Rescan Ports</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
              <tr>
                <th className="px-4 py-2.5">Port</th>
                <th className="px-4 py-2.5">Process</th>
                <th className="px-4 py-2.5">PID</th>
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Associated Docker Container</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {ports.map((p) => (
                <tr key={p.port + p.pid} className="hover:bg-zinc-800/40 transition">
                  <td className="px-4 py-2.5 font-mono font-bold text-amber-400">
                    :{p.port}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-zinc-200">
                    {p.process}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-zinc-400">
                    {p.pid}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-400">
                    {p.user}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">
                    {p.containers && p.containers.length > 0 ? (
                      <span className="rounded bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-blue-400">
                        {p.containers.join(", ")}
                      </span>
                    ) : (
                      <span className="text-zinc-500 font-sans italic">Host process</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleKillPid(p.pid, p.port)}
                      className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] text-rose-400 hover:bg-rose-500 hover:text-white transition font-mono"
                      title="Kill Process"
                    >
                      Kill PID
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
