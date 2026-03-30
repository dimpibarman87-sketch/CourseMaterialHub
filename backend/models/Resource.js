const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true
    },

    description: String,

    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true
    },

    fileUrl: {
        type: String,
        required: true
    },

    publicId: {
        type: String,
        required: true
    },

    format: {               
        type: String,
        required: true
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

},
{ timestamps: true }
);

module.exports =
    mongoose.model("Resource", resourceSchema);