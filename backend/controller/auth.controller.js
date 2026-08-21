const {
  UserModel,
  ADMIN_PERMISSIONS,
  USER_PERMISSIONS,
} = require("../model/user.service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AuditLogs = require("../model/AuditLog.service");

// =====================================================
// LOGIN
// =====================================================

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("LOGIN EMAIL:", email);
    console.log("LOGIN PASSWORD RECEIVED:", !!password);

    const user = await UserModel.findOne({ email });

    console.log("USER FOUND:", !!user);

    // =================================================
    // USER NOT FOUND
    // =================================================

    if (!user) {
      // AUDIT LOG
      await AuditLogs.create({
        user: null,
        performedBy: null,
        action: "LOGIN_FAILED",
        description: `Failed login attempt for email ${email}`,
        ipAddress: req.ip,
        metadata: {
          email: email,
          reason: "USER_NOT_FOUND",
        },
      });

      return res.status(400).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    console.log("ACCOUNT APPROVAL:", user.accountStatus);
    console.log("ACCOUNT STATUS:", user.status);

    // =================================================
    // CHECK PASSWORD
    // =================================================

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      // AUDIT LOG
      await AuditLog.create({
        user: user._id,
        performedBy: null,
        action: "LOGIN_FAILED",
        description: `Failed login attempt for ${user.email}`,
        ipAddress: req.ip,
        metadata: {
          email: user.email,
          reason: "INVALID_PASSWORD",
        },
      });

      return res.status(400).json({
        status: false,
        message: "Invalid email or password",
      });
    }

    // =================================================
    // ADMIN LOGIN
    // =================================================

    if (user.role === "admin") {
      // Admin does not need approval
    } else {
      // =================================================
      // CHECK ADMIN APPROVAL
      // =================================================

      if (user.accountStatus !== "approved") {
        // AUDIT LOG
        await AuditLog.create({
          user: user._id,
          performedBy: null,
          action: "LOGIN_BLOCKED",
          description: `Login blocked because ${user.fullname}'s account is waiting for approval`,
          ipAddress: req.ip,
          metadata: {
            email: user.email,
            reason: "PENDING_APPROVAL",
            accountStatus: user.accountStatus,
          },
        });

        return res.status(403).json({
          status: false,
          message: "Your account is waiting for admin approval.",
        });
      }

      // =================================================
      // CHECK ACTIVE / INACTIVE
      // =================================================

      if (user.status !== "active") {
        // AUDIT LOG
        await AuditLog.create({
          user: user._id,
          performedBy: null,
          action: "LOGIN_BLOCKED",
          description: `Login blocked because ${user.fullname}'s account is inactive`,
          ipAddress: req.ip,
          metadata: {
            email: user.email,
            reason: "ACCOUNT_INACTIVE",
            status: user.status,
          },
        });

        return res.status(403).json({
          status: false,
          message: "Your account isn't active.",
        });
      }
    }

    // =================================================
    // SUCCESSFUL LOGIN AUDIT
    // =================================================

    await AuditLog.create({
      user: user._id,
      performedBy: user._id,
      action: "LOGIN",
      description: `User ${user.fullname} logged in successfully`,
      ipAddress: req.ip,
      metadata: {
        email: user.email,
        role: user.role,
        status: user.status,
        accountStatus: user.accountStatus,
      },
    });

    // =================================================
    // CREATE TOKEN
    // =================================================

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      status: true,
      message: "Login Successfully",
      token,

      user: {
        userId: user.userId,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        status: user.status,
        accountStatus: user.accountStatus,
      },
    });
  } catch (err) {
    console.error("LOGIN SERVER ERROR:", err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

// =====================================================
// REGISTER
// =====================================================

const Register = async (req, res) => {
  try {
    const { userId, fullname, email, password } = req.body;

    console.log("========== REGISTER START ==========");
    console.log("BODY:", req.body);

    // =================================================
    // VALIDATION
    // =================================================

    if (!userId || !fullname || !email || !password) {
      console.log("REGISTER VALIDATION FAILED");

      return res.status(400).json({
        status: false,
        message: "Please fill in all fields.",
      });
    }

    // =================================================
    // CHECK EMAIL
    // =================================================

    const existingUser = await UserModel.findOne({
      email: email,
    });

    console.log("EXISTING EMAIL:", !!existingUser);

    // =================================================
    // CHECK USER ID
    // =================================================

    const existingUserId = await UserModel.findOne({
      userId: userId,
    });

    console.log("EXISTING USER ID:", !!existingUserId);

    // =================================================
    // BOTH EXIST
    // =================================================

    if (existingUser && existingUserId) {
      console.log("DUPLICATE EMAIL + USER ID");

      return res.status(400).json({
        status: false,
        message: "This User ID and email are already registered.",
      });
    }

    // =================================================
    // EMAIL EXISTS
    // =================================================

    if (existingUser) {
      console.log("DUPLICATE EMAIL");

      return res.status(400).json({
        status: false,
        message: "This email is already registered.",
      });
    }

    // =================================================
    // USER ID EXISTS
    // =================================================

    if (existingUserId) {
      console.log("DUPLICATE USER ID");

      return res.status(400).json({
        status: false,
        message: "This User ID is already taken.",
      });
    }

    // =================================================
    // HASH PASSWORD
    // =================================================

    console.log("HASHING PASSWORD...");

    const hashedPassword = await bcrypt.hash(password, 10);

    // =================================================
    // CREATE USER
    // =================================================

    const newUser = new UserModel({
      userId: userId,
      fullname: fullname,
      email: email,
      password: hashedPassword,
      role: "user",
      accountStatus: "pending",
      status: "active",
    });

    console.log("USER OBJECT CREATED:", newUser);

    // =================================================
    // SAVE
    // =================================================

    await newUser.save();

    console.log("USER SAVED SUCCESSFULLY");

    // =================================================
    // AUDIT LOG
    // =================================================

    await AuditLog.create({
      user: newUser._id,
      performedBy: null,
      action: "USER_REGISTERED",
      description: `New user ${newUser.fullname} registered successfully`,
      ipAddress: req.ip,
      metadata: {
        userId: newUser.userId,
        email: newUser.email,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
        status: newUser.status,
      },
    });

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      status: true,
      message:
        "Registration successful. Your account is waiting for admin acceptance.",

      user: {
        userId: newUser.userId,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        accountStatus: newUser.accountStatus,
      },
    });
  } catch (err) {
    console.error("========== REGISTER ERROR ==========");
    console.error("ERROR MESSAGE:", err.message);
    console.error("ERROR CODE:", err.code);
    console.error("ERROR KEY VALUE:", err.keyValue);
    console.error("ERROR KEY PATTERN:", err.keyPattern);
    console.error("FULL ERROR:", err);

    // =================================================
    // MONGODB DUPLICATE KEY
    // =================================================

    if (err.code === 11000) {
      const duplicateField = Object.keys(
        err.keyPattern || err.keyValue || {},
      )[0];

      console.log("DUPLICATE FIELD:", duplicateField);

      if (duplicateField === "email") {
        return res.status(400).json({
          status: false,
          message: "This email is already registered.",
        });
      }

      if (duplicateField === "userId") {
        return res.status(400).json({
          status: false,
          message: "This User ID is already taken.",
        });
      }

      return res.status(400).json({
        status: false,
        message: "Email or User ID already in use.",
      });
    }

    return res.status(500).json({
      status: false,
      message: err.message || "Registration failed.",
    });
  }
};

// =====================================================
// GET ALL USERS
// =====================================================

const getAllUsers = async (req, res) => {
  try {
    // Only admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Only admin can access users.",
      });
    }

    const users = await UserModel.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error("GET USERS ERROR:", err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

// =====================================================
// APPROVE USER
// =====================================================

const approveUser = async (req, res) => {
  try {
    // Only admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin only.",
      });
    }

    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    // Admin cannot be approved
    if (user.role === "admin") {
      return res.status(400).json({
        status: false,
        message: "Admin account does not require approval.",
      });
    }

    // Approve account
    user.accountStatus = "approved";

    // Make account active
    user.status = "active";

    await user.save();

    // =================================================
    // AUDIT LOG
    // =================================================

    await AuditLog.create({
      user: user._id,
      performedBy: req.user.id,
      action: "USER_APPROVED",
      description: `Admin approved user ${user.fullname}`,
      ipAddress: req.ip,
      metadata: {
        userId: user.userId,
        email: user.email,
        accountStatus: user.accountStatus,
        status: user.status,
      },
    });

    return res.status(200).json({
      status: true,
      message: "User approved successfully.",

      data: {
        _id: user._id,
        userId: user.userId,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        status: user.status,
        accountStatus: user.accountStatus,
      },
    });
  } catch (err) {
    console.error("APPROVE USER ERROR:", err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

// =====================================================
// TOGGLE ACTIVE / INACTIVE
// =====================================================

const toggleUserStatus = async (req, res) => {
  try {
    // Only admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin only.",
      });
    }

    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    // Admin cannot be disabled
    if (user.role === "admin") {
      return res.status(400).json({
        status: false,
        message: "Admin account cannot be deactivated.",
      });
    }

    // Toggle status
    if (user.status === "active") {
      user.status = "inactive";
    } else {
      user.status = "active";
    }

    await user.save();

    // =================================================
    // AUDIT LOG
    // =================================================

    await AuditLog.create({
      user: user._id,
      performedBy: req.user.id,
      action: user.status === "active" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      description:
        user.status === "active"
          ? `Admin activated user ${user.fullname}`
          : `Admin deactivated user ${user.fullname}`,
      ipAddress: req.ip,
      metadata: {
        userId: user.userId,
        email: user.email,
        status: user.status,
      },
    });

    return res.status(200).json({
      status: true,
      message: `User account is now ${user.status}.`,

      data: {
        _id: user._id,
        userId: user.userId,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        status: user.status,
        accountStatus: user.accountStatus,
      },
    });
  } catch (err) {
    console.error("TOGGLE USER STATUS ERROR:", err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

// =====================================================
// ROLES & PERMISSIONS
// =====================================================

const getRolePermissions = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await UserModel.findById(userId).select(
      "role permissions fullname email status accountStatus",
    );

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        status: false,
        message: "Your account is inactive",
      });
    }

    const role = user.role || "user";

    const defaultPermissions =
      role === "admin" ? ADMIN_PERMISSIONS : USER_PERMISSIONS;

    const permissions =
      Array.isArray(user.permissions) && user.permissions.length > 0
        ? user.permissions
        : defaultPermissions;

    return res.status(200).json({
      status: true,
      message: "Permissions fetched successfully",
      data: {
        role,
        permissions,

        // CUSUB: liiska guud ee ADMIN iyo USER
        allPermissions: {
          admin: ADMIN_PERMISSIONS,
          user: USER_PERMISSIONS,
        },

        user: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
          status: user.status,
          accountStatus: user.accountStatus,
        },
      },
    });
  } catch (error) {
    console.error("GET ROLE PERMISSIONS ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch permissions",
      error: error.message,
    });
  }
};

const AuditLog = require("../model/AuditLog.service");

// =====================================================
// GET ALL AUDIT LOGS
// =====================================================

const getAuditLogs = async (req, res) => {
  try {
    // Only admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Only admin can view audit logs.",
      });
    }

    const logs = await AuditLog.find()
      .populate("user", "userId fullname email role")
      .populate("performedBy", "userId fullname email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    console.error("GET AUDIT LOGS ERROR:", err);

    return res.status(500).json({
      status: false,
      message: "Failed to load audit logs.",
      error: err.message,
    });
  }
};

// =====================================================
// DELETE / CANCEL USER
// =====================================================

const deleteUser = async (req, res) => {
  try {
    // Only admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Only admin can delete users.",
      });
    }

    console.log("DELETE USER ID:", req.params.id);

    const { id } = req.params;

    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    // Admin cannot be deleted
    if (user.role === "admin") {
      return res.status(403).json({
        status: false,
        message: "Admin account cannot be deleted.",
      });
    }

    // =================================================
    // AUDIT LOG - BEFORE DELETE
    // =================================================

    await AuditLog.create({
      user: user._id,
      performedBy: req.user.id,
      action: "USER_DELETED",
      description: `Admin deleted user ${user.fullname}`,
      ipAddress: req.ip,
      metadata: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });

    await UserModel.findByIdAndDelete(id);

    return res.status(200).json({
      status: true,
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  Login,
  Register,
  getAllUsers,
  approveUser,
  toggleUserStatus,
  deleteUser,
  getRolePermissions,
  getAuditLogs,
};
