const express = require("express");

const router = express.Router();

const {
  Get,
  UpdateProfile,
  GetProfile,
  Post,
  Put,
  Delete,
  GETDELETE,
  restoreAll,
  restoreById,
  cancelUser,
  approveUser,
  toggleUserStatus,
  getRolePermissions,
} = require("../controller/user.controller");

const auth = require("../Middleware/auth");

const { adminOnly, userOrAdmin } = require("../Middleware/role");

// =====================================================
// PROFILE
// USER + ADMIN
// =====================================================

router.get("/profile", auth, userOrAdmin, GetProfile);

router.put("/profile", auth, userOrAdmin, UpdateProfile);

// =====================================================
// USERS
// ADMIN ONLY
// =====================================================

router.get("/", auth, adminOnly, Get);

router.get("/recyle-bin", auth, adminOnly, GETDELETE);

// =====================================================
// REGISTER
// PUBLIC
// =====================================================

router.post("/register", Post);

// =====================================================
// APPROVE / CANCEL
// ADMIN ONLY
// =====================================================

router.put("/:id/approve", auth, adminOnly, approveUser);

router.put("/:id/cancel", auth, adminOnly, cancelUser);

// =====================================================
// UPDATE USER
// ADMIN ONLY
// =====================================================

router.put("/:id", auth, adminOnly, Put);

// =====================================================
// RESTORE
// ADMIN ONLY
// =====================================================

router.get("/restore/:id", auth, adminOnly, restoreById);

router.post("/restore", auth, adminOnly, restoreAll);

// =====================================================
// STATUS
// ADMIN ONLY
// =====================================================

router.put("/:id/status", auth, adminOnly, toggleUserStatus);

// =====================================================
// DELETE
// ADMIN ONLY
// =====================================================

router.delete("/:id", auth, adminOnly, Delete);

module.exports = router;
