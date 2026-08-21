import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/tasks";

function App() {
  // =============================
  // STATE
  // =============================
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [darkMode, setDarkMode] = useState(false);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Todo");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  // Edit
  const [editingId, setEditingId] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);


  const LIMIT = 5;

  // =============================
  // GET TASK STATUS
  // =============================
  const getTaskStatus = (task) => {
    if (task.status === "Todo") return "Todo";
    if (task.status === "In Progress") return "In Progress";
    if (task.status === "Done") return "Done";

    // Support older tasks
    if (task.completed === true) return "Done";

    return "Todo";
  };

  // =============================
  // FETCH PAGINATED TASKS
  // =============================
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      if (priorityFilter) {
        params.append("priority", priorityFilter);
      }

      params.append("sortBy", sortBy);
      params.append("order", order);
      params.append("page", currentPage);
      params.append("limit", LIMIT);

      const response = await fetch(`${API_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();

      setTasks(data.tasks || []);
      setTotalPages(data.totalPages || 1);
      setTotalTasks(data.totalTasks || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // FETCH ALL TASKS FOR ANALYTICS
  // =============================
  const fetchAllTasks = async () => {
    try {
      const response = await fetch(
        `${API_URL}?page=1&limit=50&sortBy=createdAt&order=desc`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const data = await response.json();

      setAllTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    }
  };

  // =============================
  // INITIAL FETCH
  // =============================
  useEffect(() => {
    fetchTasks();
    fetchAllTasks();
  }, [currentPage, statusFilter, priorityFilter, sortBy, order]);

  // =============================
  // SEARCH
  // =============================
  const displayedTasks = tasks.filter((task) =>
    task.title?.toLowerCase().includes(search.toLowerCase())
  );

  // =============================
  // ANALYTICS
  // =============================
  const totalCount = allTasks.length;

  const todoCount = allTasks.filter(
    (task) => getTaskStatus(task) === "Todo"
  ).length;

  const inProgressCount = allTasks.filter(
    (task) => getTaskStatus(task) === "In Progress"
  ).length;

  const doneCount = allTasks.filter(
    (task) => getTaskStatus(task) === "Done"
  ).length;

  const highPriorityCount = allTasks.filter(
    (task) => task.priority === "High"
  ).length;

  const completionPercentage =
    totalCount === 0
      ? 0
      : Math.round((doneCount / totalCount) * 100);

  // =============================
  // TODAY'S DATE
  // =============================
  const getTodayString = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =============================
  // ADD / UPDATE TASK
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    if (dueDate && dueDate < getTodayString()) {
      setError("Due date cannot be in the past.");
      return;
    }

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status: status,
      priority: priority,
      dueDate: dueDate || undefined,
    };

    console.log("SENDING TASK:", taskData);

    try {
      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong."
        );
      }

      resetForm();

      await fetchTasks();
      await fetchAllTasks();
    } catch (err) {
      setError(err.message);
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

    setStatus(getTaskStatus(task));
    setPriority(task.priority || "Medium");

    if (task.dueDate) {
      setDueDate(task.dueDate.substring(0, 10));
    } else {
      setDueDate("");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =============================
  // DELETE TASK
  // =============================
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete task."
        );
      }

      if (tasks.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        await fetchTasks();
      }

      await fetchAllTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // =============================
  // CHANGE STATUS
  // =============================
  const handleStatusChange = async (task, newStatus) => {
    try {
      setError("");

      const response = await fetch(
        `${API_URL}/${task._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description || "",
            status: newStatus,
            priority: task.priority || "Medium",
            dueDate: task.dueDate || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update status."
        );
      }

      await fetchTasks();
      await fetchAllTasks();
    } catch (err) {
      setError(err.message);
    }
  };

  // =============================
  // STATUS STYLE
  // =============================
  const getStatusStyle = (taskStatus) => {
    if (taskStatus === "Todo") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (taskStatus === "In Progress") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    return {
      background: "#dcfce7",
      color: "#166534",
    };
  };

  // =============================
  // PRIORITY CLASS
  // =============================
  const getPriorityClass = (taskPriority) => {
    if (taskPriority === "High") {
      return "priority priority-high";
    }

    if (taskPriority === "Low") {
      return "priority priority-low";
    }

    return "priority priority-medium";
  };

  // =============================
  // FORMAT DATE
  // =============================
  const formatDate = (date) => {
    if (!date) return "No due date";

    return new Date(date).toLocaleDateString();
  };

  // =============================
  // PAGINATION
  // =============================
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // =============================
  // FILTERS
  // =============================
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handlePriorityFilter = (e) => {
    setPriorityFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;

    if (value === "newest") {
      setSortBy("createdAt");
      setOrder("desc");
    }

    if (value === "oldest") {
      setSortBy("createdAt");
      setOrder("asc");
    }

    if (value === "dueSoon") {
      setSortBy("dueDate");
      setOrder("asc");
    }

    if (value === "title") {
      setSortBy("title");
      setOrder("asc");
    }

    setCurrentPage(1);
  };

  // =============================
  // RENDER
  // =============================
  return (
    <div className={darkMode ? "app dark-mode" : "app"}>

      {/* HEADER */}
      <header className="header">
        <h1>Task Tracker</h1>

        <p>
          Organize your tasks and stay productive.
        </p>

        <button
          className="theme-btn"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </header>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ADD / EDIT FORM */}
      <section className="form-card">
        <h2>
          {editingId ? "Edit Task" : "Add New Task"}
        </h2>

        <form
          className="task-form"
          onSubmit={handleSubmit}
        >

          {/* TITLE */}
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* DESCRIPTION */}
          <textarea
            placeholder="Task description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          {/* STATUS */}
          <label>Status</label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Todo">Todo</option>
            <option value="In Progress">
              In Progress
            </option>
            <option value="Done">Done</option>
          </select>

          {/* DUE DATE */}
          <label>Due Date</label>

          <input
            type="date"
            min={getTodayString()}
            value={dueDate}
            onChange={(e) =>
              setDueDate(e.target.value)
            }
          />

          {/* PRIORITY */}
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

          {/* BUTTONS */}
          <div className="form-buttons">
            <button
              type="submit"
              className="primary-btn"
            >
              {editingId ? "Update Task" : "Add Task"}
            </button>

            {editingId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ANALYTICS */}
      <section className="analytics-section">
        <h2>Analytics</h2>

        <div className="analytics-cards">

          <div className="analytics-card">
            <h3>Total Tasks</h3>
            <p>{totalCount}</p>
          </div>

          <div className="analytics-card">
            <h3>Todo</h3>
            <p>{todoCount}</p>
          </div>

          <div className="analytics-card">
            <h3>In Progress</h3>
            <p>{inProgressCount}</p>
          </div>

          <div className="analytics-card">
            <h3>Done</h3>
            <p>{doneCount}</p>
          </div>

          {/* NEW */}
          <div className="analytics-card">
            <h3>Pending</h3>
            <p>{todoCount + inProgressCount}</p>
          </div>

          <div className="analytics-card">
            <h3>High Priority</h3>
            <p>{highPriorityCount}</p>
          </div>

          <div className="analytics-card">
            <h3>Completion</h3>
            <p>{completionPercentage}%</p>
          </div>

        </div>
      </section>


      {/* TASK SECTION */}
      <section>

        <div className="section-header">
          <h2>My Tasks</h2>

          <span>
            {totalTasks} task(s)
          </span>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="search-filters">

          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <select
            value={statusFilter}
            onChange={handleStatusFilter}
          >
            <option value="">All Status</option>
            <option value="Todo">Todo</option>
            <option value="In Progress">
              In Progress
            </option>
            <option value="Done">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={handlePriorityFilter}
          >
            <option value="">All Priority</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <select
            defaultValue="newest"
            onChange={handleSortChange}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="dueSoon">
              Due Soon
            </option>
            <option value="title">
              Title A-Z
            </option>
          </select>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="loading-message">
            Loading tasks...
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          displayedTasks.length === 0 && (
            <div className="empty-state">
              <h3>No tasks found</h3>
              <p>
                Try adding a task or changing your
                filters.
              </p>
            </div>
          )}

        {/* TASK LIST */}
        {!loading &&
          displayedTasks.length > 0 && (
            <div className="task-list">

              {displayedTasks.map((task) => {
                const currentStatus =
                  getTaskStatus(task);

                return (
                  <div
                    className={
                      currentStatus === "Done"
                        ? "task-card completed"
                        : "task-card"
                    }
                    key={task._id}
                  >

                    {/* TITLE + STATUS */}
                    <div className="task-title-row">

                      <h3>{task.title}</h3>

                      <span
                        className="status"
                        style={getStatusStyle(
                          currentStatus
                        )}
                      >
                        {currentStatus}
                      </span>

                    </div>

                    {/* DESCRIPTION */}
                    {task.description && (
                      <p className="description">
                        {task.description}
                      </p>
                    )}

                    {/* DUE DATE */}
                    {task.dueDate && (
                      <p className="due-date">
                        📅 {formatDate(task.dueDate)}
                      </p>
                    )}

                    {/* PRIORITY */}
                    <p
                      className={getPriorityClass(
                        task.priority
                      )}
                    >
                      Priority: {task.priority}
                    </p>

                    {/* ACTIONS */}
                    <div className="task-actions">

                      {/* STATUS ACTION */}
                      {currentStatus !== "Done" && (
                        <button
                          className="complete-btn"
                          onClick={() =>
                            handleStatusChange(
                              task,
                              "Done"
                            )
                          }
                        >
                          Mark Done
                        </button>
                      )}

                      {currentStatus === "Done" && (
                        <button
                          className="complete-btn"
                          onClick={() =>
                            handleStatusChange(
                              task,
                              "Todo"
                            )
                          }
                        >
                          Mark Todo
                        </button>
                      )}

                      {/* EDIT */}
                      <button
                        className="edit-btn"
                        onClick={() =>
                          handleEdit(task)
                        }
                      >
                        Edit
                      </button>

                      {/* DELETE */}
                      <button
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(task._id)
                        }
                      >
                        Delete
                      </button>

                    </div>
                  </div>
                );
              })}

            </div>
          )}

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="pagination">

            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>

          </div>
        )}

      </section>
    </div>
  );
}

export default App;