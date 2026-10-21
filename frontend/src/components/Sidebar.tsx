"use client";

import React from "react";
import {
  LayoutDashboard,
  Boxes,
  Database,
  Network,
  HardDrive,
  Activity,
  Terminal,
  Settings,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export type NavTab = "dashboard" | "apps" | "sql" | "networking" | "storage" | "monitoring" | "shell";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  appsCount: number;
  ingressCount: number;
  dbCount: number;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  appsCount,
  ingressCount,
  dbCount
}: SidebarProps) {
  const items = [
    {
      id: "dashboard" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: "apps" as NavTab,
      label: "App Services",
      icon: Boxes,
      badge: appsCount > 0 ? String(appsCount) : null
    },
    {
      id: "sql" as NavTab,
      label: "SQL Databases",
      icon: Database,
      badge: dbCount > 0 ? String(dbCount) : null
    },
    {
      id: "networking" as NavTab,
      label: "Virtual Network",
      icon: Network,
      badge: ingressCount > 0 ? `${ingressCount} routes` : null
    },
    {
      id: "storage" as NavTab,
      label: "Disks & Storage",
      icon: HardDrive,
      badge: "1 TB"
    },
    {
      id: "monitoring" as NavTab,
      label: "Monitoring & Logs",
      icon: Activity,
      badge: null
    },
    {
      id: "shell" as NavTab,
      label: "Cloud Shell",
      icon: Terminal,
      badge: "Bash"
    }
  ];

  return (
    <aside className="w-60 shrink-0 border-r border-zinc-800 bg-zinc-950/60 p-3 flex flex-col justify-between">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Compute & Infrastructure
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-cyan-400" : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Cluster Footer Card */}
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Cloudflare Edge</span>
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <p className="text-[10px] font-mono text-zinc-400 truncate">
          Tunnel: f49cf9d5...1c7e
        </p>
        <div className="border-t border-zinc-800/60 pt-2 flex items-center justify-between text-[10px] text-zinc-400">
          <span>IP 192.168.1.151</span>
          <span className="text-zinc-300 font-mono">SSH OK</span>
        </div>
      </div>
    </aside>
  );
}
