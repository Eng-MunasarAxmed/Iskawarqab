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
  approveUser,
  cancelUser,
  deleteUser,
  toggleUserStatus,
} = require("../controller/user.controller");

const auth = require("../Middleware/auth");

const {
  Login,
  Register,
  getRolePermissions,
} = require("../controller/auth.controller");

const { adminOnly, userOrAdmin } = require("../Middleware/role");

// =====================================================
// AUTH
// =====================================================

router.post("/login", Login);

router.post("/register", Register);

// =====================================================
// PROFILE
// =====================================================

router.get("/profile", auth, GetProfile);

router.put("/profile", auth, UpdateProfile);

// =====================================================
// ROLE & PERMISSIONS
// =====================================================

router.get("/permissions", auth, getRolePermissions);

// =====================================================
// USERS
// =====================================================

// Get all users
router.get("/", auth, Get);

// Recycle Bin
router.get("/recyle-bin", auth, GETDELETE);

// =====================================================
// CREATE USER
// =====================================================

router.post("/", auth, Post);

// =====================================================
// APPROVE / CANCEL
// =====================================================

router.put("/:id/approve", auth, approveUser);

router.put("/:id/cancel", auth, cancelUser);

router.put("/:id/toggle-status", auth, toggleUserStatus);

// =====================================================
// UPDATE USER
// =====================================================

router.put("/:id", auth, Put);

// =====================================================
// RESTORE
// =====================================================

router.get("/restore/:id", auth, restoreById);

router.post("/restore", auth, restoreAll);

// =====================================================
// ACTIVATE / DEACTIVATE
// =====================================================

router.put("/:id/toggle-status", auth, toggleUserStatus);

// =====================================================
// DELETE
// =====================================================

router.delete("/users/:id", auth, deleteUser);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;
