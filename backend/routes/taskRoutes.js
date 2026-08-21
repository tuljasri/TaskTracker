const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET TASK ANALYTICS / STATS
// Must be declared before /:id route!
// =====================================================
router.get("/analytics", authMiddleware, async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats] = await Task.aggregate([
      {
        $match: { user: userId }
      },
      {
        $facet: {
          total: [{ $count: "count" }],
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 }
              }
            }
          ],
          byPriority: [
            {
              $group: {
                _id: "$priority",
                count: { $sum: 1 }
              }
            }
          ],
          overdue: [
            {
              $match: {
                status: { $ne: "Done" },
                dueDate: { $lt: today, $ne: null }
              }
            },
            { $count: "count" }
          ]
        }
      }
    ]);

    const totalTasks = stats?.total?.[0]?.count || 0;

    let todoTasks = 0;
    let inProgressTasks = 0;
    let completedTasks = 0;

    (stats?.byStatus || []).forEach((item) => {
      if (item._id === "Todo") todoTasks = item.count;
      else if (item._id === "In Progress") inProgressTasks = item.count;
      else if (item._id === "Done") completedTasks = item.count;
    });

    const pendingTasks = todoTasks + inProgressTasks;

    let lowPriorityTasks = 0;
    let mediumPriorityTasks = 0;
    let highPriorityTasks = 0;

    (stats?.byPriority || []).forEach((item) => {
      if (item._id === "Low") lowPriorityTasks = item.count;
      else if (item._id === "Medium") mediumPriorityTasks = item.count;
      else if (item._id === "High") highPriorityTasks = item.count;
    });

    const overdueTasks = stats?.overdue?.[0]?.count || 0;

    const completionPercentage =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    res.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        todoTasks,
        inProgressTasks,
        highPriorityTasks,
        mediumPriorityTasks,
        lowPriorityTasks,
        overdueTasks,
        completionPercentage
      }
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// CREATE TASK
// =====================================================
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required"
      });
    }

    const finalStatus = status || "Todo";
    if (!["Todo", "In Progress", "Done"].includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be Todo, In Progress, or Done"
      });
    }

    const finalPriority = priority || "Medium";
    if (!["Low", "Medium", "High"].includes(finalPriority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid priority. Must be Low, Medium, or High"
      });
    }

    const task = await Task.create({
      user: req.user.userId,
      title: title.trim(),
      description: description ? description.trim() : "",
      status: finalStatus,
      priority: finalPriority,
      dueDate: dueDate || undefined
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// GET ALL TASKS (PAGINATION, SEARCH, FILTERING, SORTING)
// =====================================================
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const {
      search,
      status,
      priority,
      sortBy,
      order,
      page = 1,
      limit = 5
    } = req.query;

    const filter = {
      user: req.user.userId
    };

    // Status filter
    if (status && status !== "All") {
      if (["Todo", "In Progress", "Done"].includes(status)) {
        filter.status = status;
      }
    }

    // Priority filter
    if (priority && priority !== "All") {
      if (["Low", "Medium", "High"].includes(priority)) {
        filter.priority = priority;
      }
    }

    // Search by title (case-insensitive regex)
    if (search && search.trim() !== "") {
      filter.title = { $regex: search.trim(), $options: "i" };
    }

    // Sorting
    const allowedSortFields = [
      "createdAt",
      "dueDate",
      "title",
      "priority",
      "status"
    ];

    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;

    // Pagination
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(
      Math.max(parseInt(limit, 10) || 5, 1),
      50
    );
    const skip = (pageNumber - 1) * limitNumber;

    const totalTasks = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limitNumber);

    const totalPages = Math.ceil(totalTasks / limitNumber) || 1;

    res.json({
      success: true,
      tasks,
      currentPage: pageNumber,
      totalPages,
      totalTasks,
      limit: limitNumber
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// GET SINGLE TASK
// =====================================================
router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// UPDATE TASK
// =====================================================
router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    let { title, description, status, priority, dueDate } = req.body;

    const updateData = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Task title cannot be empty"
        });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (status !== undefined) {
      const allowedStatuses = ["Todo", "In Progress", "Done"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be Todo, In Progress, or Done"
        });
      }
      updateData.status = status;
    }

    if (priority !== undefined) {
      const allowedPriorities = ["Low", "Medium", "High"];
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid priority. Must be Low, Medium, or High"
        });
      }
      updateData.priority = priority;
    }

    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId
      },
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      task
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// DELETE TASK
// =====================================================
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;