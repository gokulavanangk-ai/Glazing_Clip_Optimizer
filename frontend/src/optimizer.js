import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./context/AuthContext";

import { API } from "./config";

function Optimizer() {
  const { authHeader } = useAuth();
  const [siteName, setSiteName] = useState("");
  const [rows, setRows]         = useState([{ length: "", quantity: "" }]);
  const [projects, setProjects] = useState([]);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState("");
  const [searching, setSearching] = useState(false);

  /* ── Data Fetchers ── */
  const fetchProjects = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/projects`, { headers: authHeader });
      setProjects(res.data);
    } catch { /* ignore */ }
  }, [authHeader]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  /* Debounced search */
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim()) { fetchProjects(); return; }
      setSearching(true);
      try {
        const res = await axios.get(`${API}/projects/search?q=${encodeURIComponent(search)}`, { headers: authHeader });
        setProjects(res.data);
      } catch { /* ignore */ } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [search, authHeader, fetchProjects]);

  /* ── Handlers ── */
  const addRow    = () => setRows([...rows, { length: "", quantity: "" }]);
  const removeRow = (i) => { if (rows.length > 1) setRows(rows.filter((_, idx) => idx !== i)); };
  const handleChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const res = await axios.post(`${API}/optimize`, { siteName, stockLength: 12, inputData: rows }, { headers: authHeader });
      setResult(res.data);
      fetchProjects();
    } catch { setError("Backend not reachable. Make sure the server is running."); }
    finally { setLoading(false); }
  };

  /* ── Derived ── */
  const wasteNum = result ? Number(result.totalWaste) : 0;
  const wStatClass = wasteNum === 0 ? "stat-success" : wasteNum < 2 ? "stat-warning" : "stat-danger";
  const wPctClass  = Number(result?.wastePercentage) < 5 ? "stat-success" : Number(result?.wastePercentage) < 15 ? "stat-warning" : "stat-danger";

  return (
    <main className="gco-page">
      <header className="page-hero">
        <h1>Glazing Clip <span className="gradient-text">Optimizer</span></h1>
        <p>Enter your site measurements to generate an optimised cutting plan.</p>
      </header>

      {error && <div className="alert alert-danger" role="alert"><span>⚠</span> {error}</div>}

      <div className="two-col">
        {/* ── LEFT — Input ── */}
        <section className="card" aria-label="Project Input">
          <div className="card-header-bar">
            <div className="card-icon card-icon-primary">📋</div>
            <div><h2>Project Details</h2><p>Site name and measurements</p></div>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: "var(--space-5)" }}>
              <label className="field-label" htmlFor="site-name">Site Name</label>
              <input id="site-name" type="text" className="gco-input" placeholder="e.g. Block A – 3rd Floor"
                value={siteName} onChange={(e) => setSiteName(e.target.value)} />
            </div>

            <div>
              <div className="flex-between mb-4">
                <label className="field-label mb-0">Measurements</label>
                <span className="text-xs text-muted">{rows.length} row{rows.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="table-responsive">
                <table className="measure-table" aria-label="Measurements table">
                  <thead>
                    <tr><th>#</th><th>Length (ft)</th><th>Quantity</th><th></th></tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index}>
                        <td><span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", display: "inline-block", width: 20, textAlign: "center" }}>{index + 1}</span></td>
                        <td>
                          <input type="number" className="gco-input" placeholder="0.00" min="0" step="0.01"
                            value={row.length} onChange={(e) => handleChange(index, "length", e.target.value)}
                            aria-label={`Length row ${index + 1}`} />
                        </td>
                        <td>
                          <input type="number" className="gco-input" placeholder="1" min="1"
                            value={row.quantity} onChange={(e) => handleChange(index, "quantity", e.target.value)}
                            aria-label={`Quantity row ${index + 1}`} />
                        </td>
                        <td>
                          <button className="btn-remove" onClick={() => removeRow(index)} disabled={rows.length === 1} title="Remove row">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button className="btn btn-outline" onClick={addRow}>+ Add Row</button>
              <button className="btn btn-primary" onClick={handleSubmit}
                disabled={loading || !siteName.trim()} style={{ marginLeft: "auto" }}>
                {loading ? <><span className="btn-spinner" />Calculating…</> : "✦ Calculate & Save"}
              </button>
            </div>
          </div>
        </section>

        {/* ── RIGHT — Results ── */}
        <section className="card" aria-label="Results">
          <div className="card-header-bar">
            <div className="card-icon card-icon-success">📊</div>
            <div><h2>Results</h2><p>Optimised cutting plan output</p></div>
          </div>
          <div className="card-body">
            {result ? (
              <>
                <div className="stat-grid">
                  <div className="stat-card"><div className="stat-value stat-primary">{result.totalRods}</div><div className="stat-label">Total Clips</div></div>
                  <div className="stat-card"><div className={`stat-value ${wStatClass}`}>{result.totalWaste} ft</div><div className="stat-label">Total Waste</div></div>
                  <div className="stat-card"><div className={`stat-value ${wPctClass}`}>{result.wastePercentage}%</div><div className="stat-label">Waste Rate</div></div>
                </div>

                {/* Blueprint button */}
                {result._id && (
                  <div style={{ marginBottom: "var(--space-4)" }}>
                    <Link to={`/blueprint/${result._id}`} className="btn btn-outline w-full" style={{ justifyContent: "center" }}>
                      📐 View 2D Cutting Blueprint
                    </Link>
                  </div>
                )}

                <hr className="section-divider" />
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)", marginBottom: "var(--space-4)" }}>
                  Cutting Details
                </h3>
                <div className="cut-list" role="list">
                  {result.rods?.map((rod) => (
                    <div className="cut-row" key={rod.rodNumber} role="listitem">
                      <span className="cut-label">Clip {rod.rodNumber}</span>
                      <div className="cut-bar-wrap">
                        {rod.pieces.map((p, i) => <span className="cut-piece" key={i}>{p} ft</span>)}
                      </div>
                      <span className={`cut-waste ${Number(rod.waste) > 0 ? "has-waste" : "no-waste"}`}>
                        ↩ {rod.waste} ft
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📐</div>
                <p className="empty-title">No results yet</p>
                <p className="empty-sub">Fill in measurements and click Calculate &amp; Save.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ── Saved Projects ── */}
      <section className="card mt-8" aria-label="Recent Projects">
        <div className="card-header-bar">
          <div className="card-icon card-icon-accent">🗂</div>
          <div><h2>Saved Projects</h2><p>{projects.length} project{projects.length !== 1 ? "s" : ""}</p></div>
        </div>

        {/* Search bar */}
        <div style={{ padding: "var(--space-3) var(--space-6)", borderBottom: "1px solid var(--border)" }}>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text" className="gco-input search-input"
              placeholder="Search by site name…"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
            {searching && <span className="search-spinner" />}
            {search && (
              <button className="btn-remove" onClick={() => setSearch("")} title="Clear search">×</button>
            )}
          </div>
        </div>

        <div className="card-body">
          {projects.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-8) 0" }}>
              <div className="empty-icon">{search ? "🔎" : "📁"}</div>
              <p className="empty-title">{search ? "No matching projects" : "No saved projects"}</p>
              <p className="empty-sub">{search ? `No results for "${search}"` : "Projects appear here after you calculate."}</p>
            </div>
          ) : (
            projects.slice(0, 8).map((p) => (
              <div className="project-list-row" key={p._id}>
                <div>
                  <div className="project-list-name">{p.siteName}</div>
                  <div className="project-list-sub">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </div>
                </div>
                <div className="flex gap-2" style={{ flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <span className="badge badge-primary">🔩 {p.totalRods}</span>
                  <span className={`badge ${Number(p.totalWaste) < 1 ? "badge-success" : "badge-danger"}`}>↩ {p.totalWaste} ft</span>
                  <span className={`badge ${Number(p.wastePercentage) < 5 ? "badge-success" : Number(p.wastePercentage) < 15 ? "badge-warning" : "badge-danger"}`}>{p.wastePercentage}%</span>
                  <Link to={`/blueprint/${p._id}`} className="btn btn-ghost btn-sm" title="View Blueprint">📐</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

export default Optimizer;