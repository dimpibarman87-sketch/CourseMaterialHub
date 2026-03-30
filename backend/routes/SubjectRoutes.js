const express = require("express");
const router = express.Router();

const Subject = require("../models/Subject");

const auth = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const roleCheck = require("../middleware/roleMiddleware");


router.post("/", auth, roleCheck(["admin", "teacher"]), async (req, res) => {

    try {

        const subject = new Subject({

            name: req.body.name,

            code: req.body.code,

            course: req.body.courseId,

            createdBy: req.user.id

        });

        await subject.save();

        res.json(subject);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


router.get("/course/:courseId", async (req, res) => {

    try {

        const subjects =
            await Subject.find({
                course: req.params.courseId
            }).populate("course");

        res.json(subjects);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

router.get("/", async (req, res) => {

    try {

        const subjects = await Subject.find()
            .populate("course", "name code");

        res.json(subjects);

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


router.delete("/:id", auth, roleCheck(["admin", "teacher"]), async (req, res) => {

    try {

        const subject = await Subject.findById(req.params.id);

        if (!subject) {
            return res.status(404).json({
                message: "Subject not found"
            });
        }

        await subject.deleteOne();

        res.json({
            message: "Subject deleted successfully"
        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});


module.exports = router;