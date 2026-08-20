import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState([]);

  // Form data
  const [title, setTitle] = useState(""); //to remember what user types
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Get all tasks
  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Create a new task
  const createTask = async (e) => {
    e.preventDefault();

    //sends data fromdata to backend 
    try {
      const response = await axios.post(
        "http://localhost:5000/api/tasks",
        {
          title,
          description,
          dueDate,
        }
      );

      // Add the newly created task to the list
      setTasks([...tasks, response.data]);

      // Clear the form
      setTitle("");
      setDescription("");
      setDueDate("");
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div>
      <h1>Task Tracker</h1>

      {/* Create Task Form */}
      <form onSubmit={createTask}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <button type="submit">Add Task</button>
      </form>

      {/* Display Tasks */}
      {tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        tasks.map((task) => (
          <div key={task._id}>
            <h2>{task.title}</h2>
            <p>{task.description}</p>
            <p>
              Status: {task.completed ? "Completed" : "Pending"}
            </p>
            <p>Due Date: {task.dueDate}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default App;