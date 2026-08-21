const { UserModel, validateUser } = require("../model/user.service");
const bcrypt = require("bcrypt");
const AuditLog = require("../model/AuditLog.service");

// ==========================================
// GET ALL USERS
// ==========================================
const Get = async (req, res) => {
  try {
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin kaliya ayaa arkaya!",
      });
    }

    const users = await UserModel.find({
      status: { $ne: "deleted" },
    }).select("-password");

    res.json({
      status: true,
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// APPROVE USER
// ==========================================
const approveUser = async (req, res) => {
  try {
    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { accountStatus: "approved", status: "active" },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // AUDIT LOG
    await AuditLog.create({
      user: user._id,
      performedBy: req.user?.id || null,
      action: "USER_APPROVED",
      description: `User ${user.fullname} was approved`,
      ipAddress: req.ip,
      metadata: {
        userId: user.userId,
        email: user.email,
      },
    });

    res.status(200).json({
      status: true,
      message: "User approved successfully",
      data: user,
    });
  } catch (error) {
    console.error("Approve error:", error);

    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET MY PROFILE
// ==========================================
const GetProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Profile fetched successfully",
      data: {
        userId: user.userId,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE MY PROFILE
// Email + Password + Fullname
// ==========================================
const UpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { email, password } = req.body;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const oldEmail = user.email;

    let emailChanged = false;
    let passwordChanged = false;

    // =====================================================
    // EMAIL
    // =====================================================

    if (email && email.trim() !== "" && email !== user.email) {
      const cleanEmail = email.trim().toLowerCase();

      const existingUser = await UserModel.findOne({
        email: cleanEmail,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return res.status(400).json({
          status: false,
          message: "This email is already registered.",
        });
      }

      user.email = cleanEmail;
      emailChanged = true;
    }

    // =====================================================
    // PASSWORD
    // =====================================================

    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
      passwordChanged = true;
    }

    // =====================================================
    // NO CHANGES
    // =====================================================

    if (!emailChanged && !passwordChanged) {
      return res.status(400).json({
        status: false,
        message: "No changes were made.",
      });
    }

    // =====================================================
    // SAVE USER
    // =====================================================

    await user.save();

    // =====================================================
    // CREATE ONE AUDIT LOG
    // =====================================================

    const changes = [];

    if (emailChanged) {
      changes.push("email");
    }

    if (passwordChanged) {
      changes.push("password");
    }

    await AuditLog.create({
      user: user._id,
      performedBy: user._id,
      action: "PROFILE_UPDATED",
      description: `User ${user.fullname} updated their ${changes.join(
        " and ",
      )}`,
      ipAddress: req.ip,

      metadata: {
        userId: user.userId,
        emailChanged,
        passwordChanged,

        ...(emailChanged && {
          oldEmail,
          newEmail: user.email,
        }),
      },
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      status: true,
      message: "Profile updated successfully",
      data: {
        userId: user.userId,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      status: false,
      message: error.message || "Profile update failed.",
    });
  }
};

// ==========================================
// RESTORE USER BY ID
// ==========================================
const restoreById = async (req, res) => {
  try {
    const id = req.params.id;

    const restoreData = await UserModel.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true },
    ).select("-password");

    if (!restoreData) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // AUDIT LOG
    await AuditLog.create({
      user: restoreData._id,
      performedBy: req.user?.id || null,
      action: "USER_RESTORED",
      description: `User ${restoreData.fullname} was restored`,
      ipAddress: req.ip,
      metadata: {
        userId: restoreData.userId,
        email: restoreData.email,
      },
    });

    res.json({
      status: true,
      message: "User restored successfully",
      data: restoreData,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// RESTORE ALL
// ==========================================
const restoreAll = async (req, res) => {
  try {
    const restoreData = await UserModel.updateMany(
      { status: "deleted" },
      { status: "active" },
    );

    // AUDIT LOG
    await AuditLog.create({
      user: null,
      performedBy: req.user?.id || null,
      action: "USERS_RESTORED",
      description: "All deleted users were restored",
      ipAddress: req.ip,
      metadata: {
        restoredCount: restoreData.modifiedCount,
      },
    });

    res.json({
      status: true,
      message: "All users restored successfully",
      data: restoreData,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// GET DELETED USERS
// ==========================================
const GETDELETE = async (req, res) => {
  try {
    const users = await UserModel.find({
      status: "deleted",
    }).select("-password");

    res.json({
      status: true,
      message: "Deleted users fetched successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// CREATE USER - ADMIN ONLY
// ==========================================
const Post = async (req, res) => {
  try {
    // Admin check
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin kaliya ayaa abuuri kara user.",
      });
    }

    const { error } = validateUser(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      });
    }

    // Check email
    const checkIfEmailTaken = await UserModel.findOne({
      email: req.body.email,
    });

    if (checkIfEmailTaken) {
      return res.status(400).json({
        status: false,
        message: "Email already taken",
      });
    }

    // Password hash
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new UserModel({
      userId: req.body.userId,
      fullname: req.body.fullname,
      email: req.body.email,
      password: hashedPassword,
      role: req.body.role || "user",
      accountStatus: "approved",
      status: "active",
    });

    await newUser.save();

    // AUDIT LOG
    await AuditLog.create({
      user: newUser._id,
      performedBy: req.user?.id || null,
      action: "USER_CREATED",
      description: `User ${newUser.fullname} was created`,
      ipAddress: req.ip,
      metadata: {
        userId: newUser.userId,
        email: newUser.email,
        role: newUser.role,
      },
    });

    res.status(201).json({
      status: true,
      message: "User created successfully",
      data: {
        userId: newUser.userId,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    // Duplicate key handling
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || error.keyValue || {})[0];

      return res.status(400).json({
        status: false,
        message: `${field} already in use.`,
      });
    }

    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE USER - ADMIN
// ==========================================
const Put = async (req, res) => {
  try {
    const id = req.params.id;

    const { fullname, email, password, role, userId } = req.body;

    const user = await UserModel.findById(id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Email
    if (email && email !== user.email) {
      const existingUser = await UserModel.findOne({
        email,
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          status: false,
          message: "Email-kan waa la isticmaalay user kale",
        });
      }

      user.email = email;
    }

    // Fullname
    if (fullname) {
      user.fullname = fullname;
    }

    // Role
    if (role && ["admin", "user"].includes(role)) {
      user.role = role;
    }

    // Password
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }

    // User ID
    if (userId) {
      user.userId = userId;
    }

    await user.save();

    // AUDIT LOG
    await AuditLog.create({
      user: user._id,
      performedBy: req.user?.id || null,
      action: "USER_UPDATED",
      description: `User ${user.fullname} was updated`,
      ipAddress: req.ip,
      metadata: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });

    res.json({
      status: true,
      message: "User updated successfully",
      data: {
        userId: user.userId,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// CANCEL APPROVAL
// ==========================================
const cancelUser = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Admin lama tirtiri karo
    if (user.role === "admin") {
      return res.status(403).json({
        status: false,
        message: "Admin account cannot be rejected.",
      });
    }

    // AUDIT LOG - BEFORE DELETE
    await AuditLog.create({
      user: user._id,
      performedBy: req.user?.id || null,
      action: "USER_REJECTED",
      description: `User ${user.fullname} registration was rejected`,
      ipAddress: req.ip,
      metadata: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });

    // Reject = user-ka gebi ahaanba ka tirtir database-ka
    await UserModel.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      status: true,
      message: "User registration rejected and removed.",
    });
  } catch (error) {
    console.error("Cancel user error:", error);

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// DELETE USER
// ==========================================
const Delete = async (req, res) => {
  try {
    const id = req.params.id;

    // First find user
    const userToDelete = await UserModel.findById(id);

    if (!userToDelete) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // AUDIT LOG - BEFORE DELETE
    await AuditLog.create({
      user: userToDelete._id,
      performedBy: req.user?.id || null,
      action: "USER_DELETED",
      description: `User ${userToDelete.fullname} was deleted`,
      ipAddress: req.ip,
      metadata: {
        userId: userToDelete.userId,
        email: userToDelete.email,
        role: userToDelete.role,
      },
    });

    // Hard delete
    const deletedData =
      await UserModel.findByIdAndDelete(id).select("-password");

    if (!deletedData) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    res.json({
      status: true,
      message: "User deleted successfully",
      data: deletedData,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// UPDATE USER STATUS - ADMIN
// ==========================================
const updateUserStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Invalid status. Use active or inactive.",
      });
    }

    if (req.user && req.user.id === id) {
      return res.status(403).json({
        status: false,
        message: "You cannot change your own account status.",
      });
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { status: status },
      { new: true, runValidators: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // AUDIT LOG
    await AuditLog.create({
      user: user._id,
      performedBy: req.user?.id || null,
      action: status === "active" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      description:
        status === "active"
          ? `User ${user.fullname} was activated`
          : `User ${user.fullname} was deactivated`,
      ipAddress: req.ip,
      metadata: {
        userId: user.userId,
        email: user.email,
        status: user.status,
      },
    });

    return res.status(200).json({
      status: true,
      message: `User status changed to ${status}`,
      data: user,
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// TOGGLE ACTIVE / INACTIVE
// ==========================================
const toggleUserStatus = async (req, res) => {
  try {
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

    if (user.role === "admin") {
      return res.status(400).json({
        status: false,
        message: "Admin account cannot be deactivated.",
      });
    }

    user.status = user.status === "active" ? "inactive" : "active";

    await user.save();

    // AUDIT LOG
    await AuditLog.create({
      user: user._id,
      performedBy: req.user?.id || null,
      action: user.status === "active" ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      description:
        user.status === "active"
          ? `User ${user.fullname} was activated`
          : `User ${user.fullname} was deactivated`,
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

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  Get,
  GetProfile,
  UpdateProfile,
  Post,
  Put,
  Delete,
  deleteUser: Delete,
  GETDELETE,
  restoreAll,
  restoreById,
  approveUser,
  cancelUser,
  updateUserStatus,
  toggleUserStatus,
};
