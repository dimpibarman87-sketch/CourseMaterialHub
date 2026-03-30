const express = require("express");
const router = express.Router();

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Resource = require("../models/Resource");
const auth = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");


const allowedTypes = [
  ".pdf",
  ".ppt",
  ".pptx",
  ".doc",
  ".docx",
  ".png",
  ".jpg",
  ".jpeg"
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, PPT, DOC and images allowed"), false);
  }
};



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});



router.post(
  "/upload",
  auth,
  (req, res, next) => {
    if (req.user.role === "teacher" || req.user.role === "admin") {
      return next();
    }
    return res.status(403).json({
      message: "Access Denied: Only teachers can upload resources."
    });
  },
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      if (!req.body.title || !req.body.title.trim()) {
        return res.status(400).json({ message: "Title is required" });
      }

      if (!req.body.subjectId) {
        return res.status(400).json({ message: "Subject is required" });
      }

      const ext = path.extname(req.file.originalname).toLowerCase();

      let resourceType = "image";

      if (
        ext === ".doc" ||
        ext === ".docx" ||
        ext === ".ppt" ||
        ext === ".pptx"
      ) {
        resourceType = "raw";
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true
      });

      fs.unlinkSync(req.file.path);

      const resource = new Resource({
        title: req.body.title,
        description: req.body.description,
        subject: req.body.subjectId,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        format: ext.replace(".", ""),
        uploadedBy: req.user.id
      });

      await resource.save();

      res.json({
        message: "Uploaded successfully",
        resource
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);



router.get("/search", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword || "";

    const query = {
      title: { $regex: keyword, $options: "i" }
    };

    const resources = await Resource.find(query)
      .populate("uploadedBy", "name")
      .populate("subject", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Resource.countDocuments(query);

    res.json({
      page,
      totalPages: Math.ceil(total / limit),
      total,
      resources
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/subject/:subjectId", async (req, res) => {
  try {
    const resources = await Resource.find({
      subject: req.params.subjectId
    })
      .populate("uploadedBy", "name")
      .populate("subject", "name")
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate("uploadedBy", "name email")
      .populate("subject", "name")
      .sort({ createdAt: -1 });

    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/download/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const downloadUrl = resource.fileUrl.replace(
      "/upload/",
      "/upload/fl_attachment/"
    );

    res.json({
      url: downloadUrl,
      title: resource.title
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("uploadedBy", "name email")
      .populate("subject", "name");

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", auth, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const isOwner =
      resource.uploadedBy &&
      resource.uploadedBy.toString() === req.user.id;

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to delete this resource"
      });
    }

    const ext = resource.format;
    const resourceType =
      ["jpg", "jpeg", "png"].includes(ext) ? "image" : "raw";

    await cloudinary.uploader.destroy(resource.publicId, {
      resource_type: resourceType
    });

    await resource.deleteOne();

    res.json({ message: "Resource deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;