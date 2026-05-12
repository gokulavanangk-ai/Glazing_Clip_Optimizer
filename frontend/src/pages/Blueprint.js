import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

// Colour palette for cut pieces
const PIECE_COLORS = [
  "#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#0ea5e9", "#14b8a6", "#f97316", "#6366f1",
];

export default function Blueprint() {
  const { id } = useParams();
  const { authHeader } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    axios
      .get(`${API}/projects/${id}`, { headers: authHeader })
      .then((res) => setProject(res.data))
      .catch(() => setError("Project not found or access denied."))
      .finally(() => setLoading(false));
  }, [id, authHeader]);

  if (loading) {
    return (
      <main className="gco-page">
        <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="gco-page">
        <div className="alert alert-danger"><span>⚠</span> {error}</div>
        <Link to="/" className="btn btn-outline">← Back to Optimizer</Link>
      </main>
    );
  }

  const stockLength = Number(project.stockLength) || 12; // ft

  // Build colour map: assign colour per unique piece length
  const uniqueLengths = [...new Set(project.rods.flatMap((r) => r.pieces.map(Number)))].sort((a,b)=>b-a);
  const colorMap = {};
  uniqueLengths.forEach((len, i) => {
    colorMap[len.toFixed(2)] = PIECE_COLORS[i % PIECE_COLORS.length];
  });

  const handlePrint = () => window.print();

  return (
    <main className="gco-page" id="blueprint-root">
      <div className="print-hide">
        <div className="flex-between mb-6">
          <header className="page-hero" style={{ marginBottom: 0 }}>
            <h1>Cutting <span className="gradient-text">Blueprint</span></h1>
            <p>
              <strong>{project.siteName}</strong> — {project.totalRods} clips ·{" "}
              {project.totalWaste} ft waste · {project.wastePercentage}% waste rate
            </p>
          </header>
          <div className="flex gap-3" style={{ flexShrink: 0 }}>
            <Link to="/" className="btn btn-ghost btn-sm">← Back</Link>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              🖨 Print
            </button>
          </div>
        </div>
      </div>

      {/* Print title */}
      <div className="print-only" style={{ marginBottom: 24 }}>
        <h2 style={{ fontWeight: 800, fontSize: 22 }}>Cutting Blueprint — {project.siteName}</h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>
          {project.totalRods} clips · {project.totalWaste} ft total waste · {project.wastePercentage}% waste rate
        </p>
      </div>

      {/* Blueprint Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {project.rods.map((rod) => {
          const usedPct = rod.pieces.reduce((s, p) => s + Number(p) / stockLength * 100, 0);
          const wastePct = Number(rod.waste) / stockLength * 100;

          return (
            <div className="blueprint-row" key={rod.rodNumber}>
              <div className="blueprint-label">Clip {rod.rodNumber}</div>

              <div className="blueprint-bar-wrap">
                {/* Piece segments */}
                {rod.pieces.map((piece, i) => {
                  const pct = (Number(piece) / stockLength) * 100;
                  const color = colorMap[Number(piece).toFixed(2)] || PIECE_COLORS[0];
                  return (
                    <div
                      key={i}
                      className="blueprint-segment"
                      style={{ width: `${pct}%`, background: color }}
                      title={`${piece} ft`}
                    >
                      <span className="blueprint-seg-label">{piece} ft</span>
                    </div>
                  );
                })}

                {/* Waste segment */}
                {Number(rod.waste) > 0 && (
                  <div
                    className="blueprint-segment waste-seg"
                    style={{ width: `${wastePct}%` }}
                    title={`Waste: ${rod.waste} ft`}
                  >
                    <span className="blueprint-seg-label">↩ {rod.waste} ft</span>
                  </div>
                )}
              </div>

              <div className="blueprint-meta">
                <span>{(usedPct).toFixed(1)}% used</span>
                {Number(rod.waste) > 0 && (
                  <span style={{ color: "var(--danger)" }}>↩ {rod.waste} ft</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="card mt-6 print-hide">
        <div className="card-header-bar">
          <div className="card-icon card-icon-accent">🎨</div>
          <div><h2>Legend</h2><p>Piece lengths colour key</p></div>
        </div>
        <div className="card-body" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
          {uniqueLengths.map((len) => (
            <div key={len} className="flex-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
              <span
                style={{
                  width: 16, height: 16,
                  borderRadius: 4,
                  background: colorMap[len.toFixed(2)],
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              {len.toFixed(2)} ft
            </div>
          ))}
          <div className="flex-center gap-2" style={{ fontSize: 13, fontWeight: 600 }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: "repeating-linear-gradient(45deg,#ef4444 0,#ef4444 3px,#fee2e2 3px,#fee2e2 7px)", display: "inline-block", flexShrink: 0 }} />
            Waste
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .gco-nav, .print-hide { display:none !important; }
          .print-only { display:block !important; }
          .gco-page { padding: 16px; }
          .blueprint-row { break-inside: avoid; }
        }
        .print-only { display: none; }
      `}</style>
    </main>
  );
}
