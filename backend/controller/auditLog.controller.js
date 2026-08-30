const mongoose = require("mongoose");
const AuditLog = require("../model/AuditLog.service");

// =====================================================
// GET ALL AUDIT LOGS
// =====================================================

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
    // PAGINATION PARAMS
    // =================================================
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const search = String(req.query.search || "").trim();

    // =================================================
    // SEARCH FILTER (optional — action ama description)
    // =================================================
    const filter = search
      ? {
          $or: [
            { action: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // =================================================
    // TOTAL COUNT (for pagination)
    // =================================================
    const total = await AuditLog.countDocuments(filter);

    // =================================================
    // GET LOGS (paginated)
    // =================================================
    const logs = await AuditLog.find(filter)
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
      .skip(skip)
      .limit(limit)
      .lean();

    // =================================================
    // RESPONSE
    // =================================================
    return res.status(200).json({
      status: true,
      count: logs.length,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
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
// EXPORT
// =====================================================

module.exports = {
  getAuditLogs,
  getAuditLogById,
};
