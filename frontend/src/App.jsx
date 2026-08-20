import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api/tasks";

function App() {
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;

  const [darkMode, setDarkMode] = useState(false);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL);

      // Supports both:
      // 1. Old backend: response.data = [...]
      // 2. New backend: response.data = { tasks: [...] }
      const taskData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.tasks)
          ? response.data.tasks
          : [];

      setTasks(taskData);
    } catch (error) {
      console.error("Error fetching tasks:", error);

      setError(
        "Unable to load tasks. Please make sure the backend is running."
      );

      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Create or update task
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || undefined,
        priority,
      };

      if (editingId) {
        const response = await axios.put(
          `${API_URL}/${editingId}`,
          taskData
        );

        setTasks((previousTasks) =>
          previousTasks.map((task) =>
            task._id === editingId ? response.data : task
          )
        );

        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, taskData);

        setTasks((previousTasks) => [
          ...previousTasks,
          response.data,
        ]);
      }

      clearForm();
      setCurrentPage(1);
    } catch (error) {
      console.error("Error saving task:", error);

      setError(
        error.response?.data?.message ||
          "Unable to save the task. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Edit task
  const editTask = (task) => {
    setEditingId(task._id);
    setTitle(task.title || "");
    setDescription(task.description || "");

    setDueDate(
      task.dueDate
        ? new Date(task.dueDate).toISOString().substring(0, 10)
        : ""
    );

    setPriority(task.priority || "Medium");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    clearForm();
  };

  // Clear form
  const clearForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
  };

  // Toggle completed/pending
  const toggleTask = async (task) => {
    try {
      setError("");

      const response = await axios.put(`${API_URL}/${task._id}`, {
        completed: !task.completed,
      });

      setTasks((previousTasks) =>
        previousTasks.map((t) =>
          t._id === task._id ? response.data : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);

      setError("Unable to update the task.");
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      setError("");

      await axios.delete(`${API_URL}/${id}`);

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task._id !== id)
      );

      // Prevent being stuck on an empty page
      setCurrentPage((page) => Math.max(page - 1, 1));
    } catch (error) {
      console.error("Error deleting task:", error);

      setError("Unable to delete the task.");
    }
  };

  // Fetch tasks when application loads
  useEffect(() => {
    fetchTasks();
  }, []);

  // Search + filters
  const filteredTasks = tasks
    .filter((task) => {
      const titleText = (task.title || "").toLowerCase();
      const descriptionText = (
        task.description || ""
      ).toLowerCase();

      const search = searchTerm.toLowerCase();

      return (
        titleText.includes(search) ||
        descriptionText.includes(search)
      );
    })
    .filter((task) => {
      if (statusFilter === "Pending") {
        return !task.completed;
      }

      if (statusFilter === "Completed") {
        return task.completed;
      }

      return true;
    })
    .filter((task) => {
      if (priorityFilter === "All") {
        return true;
      }

      return (task.priority || "Medium") === priorityFilter;
    });

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "Newest") {
      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    }

    if (sortBy === "Oldest") {
      return (
        new Date(a.createdAt || 0) -
        new Date(b.createdAt || 0)
      );
    }

    if (sortBy === "Due Date") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return (
        new Date(a.dueDate) -
        new Date(b.dueDate)
      );
    }

    if (sortBy === "Priority") {
      const priorityOrder = {
        High: 1,
        Medium: 2,
        Low: 3,
      };

      return (
        (priorityOrder[a.priority || "Medium"] || 2) -
        (priorityOrder[b.priority || "Medium"] || 2)
      );
    }

    return 0;
  });

  // Pagination
  const totalPages = Math.max(
    Math.ceil(sortedTasks.length / tasksPerPage),
    1
  );

  // Keep current page valid
  const safeCurrentPage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safeCurrentPage - 1) * tasksPerPage;

  const displayedTasks = sortedTasks.slice(
    startIndex,
    startIndex + tasksPerPage
  );

  // Analytics
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks =
    totalTasks - completedTasks;

  const highPriorityTasks = tasks.filter(
    (task) =>
      (task.priority || "Medium") === "High"
  ).length;

  // Search/filter/sort handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePriorityChange = (e) => {
    setPriorityFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className={`app ${darkMode ? "dark-mode" : ""}`}>
      {/* Header */}
      <header className="header">
        <h1>Task Tracker</h1>

        <p>
          Organize your tasks and stay productive.
        </p>

        <button
          className="theme-btn"
          onClick={() => setDarkMode((mode) => !mode)}
        >
          {darkMode
            ? "☀️ Light Mode"
            : "🌙 Dark Mode"}
        </button>
      </header>

      {/* Add/Edit Task */}
      <section className="form-card">
        <h2>
          {editingId
            ? "Edit Task"
            : "Add New Task"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="task-form"
        >
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
          />

          <textarea
            placeholder="Task description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows="3"
          />

          <label>Due Date</label>

          <input
            type="date"
            value={dueDate}
            onChange={(e) =>
              setDueDate(e.target.value)
            }
          />

          <label>Priority</label>

          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value)
            }
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <div className="form-buttons">
            <button
              type="submit"
              className="primary-btn"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingId
                  ? "Update Task"
                  : "Add Task"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={cancelEdit}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Analytics */}
      <section className="analytics-section">
        <div className="section-header">
          <h2>Analytics</h2>
        </div>

        <div className="analytics-cards">
          <div className="analytics-card">
            <h3>Total Tasks</h3>
            <p>{totalTasks}</p>
          </div>

          <div className="analytics-card">
            <h3>Completed</h3>
            <p>{completedTasks}</p>
          </div>

          <div className="analytics-card">
            <h3>Pending</h3>
            <p>{pendingTasks}</p>
          </div>

          <div className="analytics-card">
            <h3>High Priority</h3>
            <p>{highPriorityTasks}</p>
          </div>
        </div>
      </section>

      {/* Tasks */}
      <section className="tasks-section">
        <div className="section-header">
          <h2>My Tasks</h2>

          <span>
            {filteredTasks.length} task(s)
          </span>
        </div>

        {/* Search and Filters */}
        <div className="search-filters">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={handleSearchChange}
          />

          <select
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="All">
              All Status
            </option>
            <option value="Pending">
              Pending
            </option>
            <option value="Completed">
              Completed
            </option>
          </select>

          <select
            value={priorityFilter}
            onChange={handlePriorityChange}
          >
            <option value="All">
              All Priority
            </option>
            <option value="High">High</option>
            <option value="Medium">
              Medium
            </option>
            <option value="Low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="Newest">
              Newest
            </option>
            <option value="Oldest">
              Oldest
            </option>
            <option value="Due Date">
              Due Date
            </option>
            <option value="Priority">
              Priority
            </option>
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="loading-message">
            Loading tasks...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading &&
          !error &&
          filteredTasks.length === 0 && (
            <div className="empty-state">
              <h3>No tasks found</h3>

              <p>
                Add a task or change your
                search/filter.
              </p>
            </div>
          )}

        {/* Task list */}
        {!loading &&
          !error &&
          displayedTasks.length > 0 && (
            <>
              <div className="task-list">
                {displayedTasks.map((task) => (
                  <div
                    className={`task-card ${
                      task.completed
                        ? "completed"
                        : ""
                    }`}
                    key={task._id}
                  >
                    <div className="task-content">
                      <div className="task-title-row">
                        <h3>{task.title}</h3>

                        <span
                          className={`status ${
                            task.completed
                              ? "status-completed"
                              : "status-pending"
                          }`}
                        >
                          {task.completed
                            ? "Completed"
                            : "Pending"}
                        </span>
                      </div>

                      <p className="description">
                        {task.description ||
                          "No description"}
                      </p>

                      <p className="due-date">
                        📅{" "}
                        {task.dueDate
                          ? new Date(
                              task.dueDate
                            ).toLocaleDateString()
                          : "No due date"}
                      </p>

                      <p
                        className={`priority priority-${(
                          task.priority ||
                          "Medium"
                        ).toLowerCase()}`}
                      >
                        Priority:{" "}
                        {task.priority ||
                          "Medium"}
                      </p>
                    </div>

                    <div className="task-actions">
                      <button
                        className="complete-btn"
                        onClick={() =>
                          toggleTask(task)
                        }
                      >
                        {task.completed
                          ? "Mark Pending"
                          : "Complete"}
                      </button>

                      <button
                        className="edit-btn"
                        onClick={() =>
                          editTask(task)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() =>
                          deleteTask(task._id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={safeCurrentPage === 1}
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.max(page - 1, 1)
                      )
                    }
                  >
                    Previous
                  </button>

                  <span>
                    Page {safeCurrentPage} of{" "}
                    {totalPages}
                  </span>

                  <button
                    disabled={
                      safeCurrentPage ===
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        (page) =>
                          Math.min(
                            page + 1,
                            totalPages
                          )
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
      </section>
    </div>
  );
}

export default App;