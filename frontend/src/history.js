import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "./context/AuthContext";

import { API } from "./config";

function History() {
  const { authHeader } = useAuth();
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [searching, setSearching] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/projects`, { headers: authHeader });
      setProjects(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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

  const toggle = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const wasteBadge = (pct) => {
    const n = Number(pct);
    if (n < 5)  return "badge-success";
    if (n < 15) return "badge-warning";
    return "badge-danger";
  };

  return (
    <main className="gco-page">
      <header className="page-hero">
        <h1>Project <span className="gradient-text">History</span></h1>
        <p>All saved optimisation runs, newest first.</p>
      </header>

      {/* Search Bar */}
      <div className="card mb-6" style={{ padding: "var(--space-3) var(--space-5)" }}>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text" className="gco-input search-input"
            placeholder="Search projects by site name…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
          {searching && <span className="search-spinner" />}
          {search && (
            <button className="btn-remove" onClick={() => setSearch("")} title="Clear">×</button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state" style={{ marginTop: "var(--space-10)" }}>
          <div className="empty-icon">{search ? "🔎" : "📭"}</div>
          <p className="empty-title">{search ? "No matching projects" : "No projects yet"}</p>
          <p className="empty-sub">
            {search ? `No results for "${search}"` : "Go to the Optimizer to create your first project."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {projects.map((project) => (
            <article className="project-card" key={project._id}>
              <div className="project-card-header">
                <div>
                  <div className="project-name">{project.siteName}</div>
                  <div className="project-date">
                    {project.createdAt
                      ? new Date(project.createdAt).toLocaleDateString("en-US", {
                          weekday: "short", month: "short", day: "numeric", year: "numeric",
                        })
                      : "—"}
                  </div>
                </div>
                <div className="project-badges">
                  <span className="badge badge-primary">🔩 {project.totalRods} Clips</span>
                  <span className={`badge ${Number(project.totalWaste) < 1 ? "badge-success" : "badge-danger"}`}>
                    ↩ {project.totalWaste} ft waste
                  </span>
                  <span className={`badge ${wasteBadge(project.wastePercentage)}`}>
                    {project.wastePercentage}% waste
                  </span>
                  <Link to={`/blueprint/${project._id}`} className="btn btn-outline btn-sm" style={{ borderRadius: "var(--radius-full)" }}>
                    📐 Blueprint
                  </Link>
                </div>
              </div>

              {/* Expandable Cutting Details */}
              {expanded[project._id] && (
                <div className="project-cuts">
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                    Cutting Details
                  </div>
                  {project.rods?.map((rod) => (
                    <div className="project-cut-row" key={rod.rodNumber}>
                      <span className="project-cut-num">Clip {rod.rodNumber}</span>
                      <span className="project-cut-pieces">{rod.pieces.join(" + ")} ft</span>
                      <span className={`project-cut-waste-val ${Number(rod.waste) > 0 ? "stat-danger" : "stat-success"}`}>
                        ↩ {rod.waste} ft
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button className="expand-btn" onClick={() => toggle(project._id)} aria-expanded={!!expanded[project._id]}>
                {expanded[project._id] ? "▲ Hide Details" : "▼ View Cutting Details"}
              </button>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default History;