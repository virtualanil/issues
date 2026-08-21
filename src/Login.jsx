import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";

function Login({ onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(""); // Success message for password reset

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError("Invalid credentials. Please check your details.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMsg("");
    if (!email.trim()) {
      setError("Please enter your email address first to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMsg("Password reset link sent to your email!");
    } catch (err) {
      setError("Failed to send reset email. Make sure the email is correct.");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <div className="brand-header">
          <div className="logo-icon">IT</div>
          <h2>Sign In to <span className="highlight">IssueTrack</span></h2>
        </div>
        <p className="auth-subtitle">Welcome back! Manage your workspace issues.</p>

        {error && <div className="alert-box alert-error">{error}</div>}
        {msg && <div className="alert-box alert-success">{msg}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group">
            <div className="label-row">
              <label>Password</label>
              <span className="forgot-link" onClick={handleForgotPassword}>
                Forgot Password?
              </span>
            </div>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <span onClick={onRegister}>Create One</span>
        </div>
      </div>
    </div>
  );
}

export default Login;
