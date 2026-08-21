import { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "./firebase";
import "./App.css";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  
  // Status state handles both error and success messages
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

      // Apply persistence based on 'Remember me' checkbox
      const persistenceType = rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      onLogin(result.user);
    } catch (error) {
      console.error("Login error:", error);

      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setStatus({ type: "error", text: "Invalid email or password." });
          break;
        case "auth/invalid-email":
          setStatus({ type: "error", text: "Please enter a valid email address." });
          break;
        case "auth/too-many-requests":
          setStatus({
            type: "error",
            text: "Too many login attempts. Please try again later.",
          });
          break;
        case "auth/network-request-failed":
          setStatus({
            type: "error",
            text: "Network error. Please check your connection.",
          });
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
      setStatus({
        type: "error",
        text: "Please enter your email address first to reset password.",
      });
      return;
    }

    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setStatus({
        type: "success",
        text: `Password reset link sent to ${email.trim()}. Check your inbox!`,
      });
    } catch (error) {
      console.error("Reset error:", error);
      if (error.code === "auth/invalid-email") {
        setStatus({ type: "error", text: "Please enter a valid email address." });
      } else {
        setStatus({
          type: "error",
          text: "Failed to send reset email. Verify your email address.",
        });
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Dynamic background glow */}
      <div className="auth-background">
        <div className="auth-orb auth-orb-one"></div>
        <div className="auth-orb auth-orb-two"></div>
        <div className="auth-grid"></div>
      </div>

      <div className="auth-container">
        {/* Branding Hero Section */}
        <section className="auth-brand-section">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <span>IT</span>
            </div>
            <div className="auth-brand-text">
              <strong>IssueTrack</strong>
              <span>Management Portal</span>
            </div>
          </div>

          <div className="auth-hero-content">
            <div className="auth-badge">
              <span className="status-dot"></span>
              Modern Issue Tracking Platform
            </div>

            <h1>
              Track. <br />
              Manage. <br />
              <span className="gradient-text">Resolve.</span>
            </h1>

            <p>
              A powerful workspace designed to help teams report, manage, assign,
              and resolve issues effortlessly.
            </p>

            <div className="auth-features">
              <div className="auth-feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Centralized Hub</strong>
                  <span>Keep every ticket organized in real-time.</span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="feature-icon">⚡</div>
                <div>
                  <strong>Instant Updates</strong>
                  <span>Stay synchronized with instant team notifications.</span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="feature-icon">🛡️</div>
                <div>
                  <strong>Enterprise Security</strong>
                  <span>Role-based access and data protection built-in.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-footer-brand">
            © 2026 IssueTrack Inc. All rights reserved.
          </div>
        </section>

        {/* Form Card Section */}
        <section className="auth-form-section">
          <div className="login-card">
            <div className="login-logo-wrapper">
              <div className="login-logo">
                <span>IT</span>
              </div>
            </div>

            <div className="login-heading">
              <h2>Welcome back</h2>
              <p>Sign in to access your workspace</p>
            </div>

            {/* Error / Success Banners */}
            {status.text && (
              <div className={`auth-alert auth-alert-${status.type}`}>
                <div className="auth-alert-icon">
                  {status.type === "error" ? "!" : "✓"}
                </div>
                <div>
                  <strong>{status.type === "error" ? "Error" : "Success"}</strong>
                  <span>{status.text}</span>
                </div>
              </div>
            )}

            <form className="login-form" onSubmit={handleLogin}>
              {/* Email Input */}
              <div className="auth-field">
                <label htmlFor="email">Email address</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉</span>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearStatus();
                    }}
                    autoComplete="email"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="auth-field">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearStatus();
                    }}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={handleForgotPassword}
                  disabled={loading || resetLoading}
                >
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span className="submit-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>New to IssueTrack?</span>
            </div>

            <button
              type="button"
              className="register-button"
              onClick={onRegister}
              disabled={loading}
            >
              Create an account
              <span>→</span>
            </button>

            <p className="login-security">
              <span>🔒</span> Secured with Firebase 256-bit Encryption
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
