"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal, X, Play, Trash2, Maximize2, Minimize2, Check, Copy } from "lucide-react";
import { api } from "@/lib/api";

interface CloudShellProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CommandHistoryItem {
  cmd: string;
  output: string;
  isError: boolean;
  exitCode: number;
}

export function CloudShell({ isOpen, onClose }: CloudShellProps) {
  const [inputCmd, setInputCmd] = useState("");
  const [history, setHistory] = useState<CommandHistoryItem[]>([
    {
      cmd: "uname -a",
      output: "Linux pavankumarpotta 6.6.20+rpt-rpi-2712 #1 SMP PREEMPT Debian 1:6.6.20-1+rpt1 aarch64 GNU/Linux",
      isError: false,
      exitCode: 0
    }
  ]);
  const [cmdIndex, setCmdIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  const handleRun = async (cmdToRun?: string) => {
    const cmd = cmdToRun !== undefined ? cmdToRun : inputCmd;
    if (!cmd.trim() || isRunning) return;

    setIsRunning(true);
    setInputCmd("");
    setCmdIndex(-1);

    try {
      const res = await api.executeShell(cmd);
      setHistory((prev) => [
        ...prev,
        {
          cmd,
          output: res.stdout || res.stderr || "(No output returned)",
          isError: !res.success,
          exitCode: res.exit_code
        }
      ]);
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          cmd,
          output: `Execution failed: ${err.message}`,
          isError: true,
          exitCode: -1
        }
      ]);
    } finally {
      setIsRunning(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleRun();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = cmdIndex === -1 ? history.length - 1 : Math.max(0, cmdIndex - 1);
        setCmdIndex(nextIdx);
        setInputCmd(history[nextIdx].cmd);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdIndex !== -1) {
        const nextIdx = cmdIndex + 1;
        if (nextIdx < history.length) {
          setCmdIndex(nextIdx);
          setInputCmd(history[nextIdx].cmd);
        } else {
          setCmdIndex(-1);
          setInputCmd("");
        }
      }
    }
  };

  const quickSnippets = [
    { label: "Docker PS", cmd: "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" },
    { label: "Pi Temp", cmd: "vcgencmd measure_temp" },
    { label: "Memory (free -h)", cmd: "free -h" },
    { label: "Disk (df -h)", cmd: "df -h /" },
    { label: "Tunnel Status", cmd: "sudo systemctl status cloudflared --no-pager" }
  ];

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 flex flex-col border-t border-zinc-700 bg-zinc-950 shadow-2xl transition-all duration-200 ${
        isExpanded ? "h-[85vh]" : "h-96"
      }`}
    >
      {/* Shell Titlebar */}
      <div className="flex h-11 items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-xs text-white">Pi Cloud Shell</span>
          <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono text-amber-400 border border-amber-400/20">
            SSH pavankumarpotta@192.168.1.151
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick presets */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            {quickSnippets.map((snip) => (
              <button
                key={snip.label}
                onClick={() => handleRun(snip.cmd)}
                disabled={isRunning}
                className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700 hover:text-white transition font-mono"
              >
                {snip.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setHistory([])}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            title="Clear terminal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            title="Close Cloud Shell"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div className="flex-1 overflow-y-auto bg-black p-4 font-mono text-xs leading-relaxed text-zinc-200">
        {history.map((item, idx) => (
          <div key={idx} className="mb-3 space-y-1">
            <div className="flex items-center gap-2 text-cyan-400">
              <span className="text-emerald-400 font-bold">pavankumarpotta@raspberrypi:~$</span>
              <span className="text-white font-medium">{item.cmd}</span>
              {item.exitCode !== 0 && (
                <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[9px] text-rose-400 font-sans">
                  exit {item.exitCode}
                </span>
              )}
            </div>
            <pre
              className={`whitespace-pre-wrap pl-2 ${
                item.isError ? "text-rose-300" : "text-zinc-300"
              }`}
            >
              {item.output}
            </pre>
          </div>
        ))}

        {isRunning && (
          <div className="flex items-center gap-2 text-amber-400 pl-2">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></div>
            <span>Executing command on Raspberry Pi...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Command Input Prompt */}
      <div className="flex items-center gap-2 border-t border-zinc-800 bg-zinc-950 px-4 py-2 font-mono text-xs">
        <span className="text-emerald-400 font-bold select-none">pavankumarpotta@rpi:~$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputCmd}
          onChange={(e) => setInputCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type bash command (e.g. docker ps, vcgencmd measure_temp)..."
          className="flex-1 bg-transparent text-white placeholder-zinc-600 focus:outline-none"
          disabled={isRunning}
          autoFocus
        />
        <button
          onClick={() => handleRun()}
          disabled={isRunning || !inputCmd.trim()}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-sans font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          Run
        </button>
      </div>
    </div>
  );
}
