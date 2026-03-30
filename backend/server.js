require("dotenv").config();
const cookieParser = require("cookie-parser");
const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");

const app = express();

connectDB();

app.use(express.json());
app.use(cookieParser()); 

app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: "http://127.0.0.1:3000", 
    credentials: true 
}));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/resources", require("./routes/resourceRoutes"));
app.use("/api/subjects", require("./routes/SubjectRoutes"));
app.use("/api/courses", require("./routes/courseRoutes")); 

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
);