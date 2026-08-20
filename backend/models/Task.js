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

        completed: {
            type: Boolean,
            default: false
        },

        dueDate: {
            type: Date
        },

        priority: {
            type:String,
            enum:["Low","Medium","High"],
            default:"Medium"
        }
    },
    {
        timestamps: true
    }
);

taskSchema.index({ completed: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);