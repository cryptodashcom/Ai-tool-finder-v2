"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { ScoredAgent, LogLine, PipelineEvent } from "@/lib/types";

const SOURCES = [
  { id: "producthunt", name: "ProductHunt", icon: "🐱", color: "#FF6154", endpoint: "AI agent launches" },
  { id: "github", name: "GitHub", icon: "⬡", color: "#238636", endpoint: "ai-agent topic repos" },
  { id: "huggingface", name: "HuggingFace", icon: "🤗", color: "#FFD21E", endpoint: "Spaces & Models" },
  { id: "reddit", name: "Reddit", icon: "◉", color: "#FF4500", endpoint: "r/AIAgents + r/LocalLLaMA" },
];

const PIPELINE_STAGES = [
  { id: "discover", label: "Discover", icon: "⊙", desc: "Scrapes all sources" },
  { id: "enrich", label: "Enrich", icon: "◈", desc: "Claude extracts metadata" },
  { id: "score", label: "Score", icon: "◇", desc: "Quality gate ≥ 75" },
  { id: "dream", label: "Dream", icon: "◑", desc: "Self-improvement pass" },
  { id: "publish", label: "Publish", icon: "◉", desc: "POST to AgentsDash.ai" },
];

function PulsingDot({ color = "#22c55e", size = 8 }: { color?: string; size?: number }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }} />
      <span style={{ borderRadius: "50%", width: size, height: size, background: color, display: "block" }} />
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 99 }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 700, minWidth: 28, fontFamily: "'DM Mono', monospace" }}>{score}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    approved: ["#22c55e", "#052e16", "LIVE"],
    review: ["#f59e0b", "#1c1400", "REVIEW"],
    rejected: ["#ef4444", "#1a0000", "REJECT"],
  };
  const [fg, bg, label] = map[status] ?? map.review;
  return (
    <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", fontWeight: 700, letterSpacing: "0.1em", color: fg, background: bg, border: `1px solid ${fg}33`, borderRadius: 4, padding: "2px 6px" }}>
      {label}
    </span>
  );
}

function LogEntry({ entry, index }: { entry: LogLine; index: number }) {
  const colors: Record<string, string> = { info: "#64748b", success: "#22c55e", warning: "#f59e0b", error: "#ef4444", dream: "#a78bfa" };
  const icons: Record<string, string> = { info: "›", success: "✓", warning: "⚠", error: "✕", dream: "◑" };
  return (
    <div style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: "1px solid #0f172a", animation: `fadeIn 0.3s ease ${index * 0.03}s both`, opacity: 0 }}>
      <span style={{ color: "#334155", fontSize: 10, fontFamily: "'DM Mono', monospace", minWidth: 60 }}>{entry.time}</span>
      <span style={{ color: colors[entry.type], fontSize: 11, minWidth: 12 }}>{icons[entry.type]}</span>
      <span style={{ color: entry.type === "dream" ? "#c4b5fd" : "#94a3b8", fontSize: 11, lineHeight: 1.5 }}>{entry.msg}</span>
    </div>
  );
}

const CATEGORY_ICON: Record<string, string> = {
  Coding: "⌥", Research: "◈", Sales: "◎", Data: "⊛", Legal: "⊠",
  Marketing: "◇", DevOps: "⬡", Productivity: "◑", Other: "◇",
};

export default function AgentsDashAutomation() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [runningStage, setRunningStage] = useState<string | null>(null);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [dreamActive, setDreamActive] = useState(false);
  const [agents, setAgents] = useState<ScoredAgent[]>([]);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [stats, setStats] = useState({ discovered: 0, enriched: 0, approved: 0, dreaming: false });
  const [filter, setFilter] = useState("all");
  const [llmPrompt, setLlmPrompt] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&family=DM+Sans:wght@400;500&display=swap');
      @keyframes ping { 75%,100% { transform: scale(2); opacity: 0; } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes dreamPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
      @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0f1a; }
      ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const handleEvent = useCallback((event: PipelineEvent) => {
    if (event.log) setLogs(prev => [...prev, event.log!]);

    if (event.stage) {
      if (event.status === "running") {
        setRunningStage(event.stage);
        if (event.stage === "dream") { setDreamActive(true); setStats(s => ({ ...s, dreaming: true })); }
      }
      if (event.status === "complete") {
        setCompletedStages(prev => [...prev, event.stage!]);
        setRunningStage(null);
        if (event.stage === "discover") setStats(s => ({ ...s, discovered: event.count ?? 0 }));
        if (event.stage === "enrich") setStats(s => ({ ...s, enriched: event.count ?? 0 }));
        if (event.stage === "score") {
          setStats(s => ({ ...s, approved: event.approved ?? 0 }));
          if (event.agents) setAgents(event.agents);
        }
        if (event.stage === "dream") { setDreamActive(false); setStats(s => ({ ...s, dreaming: false })); }
      }
    }
  }, []);

  async function runPipeline() {
    if (isRunning) return;
    setIsRunning(true);
    setCompletedStages([]);
    setRunningStage(null);
    setDreamActive(false);
    setAgents([]);
    setLogs([]);
    setStats({ discovered: 0, enriched: 0, approved: 0, dreaming: false });

    try {
      const res = await fetch("/api/pipeline/run");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { handleEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (e: any) {
      setLogs(prev => [...prev, { time: new Date().toTimeString().slice(0, 8), type: "error", msg: `Pipeline failed: ${e.message}` }]);
    }

    setIsRunning(false);
    setRunningStage(null);
  }

  async function askClaude() {
    if (!llmPrompt.trim() || llmLoading) return;
    setLlmLoading(true);
    setLlmResponse("");
    try {
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: llmPrompt }),
      });
      const data = await res.json();
      setLlmResponse(data.text ?? data.error ?? "No response.");
    } catch (e: any) {
      setLlmResponse(`Error: ${e.message}`);
    }
    setLlmLoading(false);
  }

  const filteredAgents = filter === "all" ? agents : agents.filter(a => a.status === filter);
  const tabs = ["pipeline", "sources", "listings", "claude", "logs"];

  const s = {
    root: { fontFamily: "'DM Sans', sans-serif", background: "#040b14", minHeight: "100vh", color: "#e2e8f0", position: "relative" as const, overflow: "hidden" as const },
    scanline: { position: "fixed" as const, top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(transparent, #0ea5e933, transparent)", animation: "scanline 8s linear infinite", pointerEvents: "none" as const, zIndex: 0 },
    grid: { position: "fixed" as const, inset: 0, backgroundImage: "linear-gradient(#0f1a2e22 1px, transparent 1px), linear-gradient(90deg, #0f1a2e22 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" as const },
    container: { position: "relative" as const, zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "24px 20px" },
    header: { marginBottom: 28 },
    headerTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 },
    logo: { fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#f8fafc" },
    logoDot: { color: "#0ea5e9" },
    subtitle: { color: "#475569", fontSize: 12, fontFamily: "'DM Mono', monospace", marginTop: 2 },
    liveBadge: { display: "flex", alignItems: "center", gap: 6, background: "#052e16", border: "1px solid #166534", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#22c55e", fontFamily: "'DM Mono', monospace" },
    statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 },
    stat: { background: "#0a1628", border: "1px solid #1e293b", borderRadius: 8, padding: "12px 14px" },
    statVal: { fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, lineHeight: 1 },
    statLabel: { fontSize: 10, color: "#475569", fontFamily: "'DM Mono', monospace", marginTop: 4, letterSpacing: "0.08em" },
    tabs: { display: "flex", gap: 2, marginBottom: 16, background: "#0a1628", border: "1px solid #1e293b", borderRadius: 8, padding: 4 },
    tab: (active: boolean) => ({ flex: 1, padding: "7px 4px", textAlign: "center" as const, borderRadius: 5, fontSize: 11, fontFamily: "'DM Mono', monospace", letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.2s", fontWeight: active ? 600 : 400, background: active ? "#0f2d4a" : "transparent", color: active ? "#38bdf8" : "#475569", border: active ? "1px solid #1e4976" : "1px solid transparent" }),
    card: { background: "#0a1628", border: "1px solid #1e293b", borderRadius: 10, padding: 18, marginBottom: 12 },
    cardTitle: { fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 12, letterSpacing: "-0.01em" },
    pipelineFlow: { display: "flex", alignItems: "center", gap: 0, overflowX: "auto" as const, paddingBottom: 8 },
    stageBox: (state: string) => ({ flex: "0 0 auto", minWidth: 140, background: state === "complete" ? "#052e16" : state === "running" ? "#0c1f3d" : "#0d1b2e", border: `1px solid ${state === "complete" ? "#166534" : state === "running" ? "#1e4976" : "#1e293b"}`, borderRadius: 8, padding: "12px 14px", transition: "all 0.4s", boxShadow: state === "running" ? "0 0 20px #0ea5e922" : "none" }),
    stageIcon: (state: string) => ({ fontSize: 18, marginBottom: 6, color: state === "complete" ? "#22c55e" : state === "running" ? "#38bdf8" : "#334155", display: "block" as const, animation: state === "running" ? "spin 2s linear infinite" : "none" }),
    stageLabel: { fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: "#94a3b8" },
    stageDesc: { fontSize: 10, color: "#475569", marginTop: 3 },
    connector: (done: boolean) => ({ width: 20, height: 1, background: done ? "#166534" : "#1e293b", flexShrink: 0, margin: "0 2px" }),
    runBtn: { display: "flex", alignItems: "center", gap: 8, background: isRunning ? "#0c1f3d" : "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, cursor: isRunning ? "not-allowed" as const : "pointer" as const, marginTop: 14, letterSpacing: "-0.01em" },
    sourceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 },
    sourceCard: (color: string) => ({ background: "#0a1628", border: `1px solid ${color}33`, borderRadius: 8, padding: 14 }),
    agentRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #0f172a" },
    agentName: { fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#f1f5f9", marginBottom: 2 },
    agentDesc: { fontSize: 11, color: "#475569", lineHeight: 1.4 },
    filterRow: { display: "flex", gap: 6, marginBottom: 14 },
    filterBtn: (active: boolean) => ({ padding: "4px 12px", borderRadius: 5, fontSize: 11, fontFamily: "'DM Mono', monospace", cursor: "pointer" as const, background: active ? "#0f2d4a" : "transparent", color: active ? "#38bdf8" : "#475569", border: active ? "1px solid #1e4976" : "1px solid #1e293b" }),
    dreamBox: { background: "#1a0a2e", border: "1px solid #6d28d9", borderRadius: 8, padding: 14, marginTop: 12, animation: "dreamPulse 2s ease infinite" },
    textarea: { width: "100%", background: "#071020", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", fontSize: 13, resize: "vertical" as const, minHeight: 80, outline: "none", lineHeight: 1.5 },
    askBtn: { background: "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none", borderRadius: 7, padding: "9px 18px", color: "#fff", fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, cursor: llmLoading ? "not-allowed" as const : "pointer" as const, marginTop: 8 },
    responseBox: { background: "#071020", border: "1px solid #1e293b", borderRadius: 8, padding: 14, marginTop: 12, fontSize: 12, color: "#94a3b8", lineHeight: 1.7, whiteSpace: "pre-wrap" as const, fontFamily: "'DM Sans', sans-serif" },
    logsBox: { background: "#071020", border: "1px solid #1e293b", borderRadius: 8, padding: 14, maxHeight: 360, overflowY: "auto" as const },
  };

  return (
    <div style={s.root}>
      <div style={s.scanline} />
      <div style={s.grid} />
      <div style={s.container}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerTop}>
            <div>
              <div style={s.logo}>AgentsDash<span style={s.logoDot}>.</span>ai</div>
              <div style={s.subtitle}>LISTING AUTOMATION SYSTEM · v2.1</div>
            </div>
            <div style={s.liveBadge}>
              <PulsingDot size={7} /> SYSTEM ONLINE
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={s.statsRow}>
          {[
            { val: stats.discovered || "—", label: "DISCOVERED", color: "#38bdf8" },
            { val: stats.enriched || "—", label: "ENRICHED", color: "#818cf8" },
            { val: stats.approved || "—", label: "APPROVED", color: "#22c55e" },
            { val: dreamActive ? "◑" : agents.length || "—", label: dreamActive ? "DREAMING..." : "TOTAL LISTED", color: dreamActive ? "#a78bfa" : "#f59e0b" },
          ].map((item, i) => (
            <div key={i} style={s.stat}>
              <div style={{ ...s.statVal, color: item.color }}>{item.val}</div>
              <div style={s.statLabel}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {tabs.map(t => (
            <div key={t} style={s.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
              {t.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Pipeline Tab */}
        {activeTab === "pipeline" && (
          <div>
            <div style={s.card}>
              <div style={s.cardTitle}>Automated Discovery → Publish Pipeline</div>
              <div style={s.pipelineFlow}>
                {PIPELINE_STAGES.map((stage, i) => {
                  const state = completedStages.includes(stage.id) ? "complete" : runningStage === stage.id ? "running" : "idle";
                  return (
                    <div key={stage.id} style={{ display: "flex", alignItems: "center" }}>
                      <div style={s.stageBox(state)}>
                        <span style={s.stageIcon(state)}>{state === "complete" ? "✓" : stage.icon}</span>
                        <div style={s.stageLabel}>{stage.label}</div>
                        <div style={s.stageDesc}>{stage.desc}</div>
                      </div>
                      {i < PIPELINE_STAGES.length - 1 && <div style={s.connector(completedStages.includes(stage.id))} />}
                    </div>
                  );
                })}
              </div>
              <button style={s.runBtn} onClick={runPipeline} disabled={isRunning}>
                {isRunning ? <>◌ Running pipeline...</> : <>▶ Run Full Pipeline</>}
              </button>
            </div>

            {dreamActive && (
              <div style={s.dreamBox}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#c4b5fd", fontSize: 13, marginBottom: 6 }}>◑ Dreaming Active</div>
                <div style={{ fontSize: 11, color: "#a78bfa", lineHeight: 1.6 }}>
                  Analysing session patterns · Recalibrating source weights · Updating quality memory...
                </div>
              </div>
            )}

            <div style={s.card}>
              <div style={s.cardTitle}>Pipeline Architecture</div>
              {[
                { layer: "Layer 1 — Discovery", tool: "Multi-Source Scraper", detail: "Queries ProductHunt GraphQL, GitHub API (ai-agent topic), HuggingFace Spaces & Models, and Reddit r/AIAgents + r/LocalLLaMA daily. Results saved in memory for the current run." },
                { layer: "Layer 2 — Enrichment", tool: "Claude Sonnet", detail: "Batched Claude API calls extract: category, tags, pricing model, cleaned description. Filters out non-agent listings. Runs server-side — API key is never exposed to the browser." },
                { layer: "Layer 3 — Quality Gate", tool: "Scoring Engine", detail: "Scores each listing: description quality (30 pts), category fit (25 pts), uniqueness (25 pts), tag coverage (20 pts). Threshold: ≥75 auto-approve, 60–74 review queue, <60 reject." },
                { layer: "Layer 4 — Memory", tool: "Dream Pass", detail: "Analyses session results: which sources yield the most approvals, top categories, average score. Surfaces actionable insights after every run." },
                { layer: "Layer 5 — Publish", tool: "AgentsDash.ai API", detail: "Approved agents POST to your AGENTSDASH_API_URL/agents endpoint with Bearer auth. Configure AGENTSDASH_API_URL and AGENTSDASH_API_KEY in .env.local." },
              ].map((row, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: i < 4 ? "1px solid #0f172a" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 12, color: "#f1f5f9" }}>{row.layer}</span>
                    <span style={{ fontSize: 10, color: "#38bdf8", background: "#0c2340", border: "1px solid #1e4976", borderRadius: 4, padding: "1px 7px", fontFamily: "'DM Mono', monospace" }}>{row.tool}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{row.detail}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === "sources" && (
          <div>
            <div style={s.card}>
              <div style={s.cardTitle}>Discovery Sources</div>
              <div style={s.sourceGrid}>
                {SOURCES.map(src => (
                  <div key={src.id} style={s.sourceCard(src.color)}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{src.icon}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13, color: "#f1f5f9", marginBottom: 3 }}>{src.name}</div>
                    <div style={{ fontSize: 10, color: "#475569" }}>{src.endpoint}</div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <PulsingDot color={src.color} size={6} />
                      <span style={{ fontSize: 10, color: src.color, fontFamily: "'DM Mono', monospace" }}>ACTIVE</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Environment Variables Required</div>
              <div style={{ background: "#071020", borderRadius: 8, padding: 14, fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#64748b", lineHeight: 2 }}>
                {[
                  ["ANTHROPIC_API_KEY", "Claude enrichment & AI tab"],
                  ["PRODUCTHUNT_API_KEY", "ProductHunt GraphQL API"],
                  ["GITHUB_TOKEN", "GitHub repository search"],
                  ["REDDIT_CLIENT_ID", "Reddit OAuth client ID"],
                  ["REDDIT_CLIENT_SECRET", "Reddit OAuth client secret"],
                  ["HUGGINGFACE_API_KEY", "HuggingFace Spaces & Models"],
                  ["AGENTSDASH_API_URL", "Your AgentsDash.ai API base URL"],
                  ["AGENTSDASH_API_KEY", "Bearer token for AgentsDash.ai API"],
                ].map(([key, desc]) => (
                  <div key={key}>
                    <span style={{ color: "#38bdf8" }}>{key}</span>
                    <span style={{ color: "#475569" }}> — {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <div>
            <div style={s.filterRow}>
              {["all", "approved", "review", "rejected"].map(f => (
                <button key={f} style={s.filterBtn(filter === f)} onClick={() => setFilter(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>
                {agents.length === 0
                  ? "No agents yet — run the pipeline to discover listings"
                  : `Agent Listings (${filteredAgents.length})`}
              </div>
              {filteredAgents.map(agent => (
                <div key={agent.id} style={s.agentRow}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0f172a", border: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {CATEGORY_ICON[agent.category] ?? "◇"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <a href={agent.url} target="_blank" rel="noopener noreferrer" style={{ ...s.agentName, textDecoration: "none" }}>{agent.name}</a>
                      <StatusBadge status={agent.status} />
                      <span style={{ fontSize: 9, color: "#334155", fontFamily: "'DM Mono', monospace", marginLeft: "auto" }}>via {agent.source}</span>
                    </div>
                    <div style={s.agentDesc}>{agent.enrichedDescription}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" as const }}>
                      {agent.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{ fontSize: 9, color: "#475569", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 3, padding: "1px 5px", fontFamily: "'DM Mono', monospace" }}>{tag}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <ScoreBar score={agent.score} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Claude AI Tab */}
        {activeTab === "claude" && (
          <div>
            <div style={s.card}>
              <div style={s.cardTitle}>Ask Claude — AgentsDash Intelligence</div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 12, lineHeight: 1.6 }}>
                Secure server-side Claude API. Ask about listings, quality scoring, source strategy, or anything AgentsDash-related.
              </div>
              <textarea
                style={s.textarea}
                placeholder="e.g. Which categories are underrepresented in my listings? What makes a high-quality AI agent listing?"
                value={llmPrompt}
                onChange={e => setLlmPrompt(e.target.value)}
                onKeyDown={e => e.key === "Enter" && e.metaKey && askClaude()}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button style={s.askBtn} onClick={askClaude} disabled={llmLoading}>
                  {llmLoading ? "◌ Thinking..." : "Ask Claude ⌘↵"}
                </button>
                <span style={{ fontSize: 10, color: "#334155", fontFamily: "'DM Mono', monospace" }}>claude-sonnet-4 · server-side</span>
              </div>
              {llmResponse && <div style={s.responseBox}>{llmResponse}</div>}
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Suggested Prompts</div>
              {[
                "What categories are missing from my AgentsDash listings?",
                "Write a quality scoring rubric for AI agent listings",
                "How should I prioritize ProductHunt vs GitHub as discovery sources?",
                "Generate an outreach email template for agent builders to self-submit",
                "What metadata fields should every AgentsDash listing have?",
              ].map((p, i) => (
                <div key={i} onClick={() => setLlmPrompt(p)} style={{ padding: "7px 10px", borderRadius: 6, fontSize: 11, color: "#64748b", cursor: "pointer", marginBottom: 4, background: "#071020", border: "1px solid #0f172a" }}>
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <div>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={s.cardTitle}>System Logs</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {isRunning && <><PulsingDot size={6} /><span style={{ fontSize: 10, color: "#22c55e", fontFamily: "'DM Mono', monospace" }}>LIVE</span></>}
                  {!isRunning && logs.length === 0 && <span style={{ fontSize: 10, color: "#475569", fontFamily: "'DM Mono', monospace" }}>RUN PIPELINE TO SEE LOGS</span>}
                </div>
              </div>
              <div style={s.logsBox} ref={logRef}>
                {logs.map((entry, i) => <LogEntry key={i} entry={entry} index={i} />)}
              </div>
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Legend</div>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 12 }}>
                {[["success", "#22c55e", "✓"], ["info", "#64748b", "›"], ["warning", "#f59e0b", "⚠"], ["error", "#ef4444", "✕"], ["dream", "#a78bfa", "◑"]].map(([type, color, icon]) => (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                    <span style={{ color }}>{icon}</span>
                    <span style={{ color: "#475569", fontFamily: "'DM Mono', monospace" }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
