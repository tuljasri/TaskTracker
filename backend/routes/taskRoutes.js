const express = require("express");
const Task = require("../models/Task");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const task = await Task.create(req.body);

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const {
      completed,
      priority,
      sortBy,
      order,
      page = 1,
      limit = 5
    } = req.query;

    const filter = {};

    if (completed !== undefined) {
      filter.completed = completed === "true";
    }

    if (priority !== undefined) {
      filter.priority = priority;
    }

    const allowedSortFields = [
      "createdAt",
      "dueDate",
      "title",
      "priority"
    ];

    const field = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;

    const pageNumber = Math.max(parseInt(page) || 1, 1);

    const limitNumber = Math.min(
      Math.max(parseInt(limit) || 5, 1),
      50
    );

    const skip = (pageNumber - 1) * limitNumber;

    const totalTasks = await Task.countDocuments(filter);

    const tasks = await Task.find(filter)
      .sort({
        [field]: sortOrder
      })
      .skip(skip)
      .limit(limitNumber);

    const totalPages = Math.ceil(totalTasks / limitNumber);

    res.json({
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

router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;