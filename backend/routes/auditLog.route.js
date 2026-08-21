const express = require("express");

const router = express.Router();

const {
  getAuditLogs,
  getAuditLogById,
} = require("../controller/auditLog.controller");

const auth = require("../Middleware/auth");

// =====================================================
// GET ALL AUDIT LOGS
// =====================================================

router.get("/", auth, getAuditLogs);

// =====================================================
// GET ONE AUDIT LOG
// =====================================================

router.get("/:id", auth, getAuditLogById);

module.exports = router;
