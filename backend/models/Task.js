const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["Todo", "In Progress", "Done"],
      default: "Todo"
    },

    dueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value) return true;

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const selectedDate = new Date(value);
          selectedDate.setHours(0, 0, 0, 0);

          return selectedDate >= today;
        },
        message: "Due date cannot be in the past."
      }
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    }
  },
  {
    timestamps: true
  }
);

// Indexes
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);