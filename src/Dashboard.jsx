import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

function Dashboard({ user }) {
  const [issues, setIssues] = useState([
    { id: "ISSUE-101", title: "Authentication token expiration bug", priority: "High", status: "In Progress", reporter: "Anil", date: "2026-08-20" },
    { id: "ISSUE-102", title: "Dashboard CSS overflow on mobile screen", priority: "Medium", status: "Open", reporter: "Developer", date: "2026-08-21" },
    { id: "ISSUE-103", title: "Database connection delay in production", priority: "Critical", status: "Open", reporter: "Admin", date: "2026-08-21" },
    { id: "ISSUE-104", title: "Update profile avatar upload handler", priority: "Low", status: "Closed", reporter: "Anil", date: "2026-08-19" }
  ]);

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newIssue, setNewIssue] = useState({ title: "", priority: "Medium", status: "Open" });

  const handleCreateIssue = (e) => {
    e.preventDefault();
    if (!newIssue.title.trim()) return;

    const created = {
      id: `ISSUE-${100 + issues.length + 1}`,
      title: newIssue.title,
      priority: newIssue.priority,
      status: newIssue.status,
      reporter: user.email.split("@")[0],
      date: new Date().toISOString().split("T")[0]
    };

    setIssues([created, ...issues]);
    setNewIssue({ title: "", priority: "Medium", status: "Open" });
    setShowModal(false);
  };

  const filteredIssues = issues.filter((item) => {
    const matchesFilter = filter === "All" || item.status === filter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="dashboard-layout">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-logo">IT</div>
          <div>
            <h3>IssueTrack</h3>
            <span className="sub-text">Workspace Dashboard</span>
          </div>
        </div>

        <div className="nav-user">
          <div className="user-avatar">{user.email[0].toUpperCase()}</div>
          <div className="user-info">
            <span className="user-email">{user.email}</span>
            <span className="user-role">Project Manager</span>
          </div>
          <button onClick={() => signOut(auth)} className="logout-btn">Sign Out</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Analytics Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Total Issues</h4>
            <p className="stat-number">{issues.length}</p>
          </div>
          <div className="stat-card yellow">
            <h4>In Progress</h4>
            <p className="stat-number">{issues.filter(i => i.status === "In Progress").length}</p>
          </div>
          <div className="stat-card green">
            <h4>Resolved</h4>
            <p className="stat-number">{issues.filter(i => i.status === "Closed").length}</p>
          </div>
          <div className="stat-card red">
            <h4>Critical Bugs</h4>
            <p className="stat-number">{issues.filter(i => i.priority === "Critical").length}</p>
          </div>
        </div>

        {/* Controls Header */}
        <div className="controls-bar">
          <div className="search-filter">
            <input 
              type="text" 
              placeholder="Search issues by ID or Title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <button onClick={() => setShowModal(true)} className="create-issue-btn">+ New Issue</button>
        </div>

        {/* Issues List Table */}
        <div className="table-card">
          <table className="issue-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="issue-id">{issue.id}</td>
                  <td className="issue-title">{issue.title}</td>
                  <td>
                    <span className={`badge priority-${issue.priority.toLowerCase()}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge status-${issue.status.toLowerCase().replace(" ", "-")}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="reporter-cell">{issue.reporter}</td>
                  <td className="date-cell">{issue.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal for Creating New Issue */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create New Issue Ticket</h3>
            <form onSubmit={handleCreateIssue}>
              <div className="form-group">
                <label>Issue Title</label>
                <input 
                  type="text" 
                  placeholder="Describe the bug or task" 
                  value={newIssue.title}
                  onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    value={newIssue.priority} 
                    onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Initial Status</label>
                  <select 
                    value={newIssue.status} 
                    onChange={(e) => setNewIssue({ ...newIssue, status: e.target.value })}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="submit-btn">Create Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
