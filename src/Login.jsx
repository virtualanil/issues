import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "./firebase";
import "./Login.css"; // Aghi mathi deko dami CSS file

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const clearStatus = () => setStatus({ type: "", text: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    clearStatus();

    if (!email.trim() || !password) {
      setStatus({ type: "error", text: "Please enter both email and password." });
      return;
    }

    try {
      setLoading(true);

      const persistenceType = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      // Firebase login function
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // Login success vaye pachi dashboard ma pathaune
      navigate("/dashboard");

    } catch (error) {
      console.error("Login error:", error);
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setStatus({ type: "error", text: "Invalid email or password." });
          break;
        default:
          setStatus({ type: "error", text: "Unable to sign in. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearStatus();
    if (!email.trim()) {
      setStatus({ type: "error", text: "Please enter your email first to reset." });
      return;
    }
    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setStatus({ type: "success", text: "Password reset link sent! Check your inbox." });
    } catch (error) {
      setStatus({ type: "error", text: "Failed to send reset email." });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-orb auth-orb-one"></div>
        <div className="auth-orb auth-orb-two"></div>
        <div className="auth-grid"></div>
      </div>

      <div className="auth-container">
        {/* Left Branding Section */}
        <section className="auth-brand-section">
          <div className="auth-hero-content">
            <h1>Track.<br/>Manage.<br/><span className="gradient-text">Resolve.</span></h1>
            <p>Issue management made simple and secure.</p>
          </div>
        </section>

        {/* Right Form Section */}
        <section className="auth-form-section">
          <div className="login-card">
            <h2>Welcome back</h2>
            
            {status.text && (
              <div className={`auth-alert auth-alert-${status.type}`}>
                <span>{status.text}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleLogin}>
              <div className="auth-field">
                <label>Email address</label>
                <div className="input-wrapper">
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearStatus(); }}
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <label>Password</label>
                <div className="input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearStatus(); }}
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="remember-me">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-password" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in →"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
