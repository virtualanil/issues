import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";


/* =========================================================
   APP
========================================================= */

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);

  const [issues, setIssues] = useState([]);
  const [users, setUsers] = useState([]);

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [showIssueModal, setShowIssueModal] =
    useState(false);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [selectedIssue, setSelectedIssue] =
    useState(null);

  const [editingIssue, setEditingIssue] =
    useState(null);

  const [loadingIssues, setLoadingIssues] =
    useState(true);

  const [newIssue, setNewIssue] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "General",
    assigneeUid: "",
    assignee: "Unassigned",
  });


  /* =========================================================
     AUTH
  ========================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);

        if (currentUser) {
          await ensureUserProfile(currentUser);
        }
      }
    );

    return () => unsubscribe();
  }, []);


  /* =========================================================
     ENSURE USER PROFILE
  ========================================================= */

  const ensureUserProfile = async (currentUser) => {
    try {
      const userRef = doc(
        db,
        "users",
        currentUser.uid
      );

      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        await setDoc(
          userRef,
          {
            uid: currentUser.uid,
            name:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "User",
            email: currentUser.email || "",
            role: "user",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.error(
        "User profile error:",
        error
      );
    }
  };


  /* =========================================================
     LOAD ISSUES
  ========================================================= */

  useEffect(() => {
    if (!user) {
      setIssues([]);
      return;
    }

    setLoadingIssues(true);

    const issuesQuery = query(
      collection(db, "issues"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      issuesQuery,
      (snapshot) => {
        const firestoreIssues =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }));

        setIssues(firestoreIssues);
        setLoadingIssues(false);
      },
      (error) => {
        console.error(
          "Firestore issue error:",
          error
        );

        setLoadingIssues(false);
      }
    );

    return () => unsubscribe();
  }, [user]);


  /* =========================================================
     LOAD USERS
  ========================================================= */

  useEffect(() => {
    if (!user) {
      setUsers([]);
      return;
    }

    const usersQuery = query(
      collection(db, "users"),
      orderBy("name", "asc")
    );

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const firestoreUsers =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }));

        setUsers(firestoreUsers);
      },
      (error) => {
        console.error(
          "Users loading error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [user]);


  /* =========================================================
     CURRENT USER PROFILE
  ========================================================= */

  const currentUserProfile = useMemo(() => {
    return users.find(
      (item) => item.uid === user?.uid
    );
  }, [users, user]);


  const currentUserName =
    currentUserProfile?.name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";


  /* =========================================================
     DASHBOARD STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const total = issues.length;

    const open = issues.filter(
      (item) => item.status === "Open"
    ).length;

    const progress = issues.filter(
      (item) => item.status === "In Progress"
    ).length;

    const resolved = issues.filter(
      (item) => item.status === "Resolved"
    ).length;

    const critical = issues.filter(
      (item) => item.priority === "Critical"
    ).length;

    const resolutionRate =
      total > 0
        ? Math.round((resolved / total) * 100)
        : 0;

    const openRate =
      total > 0
        ? Math.round((open / total) * 100)
        : 0;

    const progressRate =
      total > 0
        ? Math.round((progress / total) * 100)
        : 0;

    const criticalRate =
      total > 0
        ? Math.round((critical / total) * 100)
        : 0;

    return {
      total,
      open,
      progress,
      resolved,
      critical,
      resolutionRate,
      openRate,
      progressRate,
      criticalRate,
    };
  }, [issues]);


  /* =========================================================
     SEARCH / FILTER
  ========================================================= */

  const filteredIssues = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return issues.filter((issue) => {
      const matchesSearch =
        !searchText ||
        issue.title
          ?.toLowerCase()
          .includes(searchText) ||
        issue.id
          ?.toLowerCase()
          .includes(searchText) ||
        issue.assignee
          ?.toLowerCase()
          .includes(searchText) ||
        issue.category
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        issue.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    issues,
    search,
    statusFilter,
  ]);


  /* =========================================================
     MY ISSUES
  ========================================================= */

  const myIssues = useMemo(() => {
    if (!user) return [];

    return issues.filter((issue) => {
      if (issue.assigneeUid) {
        return (
          issue.assigneeUid === user.uid
        );
      }

      return (
        issue.assignee === currentUserName
      );
    });
  }, [
    issues,
    user,
    currentUserName,
  ]);


  /* =========================================================
     RESET ISSUE FORM
  ========================================================= */

  const resetIssueForm = () => {
    setNewIssue({
      title: "",
      description: "",
      priority: "Medium",
      category: "General",
      assigneeUid: "",
      assignee: "Unassigned",
    });

    setEditingIssue(null);
  };


  /* =========================================================
     OPEN CREATE MODAL
  ========================================================= */

  const openCreateIssue = () => {
    resetIssueForm();
    setShowIssueModal(true);
  };


  /* =========================================================
     OPEN EDIT MODAL
  ========================================================= */

  const openEditIssue = (issue) => {
    setEditingIssue(issue);

    setNewIssue({
      title: issue.title || "",
      description: issue.description || "",
      priority: issue.priority || "Medium",
      category: issue.category || "General",
      assigneeUid: issue.assigneeUid || "",
      assignee:
        issue.assignee || "Unassigned",
    });

    setShowDetailsModal(false);
    setShowIssueModal(true);
  };


  /* =========================================================
     ASSIGNEE CHANGE
  ========================================================= */

  const handleAssigneeChange = (uid) => {
    if (!uid) {
      setNewIssue((previous) => ({
        ...previous,
        assigneeUid: "",
        assignee: "Unassigned",
      }));

      return;
    }

    const selectedUser = users.find(
      (item) => item.uid === uid
    );

    setNewIssue((previous) => ({
      ...previous,
      assigneeUid: uid,
      assignee:
        selectedUser?.name ||
        selectedUser?.email ||
        "User",
    }));
  };


  /* =========================================================
     CREATE / UPDATE ISSUE
  ========================================================= */

  const handleSubmitIssue = async (e) => {
    e.preventDefault();

    if (!newIssue.title.trim() || !user) {
      return;
    }

    try {
      if (editingIssue) {
        await updateDoc(
          doc(
            db,
            "issues",
            editingIssue.id
          ),
          {
            title: newIssue.title.trim(),
            description:
              newIssue.description.trim(),
            priority: newIssue.priority,
            category: newIssue.category,
            assignee: newIssue.assignee,
            assigneeUid:
              newIssue.assigneeUid || "",
            updatedAt:
              serverTimestamp(),
          }
        );
      } else {
        await addDoc(
          collection(db, "issues"),
          {
            title: newIssue.title.trim(),
            description:
              newIssue.description.trim(),

            priority: newIssue.priority,

            status: "Open",

            category: newIssue.category,

            assignee: newIssue.assignee,

            assigneeUid:
              newIssue.assigneeUid || "",

            createdBy:
              currentUserName,

            createdByUid:
              user.uid,

            createdByEmail:
              user.email || "",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),

            date:
              new Date().toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              ),
          }
        );
      }

      resetIssueForm();
      setShowIssueModal(false);

      setActivePage("All Issues");
    } catch (error) {
      console.error(
        "Save issue error:",
        error
      );

      alert(
        "Unable to save issue. Please try again."
      );
    }
  };


  /* =========================================================
     UPDATE STATUS
  ========================================================= */

  const updateStatus = async (
    id,
    status
  ) => {
    try {
      await updateDoc(
        doc(db, "issues", id),
        {
          status,
          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      alert(
        "Unable to update issue status."
      );
    }
  };


  /* =========================================================
     UPDATE PRIORITY
  ========================================================= */

  const updatePriority = async (
    id,
    priority
  ) => {
    try {
      await updateDoc(
        doc(db, "issues", id),
        {
          priority,
          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Priority update error:",
        error
      );

      alert(
        "Unable to update priority."
      );
    }
  };


  /* =========================================================
     UPDATE ASSIGNEE
  ========================================================= */

  const updateAssignee = async (
    id,
    uid
  ) => {
    try {
      const selectedUser = users.find(
        (item) => item.uid === uid
      );

      await updateDoc(
        doc(db, "issues", id),
        {
          assigneeUid: uid || "",
          assignee:
            selectedUser?.name ||
            selectedUser?.email ||
            "Unassigned",
          updatedAt:
            serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Assignee update error:",
        error
      );

      alert(
        "Unable to update assignee."
      );
    }
  };


  /* =========================================================
     DELETE ISSUE
  ========================================================= */

  const deleteIssue = async () => {
    if (!selectedIssue) return;

    try {
      await deleteDoc(
        doc(
          db,
          "issues",
          selectedIssue.id
        )
      );

      setSelectedIssue(null);
      setShowDeleteModal(false);
      setShowDetailsModal(false);
    } catch (error) {
      console.error(
        "Delete issue error:",
        error
      );

      alert(
        "Unable to delete issue."
      );
    }
  };


  /* =========================================================
     OPEN DETAILS
  ========================================================= */

  const openDetails = (issue) => {
    setSelectedIssue(issue);
    setShowDetailsModal(true);
  };


  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };


  /* =========================================================
     LOADING
  ========================================================= */

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-card">
          <div className="loading-logo">
            IT
          </div>

          <h2>IssueTrack</h2>

          <p>Loading your workspace...</p>

          <div className="loader"></div>
        </div>
      </div>
    );
  }


  /* =========================================================
     LOGIN / REGISTER
  ========================================================= */

  if (!user) {
    if (showRegister) {
      return (
        <Register
          onRegister={(registeredUser) => {
            setUser(registeredUser);
            setShowRegister(false);
          }}
          onLogin={() =>
            setShowRegister(false)
          }
        />
      );
    }

    return (
      <Login
        onLogin={(loggedInUser) =>
          setUser(loggedInUser)
        }
        onRegister={() =>
          setShowRegister(true)
        }
      />
    );
  }


  /* =========================================================
     MAIN APP
  ========================================================= */

  return (
    <div className="app">

      {/* ================= SIDEBAR ================= */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            IT
          </div>

          <div>
            <h2>IssueTrack</h2>
            <span>
              Management Portal
            </span>
          </div>
        </div>


        <div className="workspace">
          <div className="workspace-avatar">
            {getInitials(
              currentUserName
            )}
          </div>

          <div>
            <strong>
              My Workspace
            </strong>

            <span>
              {currentUserProfile?.role ||
                "User"}
            </span>
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
            <b>{myIssues.length}</b>
          </button>


          <button
            className="nav-item"
            onClick={openCreateIssue}
          >
            <span>＋</span>
            Create Issue
          </button>


          <p className="nav-title second">
            MANAGEMENT
          </p>


          <button
            className="nav-item"
            onClick={() =>
              setActivePage("Reports")
            }
          >
            <span>◫</span>
            Reports
          </button>


          <button
            className="nav-item"
            onClick={() =>
              setActivePage("Settings")
            }
          >
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
              <strong>
                Need Help?
              </strong>

              <span>
                Contact support
              </span>
            </div>
          </div>


          <div className="user-card">

            <div className="avatar">
              {getInitials(
                currentUserName
              )}
            </div>

            <div className="user-info">
              <strong>
                {currentUserName}
              </strong>

              <span>
                {user.email}
              </span>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
              title="Logout"
            >
              ↪
            </button>
          </div>
        </div>
      </aside>


      {/* ================= MAIN ================= */}

      <main className="main">

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
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <kbd>Ctrl K</kbd>
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
              {getInitials(
                currentUserName
              )}
            </div>
          </div>
        </header>


        {/* ================= CONTENT ================= */}

        <div className="content">

          {/* DASHBOARD */}

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
                    Welcome back,{" "}
                    {currentUserName}.
                    Here's what's happening
                    with your issues today.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={openCreateIssue}
                >
                  ＋ Create Issue
                </button>
              </div>


              {/* STATS */}

              <section className="stats-grid">

                <StatCard
                  label="TOTAL ISSUES"
                  value={stats.total}
                  icon="☷"
                  type="purple"
                  footer={`${stats.total} total issues`}
                />

                <StatCard
                  label="OPEN"
                  value={stats.open}
                  icon="◷"
                  type="orange"
                  footer={`${stats.openRate}% of all issues`}
                />

                <StatCard
                  label="IN PROGRESS"
                  value={stats.progress}
                  icon="◌"
                  type="blue"
                  footer={`${stats.progressRate}% of all issues`}
                />

                <StatCard
                  label="RESOLVED"
                  value={stats.resolved}
                  icon="✓"
                  type="green"
                  footer={`${stats.resolutionRate}% resolution rate`}
                />

                <StatCard
                  label="CRITICAL"
                  value={stats.critical}
                  icon="!"
                  type="red"
                  footer={`${stats.criticalRate}% of all issues`}
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
                      setActivePage(
                        "All Issues"
                      )
                    }
                  >
                    View all →
                  </button>
                </div>


                <IssueTable
                  issues={filteredIssues.slice(
                    0,
                    5
                  )}
                  users={users}
                  currentUser={user}
                  onView={openDetails}
                  onEdit={openEditIssue}
                  onDelete={(issue) => {
                    setSelectedIssue(
                      issue
                    );
                    setShowDeleteModal(
                      true
                    );
                  }}
                  updateStatus={
                    updateStatus
                  }
                  updatePriority={
                    updatePriority
                  }
                  updateAssignee={
                    updateAssignee
                  }
                />
              </section>
            </>
          )}


          {/* ALL ISSUES */}

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
                  onClick={openCreateIssue}
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
                      setSearch(
                        e.target.value
                      )
                    }
                  />
                </div>


                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                >
                  <option>All</option>
                  <option>Open</option>
                  <option>
                    In Progress
                  </option>
                  <option>
                    Resolved
                  </option>
                </select>


                <button
                  className="secondary-button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter(
                      "All"
                    );
                  }}
                >
                  Reset
                </button>
              </div>


              <section className="issues-section full">

                <IssueTable
                  issues={
                    filteredIssues
                  }
                  users={users}
                  currentUser={user}
                  onView={openDetails}
                  onEdit={openEditIssue}
                  onDelete={(issue) => {
                    setSelectedIssue(
                      issue
                    );
                    setShowDeleteModal(
                      true
                    );
                  }}
                  updateStatus={
                    updateStatus
                  }
                  updatePriority={
                    updatePriority
                  }
                  updateAssignee={
                    updateAssignee
                  }
                />

              </section>
            </>
          )}


          {/* MY ISSUES */}

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
                    Issues currently assigned to{" "}
                    {currentUserName}.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={openCreateIssue}
                >
                  ＋ Create Issue
                </button>
              </div>


              <section className="issues-section full">

                <IssueTable
                  issues={myIssues}
                  users={users}
                  currentUser={user}
                  onView={openDetails}
                  onEdit={openEditIssue}
                  onDelete={(issue) => {
                    setSelectedIssue(
                      issue
                    );
                    setShowDeleteModal(
                      true
                    );
                  }}
                  updateStatus={
                    updateStatus
                  }
                  updatePriority={
                    updatePriority
                  }
                  updateAssignee={
                    updateAssignee
                  }
                />

              </section>
            </>
          )}


          {/* REPORTS */}

          {activePage === "Reports" && (
            <Reports
              stats={stats}
              issues={issues}
            />
          )}


          {/* SETTINGS */}

          {activePage === "Settings" && (
            <Settings
              user={user}
              currentUserName={
                currentUserName
              }
            />
          )}

        </div>
      </main>


      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {showIssueModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowIssueModal(false);
            resetIssueForm();
          }}
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <p className="eyebrow">
                  {editingIssue
                    ? "EDIT ISSUE"
                    : "NEW ISSUE"}
                </p>

                <h2>
                  {editingIssue
                    ? "Edit Issue"
                    : "Create New Issue"}
                </h2>
              </div>

              <button
                className="close-button"
                onClick={() => {
                  setShowIssueModal(
                    false
                  );
                  resetIssueForm();
                }}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                handleSubmitIssue
              }
            >

              <label>
                Issue Title

                <input
                  type="text"
                  placeholder="Enter issue title"
                  value={
                    newIssue.title
                  }
                  onChange={(e) =>
                    setNewIssue({
                      ...newIssue,
                      title:
                        e.target.value,
                    })
                  }
                  required
                />
              </label>


              <label>
                Description

                <textarea
                  placeholder="Describe the issue..."
                  rows="5"
                  value={
                    newIssue.description
                  }
                  onChange={(e) =>
                    setNewIssue({
                      ...newIssue,
                      description:
                        e.target.value,
                    })
                  }
                />
              </label>


              <div className="form-grid">

                <label>
                  Priority

                  <select
                    value={
                      newIssue.priority
                    }
                    onChange={(e) =>
                      setNewIssue({
                        ...newIssue,
                        priority:
                          e.target.value,
                      })
                    }
                  >
                    <option>
                      Critical
                    </option>
                    <option>
                      High
                    </option>
                    <option>
                      Medium
                    </option>
                    <option>
                      Low
                    </option>
                  </select>
                </label>


                <label>
                  Category

                  <select
                    value={
                      newIssue.category
                    }
                    onChange={(e) =>
                      setNewIssue({
                        ...newIssue,
                        category:
                          e.target.value,
                      })
                    }
                  >
                    <option>
                      General
                    </option>
                    <option>
                      Authentication
                    </option>
                    <option>
                      Payment
                    </option>
                    <option>
                      UI/UX
                    </option>
                    <option>
                      Performance
                    </option>
                    <option>
                      Technical
                    </option>
                  </select>
                </label>

              </div>


              <label>
                Assign To

                <select
                  value={
                    newIssue.assigneeUid
                  }
                  onChange={(e) =>
                    handleAssigneeChange(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Unassigned
                  </option>

                  {users.map(
                    (item) => (
                      <option
                        key={
                          item.uid ||
                          item.id
                        }
                        value={
                          item.uid ||
                          item.id
                        }
                      >
                        {item.name ||
                          item.email}
                      </option>
                    )
                  )}

                </select>
              </label>


              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowIssueModal(
                      false
                    );
                    resetIssueForm();
                  }}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingIssue
                    ? "Save Changes"
                    : "Create Issue"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}


      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {showDetailsModal &&
        selectedIssue && (
          <IssueDetailsModal
            issue={selectedIssue}
            users={users}
            onClose={() =>
              setShowDetailsModal(
                false
              )
            }
            onEdit={() =>
              openEditIssue(
                selectedIssue
              )
            }
            onDelete={() => {
              setShowDetailsModal(
                false
              );
              setShowDeleteModal(
                true
              );
            }}
            updateStatus={
              updateStatus
            }
            updatePriority={
              updatePriority
            }
            updateAssignee={
              updateAssignee
            }
          />
        )}


      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      {showDeleteModal &&
        selectedIssue && (
          <div
            className="modal-overlay"
            onClick={() =>
              setShowDeleteModal(
                false
              )
            }
          >

            <div
              className="delete-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="delete-icon">
                !
              </div>

              <h2>
                Delete Issue?
              </h2>

              <p>
                Are you sure you want to
                delete{" "}
                <strong>
                  {selectedIssue.title}
                </strong>
                ? This action cannot be
                undone.
              </p>

              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowDeleteModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className="danger-button"
                  onClick={
                    deleteIssue
                  }
                >
                  Delete Issue
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  icon,
  type,
  footer,
  critical,
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
          className={`stat-icon ${type}`}
        >
          {icon}
        </div>

      </div>

      <strong>
        {value}
      </strong>

      <div
        className={`stat-change ${type}`}
      >
        ● {footer}
      </div>

    </div>
  );
}


/* =========================================================
   ISSUE TABLE
========================================================= */

function IssueTable({
  issues,
  users,
  onView,
  onEdit,
  onDelete,
  updateStatus,
  updatePriority,
  updateAssignee,
}) {
  if (issues.length === 0) {
    return (
      <div className="empty-state">
        <div>☷</div>

        <h3>
          No issues found
        </h3>

        <p>
          There are no issues matching
          your current selection.
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
                <button
                  className="issue-click"
                  onClick={() =>
                    onView(issue)
                  }
                >

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

                </button>
              </td>


              <td>

                <select
                  className={`priority-select ${issue.priority?.toLowerCase() || ""}`}
                  value={
                    issue.priority ||
                    "Medium"
                  }
                  onChange={(e) =>
                    updatePriority(
                      issue.id,
                      e.target.value
                    )
                  }
                >
                  <option>
                    Critical
                  </option>
                  <option>
                    High
                  </option>
                  <option>
                    Medium
                  </option>
                  <option>
                    Low
                  </option>
                </select>

              </td>


              <td>

                <select
                  className={`status-select ${issue.status
                    ?.toLowerCase()
                    .replace(/\s+/g, "-") || ""}`}
                  value={
                    issue.status ||
                    "Open"
                  }
                  onChange={(e) =>
                    updateStatus(
                      issue.id,
                      e.target.value
                    )
                  }
                >

                  <option>
                    Open
                  </option>

                  <option>
                    In Progress
                  </option>

                  <option>
                    Resolved
                  </option>

                </select>

              </td>


              <td>

                <select
                  className="assignee-select"
                  value={
                    issue.assigneeUid ||
                    ""
                  }
                  onChange={(e) =>
                    updateAssignee(
                      issue.id,
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    Unassigned
                  </option>

                  {users.map(
                    (item) => (
                      <option
                        key={
                          item.uid ||
                          item.id
                        }
                        value={
                          item.uid ||
                          item.id
                        }
                      >
                        {item.name ||
                          item.email}
                      </option>
                    )
                  )}

                </select>

              </td>


              <td className="date">
                {formatDate(
                  issue.createdAt,
                  issue.date
                )}
              </td>


              <td>

                <div className="action-menu">

                  <button
                    className="more-button"
                    title="Actions"
                  >
                    •••
                  </button>

                  <div className="action-dropdown">

                    <button
                      onClick={() =>
                        onView(issue)
                      }
                    >
                      👁 View
                    </button>

                    <button
                      onClick={() =>
                        onEdit(issue)
                      }
                    >
                      ✎ Edit
                    </button>

                    <button
                      className="delete-action"
                      onClick={() =>
                        onDelete(issue)
                      }
                    >
                      🗑 Delete
                    </button>

                  </div>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}


/* =========================================================
   ISSUE DETAILS MODAL
========================================================= */

function IssueDetailsModal({
  issue,
  users,
  onClose,
  onEdit,
  onDelete,
  updateStatus,
  updatePriority,
  updateAssignee,
}) {
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
    >

      <div
        className="details-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>
            <p className="eyebrow">
              {issue.id}
            </p>

            <h2>
              {issue.title}
            </h2>
          </div>

          <button
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        <div className="details-content">

          <div className="details-description">

            <h3>
              Description
            </h3>

            <p>
              {issue.description ||
                "No description provided."}
            </p>

          </div>


          <div className="details-grid">

            <DetailItem
              label="Category"
              value={
                issue.category ||
                "General"
              }
            />

            <div className="detail-item">
              <span>
                Priority
              </span>

              <select
                className="detail-select"
                value={
                  issue.priority ||
                  "Medium"
                }
                onChange={(e) =>
                  updatePriority(
                    issue.id,
                    e.target.value
                  )
                }
              >
                <option>
                  Critical
                </option>
                <option>
                  High
                </option>
                <option>
                  Medium
                </option>
                <option>
                  Low
                </option>
              </select>
            </div>


            <div className="detail-item">
              <span>
                Status
              </span>

              <select
                className="detail-select"
                value={
                  issue.status ||
                  "Open"
                }
                onChange={(e) =>
                  updateStatus(
                    issue.id,
                    e.target.value
                  )
                }
              >
                <option>
                  Open
                </option>
                <option>
                  In Progress
                </option>
                <option>
                  Resolved
                </option>
              </select>
            </div>


            <div className="detail-item">
              <span>
                Assignee
              </span>

              <select
                className="detail-select"
                value={
                  issue.assigneeUid ||
                  ""
                }
                onChange={(e) =>
                  updateAssignee(
                    issue.id,
                    e.target.value
                  )
                }
              >

                <option value="">
                  Unassigned
                </option>

                {users.map(
                  (item) => (
                    <option
                      key={
                        item.uid ||
                        item.id
                      }
                      value={
                        item.uid ||
                        item.id
                      }
                    >
                      {item.name ||
                        item.email}
                    </option>
                  )
                )}

              </select>

            </div>


            <DetailItem
              label="Created By"
              value={
                issue.createdBy ||
                issue.createdByEmail ||
                "Unknown"
              }
            />


            <DetailItem
              label="Created"
              value={formatDate(
                issue.createdAt,
                issue.date
              )}
            />


            <DetailItem
              label="Last Updated"
              value={formatDate(
                issue.updatedAt
              )}
            />

          </div>

        </div>


        <div className="details-actions">

          <button
            className="secondary-button"
            onClick={onClose}
          >
            Close
          </button>

          <button
            className="secondary-button"
            onClick={onEdit}
          >
            ✎ Edit
          </button>

          <button
            className="danger-button"
            onClick={onDelete}
          >
            🗑 Delete
          </button>

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   DETAIL ITEM
========================================================= */

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="detail-item">

      <span>
        {label}
      </span>

      <strong>
        {value || "—"}
      </strong>

    </div>
  );
}


/* =========================================================
   REPORTS
========================================================= */

function Reports({
  stats,
  issues,
}) {
  const categories = {};

  issues.forEach((issue) => {
    const category =
      issue.category ||
      "General";

    categories[category] =
      (categories[category] || 0) + 1;
  });

  return (
    <div>

      <div className="page-header">

        <div>
          <p className="eyebrow">
            ANALYTICS
          </p>

          <h1>
            Reports
          </h1>

          <p className="subtitle">
            Overview of your issue management activity.
          </p>
        </div>

      </div>


      <div className="report-grid">

        <div className="report-card">
          <span>Total Issues</span>
          <strong>
            {stats.total}
          </strong>
        </div>

        <div className="report-card">
          <span>Open Issues</span>
          <strong>
            {stats.open}
          </strong>
        </div>

        <div className="report-card">
          <span>In Progress</span>
          <strong>
            {stats.progress}
          </strong>
        </div>

        <div className="report-card">
          <span>Resolution Rate</span>
          <strong>
            {stats.resolutionRate}%
          </strong>
        </div>

      </div>


      <div className="issues-section report-section">

        <div className="section-header">
          <div>
            <h2>
              Issues by Category
            </h2>

            <p>
              Distribution of reported issues.
            </p>
          </div>
        </div>


        <div className="category-list">

          {Object.keys(categories).length ===
          0 ? (
            <div className="empty-state">
              No report data available.
            </div>
          ) : (
            Object.entries(
              categories
            ).map(
              ([category, count]) => (
                <div
                  className="category-row"
                  key={category}
                >
                  <span>
                    {category}
                  </span>

                  <strong>
                    {count}
                  </strong>
                </div>
              )
            )
          )}

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SETTINGS
========================================================= */

function Settings({
  user,
  currentUserName,
}) {
  return (
    <div>

      <div className="page-header">

        <div>
          <p className="eyebrow">
            ACCOUNT
          </p>

          <h1>
            Settings
          </h1>

          <p className="subtitle">
            Manage your IssueTrack account.
          </p>
        </div>

      </div>


      <div className="settings-card">

        <div className="settings-avatar">
          {getInitials(
            currentUserName
          )}
        </div>

        <div className="settings-info">

          <h2>
            {currentUserName}
          </h2>

          <p>
            {user.email}
          </p>

          <span>
            Firebase authenticated user
          </span>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getInitials(name) {
  if (!name) return "U";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part[0]?.toUpperCase()
    )
    .join("");
}


function formatDate(
  timestamp,
  fallback
) {
  if (
    timestamp &&
    typeof timestamp.toDate ===
      "function"
  ) {
    return timestamp
      .toDate()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
  }

  if (fallback) {
    return fallback;
  }

  return "—";
}


export default App;
