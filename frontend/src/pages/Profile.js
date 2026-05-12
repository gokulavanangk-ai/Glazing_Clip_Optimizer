import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

export default function Profile() {
  const { user, authHeader, isAdmin } = useAuth();
  const [stats, setStats] = useState({ count: 0, totalWaste: "0.00" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/projects`, { headers: authHeader })
      .then((res) => {
        const projects = res.data;
        const totalWaste = projects
          .reduce((sum, p) => sum + Number(p.totalWaste || 0), 0)
          .toFixed(2);
        setStats({ count: projects.length, totalWaste });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authHeader]);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : "—";

  // Get initials for avatar
  const initials = (user?.name || "U")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <main className="gco-page">
      <header className="page-hero">
        <h1>My <span className="gradient-text">Profile</span></h1>
        <p>Your account information and usage summary.</p>
      </header>

      <div className="two-col" style={{ alignItems: "start" }}>

        {/* ── Avatar Card ── */}
        <section className="card" aria-label="User info">
          <div className="card-body" style={{ textAlign: "center", padding: "var(--space-8) var(--space-6)" }}>
            <div className="profile-avatar">{initials}</div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-heading)", letterSpacing: "-0.4px", marginTop: "var(--space-4)" }}>
              {user?.name}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{user?.email}</p>

            <div style={{ marginTop: "var(--space-4)" }}>
              <span className={`badge ${isAdmin ? "badge-primary" : "badge-neutral"}`} style={{ fontSize: 13, padding: "6px 14px" }}>
                {isAdmin ? "👑 Admin" : "👤 User"}
              </span>
            </div>
          </div>
        </section>

        {/* ── Details + Stats ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

          {/* Account Details */}
          <section className="card">
            <div className="card-header-bar">
              <div className="card-icon card-icon-primary">🪪</div>
              <div>
                <h2>Account Details</h2>
                <p>Your registration information</p>
              </div>
            </div>
            <div className="card-body">
              <div className="profile-detail-row">
                <span className="profile-detail-label">Full Name</span>
                <span className="profile-detail-val">{user?.name}</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Email</span>
                <span className="profile-detail-val">{user?.email}</span>
              </div>
              <div className="profile-detail-row">
                <span className="profile-detail-label">Role</span>
                <span className="profile-detail-val">
                  <span className={`badge ${isAdmin ? "badge-primary" : "badge-neutral"}`}>
                    {isAdmin ? "Admin" : "User"}
                  </span>
                </span>
              </div>
              <div className="profile-detail-row" style={{ borderBottom: "none" }}>
                <span className="profile-detail-label">Member Since</span>
                <span className="profile-detail-val">{joinedDate}</span>
              </div>
            </div>
          </section>

          {/* Usage Stats */}
          <section className="card">
            <div className="card-header-bar">
              <div className="card-icon card-icon-success">📊</div>
              <div>
                <h2>Usage Stats</h2>
                <p>Your project activity summary</p>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="skeleton" style={{ height: 60 }} />
              ) : (
                <div className="stat-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="stat-card">
                    <div className="stat-value stat-primary">{stats.count}</div>
                    <div className="stat-label">Projects Saved</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value stat-warning">{stats.totalWaste} ft</div>
                    <div className="stat-label">Total Waste</div>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
