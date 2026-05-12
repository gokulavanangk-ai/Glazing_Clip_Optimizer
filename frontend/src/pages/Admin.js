import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

export default function Admin() {
  const { authHeader } = useAuth();
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [projects, setProjects] = useState([]);
  const [tab, setTab]           = useState("users");
  const [loading, setLoading]   = useState(true);
  const [msg, setMsg]           = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, uRes, pRes] = await Promise.all([
        axios.get(`${API}/admin/stats`,    { headers: authHeader }),
        axios.get(`${API}/admin/users`,    { headers: authHeader }),
        axios.get(`${API}/admin/projects`, { headers: authHeader }),
      ]);
      setStats(sRes.data);
      setUsers(uRes.data);
      setProjects(pRes.data);
    } catch (err) {
      flash("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (user) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await axios.patch(
        `${API}/admin/users/${user._id}/role`,
        { role: newRole },
        { headers: authHeader }
      );
      flash(`${user.name} is now ${newRole}.`);
      load();
    } catch {
      flash("Failed to update role.");
    }
  };

  const deleteProject = async (id, name) => {
    if (!window.confirm(`Delete project "${name}"?`)) return;
    try {
      await axios.delete(`${API}/admin/projects/${id}`, { headers: authHeader });
      flash("Project deleted.");
      load();
    } catch {
      flash("Delete failed.");
    }
  };

  const fmt = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—";

  return (
    <main className="gco-page">
      <header className="page-hero">
        <h1>Admin <span className="gradient-text">Dashboard</span></h1>
        <p>Manage users and projects across the entire platform.</p>
      </header>

      {/* Flash message */}
      {msg && (
        <div className="alert" style={{ background: "var(--success-soft)", color: "#065f46", border: "1px solid #6ee7b7", marginBottom: "var(--space-5)" }}>
          ✓ {msg}
        </div>
      )}

      {/* ── Stat Cards ── */}
      {loading ? (
        <div className="stat-grid" style={{ marginBottom: "var(--space-6)" }}>
          {[1,2,3].map(i => <div key={i} className="skeleton stat-card" style={{ height: 80 }} />)}
        </div>
      ) : stats && (
        <div className="stat-grid" style={{ marginBottom: "var(--space-6)" }}>
          <div className="stat-card">
            <div className="stat-value stat-primary">{stats.userCount}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-success">{stats.projectCount}</div>
            <div className="stat-label">Total Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-warning">{stats.totalWaste} ft</div>
            <div className="stat-label">Total Waste</div>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === "users" ? "active" : ""}`}
          onClick={() => setTab("users")}
        >
          👤 Users ({users.length})
        </button>
        <button
          className={`admin-tab ${tab === "projects" ? "active" : ""}`}
          onClick={() => setTab("projects")}
        >
          📁 Projects ({projects.length})
        </button>
      </div>

      {/* ── Users Table ── */}
      {tab === "users" && (
        <div className="card">
          <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
            {loading ? (
              <div style={{ padding: "var(--space-6)" }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: "var(--space-3)" }} />)}
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id}>
                      <td className="admin-td-num">{i + 1}</td>
                      <td>
                        <div className="admin-user-name">{u.name}</div>
                      </td>
                      <td className="admin-td-muted">{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "badge-primary" : "badge-neutral"}`}>
                          {u.role === "admin" ? "👑 Admin" : "👤 User"}
                        </span>
                      </td>
                      <td className="admin-td-muted">{fmt(u.createdAt)}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${u.role === "admin" ? "btn-ghost" : "btn-outline"}`}
                          onClick={() => toggleRole(u)}
                        >
                          {u.role === "admin" ? "Demote" : "Make Admin"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Projects Table ── */}
      {tab === "projects" && (
        <div className="card">
          <div className="card-body" style={{ padding: 0, overflowX: "auto" }}>
            {loading ? (
              <div style={{ padding: "var(--space-6)" }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: "var(--space-3)" }} />)}
              </div>
            ) : projects.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📭</div><p className="empty-title">No projects yet</p></div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Site Name</th>
                    <th>Owner</th>
                    <th>Clips</th>
                    <th>Waste</th>
                    <th>Waste %</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr key={p._id}>
                      <td className="admin-td-num">{i + 1}</td>
                      <td><div className="admin-user-name">{p.siteName}</div></td>
                      <td className="admin-td-muted">{p.userName || "—"}</td>
                      <td>
                        <span className="badge badge-primary">🔩 {p.totalRods}</span>
                      </td>
                      <td className="admin-td-muted">{p.totalWaste} ft</td>
                      <td>
                        <span className={`badge ${Number(p.wastePercentage) < 5 ? "badge-success" : Number(p.wastePercentage) < 15 ? "badge-warning" : "badge-danger"}`}>
                          {p.wastePercentage}%
                        </span>
                      </td>
                      <td className="admin-td-muted">{fmt(p.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid #fca5a5" }}
                          onClick={() => deleteProject(p._id, p.siteName)}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
