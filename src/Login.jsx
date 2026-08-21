import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { auth } from "./firebase";
import "./Login.css";

export default function Login() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const clearMessages = () => {
    setError("");
    setMsg("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      setError("Invalid Email or Password!");
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearMessages();
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, regEmail, regPassword);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    if (!loginEmail.trim()) {
      setError("User Name (Email) पहिला हाल्नुहोस्!");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, loginEmail);
      setMsg("Reset link sent to your email!");
    } catch (err) {
      setError("Failed to send reset email.");
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-flip-box ${isFlipped ? "flipped" : ""}`}>
        
        {/* FRONT: LOGIN */}
        <div className="auth-face auth-front">
          <div className="circle-border">
            <h2 className="title">Login</h2>
            
            {(error || msg) && (
              <div className={`alert ${error ? 'alert-red' : 'alert-green'}`}>
                {error || msg}
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="input-group">
                <label>User Name</label>
                <input 
                  type="email" 
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required 
                />
              </div>

              <div className="options-group">
                <label className="remember">
                  <input type="checkbox" /> 
                  <span className="checkbox-custom"></span>
                </label>
                <span className="forgot-text" onClick={handleForgotPassword}>
                  Forgot Password?
                </span>
              </div>

              <button type="submit" className="go-btn" disabled={loading}>
                {loading ? "..." : "Go"}
              </button>
            </form>

            <div className="switch-text">
              New here? <span onClick={() => { setIsFlipped(true); clearMessages(); }}>Sign Up</span>
            </div>
          </div>
        </div>

        {/* BACK: SIGN UP */}
        <div className="auth-face auth-back">
          <div className="circle-border">
            <h2 className="title">Sign Up</h2>

            {error && <div className="alert alert-red">{error}</div>}

            <form onSubmit={handleRegister} className="auth-form register-form">
              <div className="input-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required 
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required 
                />
              </div>

              <button type="submit" className="go-btn reg-btn" disabled={loading}>
                {loading ? "..." : "Create"}
              </button>
            </form>

            <div className="switch-text">
              Already have an account? <span onClick={() => { setIsFlipped(false); clearMessages(); }}>Login</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
