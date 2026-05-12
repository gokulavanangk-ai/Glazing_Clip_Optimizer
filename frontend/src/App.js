import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./comp/ProtectedRoute";
import Navbar from "./comp/navbar";

import Optimizer from "./optimizer";
import History   from "./history";
import Login     from "./pages/Login";
import Signup    from "./pages/Signup";
import Profile   from "./pages/Profile";
import Blueprint from "./pages/Blueprint";
import Admin     from "./pages/Admin";

import "./index.css";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute><Optimizer /></ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute><History /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Profile /></ProtectedRoute>
          } />
          <Route path="/blueprint/:id" element={
            <ProtectedRoute><Blueprint /></ProtectedRoute>
          } />

          {/* Admin only */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><Admin /></ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;