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
    origin: [
      "http://localhost:5173",
      "https://iskawarqab.netlify.app",
      "https://iskawarqab-swart.vercel.app",
    ],
    credentials: true,
  }),
);
require("./cron");
app.use(express.json());

const mongoose = require("mongoose");
const auth = require("./Middleware/auth");
console.log("DATABASE exists:", !!process.env.DATABASE);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.DATABASE, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongoose) => {
        console.log("Connected to MongoDB Atlas");
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

connectDB().catch((error) => {
  console.error("Error connecting to MongoDB:", error.message);
});

// Ku dar tan si aad u hubiso in connection-ku uu si joogto ah u shaqeeyo
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected, will retry on next request");
});

// 2. Routes-ka saxda ah (Mid walba meeshiisa ayuu ku jiraa)
app.use("/api/users", router);
app.use("/api/transections", transectionRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/auth", authRouter);
app.use("/api/auditlogs", auditLogRouter);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
