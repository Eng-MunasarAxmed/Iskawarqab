const express = require("express");
const router = express.Router();
const { Get, Post, Put } = require("../controller/transection.controller");
const auth = require("../Middleware/auth");

router.get("/", auth, Get);
router.post("/", auth, Post);
router.put("/:id", auth, Put);

module.exports = router;
