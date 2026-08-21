const express = require("express");

const router = express.Router();

const { Get, Post, Put, Delete } = require("../controller/category.controller");
const auth = require("../Middleware/auth");
// GET ALL
router.get("/", auth, Get);

// CREATE
router.post("/", auth, Post);

// UPDATE
router.put("/:id", auth, Put);

// DELETE
router.delete("/:id", auth, Delete);

module.exports = router;
