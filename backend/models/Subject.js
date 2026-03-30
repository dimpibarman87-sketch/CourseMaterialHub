const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true
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

module.exports =
mongoose.model("Subject", subjectSchema);