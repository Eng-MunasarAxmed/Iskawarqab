require("dotenv").config();
const jwt = require("jsonwebtoken");
const express = require("express");
const router = require("./routes/user.route");
const transectionRouter = require("./routes/transection.route");
const categoryRouter = require("./routes/category.route");
const { UserModel } = require("./model/user.service");
const authRouter = require("./routes/auth.route");
const auditLogRouter = require("./routes/auditLog.route");

const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Daar CORS si uu u oggolaado Frontend-ka (Port 5173)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
require("./cron");
app.use(express.json());

const mongoose = require("mongoose");

mongoose
  .connect(process.env.DATABASE)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });

// 2. Routes-ka saxda ah (Mid walba meeshiisa ayuu ku jiraa)
app.use("/api/users", router);
app.use("/api/transections", transectionRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/auth", authRouter);
app.use("/api/auditlogs", auditLogRouter);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
