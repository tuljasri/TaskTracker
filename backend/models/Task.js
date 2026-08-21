const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must belong to a user"]
    },

    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    status: {
      type: String,
      enum: ["Todo", "In Progress", "Done"],
      default: "Todo"
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    },

    dueDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value) return true;
          // Validate only for newly assigned or modified due dates
          if (this.isNew || (typeof this.isModified === "function" && this.isModified("dueDate"))) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const selectedDate = new Date(value);
            selectedDate.setHours(0, 0, 0, 0);

            return selectedDate >= today;
          }
          return true;
        },
        message: "Due date cannot be in the past."
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimized query and filtering performance per user
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, priority: 1 });
taskSchema.index({ user: 1, dueDate: 1 });
taskSchema.index({ user: 1, title: 1 });

module.exports = mongoose.model("Task", taskSchema);