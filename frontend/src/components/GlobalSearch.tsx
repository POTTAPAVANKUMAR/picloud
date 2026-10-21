"use client";

import React, { useState, useEffect } from "react";
import { Search, Boxes, Database, Network, Terminal, X, ArrowRight } from "lucide-react";
import { AppService, DatabaseItem, IngressRule, ListeningPort } from "@/lib/types";
import { NavTab } from "./Sidebar";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  apps: AppService[];
  databases: DatabaseItem[];
  ingressRules: IngressRule[];
  ports: ListeningPort[];
  onSelectTab: (tab: NavTab) => void;
}

export function GlobalSearch({
  isOpen,
  onClose,
  apps,
  databases,
  ingressRules,
  ports,
  onSelectTab
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();

  const filteredApps = apps.filter(
    (a) => a.name.toLowerCase().includes(q) || a.image.toLowerCase().includes(q)
  );

  const filteredDbs = databases.filter((d) => d.name.toLowerCase().includes(q));

  const filteredRoutes = ingressRules.filter(
    (r) => r.hostname.toLowerCase().includes(q) || r.service.toLowerCase().includes(q)
  );

  const filteredPorts = ports.filter(
    (p) => p.port.includes(q) || p.process.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <Search className="h-5 w-5 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, apps, databases, subdomains, ports..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-sans"
            autoFocus
          />
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3">
          {/* App Services */}
          {filteredApps.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                App Services ({filteredApps.length})
              </div>
              {filteredApps.slice(0, 5).map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    onSelectTab("apps");
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{app.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">({app.image})</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <span>{app.status}</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Databases */}
          {filteredDbs.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                SQL Databases ({filteredDbs.length})
              </div>
              {filteredDbs.map((db) => (
                <button
                  key={db.name}
                  onClick={() => {
                    onSelectTab("sql");
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium">{db.name}</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">{db.size}</span>
                </button>
              ))}
            </div>
          )}

          {/* Ingress Subdomains */}
          {filteredRoutes.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                Cloudflare Ingress Routes ({filteredRoutes.length})
              </div>
              {filteredRoutes.slice(0, 5).map((route) => (
                <button
                  key={route.hostname}
                  onClick={() => {
                    onSelectTab("networking");
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-cyan-400" />
                    <span className="font-medium font-mono text-cyan-300">{route.hostname}</span>
                  </span>
                  <span className="text-[11px] text-zinc-400 font-mono">→ {route.service}</span>
                </button>
              ))}
            </div>
          )}

          {/* Ports */}
          {filteredPorts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold uppercase text-zinc-500 tracking-wider">
                Listening Ports ({filteredPorts.length})
              </div>
              {filteredPorts.slice(0, 4).map((port) => (
                <button
                  key={port.port + port.pid}
                  onClick={() => {
                    onSelectTab("networking");
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-semibold">:{port.port}</span>
                    <span className="text-zinc-400">({port.process})</span>
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">PID {port.pid}</span>
                </button>
              ))}
            </div>
          )}

          {filteredApps.length === 0 && filteredDbs.length === 0 && filteredRoutes.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching resources found for "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-2 text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Navigate with arrow keys</span>
          <div className="flex gap-2">
            <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 text-[10px]">ESC</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
