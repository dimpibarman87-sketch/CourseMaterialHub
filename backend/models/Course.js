const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    code: {
        type: String,
        required: true,
        unique: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
    }
});

module.exports = mongoose.model(
    "Course",
    courseSchema
);