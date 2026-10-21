"use client";

import React, { useState, useEffect } from "react";
import { X, RefreshCw, Download, Terminal, Search, Copy, Check } from "lucide-react";
import { api } from "@/lib/api";

interface LogsDrawerProps {
  appName: string | null;
  onClose: () => void;
}

export function LogsDrawer({ appName, onClose }: LogsDrawerProps) {
  const [logs, setLogs] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchLogs = async () => {
    if (!appName) return;
    setIsLoading(true);
    try {
      const res = await api.getAppLogs(appName, 250);
      setLogs(res.logs || "No logs available for this container.");
    } catch (err: any) {
      setLogs(`Error fetching logs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appName) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [appName]);

  if (!appName) return null;

  const filteredLines = logs
    .split("\n")
    .filter((line) => line.toLowerCase().includes(filter.toLowerCase()));

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName}_logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-3xl flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-cyan-400" />
          <span className="font-semibold text-xs text-white">Live Logs:</span>
          <span className="font-mono text-xs font-bold text-cyan-400">{appName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            title="Refresh logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
          </button>

          {/* Copy logs */}
          <button
            onClick={handleCopy}
            className="flex h-7 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-[11px] text-zinc-400 hover:text-white"
            title="Copy all logs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex h-7 items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-[11px] text-zinc-400 hover:text-white"
            title="Download log file"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/50 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter logs (regex, text)..."
            className="w-full bg-transparent text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none font-mono"
          />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <span className="font-mono">{filteredLines.length} lines</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 text-cyan-500"
            />
            <span>Auto-refresh (5s)</span>
          </label>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto bg-black p-4 font-mono text-[11px] leading-relaxed text-zinc-300 selection:bg-cyan-500 selection:text-black">
        {filteredLines.length === 0 ? (
          <div className="text-zinc-600">No logs found matching filter.</div>
        ) : (
          filteredLines.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap hover:bg-zinc-900/50 px-1 py-0.5 rounded">
              <span className="text-zinc-600 select-none mr-3">{idx + 1}</span>
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
