"use client";

import React from "react";
import {
  Cloud,
  Search,
  Terminal,
  PlusCircle,
  RefreshCw,
  Cpu,
  Thermometer,
  HardDrive,
  Activity,
  Layers
} from "lucide-react";
import { SystemTelemetry } from "@/lib/types";

interface HeaderProps {
  stats: SystemTelemetry | null;
  onOpenSearch: () => void;
  onOpenDeploy: () => void;
  onToggleTerminal: () => void;
  onRefresh: () => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
  isRefreshing: boolean;
  activeAppsCount: number;
}

export function Header({
  stats,
  onOpenSearch,
  onOpenDeploy,
  onToggleTerminal,
  onRefresh,
  refreshInterval,
  setRefreshInterval,
  isRefreshing,
  activeAppsCount
}: HeaderProps) {
  const tempVal = stats?.temperature ? parseFloat(stats.temperature) : 52.8;
  const tempColor =
    tempVal < 60
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : tempVal < 75
      ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
      : "text-rose-400 border-rose-500/30 bg-rose-500/10";

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md">
      {/* Brand & Portal Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-md shadow-cyan-500/20">
          <Cloud className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-white text-sm">PiCloud</span>
            <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-medium text-cyan-400 border border-cyan-800/40">
              CONSOLE
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono">pottapk.win • rpi5-aarch64</p>
        </div>
      </div>

      {/* Global Search Bar (like Azure / AWS Portal search) */}
      <button
        onClick={onOpenSearch}
        className="group hidden md:flex h-8 w-80 items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 text-xs text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-900"
      >
        <span className="flex items-center gap-2">
          <Search className="h-3.5 w-3.5 text-zinc-500 group-hover:text-cyan-400" />
          <span>Search resources, services, ports...</span>
        </span>
        <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
          ⌘K
        </kbd>
      </button>

      {/* Live Status Telemetry & Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Hardware Status Chips */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono">
          {/* Online Indicator */}
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-sans text-[11px] font-medium">192.168.1.151</span>
          </div>

          {/* Temperature */}
          <div className={`flex items-center gap-1 rounded-md border px-2 py-1 ${tempColor}`}>
            <Thermometer className="h-3 w-3" />
            <span>{tempVal.toFixed(1)}°C</span>
          </div>

          {/* RAM */}
          <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-300">
            <Cpu className="h-3 w-3 text-cyan-400" />
            <span>RAM {stats?.memory?.percent || 44.8}%</span>
          </div>

          {/* Apps count */}
          <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-zinc-300">
            <Layers className="h-3 w-3 text-blue-400" />
            <span>{activeAppsCount} Apps</span>
          </div>
        </div>

        {/* Deploy App Action */}
        <button
          onClick={onOpenDeploy}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-3 text-xs font-medium text-white shadow hover:from-blue-500 hover:to-cyan-500 transition"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Deploy App</span>
        </button>

        {/* Cloud Shell Button */}
        <button
          onClick={onToggleTerminal}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 transition"
          title="Open Pi Cloud Shell"
        >
          <Terminal className="h-3.5 w-3.5 text-amber-400" />
          <span className="hidden sm:inline">Cloud Shell</span>
        </button>

        {/* Refresh Interval Selector & Manual Refresh */}
        <div className="flex items-center border-l border-zinc-800 pl-2 ml-1">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="h-8 rounded-l-lg border border-r-0 border-zinc-800 bg-zinc-900 px-2 text-[11px] text-zinc-400 focus:outline-none"
          >
            <option value={5000}>Live (5s)</option>
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={0}>Paused</option>
          </select>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex h-8 w-8 items-center justify-center rounded-r-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
            title="Refresh now"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
