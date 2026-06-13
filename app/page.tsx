"use client";
import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock, ExternalLink, Info } from "lucide-react";

type Status = "online" | "offline" | "degraded" | "checking";

interface CheckResult {
  status: Status;
  latency: number | null;
  checkedAt: Date;
}

interface Site {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  history: (Status | null)[];
  current: CheckResult | null;
}

const SITES_CONFIG = [
  { id: "main", name: "University Website", url: "https://ndmu.edu.ph", description: "Official NDMU university portal", category: "Main" },
  { id: "sms", name: "School Management System", url: "https://sms.ndmu.edu.ph", description: "Student enrollment & academic portal", category: "Academic" },
  { id: "satp", name: "Student Portal (SATP)", url: "https://satp.ndmu.edu.ph", description: "Student academic tracking portal", category: "Academic" },
  { id: "alumni", name: "Alumni Portal", url: "https://alumni.ndmu.edu.ph", description: "NDMU alumni network & directory", category: "Community" },
];

function UptimeBar({ history }: { history: (Status | null)[] }) {
  return (
    <div className="uptime-bar-container">
      <div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "28px" }}>
        {history.map((s, i) => (
          <div
            key={i}
            title={s ?? "no data"}
            style={{
              flex: 1,
              height: s === "online" ? "100%" : s === "degraded" ? "60%" : s === "offline" ? "40%" : "20%",
              borderRadius: "2px",
              backgroundColor:
                s === "online" ? "var(--green)" :
                  s === "degraded" ? "var(--yellow)" :
                    s === "offline" ? "var(--red)" :
                      "var(--border-bright)",
              opacity: s ? 0.7 + (i / history.length) * 0.3 : 0.2,
              transition: "height 0.3s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const config = {
    online: { color: "var(--green)", bg: "var(--green-glow)", label: "Operational", Icon: CheckCircle2 },
    degraded: { color: "var(--yellow)", bg: "var(--yellow-glow)", label: "Degraded", Icon: AlertTriangle },
    offline: { color: "var(--red)", bg: "var(--red-glow)", label: "Offline", Icon: XCircle },
    checking: { color: "var(--text-muted)", bg: "transparent", label: "Loading…", Icon: Activity },
  }[status];

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "4px",
      background: config.bg, border: `1px solid ${config.color}33`, color: config.color,
      fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
    }}>
      <span className="status-dot" style={{
        width: "6px", height: "6px", borderRadius: "50%", backgroundColor: config.color, display: "inline-block"
      }} />
      {config.label}
    </span>
  );
}

function SiteCard({ site }: { site: Site }) {
  const historicalLogs = site.history.filter(s => s !== null);
  const uptimePercent = historicalLogs.length > 0
    ? (historicalLogs.filter(s => s === "online" || s === "degraded").length / historicalLogs.length) * 100
    : 100;

  return (
    <article style={{
      background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px",
      transition: "border-color 0.2s, background 0.2s", position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-bright)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
        background: site.current?.status === "online" ? "var(--green)" : site.current?.status === "degraded" ? "var(--yellow)" : site.current?.status === "offline" ? "var(--red)" : "var(--border-bright)",
        opacity: 0.6,
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{site.category}</span>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>{site.name}</h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{site.description}</p>
        </div>
        <StatusBadge status={site.current?.status ?? "checking"} />
      </div>

      <a href={site.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace", marginBottom: "20px", textDecoration: "none", opacity: 0.8 }}>
        {site.url} <ExternalLink size={10} />
      </a>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Latency", value: site.current?.latency != null ? `${site.current.latency}ms` : "—", color: site.current?.latency != null ? (site.current.latency < 500 ? "var(--green)" : site.current.latency < 2000 ? "var(--yellow)" : "var(--red)") : "var(--text-muted)" },
          { label: "Uptime Metric", value: historicalLogs.length > 0 ? `${uptimePercent.toFixed(1)}%` : "—", color: uptimePercent > 98 ? "var(--green)" : uptimePercent > 90 ? "var(--yellow)" : "var(--red)" },
          { label: "Last Sync", value: site.current?.checkedAt ? new Date(site.current.checkedAt).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" }) : "—", color: "var(--text-muted)" },
        ].map(m => (
          <div key={m.label} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "6px", padding: "10px 12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>{m.label}</div>
            <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "10px", color: "var(--text-dim)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>Database History</span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>live status →</span>
        </div>
        <UptimeBar history={site.history} />
      </div>
    </article>
  );
}

export default function Home() {
  const [sites, setSites] = useState<Site[]>(() =>
    SITES_CONFIG.map(s => ({ ...s, history: Array(90).fill(null), current: null }))
  );
  const [checking, setChecking] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [overallStatus, setOverallStatus] = useState<Status>("checking");

  const fetchDatabaseStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        const mergedSites = SITES_CONFIG.map(config => {
          const dbMatch = data.systems.find((sys: any) => sys.id === config.id);
          return {
            ...config,
            current: dbMatch?.current || null,
            history: dbMatch?.history || Array(90).fill(null)
          };
        });

        setSites(mergedSites);

        const statuses = data.systems.map((sys: any) => sys.current?.status).filter(Boolean);
        if (statuses.every((s: Status) => s === "online")) setOverallStatus("online");
        else if (statuses.some((s: Status) => s === "offline")) setOverallStatus("offline");
        else setOverallStatus("degraded");

        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to sync database logs:", err);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    fetchDatabaseStatus();
    const interval = setInterval(fetchDatabaseStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchDatabaseStatus]);

  const overallConfig = {
    online: { label: "All Systems Operational", color: "var(--green)", Icon: CheckCircle2 },
    degraded: { label: "Partial Operational Interruption", color: "var(--yellow)", Icon: AlertTriangle },
    offline: { label: "Critical Outage Detected", color: "var(--red)", Icon: XCircle },
    checking: { label: "Synchronizing Database Logs…", color: "var(--text-muted)", Icon: Activity },
  }[overallStatus];

  return (
    <main style={{ position: "relative", zIndex: 10, minHeight: "100vh", maxWidth: "900px", margin: "0 auto", padding: "0 20px 80px" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", borderBottom: "1px solid var(--border)", marginBottom: "48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--accent-dim)", border: "1px solid var(--accent)33", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={16} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "var(--text)" }}>NDMU Systems</div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>INDEPENDENT STATUS</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {lastUpdated && (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
              <Clock size={11} /> Sync: {lastUpdated.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
          )}
          <button onClick={fetchDatabaseStatus} disabled={checking} style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-card)", border: "1px solid var(--border)", color: checking ? "var(--text-muted)" : "var(--text)", padding: "7px 14px", borderRadius: "6px", cursor: checking ? "not-allowed" : "pointer", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace" }}>
            <RefreshCw size={12} style={{ animation: checking ? "spin 1s linear infinite" : "none" }} />
            {checking ? "Syncing…" : "Sync"}
          </button>
        </div>
      </nav>

      <section style={{ marginBottom: "52px" }}>
        <div style={{ padding: "32px 36px", background: "var(--bg-card)", border: `1px solid ${overallConfig.color}33`, borderRadius: "10px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top left, ${overallConfig.color}08 0%, transparent 60%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <overallConfig.Icon size={28} color={overallConfig.color} strokeWidth={1.5} />
            <h1 style={{ fontSize: "22px", fontWeight: 600, color: overallConfig.color }}>{overallConfig.label}</h1>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "500px", lineHeight: 1.6 }}>
            Displaying analytical data retrieved from continuous cloud monitoring.
          </p>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>
        {sites.map((site) => <SiteCard key={site.id} site={site} />)}
      </section>

      <footer>
        <div style={{ padding: "20px 24px", background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: "8px", display: "flex", gap: "12px", marginBottom: "24px" }}>
          <Info size={14} color="var(--yellow)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{ fontSize: "12px", color: "var(--yellow)", fontWeight: 600, marginBottom: "4px", fontFamily: "'JetBrains Mono', monospace" }}>Unofficial Monitor</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
              This tool operates independently of Notre Dame of Marbel University.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}