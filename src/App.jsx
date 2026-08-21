import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./Login";
import Register from "./Register";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    // Firebase ले user को अवस्था (login/logout) आफैं ट्र्याक गर्छ
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 1. Loading हुँदा देखिने UI
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f19', color: '#6366f1' }}>
        <h2>Loading IssueTrack...</h2>
      </div>
    );
  }

  // 2. लगइन सफल भएपछि देखिने (Temporary Dashboard)
  if (user) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#0b0f19", 
        color: "#f8fafc", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center",
        fontFamily: "sans-serif"
      }}>
        <div style={{ background: "rgba(18, 24, 38, 0.75)", padding: "40px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
          <h1 style={{ marginBottom: "10px" }}>Welcome to IssueTrack! 🎉</h1>
          <p style={{ color: "#94a3b8", marginBottom: "30px" }}>
            You are securely logged in as: <strong style={{ color: "#6366f1" }}>{user.email}</strong>
          </p>
          
          <button 
            onClick={handleLogout}
            style={{
              padding: "12px 24px",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = "rgba(239, 68, 68, 0.2)"}
            onMouseOut={(e) => e.target.style.backgroundColor = "rgba(239, 68, 68, 0.1)"}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 3. लगइन नहुँदा Login वा Register देखाउने
  return (
    <>
      {showRegister ? (
        <Register onBackToLogin={() => setShowRegister(false)} />
      ) : (
        <Login onRegister={() => setShowRegister(true)} />
      )}
    </>
  );
}

export default App;
