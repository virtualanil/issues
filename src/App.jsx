import { useEffect, useMemo, useState } from "react";
import "./App.css";

import Login from "./Login";
import Register from "./Register";

import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

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

  /* =========================
     FIREBASE AUTH
  ========================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  /* =========================
     FIRESTORE ISSUES
  ========================= */

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
        } else {
          setIssues([]);
        }
      },
      (error) => {
        console.error("Firestore error:", error);
      }
    );

    return unsubscribe;
  }, [user]);

  /* =========================
     STATISTICS
  ========================= */

  const stats = useMemo(() => {
    return {
      total: issues.length,

      open: issues.filter(
        (issue) => issue.status === "Open"
      ).length,

      progress: issues.filter(
        (issue) => issue.status === "In Progress"
      ).length,

      resolved: issues.filter(
        (issue) => issue.status === "Resolved"
      ).length,

      critical: issues.filter(
        (issue) => issue.priority === "Critical"
      ).length,
    };
  }, [issues]);

  /* =========================
     SEARCH + FILTER
  ========================= */

  const filteredIssues = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return issues.filter((issue) => {
      const matchesSearch =
        !searchText ||
        issue.title?.toLowerCase().includes(searchText) ||
        issue.id?.toLowerCase().includes(searchText) ||
        issue.assignee?.toLowerCase().includes(searchText) ||
        issue.category?.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        issue.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [issues, search, statusFilter]);

  /* =========================
     CREATE ISSUE
  ========================= */

  const handleCreateIssue = async (event) => {
    event.preventDefault();

    if (!newIssue.title.trim()) {
      alert("Please enter an issue title.");
      return;
    }

    if (!user) {
      alert("Please login first.");
      return;
    }

    try {
      await addDoc(collection(db, "issues"), {
        title: newIssue.title.trim(),
        description: newIssue.description.trim(),
        priority: newIssue.priority,
        status: "Open",
        category: newIssue.category,
        assignee: newIssue.assignee,
        createdBy: user.email || "Unknown",
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

  /* =========================
     UPDATE STATUS
  ========================= */

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

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /* =========================
     LOADING
  ========================= */

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-box">
          <div className="brand-icon">IT</div>
          <h2>IssueTrack</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  /* =========================
     LOGIN / REGISTER
  ========================= */

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
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
        }}
        onRegister={() => setShowRegister(true)}
      />
    );
  }

  /* =========================
     MAIN APP
  ========================= */

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

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

          <span className="workspace-arrow">
            ⌄
          </span>

        </div>

        <nav>

          <p className="nav-title">
            MAIN MENU
          </p>

          <button
            className={
              activePage === "Dashboard"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              setActivePage("Dashboard")
            }
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
            onClick={() =>
              setActivePage("All Issues")
            }
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
            onClick={() =>
              setActivePage("My Issues")
            }
          >
            <span>◎</span>
            My Issues
          </button>

          <button
            className="nav-item"
            onClick={() =>
              setShowModal(true)
            }
          >
            <span>＋</span>
            Create Issue
          </button>

          <p className="nav-title second">
            MANAGEMENT
          </p>

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
            <div className="help-icon">
              ?
            </div>

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
              <strong>
                {user.email}
              </strong>

              <span>
                Administrator
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="logout-button"
              title="Logout"
            >
              ↪
            </button>

          </div>

        </div>

      </aside>

      {/* ================= MAIN ================= */}

      <main className="main">

        {/* TOP BAR */}

        <header className="topbar">

          <div className="mobile-brand">
            <div className="brand-icon">
              IT
            </div>

            <strong>
              IssueTrack
            </strong>
          </div>

          <div className="search-box">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search issues, IDs, assignees..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <kbd>
              Ctrl K
            </kbd>

          </div>

          <div className="top-actions">

            <button className="icon-button">
              ☼
            </button>

            <button className="icon-button notification">
              ♢
              <i></i>
            </button>

            <div className="top-avatar">
              {(user.email?.slice(0, 2) || "US").toUpperCase()}
            </div>

          </div>

        </header>

        {/* CONTENT */}

        <div className="content">

          {/* ================= DASHBOARD ================= */}

          {activePage === "Dashboard" && (
            <>

              <div className="page-header">

                <div>

                  <p className="eyebrow">
                    OVERVIEW
                  </p>

                  <h1>
                    Dashboard
                  </h1>

                  <p className="subtitle">
                    Welcome back. Here's what's
                    happening with your issues today.
                  </p>

                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    setShowModal(true)
                  }
                >
                  <span>＋</span>
                  Create Issue
                </button>

              </div>

              {/* STATS */}

              <section className="stats-grid">

                <StatCard
                  label="TOTAL ISSUES"
                  value={stats.total}
                  icon="☷"
                  iconClass="purple"
                  change="↗ 12%"
                  changeText="vs last month"
                  changeClass="positive"
                />

                <StatCard
                  label="OPEN"
                  value={stats.open}
                  icon="◷"
                  iconClass="orange"
                  change="●"
                  changeText="Needs attention"
                  changeClass="warning"
                />

                <StatCard
                  label="IN PROGRESS"
                  value={stats.progress}
                  icon="◌"
                  iconClass="blue"
                  change="●"
                  changeText="Being worked on"
                  changeClass="neutral"
                />

                <StatCard
                  label="RESOLVED"
                  value={stats.resolved}
                  icon="✓"
                  iconClass="green"
                  change="↗ 8%"
                  changeText="this week"
                  changeClass="positive"
                />

                <StatCard
                  label="CRITICAL"
                  value={stats.critical}
                  icon="!"
                  iconClass="red"
                  change="●"
                  changeText="High priority"
                  changeClass="danger"
                  critical
                />

              </section>

              {/* RECENT ISSUES */}

              <section className="issues-section">

                <div className="section-header">

                  <div>
                    <h2>
                      Recent Issues
                    </h2>

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
          )}

          {/* ================= ALL ISSUES ================= */}

          {activePage === "All Issues" && (
            <>

              <div className="page-header">

                <div>

                  <p className="eyebrow">
                    ISSUE MANAGEMENT
                  </p>

                  <h1>
                    All Issues
                  </h1>

                  <p className="subtitle">
                    Manage and track all reported issues.
                  </p>

                </div>

                <button
                  className="primary-button"
                  onClick={() =>
                    setShowModal(true)
                  }
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
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />

                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option value="All">
                    All
                  </option>

                  <option value="Open">
                    Open
                  </option>

                  <option value="In Progress">
                    In Progress
                  </option>

                  <option value="Resolved">
                    Resolved
                  </option>
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
          )}

          {/* ================= MY ISSUES ================= */}

          {activePage === "My Issues" && (
            <>

              <div className="page-header">

                <div>

                  <p className="eyebrow">
                    PERSONAL WORKSPACE
                  </p>

                  <h1>
                    My Issues
                  </h1>

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

      {/* ================= CREATE ISSUE MODAL ================= */}

      {showModal && (
        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <p className="eyebrow">
                  NEW ISSUE
                </p>

                <h2>
                  Create New Issue
                </h2>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleCreateIssue}
            >

              <label>

                Issue Title

                <input
                  type="text"
                  placeholder="Enter issue title"
                  value={newIssue.title}
                  onChange={(event) =>
                    setNewIssue({
                      ...newIssue,
                      title: event.target.value,
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
                  onChange={(event) =>
                    setNewIssue({
                      ...newIssue,
                      description: event.target.value,
                    })
                  }
                />

              </label>

              <div className="form-grid">

                <label>

                  Priority

                  <select
                    value={newIssue.priority}
                    onChange={(event) =>
                      setNewIssue({
                        ...newIssue,
                        priority: event.target.value,
                      })
                    }
                  >
                    <option value="Critical">
                      Critical
                    </option>

                    <option value="High">
                      High
                    </option>

                    <option value="Medium">
                      Medium
                    </option>

                    <option value="Low">
                      Low
                    </option>

                  </select>

                </label>

                <label>

                  Category

                  <select
                    value={newIssue.category}
                    onChange={(event) =>
                      setNewIssue({
                        ...newIssue,
                        category: event.target.value,
                      })
                    }
                  >

                    <option value="General">
                      General
                    </option>

                    <option value="Authentication">
                      Authentication
                    </option>

                    <option value="Payment">
                      Payment
                    </option>

                    <option value="UI/UX">
                      UI/UX
                    </option>

                    <option value="Performance">
                      Performance
                    </option>

                    <option value="Technical">
                      Technical
                    </option>

                  </select>

                </label>

              </div>

              <label>

                Assign To

                <select
                  value={newIssue.assignee}
                  onChange={(event) =>
                    setNewIssue({
                      ...newIssue,
                      assignee: event.target.value,
                    })
                  }
                >

                  <option value="Unassigned">
                    Unassigned
                  </option>

                  <option value="Anil Lama">
                    Anil Lama
                  </option>

                  <option value="Sujan">
                    Sujan
                  </option>

                  <option value="Ramesh">
                    Ramesh
                  </option>

                  <option value="Bikash">
                    Bikash
                  </option>

                </select>

              </label>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowModal(false)
                  }
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

/* =========================
   STAT CARD
========================= */

function StatCard({
  label,
  value,
  icon,
  iconClass,
  change,
  changeText,
  changeClass,
  critical = false,
}) {
  return (
    <div
      className={
        critical
          ? "stat-card critical-card"
          : "stat-card"
      }
    >

      <div className="stat-top">

        <span className="stat-label">
          {label}
        </span>

        <div
          className={`stat-icon ${iconClass}`}
        >
          {icon}
        </div>

      </div>

      <strong>
        {value}
      </strong>

      <div
        className={`stat-change ${changeClass}`}
      >
        {change}{" "}

        <span>
          {changeText}
        </span>

      </div>

    </div>
  );
}

/* =========================
   ISSUE TABLE
========================= */

function IssueTable({
  issues,
  updateStatus,
}) {
  if (!issues || issues.length === 0) {
    return (
      <div className="empty-state">

        <div>
          ☷
        </div>

        <h3>
          No issues found
        </h3>

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

          {issues.map((issue) => {

            const priorityClass =
              issue.priority
                ?.toLowerCase()
                ?.replace(/\s+/g, "-") || "";

            const statusClass =
              issue.status
                ?.toLowerCase()
                ?.replace(/\s+/g, "-") || "";

            const initials =
              issue.assignee &&
              issue.assignee !== "Unassigned"
                ? issue.assignee
                    .split(" ")
                    .map((name) => name[0])
                    .join("")
                : "?";

            return (
              <tr key={issue.id}>

                <td>

                  <div className="issue-title">

                    <span className="issue-id">
                      {issue.id}
                    </span>

                    <strong>
                      {issue.title}
                    </strong>

                    <small>
                      {issue.category}
                    </small>

                  </div>

                </td>

                <td>

                  <span
                    className={
                      "priority " +
                      priorityClass
                    }
                  >

                    <i></i>

                    {issue.priority}

                  </span>

                </td>

                <td>

                  <select
                    className={
                      "status-select " +
                      statusClass
                    }
                    value={
                      issue.status || "Open"
                    }
                    onChange={(event) =>
                      updateStatus(
                        issue.id,
                        event.target.value
                      )
                    }
                  >

                    <option value="Open">
                      Open
                    </option>

                    <option value="In Progress">
                      In Progress
                    </option>

                    <option value="Resolved">
                      Resolved
                    </option>

                  </select>

                </td>

                <td>

                  <div className="assignee">

                    <div className="small-avatar">
                      {initials}
                    </div>

                    <span>
                      {issue.assignee ||
                        "Unassigned"}
                    </span>

                  </div>

                </td>

                <td className="date">
                  {issue.date || "—"}
                </td>

                <td>

                  <button
                    className="more-button"
                    type="button"
                  >
                    •••
                  </button>

                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

    </div>
  );
}

export default App;