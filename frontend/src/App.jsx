import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  const navigate = useNavigate();

  // =============================
  // AUTH STATE
  // =============================
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  // =============================
  // THEME STATE
  // =============================
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("tasktracker_theme") === "dark";
  });

  // =============================
  // DATA STATE
  // =============================
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    highPriorityTasks: 0,
    mediumPriorityTasks: 0,
    lowPriorityTasks: 0,
    overdueTasks: 0,
    completionPercentage: 0
  });

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // =============================
  // FORM STATE
  // =============================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Todo");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // =============================
  // FILTER & PAGINATION STATE
  // =============================
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [limit, setLimit] = useState(5);

  // =============================
  // TODAY STRING FOR DUE DATE VALIDATION
  // =============================
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Check auth on load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken) {
      navigate("/login");
      return;
    }

    setToken(storedToken);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, [navigate]);

  // Persist dark mode
  useEffect(() => {
    localStorage.setItem("tasktracker_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Auth header helper
  const getAuthHeaders = useCallback(() => {
    const currentToken = token || localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentToken}`
    };
  }, [token]);

  // Handle unauthorized response
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }, [navigate]);

  // =============================
  // FETCH ANALYTICS
  // =============================
  const fetchAnalytics = useCallback(async () => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) return;

    try {
      setAnalyticsLoading(true);
      const res = await fetch(`${API_BASE_URL}/tasks/analytics`, {
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [token, getAuthHeaders, handleUnauthorized]);

  // =============================
  // FETCH TASKS
  // =============================
  const fetchTasks = useCallback(async () => {
    const currentToken = token || localStorage.getItem("token");
    if (!currentToken) return;

    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (statusFilter && statusFilter !== "All") params.append("status", statusFilter);
      if (priorityFilter && priorityFilter !== "All") params.append("priority", priorityFilter);

      let sortBy = "createdAt";
      let order = "desc";

      if (sortOption === "newest") {
        sortBy = "createdAt";
        order = "desc";
      } else if (sortOption === "oldest") {
        sortBy = "createdAt";
        order = "asc";
      } else if (sortOption === "dueSoon") {
        sortBy = "dueDate";
        order = "asc";
      } else if (sortOption === "title") {
        sortBy = "title";
        order = "asc";
      } else if (sortOption === "priority") {
        sortBy = "priority";
        order = "desc";
      }

      params.append("sortBy", sortBy);
      params.append("order", order);
      params.append("page", currentPage);
      params.append("limit", limit);

      const res = await fetch(`${API_BASE_URL}/tasks?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch tasks");
      }

      setTasks(data.tasks || []);
      setTotalPages(data.totalPages || 1);
      setTotalTasks(data.totalTasks || 0);
    } catch (err) {
      setError(err.message || "Could not retrieve tasks.");
    } finally {
      setLoading(false);
    }
  }, [token, debouncedSearch, statusFilter, priorityFilter, sortOption, currentPage, limit, getAuthHeaders, handleUnauthorized]);

  // Re-fetch tasks when dependencies change
  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchAnalytics();
    }
  }, [token, fetchTasks, fetchAnalytics]);

  // =============================
  // LOGOUT
  // =============================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // =============================
  // FORM SUBMISSION (CREATE / EDIT)
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (!editingId && dueDate && dueDate < getTodayString()) {
      setError("Due date cannot be in the past.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || null
    };

    try {
      setSubmitting(true);
      const url = editingId ? `${API_BASE_URL}/tasks/${editingId}` : `${API_BASE_URL}/tasks`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save task.");
      }

      setSuccessMsg(editingId ? "Task updated successfully!" : "Task created successfully!");
      resetForm();
      setShowForm(false);

      await fetchTasks();
      await fetchAnalytics();

      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError(err.message || "An error occurred while saving the task.");
    } finally {
      setSubmitting(false);
    }
  };

  // =============================
  // RESET FORM
  // =============================
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("Todo");
    setPriority("Medium");
    setDueDate("");
    setEditingId(null);
  };

  // =============================
  // EDIT TASK
  // =============================
  const handleEdit = (task) => {
    setEditingId(task._id);
    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "Todo");
    setPriority(task.priority || "Medium");

    if (task.dueDate) {
      setDueDate(new Date(task.dueDate).toISOString().substring(0, 10));
    } else {
      setDueDate("");
    }

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =============================
  // DELETE TASK
  // =============================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      setError("");
      const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete task.");
      }

      setSuccessMsg("Task deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);

      // Handle page step-back if deleting last item on current page
      if (tasks.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await fetchTasks();
      }
      await fetchAnalytics();
    } catch (err) {
      setError(err.message || "Failed to delete task.");
    }
  };

  // =============================
  // QUICK STATUS TOGGLE
  // =============================
  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/tasks/${task._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (res.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update task status.");
      }

      await fetchTasks();
      await fetchAnalytics();
    } catch (err) {
      setError(err.message || "Failed to update status.");
    }
  };

  // Check if task is overdue
  const isOverdue = (task) => {
    if (!task.dueDate || task.status === "Done") return false;
    const due = new Date(task.dueDate);
    due.setHours(23, 59, 59, 999);
    return due < new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setSortOption("newest");
    setCurrentPage(1);
  };

  const hasActiveFilters = search || statusFilter !== "All" || priorityFilter !== "All" || sortOption !== "newest";

  return (
    <div className={`app-container ${darkMode ? "dark-theme" : "light-theme"}`}>
      {/* ================= TOP NAVIGATION ================= */}
      <header className="navbar">
        <div className="nav-brand">
          <span className="brand-logo">⚡</span>
          <span className="brand-title">TaskTracker</span>
        </div>

        <div className="nav-controls">
          {user && (
            <div className="user-profile">
              <span className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
          )}

          <button
            className="btn-icon theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button className="btn-logout" onClick={handleLogout} title="Log Out">
            <span>Log out</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* ================= ALERTS ================= */}
        {error && (
          <div className="app-alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">{error}</span>
            <button className="alert-close" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {successMsg && (
          <div className="app-alert alert-success">
            <span className="alert-icon">✅</span>
            <span className="alert-text">{successMsg}</span>
            <button className="alert-close" onClick={() => setSuccessMsg("")}>✕</button>
          </div>
        )}

        {/* ================= ANALYTICS DASHBOARD ================= */}
        <section className="analytics-dashboard">
          <div className="dashboard-header">
            <div>
              <h2>Overview & Insights</h2>
              <p>Real-time analytics and task tracking progress</p>
            </div>
            {analyticsLoading && <span className="refresh-spinner">🔄 Refreshing...</span>}
          </div>

          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">📋</div>
              <div className="stat-meta">
                <span className="stat-label">Total Tasks</span>
                <span className="stat-value">{analytics.totalTasks}</span>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-meta">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{analytics.completedTasks}</span>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">⏳</div>
              <div className="stat-meta">
                <span className="stat-label">Pending</span>
                <span className="stat-value">{analytics.pendingTasks}</span>
              </div>
            </div>

            <div className="stat-card info">
              <div className="stat-icon">🔄</div>
              <div className="stat-meta">
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{analytics.inProgressTasks}</span>
              </div>
            </div>

            <div className="stat-card danger">
              <div className="stat-icon">🔥</div>
              <div className="stat-meta">
                <span className="stat-label">High Priority</span>
                <span className="stat-value">{analytics.highPriorityTasks}</span>
              </div>
            </div>

            <div className={`stat-card ${analytics.overdueTasks > 0 ? "danger" : "neutral"}`}>
              <div className="stat-icon">⏰</div>
              <div className="stat-meta">
                <span className="stat-label">Overdue</span>
                <span className="stat-value">{analytics.overdueTasks}</span>
              </div>
            </div>

            <div className="stat-card accent">
              <div className="stat-icon">🎯</div>
              <div className="stat-meta">
                <span className="stat-label">Completion Rate</span>
                <span className="stat-value">{analytics.completionPercentage}%</span>
              </div>
            </div>
          </div>

          {/* Visual Progress & Distribution Bars */}
          <div className="charts-summary">
            <div className="chart-bar-card">
              <div className="bar-header">
                <span className="bar-title">Overall Completion</span>
                <span className="bar-val">{analytics.completionPercentage}%</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${analytics.completionPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="chart-bar-card">
              <div className="bar-header">
                <span className="bar-title">Status Breakdown</span>
                <span className="bar-legend">
                  <span className="legend-dot todo"></span> Todo: {analytics.todoTasks}
                  <span className="legend-dot in-prog"></span> In Progress: {analytics.inProgressTasks}
                  <span className="legend-dot done"></span> Done: {analytics.completedTasks}
                </span>
              </div>
              <div className="segmented-bar">
                {analytics.totalTasks > 0 ? (
                  <>
                    <div
                      className="segment todo"
                      style={{ width: `${(analytics.todoTasks / analytics.totalTasks) * 100}%` }}
                      title={`Todo: ${analytics.todoTasks}`}
                    ></div>
                    <div
                      className="segment in-prog"
                      style={{ width: `${(analytics.inProgressTasks / analytics.totalTasks) * 100}%` }}
                      title={`In Progress: ${analytics.inProgressTasks}`}
                    ></div>
                    <div
                      className="segment done"
                      style={{ width: `${(analytics.completedTasks / analytics.totalTasks) * 100}%` }}
                      title={`Done: ${analytics.completedTasks}`}
                    ></div>
                  </>
                ) : (
                  <div className="segment empty" style={{ width: "100%" }}></div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ================= ACTION BAR & TASK CREATION ================= */}
        <section className="actions-section">
          <div className="section-title-row">
            <div>
              <h2>Task Management</h2>
              <p>Create, organize, prioritize, and track your daily work</p>
            </div>

            <button
              className={`btn-primary add-task-btn ${showForm ? "btn-active" : ""}`}
              onClick={() => {
                if (showForm && editingId) {
                  resetForm();
                } else {
                  setShowForm(!showForm);
                }
              }}
            >
              {showForm ? (editingId ? "Cancel Editing" : "✕ Close Form") : "➕ Add New Task"}
            </button>
          </div>

          {/* ADD / EDIT TASK FORM */}
          {showForm && (
            <div className="form-card-container">
              <div className="form-card">
                <div className="form-header">
                  <h3>{editingId ? "✏️ Edit Task" : "✨ Create New Task"}</h3>
                  <p>{editingId ? "Modify task attributes and save changes." : "Fill in the details below to add a new task."}</p>
                </div>

                <form onSubmit={handleSubmit} className="task-form">
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label htmlFor="task-title">Title *</label>
                      <input
                        id="task-title"
                        type="text"
                        placeholder="e.g. Implement user authentication..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="task-desc">Description</label>
                      <textarea
                        id="task-desc"
                        rows={3}
                        placeholder="Add additional details, links, or notes..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="task-status">Status</label>
                      <select
                        id="task-status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                      >
                        <option value="Todo">📝 Todo</option>
                        <option value="In Progress">🔄 In Progress</option>
                        <option value="Done">✅ Done</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="task-priority">Priority</label>
                      <select
                        id="task-priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                      >
                        <option value="Low">🟢 Low</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="High">🔴 High</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="task-due">Due Date</label>
                      <input
                        id="task-due"
                        type="date"
                        min={!editingId ? getTodayString() : undefined}
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? "Saving..." : editingId ? "Update Task" : "Save Task"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        resetForm();
                        setShowForm(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* ================= SEARCH & FILTERS BAR ================= */}
        <section className="filters-section">
          <div className="filters-card">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search tasks by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="clear-search-btn" onClick={() => setSearch("")}>
                  ✕
                </button>
              )}
            </div>

            <div className="filter-controls">
              <div className="select-wrapper">
                <label>Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div className="select-wrapper">
                <label>Priority:</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="select-wrapper">
                <label>Sort By:</label>
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="dueSoon">Due Soonest</option>
                  <option value="priority">Highest Priority</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button className="btn-reset-filters" onClick={resetFilters}>
                  ↺ Reset
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ================= TASK LIST SECTION ================= */}
        <section className="task-list-section">
          <div className="list-meta-header">
            <span className="results-count">
              Showing <strong>{tasks.length}</strong> of <strong>{totalTasks}</strong> task(s)
            </span>

            <div className="page-size-selector">
              <label>Show:</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
              </select>
            </div>
          </div>

          {/* LOADING STATE */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your tasks...</p>
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && tasks.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-icon">📭</div>
              <h3>No tasks found</h3>
              <p>
                {hasActiveFilters
                  ? "No tasks match the active filters or search term."
                  : "You haven't created any tasks yet. Get started by adding one!"}
              </p>
              {hasActiveFilters ? (
                <button className="btn-secondary" onClick={resetFilters}>
                  Clear Filters
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  ➕ Create First Task
                </button>
              )}
            </div>
          )}

          {/* TASK ITEMS */}
          {!loading && tasks.length > 0 && (
            <div className="tasks-container">
              {tasks.map((task) => {
                const overdue = isOverdue(task);
                const isCompleted = task.status === "Done";

                return (
                  <div
                    key={task._id}
                    className={`task-item-card ${isCompleted ? "task-completed" : ""} ${
                      overdue ? "task-overdue" : ""
                    }`}
                  >
                    <div className="task-main">
                      <div className="task-top-bar">
                        <div className="task-badges">
                          <span className={`badge-status status-${task.status.toLowerCase().replace(/\s+/g, "-")}`}>
                            {task.status}
                          </span>
                          <span className={`badge-priority priority-${task.priority.toLowerCase()}`}>
                            {task.priority} Priority
                          </span>
                          {overdue && <span className="badge-overdue">⚠️ Overdue</span>}
                        </div>

                        {task.dueDate && (
                          <div className={`task-due-info ${overdue ? "due-overdue" : ""}`}>
                            📅 <span>Due: {formatDate(task.dueDate)}</span>
                          </div>
                        )}
                      </div>

                      <h4 className="task-title">{task.title}</h4>

                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}

                      <div className="task-footer-meta">
                        <span>Created: {formatDate(task.createdAt)}</span>
                      </div>
                    </div>

                    <div className="task-actions-col">
                      {isCompleted ? (
                        <button
                          className="btn-action btn-mark-todo"
                          onClick={() => handleQuickStatusChange(task, "Todo")}
                          title="Mark as Todo"
                        >
                          ↺ Todo
                        </button>
                      ) : (
                        <button
                          className="btn-action btn-mark-done"
                          onClick={() => handleQuickStatusChange(task, "Done")}
                          title="Mark as Done"
                        >
                          ✓ Done
                        </button>
                      )}

                      {task.status !== "In Progress" && !isCompleted && (
                        <button
                          className="btn-action btn-mark-in-prog"
                          onClick={() => handleQuickStatusChange(task, "In Progress")}
                          title="Mark as In Progress"
                        >
                          ▶ In Prog
                        </button>
                      )}

                      <button
                        className="btn-action btn-edit"
                        onClick={() => handleEdit(task)}
                        title="Edit Task"
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(task._id)}
                        title="Delete Task"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= PAGINATION CONTROLS ================= */}
          {!loading && totalPages > 1 && (
            <div className="pagination-bar">
              <button
                className="btn-page"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ‹ Previous
              </button>

              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`btn-page-number ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                className="btn-page"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next ›
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;