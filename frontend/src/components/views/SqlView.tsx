"use client";

import React, { useState } from "react";
import {
  Database,
  Play,
  Copy,
  Check,
  PlusCircle,
  Trash2,
  Download,
  ExternalLink,
  Code2,
  Table,
  Eye,
  EyeOff,
  Server,
  Layers
} from "lucide-react";
import { DatabaseInstance, DatabaseItem, DatabaseTable, ConnectionStrings } from "@/lib/types";
import { api } from "@/lib/api";

interface SqlViewProps {
  instance: DatabaseInstance | null;
  databases: DatabaseItem[];
  tables: DatabaseTable[];
  connectionStrings: ConnectionStrings | null;
  onRefresh: () => void;
}

export function SqlView({
  instance,
  databases,
  tables,
  connectionStrings,
  onRefresh
}: SqlViewProps) {
  const [selectedDb, setSelectedDb] = useState("picloud");
  const [query, setQuery] = useState("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
  const [queryOutput, setQueryOutput] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New DB form
  const [isCreatingDb, setIsCreatingDb] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunQuery = async () => {
    if (!query.trim() || isRunning) return;
    setIsRunning(true);
    setQueryOutput(null);
    setQueryError(null);
    try {
      const res = await api.runQuery(query, selectedDb);
      setDuration(res.duration_ms);
      if (res.success) {
        setQueryOutput(res.output || "(Empty result set)");
      } else {
        setQueryError(res.error || "Query failed");
      }
    } catch (err: any) {
      setQueryError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbName.trim()) return;
    try {
      await api.createDatabase(newDbName.trim());
      setNewDbName("");
      setIsCreatingDb(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error creating database: ${err.message}`);
    }
  };

  const handleBackup = async (dbName: string) => {
    setBackupStatus(`Creating snapshot of ${dbName}...`);
    try {
      const res = await api.backupDatabase(dbName);
      setBackupStatus(`Snapshot created: ${res.file}`);
      setTimeout(() => setBackupStatus(null), 5000);
    } catch (err: any) {
      setBackupStatus(`Backup failed: ${err.message}`);
    }
  };

  const querySnippets = [
    { label: "List Tables", sql: "SELECT table_name FROM information_schema.tables WHERE table_schema='public';" },
    { label: "DB Sizes", sql: "SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;" },
    { label: "Connections", sql: "SELECT pid, usename, client_addr, state FROM pg_stat_activity;" },
    { label: "Server Time", sql: "SELECT NOW(), version();" }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            <span>SQL & Managed Databases</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Dedicated PostgreSQL instances on the Raspberry Pi with query studio, connection strings, and backups
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://postgresql.pottapk.win"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 hover:text-white transition"
          >
            <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
            <span>Adminer GUI</span>
          </a>
          <button
            onClick={() => setIsCreatingDb(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Database</span>
          </button>
        </div>
      </div>

      {backupStatus && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-mono">
          {backupStatus}
        </div>
      )}

      {/* Instance Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Database Engine</div>
          <div className="mt-1 text-sm font-bold text-white flex items-center gap-1.5">
            <Server className="h-4 w-4 text-emerald-400" />
            <span>PostgreSQL 15</span>
          </div>
          <div className="mt-1 text-[10px] text-zinc-500 font-mono">Container: picloud-db</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Connection Endpoint</div>
          <div className="mt-1 text-sm font-bold text-white font-mono">192.168.1.151:5432</div>
          <div className="mt-1 text-[10px] text-emerald-400 font-mono">● Ready for connections</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Active Databases</div>
          <div className="mt-1 text-sm font-bold text-white">{databases.length} Databases</div>
          <div className="mt-1 text-[10px] text-zinc-500 font-mono">Default: picloud</div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-xs text-zinc-400">Public Access Route</div>
          <div className="mt-1 text-sm font-bold text-cyan-400 font-mono truncate">
            postgresql.pottapk.win
          </div>
          <div className="mt-1 text-[10px] text-zinc-500">Cloudflare Tunnel Route (5050)</div>
        </div>
      </div>

      {/* Database Explorer & Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Databases List */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Databases ({databases.length})
            </h3>
            <button
              onClick={() => setIsCreatingDb(!isCreatingDb)}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              + New
            </button>
          </div>

          {isCreatingDb && (
            <form onSubmit={handleCreateDb} className="rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 space-y-2">
              <input
                type="text"
                value={newDbName}
                onChange={(e) => setNewDbName(e.target.value)}
                placeholder="Database name (e.g. analytics)"
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingDb(false)}
                  className="rounded px-2 py-0.5 text-[10px] text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white"
                >
                  Create
                </button>
              </div>
            </form>
          )}

          <div className="space-y-1.5">
            {databases.map((db) => {
              const isSelected = selectedDb === db.name;
              return (
                <div
                  key={db.name}
                  onClick={() => setSelectedDb(db.name)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-xs transition ${
                    isSelected
                      ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-semibold"
                      : "border border-transparent bg-zinc-950/40 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{db.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-zinc-500">{db.size}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBackup(db.name);
                      }}
                      className="rounded p-1 text-zinc-500 hover:text-cyan-400"
                      title="Dump Snapshot"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tables in chosen Database */}
        <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Table className="h-4 w-4 text-emerald-400" />
              <span>Public Tables in &quot;{selectedDb}&quot;</span>
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">{tables.length} tables found</span>
          </div>

          {tables.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No public tables created yet in database &quot;{selectedDb}&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tables.map((tbl) => (
                <div
                  key={tbl.name}
                  onClick={() => setQuery(`SELECT * FROM ${tbl.name} LIMIT 25;`)}
                  className="cursor-pointer rounded-lg border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs hover:border-emerald-500/40 hover:bg-zinc-900 transition"
                >
                  <div className="font-mono font-medium text-zinc-200 truncate">{tbl.name}</div>
                  <div className="mt-1 text-[10px] text-zinc-500 font-mono">{tbl.size}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive SQL Query Runner */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white">Interactive SQL Studio</h3>
            <span className="text-[11px] font-mono text-zinc-400">Target: {selectedDb}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Snippet buttons */}
            <div className="hidden sm:flex items-center gap-1 mr-2">
              {querySnippets.map((s) => (
                <button
                  key={s.label}
                  onClick={() => setQuery(s.sql)}
                  className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white font-mono"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleRunQuery}
              disabled={isRunning || !query.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>{isRunning ? "Executing..." : "Execute Query"}</span>
            </button>
          </div>
        </div>

        {/* Editor Textarea */}
        <div className="p-3 bg-zinc-950">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-emerald-300 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
            placeholder="SELECT * FROM table_name WHERE ..."
          />
        </div>

        {/* Results / Error Area */}
        {(queryOutput || queryError) && (
          <div className="border-t border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400">Query Output</span>
              {duration !== null && (
                <span className="text-[10px] font-mono text-zinc-500">
                  Execution time: {duration}ms
                </span>
              )}
            </div>

            {queryError ? (
              <pre className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 font-mono text-xs text-rose-300 whitespace-pre-wrap">
                {queryError}
              </pre>
            ) : (
              <pre className="max-h-60 overflow-x-auto overflow-y-auto rounded-lg border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-200 whitespace-pre">
                {queryOutput}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Connection Strings Panel */}
      {connectionStrings && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Connection Strings & SDK Setup
              </h3>
              <p className="text-[11px] text-zinc-400">
                Use these connection strings in your Node.js, Python, or .NET applications
              </p>
            </div>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:text-white"
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{showPassword ? "Mask Password" : "Show Password"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Standard URI */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-zinc-300">Postgres URI</span>
                <button
                  onClick={() => handleCopy(connectionStrings.uri, "uri")}
                  className="text-zinc-500 hover:text-white"
                >
                  {copiedKey === "uri" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="font-mono text-[11px] text-emerald-400 truncate">
                {showPassword ? connectionStrings.uri : connectionStrings.uri.replace(/:[^@]+@/, ":••••••••@")}
              </p>
            </div>

            {/* CLI Command */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-zinc-300">PSQL Terminal CLI</span>
                <button
                  onClick={() => handleCopy(connectionStrings.psql_cli, "psql")}
                  className="text-zinc-500 hover:text-white"
                >
                  {copiedKey === "psql" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="font-mono text-[11px] text-cyan-400 truncate">
                {showPassword ? connectionStrings.psql_cli : connectionStrings.psql_cli.replace(/'[^']+'/, "'••••••••'")}
              </p>
            </div>

            {/* Python asyncpg */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-zinc-300">Python AsyncPG / SQLAlchemy</span>
                <button
                  onClick={() => handleCopy(connectionStrings.python_asyncpg, "py")}
                  className="text-zinc-500 hover:text-white"
                >
                  {copiedKey === "py" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="font-mono text-[11px] text-zinc-300 truncate">
                {showPassword ? connectionStrings.python_asyncpg : connectionStrings.python_asyncpg.replace(/:[^@]+@/, ":••••••••@")}
              </p>
            </div>

            {/* Prisma ORM */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="font-semibold text-zinc-300">Prisma / Next.js ORM</span>
                <button
                  onClick={() => handleCopy(connectionStrings.prisma, "prisma")}
                  className="text-zinc-500 hover:text-white"
                >
                  {copiedKey === "prisma" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <p className="font-mono text-[11px] text-zinc-300 truncate">
                {showPassword ? connectionStrings.prisma : connectionStrings.prisma.replace(/:[^@]+@/, ":••••••••@")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
