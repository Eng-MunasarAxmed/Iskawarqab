const mongoose = require("mongoose");
const AuditLog = require("../model/AuditLog.service");

// =====================================================
// GET ALL AUDIT LOGS
// =====================================================

const getAuditLogs = async (req, res) => {
  try {
    // =================================================
    // ADMIN ONLY
    // =================================================

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin only.",
      });
    }

    // =================================================
    // GET LOGS
    // =================================================

    const logs = await AuditLog.find()
      .populate({
        path: "user",
        select:
          "_id userId fullname email role status accountStatus createdAt updatedAt",
      })
      .populate({
        path: "performedBy",
        select: "_id userId fullname email role status accountStatus",
      })
      .sort({ createdAt: -1 })
      .lean();

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      status: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("GET AUDIT LOGS ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch audit logs.",
      error: error.message,
    });
  }
};

// =====================================================
// GET ONE AUDIT LOG
// =====================================================

const getAuditLogById = async (req, res) => {
  try {
    // =================================================
    // ADMIN ONLY
    // =================================================

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin only.",
      });
    }

    // =================================================
    // CHECK ID
    // =================================================

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid audit log ID.",
      });
    }

    // =================================================
    // FIND LOG
    // =================================================

    const log = await AuditLog.findById(req.params.id)
      .populate({
        path: "user",
        select:
          "_id userId fullname email role status accountStatus createdAt updatedAt",
      })
      .populate({
        path: "performedBy",
        select: "_id userId fullname email role status accountStatus",
      })
      .lean();

    // =================================================
    // NOT FOUND
    // =================================================

    if (!log) {
      return res.status(404).json({
        status: false,
        message: "Audit log not found.",
      });
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      status: true,
      data: log,
    });
  } catch (error) {
    console.error("GET AUDIT LOG BY ID ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch audit log.",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
