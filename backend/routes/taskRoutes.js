const express = require("express");
const Task = require("../models/Task");

const router = express.Router();


// =====================================================
// CREATE TASK
// =====================================================
// =====================================================
// CREATE TASK
// =====================================================
router.post("/", async (req, res, next) => {
  try {
    console.log("RECEIVED FROM FRONTEND:", req.body);

    const {
      title,
      description,
      status,
      priority,
      dueDate
    } = req.body;

    // Keep the status sent by frontend
    const finalStatus = status || "Todo";

    // Validate status
    if (!["Todo", "In Progress", "Done"].includes(finalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const task = await Task.create({
      title,
      description,
      status: finalStatus,
      priority,
      dueDate: dueDate || undefined
    });

    console.log("SAVED TO DATABASE:", task);

    res.status(201).json(task);

  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    next(error);
  }
});


// =====================================================
// GET ALL TASKS
// FILTERING + SORTING + PAGINATION
// =====================================================
router.get("/", async (req, res, next) => {
  try {

    const {
      status,
      priority,
      sortBy,
      order,
      page = 1,
      limit = 5
    } = req.query;

    const filter = {};


    // STATUS FILTER
    if (status && status !== "All") {

      if (status === "Todo") {
        filter.status = "Todo";
      }

      else if (status === "In Progress") {
        filter.status = "In Progress";
      }

      else if (status === "Done") {
        filter.status = "Done";
      }
    }


    // PRIORITY FILTER
    if (priority && priority !== "All") {
      filter.priority = priority;
    }


    // SORTING
    const allowedSortFields = [
      "createdAt",
      "dueDate",
      "title",
      "priority",
      "status"
    ];

    const field = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const sortOrder = order === "asc" ? 1 : -1;


    // PAGINATION
    const pageNumber = Math.max(
      parseInt(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(parseInt(limit) || 5, 1),
      50
    );

    const skip =
      (pageNumber - 1) * limitNumber;


    // COUNT
    const totalTasks =
      await Task.countDocuments(filter);


    // FETCH TASKS
    const tasks = await Task.find(filter)
      .sort({
        [field]: sortOrder
      })
      .skip(skip)
      .limit(limitNumber);


    // TOTAL PAGES
    const totalPages =
      Math.ceil(totalTasks / limitNumber);


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


// =====================================================
// GET SINGLE TASK
// =====================================================
router.get("/:id", async (req, res, next) => {
  try {

    const task =
      await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    res.json(task);

  } catch (error) {
    next(error);
  }
});


// =====================================================
// UPDATE TASK
// =====================================================
router.put("/:id", async (req, res, next) => {
  try {

    let {
      title,
      description,
      status,
      priority,
      dueDate
    } = req.body;


    // Normalize status
    if (status) {

      if (
        status === "In-Progress" ||
        status === "in-progress" ||
        status === "in progress"
      ) {
        status = "In Progress";
      }

      if (
        status === "todo" ||
        status === "TODO"
      ) {
        status = "Todo";
      }

      if (
        status === "done" ||
        status === "DONE"
      ) {
        status = "Done";
      }


      const allowedStatuses = [
        "Todo",
        "In Progress",
        "Done"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid status. Use Todo, In Progress, or Done."
        });
      }
    }


    const updateData = {};

    if (title !== undefined)
      updateData.title = title;

    if (description !== undefined)
      updateData.description = description;

    if (status !== undefined)
      updateData.status = status;

    if (priority !== undefined)
      updateData.priority = priority;

    if (dueDate !== undefined)
      updateData.dueDate = dueDate;


    const task =
      await Task.findByIdAndUpdate(
        req.params.id,
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


    res.json(task);

  } catch (error) {
    next(error);
  }
});


// =====================================================
// DELETE TASK
// =====================================================
router.delete("/:id", async (req, res, next) => {
  try {

    const task =
      await Task.findByIdAndDelete(
        req.params.id
      );

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