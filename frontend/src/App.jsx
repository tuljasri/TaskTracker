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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(API_URL);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError(
        "Unable to load tasks. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setError("");

      if (editingId) {
        const response = await axios.put(`${API_URL}/${editingId}`, {
          title,
          description,
          dueDate,
          priority,
        });

        setTasks(
          tasks.map((task) =>
            task._id === editingId ? response.data : task
          )
        );

        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, {
          title,
          description,
          dueDate,
          priority,
        });

        setTasks([...tasks, response.data]);
      }

      clearForm();
    } catch (error) {
      console.error("Error saving task:", error);
      setError("Unable to save the task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const editTask = (task) => {
    setEditingId(task._id);
    setTitle(task.title);
    setDescription(task.description || "");
    setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : "");
    setPriority(task.priority || "Medium");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    clearForm();
  };

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("Medium");
  };

  const toggleTask = async (task) => {
    try {
      const response = await axios.put(`${API_URL}/${task._id}`, {
        completed: !task.completed,
      });

      setTasks(
        tasks.map((t) =>
          t._id === task._id ? response.data : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);

      setTasks(tasks.filter((task) => task._id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((task) => {
      if (statusFilter === "Pending") return !task.completed;
      if (statusFilter === "Completed") return task.completed;
      return true;
    })
    .filter((task) => {
      if (priorityFilter === "All") return true;
      return (task.priority || "Medium") === priorityFilter;
    });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "Newest") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }

    if (sortBy === "Oldest") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    if (sortBy === "Due Date") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
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

  const totalPages = Math.ceil(sortedTasks.length / tasksPerPage);

  const startIndex = (currentPage - 1) * tasksPerPage;

  const displayedTasks = sortedTasks.slice(
    startIndex,
    startIndex + tasksPerPage
  );

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter(
    (task) => (task.priority || "Medium") === "High"
  ).length;

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
      <header className="header">
        <h1>Task Tracker</h1>
        <p>Organize your tasks and stay productive.</p>

        <button
          className="theme-btn"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      <section className="form-card">
        <h2>{editingId ? "Edit Task" : "Add New Task"}</h2>

        <form onSubmit={handleSubmit} className="task-form">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <textarea
            placeholder="Task description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
          />

          <label>Due Date</label>

          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <label>Priority</label>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
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

      <section className="tasks-section">
        <div className="section-header">
          <h2>My Tasks</h2>
          <span>{filteredTasks.length} task(s)</span>
        </div>

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
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={handlePriorityChange}
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Due Date">Due Date</option>
            <option value="Priority">Priority</option>
          </select>
        </div>

        {loading && (
          <div className="loading-message">
            Loading tasks...
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {!loading && !error && filteredTasks.length === 0 && (
          <div className="empty-state">
            <h3>No tasks found</h3>
            <p>Add a task or change your search/filter.</p>
          </div>
        )}

        {!loading && !error && displayedTasks.length > 0 && (
          <>
            <div className="task-list">
              {displayedTasks.map((task) => (
                <div
                  className={`task-card ${
                    task.completed ? "completed" : ""
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
                      {task.description || "No description"}
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
                        task.priority || "Medium"
                      ).toLowerCase()}`}
                    >
                      Priority: {task.priority || "Medium"}
                    </p>
                  </div>

                  <div className="task-actions">
                    <button
                      className="complete-btn"
                      onClick={() => toggleTask(task)}
                    >
                      {task.completed
                        ? "Mark Pending"
                        : "Complete"}
                    </button>

                    <button
                      className="edit-btn"
                      onClick={() => editTask(task)}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteTask(task._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage(currentPage - 1)
                  }
                >
                  Previous
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage(currentPage + 1)
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