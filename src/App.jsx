```jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";

import Login from "./Login";
import Register from "./Register";

import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";

const initialIssues = [
  {
    id: "ISS-1001",
    title: "Login page not loading",
    description: "Users are unable to access the login page.",
    priority: "Critical",
    status: "Open",
    category: "Authentication",
    assignee: "Anil Lama",
    date: "21 Aug 2026",
  },
  {
    id: "ISS-1002",
    title: "Payment verification delay",
    description: "Payment verification takes longer than expected.",
    priority: "High",
    status: "In Progress",
    category: "Payment",
    assignee: "Sujan",
    date: "21 Aug 2026",
  },
  {
    id: "ISS-1003",
    title: "Dashboard loading slowly",
    description: "Dashboard requires more than 5 seconds to load.",
    priority: "Medium",
    status: "In Progress",
    category: "Performance",
    assignee: "Ramesh",
    date: "20 Aug 2026",
  },
  {
    id: "ISS-1004",
    title: "Profile image upload issue",
    description: "Profile image upload fails for some users.",
    priority: "Low",
    status: "Resolved",
    category: "Profile",
    assignee: "Anil Lama",
    date: "19 Aug 2026",
  },
  {
    id: "ISS-1005",
    title: "Mobile menu not responding",
    description: "Mobile navigation menu does not open correctly.",
    priority: "High",
    status: "Open",
    category: "UI/UX",
    assignee: "Bikash",
    date: "18 Aug 2026",
  },
];

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  const [issues, setIssues] = useState(initialIssues);
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "General",
    assignee: "Unassigned",
  });

  // Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load issues from Firestore
  useEffect(() => {
    if (!user) return;

    const issuesQuery = query(
      collection(db, "issues"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      issuesQuery,
      (snapshot) => {
        const firestoreIssues = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        if (firestoreIssues.length > 0) {
          setIssues(firestoreIssues);
        }
      },
      (error) => {
        console.error("Firestore error:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(
    () => ({
      total: issues.length,
      open: issues.filter((i) => i.status === "Open").length,
      progress: issues.filter((i) => i.status === "In Progress").length,
      resolved: issues.filter((i) => i.status === "Resolved").length,
      critical: issues.filter((i) => i.priority === "Critical").length,
    }),
    [issues]
  );

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.title?.toLowerCase().includes(search.toLowerCase()) ||
      issue.id?.toLowerCase().includes(search.toLowerCase()) ||
      issue.assignee?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || issue.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateIssue = async (e) => {
    e.preventDefault();

    if (!newIssue.title.trim() || !user) return;

    try {
      await addDoc(collection(db, "issues"), {
        title: newIssue.title,
        description: newIssue.description,
        priority: newIssue.priority,
        status: "Open",
        category: newIssue.category,
        assignee: newIssue.assignee,
        createdBy: user.email,
        createdAt: serverTimestamp(),
        date: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      });

      setNewIssue({
        title: "",
        description: "",
        priority: "Medium",
        category: "General",
        assignee: "Unassigned",
      });

      setShowModal(false);
      setActivePage("All Issues");
    } catch (error) {
      console.error("Create issue error:", error);
      alert("Unable to create issue. Please try again.");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "issues", id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Update status error:", error);
      alert("Unable to update issue status.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>IssueTrack</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (showRegister) {
      return (
        <Register
          onRegister={(registeredUser) => {
            setUser(registeredUser);
            setShowRegister(false);
          }}
          onLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <Login
        onLogin={(loggedInUser) => setUser(loggedInUser)}
        onRegister={() => setShowRegister(true)}
      />
    );
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">IT</div>
          <div>
            <h2>IssueTrack</h2>
            <span>Management Portal</span>
          </div>
        </div>

        <div className="workspace">
          <div className="workspace-avatar">
            {(user.email?.[0] || "U").toUpperCase()}
          </div>

          <div>
            <strong>My Workspace</strong>
            <span>Administrator</span>
          </div>

          <span className="workspace-arrow">⌄</span>
        </div>

        <nav>
          <p className="nav-title">MAIN MENU</p>

          <button
            className={
              activePage === "Dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("Dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className={
              activePage === "All Issues"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("All Issues")}
          >
            <span>☷</span>
            All Issues
            <b>{issues.length}</b>
          </button>

          <button
            className={
              activePage === "My Issues"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() => setActivePage("My Issues")}
          >
            <span>◎</span>
            My Issues
          </button>

          <button
            className="nav-item"
            onClick={() => setShowModal(true)}
          >
            <span>＋</span>
            Create Issue
          </button>

          <p className="nav-title second">MANAGEMENT</p>

          <button className="nav-item">
            <span>◫</span>
            Reports
          </button>

          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-box">
            <div className="help-icon">?</div>
            <div>
              <strong>Need Help?</strong>
              <span>Contact support</span>
            </div>
          </div>

          <div className="user-card">
            <div className="avatar">
              {(user.email?.slice(0, 2) || "US").toUpperCase()}
            </div>

            <div className="user-info">
              <strong>{user.email}</strong>
              <span>Administrator</span>
            </div>

            <button
              onClick={handleLogout}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: "16px",
              }}
              title="Logout"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-icon">IT</div>
            <strong>IssueTrack</strong>
          </div>

          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search issues, IDs, assignees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <kbd>Ctrl K</kbd>
          </div>

          <div className="top-actions">
            <button className="icon-button">☼</button>

            <button className="icon-button notification">
              ♢
              <i></i>
            </button>

            <div className="top-avatar">
              {(user.email?.slice(0, 2) || "US").toUpperCase()}
            </div>
          </div>
        </header>

        <div className="content">
          {activePage === "Dashboard" ? (
            <>
              <div className="page-header">
                <div>
                  <p className="eyebrow">OVERVIEW</p>

                  <h1>Dashboard</h1>

                  <p className="subtitle">
                    Welcome back. Here's what's happening with your
                    issues today.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setShowModal(true)}
                >
                  <span>＋</span>
                  Create Issue
                </button>
              </div>

              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">
                      TOTAL ISSUES
                    </span>

                    <div className="stat-icon purple">☷</div>
                  </div>

                  <strong>{stats.total}</strong>

                  <div className="stat-change positive">
                    ↗ 12% <span>vs last month</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">OPEN</span>

                    <div className="stat-icon orange">◷</div>
                  </div>

                  <strong>{stats.open}</strong>

                  <div className="stat-change warning">
                    ● Needs attention
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">
                      IN PROGRESS
                    </span>

                    <div className="stat-icon blue">◌</div>
                  </div>

                  <strong>{stats.progress}</strong>

                  <div className="stat-change neutral">
                    ● Being worked on
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span className="stat-label">RESOLVED</span>

                    <div className="stat-icon green">✓</div>
                  </div>

                  <strong>{stats.resolved}</strong>

                  <div className="stat-change positive">
                    ↗ 8% <span>this week</span>
                  </div>
                </div>

                <div className="stat-card critical-card">
                  <div className="stat-top">
                    <span className="stat-label">CRITICAL</span>

                    <div className="stat-icon red">!</div>
                  </div>

                  <strong>{stats.critical}</strong>

                  <div className="stat-change danger">
                    ● High priority
                  </div>
                </div>
              </section>

              <section className="issues-section">
                <div className="section-header">
                  <div>
                    <h2>Recent Issues</h2>
                    <p>
                      Latest issues reported by your team
                    </p>
                  </div>

                  <button
                    className="view-all"
                    onClick={() =>
                      setActivePage("All Issues")
                    }
                  >
                    View all →
                  </button>
                </div>

                <IssueTable
                  issues={filteredIssues.slice(0, 5)}
                  updateStatus={updateStatus}
                />
              </section>
            </>
          ) : activePage === "All Issues" ? (
            <>
              <div className="page-header">
                <div>
                  <p className="eyebrow">
                    ISSUE MANAGEMENT
                  </p>

                  <h1>All Issues</h1>

                  <p className="subtitle">
                    Manage and track all reported issues.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setShowModal(true)}
                >
                  ＋ Create Issue
                </button>
              </div>

              <div className="filter-bar">
                <div className="filter-search">
                  <span>⌕</span>

                  <input
                    placeholder="Search issues..."
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                >
                  <option>All</option>
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>

                <button
                  className="secondary-button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("All");
                  }}
                >
                  Reset
                </button>
              </div>

              <section className="issues-section full">
                <IssueTable
                  issues={filteredIssues}
                  updateStatus={updateStatus}
                />
              </section>
            </>
          ) : (
            <>
              <div className="page-header">
                <div>
                  <p className="eyebrow">
                    PERSONAL WORKSPACE
                  </p>

                  <h1>My Issues</h1>

                  <p className="subtitle">
                    Issues currently assigned to you.
                  </p>
                </div>
              </div>

              <section className="issues-section full">
                <IssueTable
                  issues={issues.filter(
                    (issue) =>
                      issue.assignee === "Anil Lama"
                  )}
                  updateStatus={updateStatus}
                />
              </section>
            </>
          )}
        </div>
      </main>

      {/* Create Issue Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">NEW ISSUE</p>

                <h2>Create New Issue</h2>
              </div>

              <button
                className="close-button"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateIssue}>
              <label>
                Issue Title

                <input
                  type="text"
                  placeholder="Enter issue title"
                  value={newIssue.title}
                  onChange={(e) =>
                    setNewIssue({
                      ...newIssue,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                Description

                <textarea
                  placeholder="Describe the issue..."
                  rows="4"
                  value={newIssue.description}
                  onChange={(e) =>
                    setNewIssue({
                      ...newIssue,
                      description: e.target.value,
                    })
                  }
                />
              </label>

              <div className="form-grid">
                <label>
                  Priority

                  <select
                    value={newIssue.priority}
                    onChange={(e) =>
                      setNewIssue({
                        ...newIssue,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </label>

                <label>
                  Category

                  <select
                    value={newIssue.category}
                    onChange={(e) =>
                      setNewIssue({
                        ...newIssue,
                        category: e.target.value,
                      })
                    }
                  >
                    <option>General</option>
                    <option>Authentication</option>
                    <option>Payment</option>
                    <option>UI/UX</option>
                    <option>Performance</option>
                    <option>Technical</option>
                  </select>
                </label>
              </div>

              <label>
                Assign To

                <select
                  value={newIssue.assignee}
                  onChange={(e) =>
                    setNewIssue({
                      ...newIssue,
                      assignee: e.target.value,
                    })
                  }
                >
                  <option>Unassigned</option>
                  <option>Anil Lama</option>
                  <option>Sujan</option>
                  <option>Ramesh</option>
                  <option>Bikash</option>
                </select>
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  Create Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function IssueTable({ issues, updateStatus }) {
  if (issues.length === 0) {
    return (
      <div className="empty-state">
        <div>☷</div>

        <h3>No issues found</h3>

        <p>
          Try changing your search or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>ISSUE</th>
            <th>PRIORITY</th>
            <th>STATUS</th>
            <th>ASSIGNEE</th>
            <th>CREATED</th>
            <th>ACTION</th>
          </tr>
        </thead>

        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id}>
              <td>
                <div className="issue-title">
                  <span className="issue-id">
                    {issue.id}
                  </span>

                  <strong>{issue.title}</strong>

                  <small>{issue.category}</small>
                </div>
              </td>

              <td>
                <span
                  className={`priority ${issue.priority?.toLowerCase()}`}
                >
                  <i></i>

                  {issue.priority}
                </span>
              </td>

              <td>
                <select
                  className={`status-select ${issue.status
                    ?.toLowerCase()
                    .replace(" ", "-")}`}
                  value={issue.status}
                  onChange={(e) =>
                    updateStatus(
                      issue.id,
                      e.target.value
                    )
                  }
                >
                  <option>Open</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </td>

              <td>
                <div className="assignee">
                  <div className="small-avatar">
                    {issue.assignee === "Unassigned"
                      ? "?"
                      : issue.assignee
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                  </div>

                  <span>{issue.assignee}</span>
                </div>
              </td>

              <td className="date">
                {issue.date}
              </td>

              <td>
                <button className="more-button">
                  •••
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
```
