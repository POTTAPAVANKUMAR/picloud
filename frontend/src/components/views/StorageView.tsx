"use client";

import React, { useState } from "react";
import {
  HardDrive,
  Trash2,
  Sparkles,
  Layers,
  Database,
  CheckCircle2,
  RefreshCw,
  Folder,
  Server
} from "lucide-react";
import { StorageInfo } from "@/lib/types";
import { api } from "@/lib/api";

interface StorageViewProps {
  storage: StorageInfo | null;
  onRefresh: () => void;
}

export function StorageView({ storage, onRefresh }: StorageViewProps) {
  const [isPruning, setIsPruning] = useState(false);
  const [pruneOutput, setPruneOutput] = useState<string | null>(null);

  const disks = storage?.disks || [];
  const dockerUsage = storage?.docker_usage || [];

  const handlePrune = async () => {
    if (!confirm("This will safely remove all unused Docker containers, networks, dangling images, and build caches. Proceed?")) {
      return;
    }
    setIsPruning(true);
    setPruneOutput(null);
    try {
      const res = await api.pruneDocker();
      setPruneOutput(res.output || "Docker system prune completed successfully.");
      onRefresh();
    } catch (err: any) {
      setPruneOutput(`Error pruning: ${err.message}`);
    } finally {
      setIsPruning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-amber-400" />
            <span>Disks & Persistent Storage</span>
          </h2>
          <p className="text-xs text-zinc-400">
            High-speed NVMe SSD partitions, Docker image layers, and volume storage
          </p>
        </div>

        <button
          onClick={handlePrune}
          disabled={isPruning}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 text-xs font-semibold text-white hover:bg-amber-500 transition shadow disabled:opacity-50"
        >
          <Sparkles className={`h-3.5 w-3.5 ${isPruning ? "animate-spin" : ""}`} />
          <span>{isPruning ? "Reclaiming Disk Space..." : "Prune Unused Docker Layers"}</span>
        </button>
      </div>

      {pruneOutput && (
        <div className="rounded-xl border border-emerald-500/30 bg-zinc-950 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Storage Reclaim Output</span>
            </span>
            <button onClick={() => setPruneOutput(null)} className="text-zinc-500 hover:text-white">
              ✕
            </button>
          </div>
          <pre className="max-h-48 overflow-y-auto font-mono text-[11px] text-zinc-300 whitespace-pre-wrap">
            {pruneOutput}
          </pre>
        </div>
      )}

      {/* NVMe Partitions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disks.map((d, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Server className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white font-mono">{d.filesystem}</h3>
                  <p className="text-[11px] text-zinc-400">Mounted on: <span className="text-zinc-200 font-mono">{d.mounted_on}</span></p>
                </div>
              </div>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono text-emerald-400">
                {d.use_percent} Used
              </span>
            </div>

            {/* Storage Progress bar */}
            <div className="space-y-1.5">
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  style={{ width: d.use_percent }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span>Used: {d.used}</span>
                <span>Free: {d.avail}</span>
                <span>Total: {d.size}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Docker Storage Breakdown */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h3 className="text-xs font-semibold text-white">Docker Disk Consumption (docker system df)</h3>
            <p className="text-[11px] text-zinc-400">
              Breakdown of layers, container filesystems, and build cache
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-zinc-950/60 text-[11px] font-semibold text-zinc-400">
              <tr>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Total Count</th>
                <th className="px-4 py-2.5">Active</th>
                <th className="px-4 py-2.5">Size on Disk</th>
                <th className="px-4 py-2.5">Reclaimable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {dockerUsage.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-800/40 transition">
                  <td className="px-4 py-3 font-semibold text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-400" />
                    <span>{item.Type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300">
                    {item.TotalCount}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300">
                    {item.Active}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-amber-400">
                    {item.Size}
                  </td>
                  <td className="px-4 py-3 font-mono text-emerald-400">
                    {item.Reclaimable}
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
