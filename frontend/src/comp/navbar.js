import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [dropOpen, setDropOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    setDropOpen(false);
    navigate("/login");
  };

  const initials = (user?.name || "?")
    .split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="gco-nav">
      <div className="inner">
        {/* Brand */}
        <Link to="/" className="brand" style={{ textDecoration: "none" }}>
          <div className="brand-icon">✂</div>
          <span className="brand-name">
            Glazing<span>Clip</span>
          </span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

        <div className={`nav-menu-container ${mobileMenuOpen ? "open" : ""}`}>
          {/* Nav Links (only when logged in) */}
          {user && (
            <div className="nav-links main-links">
              <Link to="/"        className={`nav-link ${isActive("/") ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>Optimizer</Link>
              <Link to="/history" className={`nav-link ${isActive("/history") ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}>History</Link>
              {isAdmin && (
                <Link to="/admin" className={`nav-link ${isActive("/admin") ? "active" : ""}`} style={{ color: "var(--primary)", fontWeight: 700 }} onClick={() => setMobileMenuOpen(false)}>
                  👑 Admin
                </Link>
              )}
            </div>
          )}

          {/* Right side */}
          <div className="nav-links right-links" style={{ marginLeft: "auto" }}>
            {user ? (
              /* User Avatar Dropdown */
              <div className="nav-dropdown" ref={dropRef}>
                <button
                  className="nav-avatar-btn"
                  onClick={() => setDropOpen((p) => !p)}
                  aria-haspopup="true"
                  aria-expanded={dropOpen}
                  title={user.name}
                >
                  <span className="nav-avatar">{initials}</span>
                  <span className="nav-avatar-name">{user.name.split(" ")[0]}</span>
                  <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
                </button>

                {dropOpen && (
                  <div className="nav-drop-menu" role="menu">
                    <div className="nav-drop-header">
                      <div className="nav-drop-name">{user.name}</div>
                      <div className="nav-drop-email">{user.email}</div>
                      <span className={`badge ${isAdmin ? "badge-primary" : "badge-neutral"}`} style={{ fontSize: 11, marginTop: 6 }}>
                        {isAdmin ? "👑 Admin" : "👤 User"}
                      </span>
                    </div>
                    <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid var(--border)" }} />
                    <Link to="/profile" className="nav-drop-item" onClick={() => { setDropOpen(false); setMobileMenuOpen(false); }}>
                      🪪 My Profile
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="nav-drop-item" onClick={() => { setDropOpen(false); setMobileMenuOpen(false); }}>
                        ⚙ Admin Panel
                      </Link>
                    )}
                    <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid var(--border)" }} />
                    <button className="nav-drop-item nav-drop-logout" onClick={handleLogout}>
                      ↩ Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login / Signup buttons */
              <>
                <Link to="/login"  className="nav-link" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/signup" className="btn btn-primary btn-sm" style={{ marginLeft: 4 }} onClick={() => setMobileMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;