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

      const taskData = {
        title,
        description,
        dueDate,
        priority
      };

      if (editingId) {
        const response = await axios.put(
          `${API_URL}/${editingId}`,
          taskData
        );

        await new Promise((resolve) => setTimeout(resolve, 800));

        setTasks(
          tasks.map((task) =>
            task._id === editingId ? response.data : task
          )
        );

        setEditingId(null);
      } else {
        const response = await axios.post(API_URL, taskData);

        await new Promise((resolve) => setTimeout(resolve, 800));

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
      behavior: "smooth"
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
        completed: !task.completed
      });

      setTasks(
        tasks.map((t) =>
          t._id === task._id ? response.data : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Unable to update the task.");
    }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);

      setTasks(tasks.filter((task) => task._id !== id));
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Unable to delete the task.");
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Completed" && task.completed) ||
      (statusFilter === "Pending" && !task.completed);

    const matchesPriority =
      priorityFilter === "All" ||
      (task.priority || "Medium") === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const pendingTasks = tasks.filter((task) => !task.completed).length;
  const highPriorityTasks = tasks.filter(
    (task) => (task.priority || "Medium") === "High"
  ).length;

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Task Tracker</h1>
        <p>Organize your tasks and stay productive.</p>
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
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

        {!loading && filteredTasks.length === 0 && !error ? (
          <div className="empty-state">
            <h3>No tasks found</h3>
            <p>
              {tasks.length === 0
                ? "Add your first task to get started."
                : "Try changing your search or filters."}
            </p>
          </div>
        ) : (
          !loading && (
            <div className="task-list">
              {filteredTasks.map((task) => (
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
          )
        )}
      </section>
    </div>
  );
}

export default App;