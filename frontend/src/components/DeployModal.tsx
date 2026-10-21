"use client";

import React, { useState } from "react";
import { X, Rocket, Sparkles, Plus, Trash2, Globe, Cpu, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployed: () => void;
}

interface TemplatePreset {
  title: string;
  desc: string;
  image: string;
  containerPort: number;
  env: Record<string, string>;
}

const TEMPLATES: Record<string, TemplatePreset> = {
  nextjs: {
    title: "Next.js Web App",
    desc: "React 19, Turbopack, Tailwind CSS web application",
    image: "node:18-alpine",
    containerPort: 3000,
    env: { NODE_ENV: "production", PORT: "3000" }
  },
  fastapi: {
    title: "Python FastAPI",
    desc: "High-performance REST API with Swagger & Uvicorn",
    image: "tiangolo/uvicorn-gunicorn-fastapi:python3.11",
    containerPort: 80,
    env: { APP_ENV: "production" }
  },
  nginx: {
    title: "Nginx Static Web",
    desc: "Ultra-fast static landing page or web client",
    image: "nginx:alpine",
    containerPort: 80,
    env: {}
  },
  go: {
    title: "Go Microservice",
    desc: "Lightweight, compiled aarch64 native binary server",
    image: "golang:1.22-alpine",
    containerPort: 8080,
    env: { GIN_MODE: "release" }
  },
  custom: {
    title: "Custom Docker Image",
    desc: "Deploy any Docker Hub or GHCR image",
    image: "",
    containerPort: 8080,
    env: {}
  }
};

export function DeployModal({ isOpen, onClose, onDeployed }: DeployModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("nextjs");
  const [name, setName] = useState("");
  const [image, setImage] = useState(TEMPLATES.nextjs.image);
  const [hostPort, setHostPort] = useState("8095");
  const [containerPort, setContainerPort] = useState(String(TEMPLATES.nextjs.containerPort));
  const [subdomain, setSubdomain] = useState("");
  const [restartPolicy, setRestartPolicy] = useState("unless-stopped");
  const [envPairs, setEnvPairs] = useState<Array<{ key: string; value: string }>>([
    { key: "NODE_ENV", value: "production" }
  ]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplate(key);
    const tmpl = TEMPLATES[key];
    setImage(tmpl.image);
    setContainerPort(String(tmpl.containerPort));
    setEnvPairs(Object.entries(tmpl.env).map(([k, v]) => ({ key: k, value: v })));
  };

  const handleAddEnv = () => {
    setEnvPairs([...envPairs, { key: "", value: "" }]);
  };

  const handleRemoveEnv = (index: number) => {
    setEnvPairs(envPairs.filter((_, i) => i !== index));
  };

  const handleUpdateEnv = (index: number, field: "key" | "value", val: string) => {
    const updated = [...envPairs];
    updated[index][field] = val;
    setEnvPairs(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an Application Name");
      return;
    }
    if (!image.trim()) {
      setError("Please specify a Docker Image");
      return;
    }

    setIsDeploying(true);
    setError(null);

    const envMap: Record<string, string> = {};
    envPairs.forEach((p) => {
      if (p.key.trim()) envMap[p.key.trim()] = p.value;
    });

    try {
      await api.deployApp({
        name: name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
        image: image.trim(),
        host_port: hostPort ? parseInt(hostPort) : undefined,
        container_port: containerPort ? parseInt(containerPort) : undefined,
        env_vars: envMap,
        restart_policy: restartPolicy,
        subdomain: subdomain.trim() || undefined
      });
      onDeployed();
      onClose();
    } catch (err: any) {
      setError(err.message || "Deployment failed");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Deploy App Service</h2>
              <p className="text-xs text-zinc-400">Launch a containerized microservice on your Raspberry Pi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Template presets */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Choose Deployment Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(TEMPLATES).map(([key, t]) => {
                const isSelected = selectedTemplate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectTemplate(key)}
                    className={`rounded-xl border p-3 text-left transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-500/10 text-white"
                        : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-xs text-white">
                      <Sparkles className={`h-3 w-3 ${isSelected ? "text-blue-400" : "text-zinc-500"}`} />
                      <span>{t.title}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-zinc-400 line-clamp-1">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* App Name & Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                App Service Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-web-app"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Docker Image *
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="nginx:alpine"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Ports & Subdomain */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Host Port
              </label>
              <input
                type="number"
                value={hostPort}
                onChange={(e) => setHostPort(e.target.value)}
                placeholder="8095"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Container Port
              </label>
              <input
                type="number"
                value={containerPort}
                onChange={(e) => setContainerPort(e.target.value)}
                placeholder="80"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 font-mono focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Restart Policy
              </label>
              <select
                value={restartPolicy}
                onChange={(e) => setRestartPolicy(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="unless-stopped">Unless Stopped</option>
                <option value="always">Always</option>
                <option value="on-failure">On Failure</option>
                <option value="no">No Restart</option>
              </select>
            </div>
          </div>

          {/* Cloudflare Subdomain Auto-Routing */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
              <Globe className="h-4 w-4 text-cyan-400" />
              <span>Public Cloudflare Subdomain Route</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="demo-app"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-500 focus:outline-none font-mono"
              />
              <span className="text-xs font-mono text-zinc-400">.pottapk.win</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              If specified, the tunnel configuration will instantly map this subdomain to your host port!
            </p>
          </div>

          {/* Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300">
                Environment Variables
              </label>
              <button
                type="button"
                onClick={handleAddEnv}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300"
              >
                <Plus className="h-3 w-3" />
                <span>Add Variable</span>
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto">
              {envPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => handleUpdateEnv(idx, "key", e.target.value)}
                    placeholder="KEY"
                    className="w-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => handleUpdateEnv(idx, "value", e.target.value)}
                    placeholder="VALUE"
                    className="w-1/2 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-100 font-mono placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveEnv(idx)}
                    className="rounded p-1 text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeploying}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeploying}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50"
            >
              {isDeploying ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Provisioning App Service...</span>
                </>
              ) : (
                <>
                  <Rocket className="h-3.5 w-3.5" />
                  <span>Provision & Deploy</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
