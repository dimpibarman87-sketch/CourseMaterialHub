const express = require("express");

const router = express.Router();

const Course = require("../models/Course");
const Subject = require("../models/Subject");


const auth = require("../middleware/authMiddleware");

const admin = require("../middleware/adminMiddleware");
const roleCheck = require("../middleware/roleMiddleware");


router.post("/", auth, roleCheck(["admin", "teacher"]), async (req, res) => {

    try {

        const course = new Course({
            name: req.body.name,
            code: req.body.code,
            createdBy: req.user.id
        });

        await course.save();

        res.json(course);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});



router.get("/", async (req, res) => {

    const courses = await Course.find();

    res.json(courses);

});


router.delete("/:id", auth, roleCheck(["admin", "teacher"]), async (req, res) => {

    try {

        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                message: "Course not found"
            });
        }

        await Subject.deleteMany({ course: req.params.id });

        await course.deleteOne();

        res.json({
            message: "Course and its subjects deleted successfully"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;