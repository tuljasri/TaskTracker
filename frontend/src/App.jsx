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

  // Stores the ID of the task currently being edited
  const [editingId, setEditingId] = useState(null);

  // Stores the ID of the task currently being updated
  const [updatingId, setUpdatingId] = useState(null);

  // Stores the ID of the task currently being deleted
  const [deletingId, setDeletingId] = useState(null);

  // Get all tasks
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

  // Create or update a task
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setError("");

      if (editingId) {
        // Update existing task
        const response = await axios.put(`${API_URL}/${editingId}`, {
          title,
          description,
          dueDate,
        });

        // Keep "Saving..." visible briefly
        await new Promise((resolve) => setTimeout(resolve, 800));

        setTasks(
          tasks.map((task) =>
            task._id === editingId ? response.data : task
          )
        );

        setEditingId(null);
      } else {
        // Create new task
        const response = await axios.post(API_URL, {
          title,
          description,
          dueDate,
        });

        // Keep "Saving..." visible briefly
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

  // Put task data into the form for editing
  const editTask = (task) => {
    setEditingId(task._id);
    setTitle(task.title);
    setDescription(task.description);
    setDueDate(
      task.dueDate ? task.dueDate.substring(0, 10) : ""
    );

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
  };

  // Toggle task status
  const toggleTask = async (task) => {
    if (updatingId || deletingId) return;

    try {
      setUpdatingId(task._id);
      setError("");

      const response = await axios.put(`${API_URL}/${task._id}`, {
        completed: !task.completed,
      });

      // Keep feedback visible briefly
      await new Promise((resolve) => setTimeout(resolve, 800));

      setTasks(
        tasks.map((t) =>
          t._id === task._id ? response.data : t
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Unable to update the task. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    if (deletingId || updatingId) return;

    try {
      setDeletingId(id);
      setError("");

      await axios.delete(`${API_URL}/${id}`);

      // Keep "Deleting..." visible briefly
      await new Promise((resolve) => setTimeout(resolve, 800));

      setTasks(
        tasks.filter((task) => task._id !== id)
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Unable to delete the task. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Task Tracker</h1>
        <p>Organize your tasks and stay productive.</p>
      </header>

      {/* Task Form */}
      <section className="form-card">
        <h2>
          {editingId ? "Edit Task" : "Add New Task"}
        </h2>

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

      {/* Tasks */}
      <section className="tasks-section">
        <div className="section-header">
          <h2>My Tasks</h2>
          <span>{tasks.length} task(s)</span>
        </div>

        {/* Loading message */}
        {loading && (
          <div className="loading-message">
            Loading tasks...
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && tasks.length === 0 && !error ? (
          <div className="empty-state">
            <h3>No tasks yet</h3>
            <p>Add your first task to get started.</p>
          </div>
        ) : (
          !loading && (
            <div className="task-list">
              {tasks.map((task) => (
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
                  </div>

                  <div className="task-actions">
                    {/* Complete / Pending */}
                    <button
                      className="complete-btn"
                      onClick={() => toggleTask(task)}
                      disabled={
                        updatingId === task._id ||
                        deletingId !== null
                      }
                    >
                      {updatingId === task._id
                        ? "Updating..."
                        : task.completed
                          ? "Mark Pending"
                          : "Complete"}
                    </button>

                    {/* Edit */}
                    <button
                      className="edit-btn"
                      onClick={() => editTask(task)}
                      disabled={
                        updatingId !== null ||
                        deletingId !== null
                      }
                    >
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      className="delete-btn"
                      onClick={() => deleteTask(task._id)}
                      disabled={
                        deletingId === task._id ||
                        updatingId !== null
                      }
                    >
                      {deletingId === task._id
                        ? "Deleting..."
                        : "Delete"}
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