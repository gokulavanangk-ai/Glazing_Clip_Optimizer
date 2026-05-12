import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API = "http://localhost:5000";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, val) =>
    setForm((p) => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/register`, {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-box">
        {/* Brand */}
        <div className="auth-brand">
          <div className="brand-icon">✂</div>
          <span className="auth-brand-name">GlazingClip</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Join GlazingClip Optimizer today — it's free</p>

        {error && (
          <div className="alert alert-danger" role="alert">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="field-label" htmlFor="su-name">Full Name</label>
            <input
              id="su-name"
              type="text"
              className="gco-input"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="field-label" htmlFor="su-email">Email Address</label>
            <input
              id="su-email"
              type="email"
              className="gco-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="field-label" htmlFor="su-password">Password</label>
            <input
              id="su-password"
              type="password"
              className="gco-input"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label className="field-label" htmlFor="su-confirm">Confirm Password</label>
            <input
              id="su-confirm"
              type="password"
              className="gco-input"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={(e) => handleChange("confirm", e.target.value)}
              required
            />
          </div>

          <p className="auth-note">
            🔑 First account registered becomes the <strong>admin</strong>.
          </p>

          <button
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: "var(--space-3)", height: 44 }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner" />
                Creating account…
              </>
            ) : (
              "Create Account →"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
