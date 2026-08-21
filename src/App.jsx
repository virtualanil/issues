import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

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
          setError("Invalid email or password.");
          break;

        case "auth/invalid-email":
          setError("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setError(
            "Too many login attempts. Please try again later."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* Background decoration */}
      <div className="auth-background">
        <div className="auth-orb auth-orb-one"></div>
        <div className="auth-orb auth-orb-two"></div>
        <div className="auth-grid"></div>
      </div>

      {/* Main content */}
      <div className="auth-container">

        {/* Left branding section */}
        <section className="auth-brand-section">

          <div className="auth-brand">

            <div className="auth-brand-icon">
              <span>IT</span>
            </div>

            <div>
              <strong>IssueTrack</strong>
              <span>Management Portal</span>
            </div>

          </div>

          <div className="auth-hero-content">

            <div className="auth-badge">
              <span className="status-dot"></span>
              Issue management made simple
            </div>

            <h1>
              Track.
              <br />
              Manage.
              <br />
              <span>Resolve.</span>
            </h1>

            <p>
              A modern issue tracking platform designed to help
              teams report, manage, assign and resolve issues faster.
            </p>

            <div className="auth-features">

              <div className="auth-feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Centralized Issue Management</strong>
                  <span>Keep every issue organized in one place.</span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="feature-icon">↗</div>
                <div>
                  <strong>Real-time Updates</strong>
                  <span>Stay synchronized with your entire team.</span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="feature-icon">◎</div>
                <div>
                  <strong>Team Collaboration</strong>
                  <span>Assign and track issues effortlessly.</span>
                </div>
              </div>

            </div>

          </div>

          <div className="auth-footer-brand">
            © 2026 IssueTrack. All rights reserved.
          </div>

        </section>


        {/* Login section */}
        <section className="auth-form-section">

          <div className="login-card">

            {/* Logo */}
            <div className="login-logo-wrapper">
              <div className="login-logo">
                <span>IT</span>
              </div>
            </div>

            <div className="login-heading">

              <h2>Welcome back</h2>

              <p>
                Sign in to continue to your workspace
              </p>

            </div>


            {/* Error */}
            {error && (
              <div className="auth-error">

                <div className="auth-error-icon">
                  !
                </div>

                <div>
                  <strong>Sign in failed</strong>
                  <span>{error}</span>
                </div>

              </div>
            )}


            {/* Form */}
            <form
              className="login-form"
              onSubmit={handleLogin}
            >

              {/* Email */}
              <div className="auth-field">

                <label htmlFor="email">
                  Email address
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    @
                  </span>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    autoComplete="email"
                    disabled={loading}
                    required
                  />

                </div>

              </div>


              {/* Password */}
              <div className="auth-field">

                <div className="field-header">

                  <label htmlFor="password">
                    Password
                  </label>

                </div>

                <div className="input-wrapper">

                  <span className="input-icon">
                    •••
                  </span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    disabled={loading}
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>


              {/* Remember / Forgot */}
              <div className="login-options">

                <label className="remember-me">

                  <input type="checkbox" />

                  <span>
                    Remember me
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-password"
                  onClick={() =>
                    setError(
                      "Password reset can be added using Firebase Password Reset."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>


              {/* Submit */}
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
                    <span className="submit-arrow">
                      →
                    </span>
                  </>
                )}

              </button>

            </form>


            {/* Divider */}
            <div className="auth-divider">
              <span>New to IssueTrack?</span>
            </div>


            {/* Register */}
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

              <span>🔒</span>

              Your account is protected by Firebase Authentication.

            </p>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Login;
