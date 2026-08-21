const mongoose = require("mongoose");
const Joi = require("joi");

// =====================================================
// DEFAULT PERMISSIONS
// =====================================================

const ADMIN_PERMISSIONS = [
  "view_users",
  "create_users",
  "edit_users",
  "approve_users",
  "activate_users",
  "deactivate_users",
  "delete_users",

  "view_transactions",
  "manage_categories",

  "view_dashboard",
  "view_profile",
  "update_profile",
  "update_email",
  "update_password",

  "security_settings",
];

const USER_PERMISSIONS = [
  "view_dashboard",

  "view_transactions",
  "create_transactions",

  "view_categories",
  "create_categories",

  "view_profile",
  "update_profile",
  "update_email",
  "update_password",
];

// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
      required: true,
    },

    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // =================================================
    // ROLE
    // =================================================

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    // =================================================
    // PERMISSIONS
    // =================================================

    permissions: {
      type: [String],
      default: [],
    },

    // =================================================
    // ACCOUNT APPROVAL
    // =================================================

    accountStatus: {
      type: String,
      enum: ["pending", "approved"],
      default: "pending",
    },

    // =================================================
    // ACCOUNT STATUS
    // =================================================

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

// =====================================================
// AUTOMATIC DEFAULT PERMISSIONS
// =====================================================

userSchema.pre("save", function () {
  if (!this.permissions || this.permissions.length === 0) {
    if (this.role === "admin") {
      this.permissions = ADMIN_PERMISSIONS;
    } else {
      this.permissions = USER_PERMISSIONS;
    }
  }
});

// =====================================================
// MODEL
// =====================================================

const UserModel = mongoose.model("Users", userSchema);

// =====================================================
// JOI VALIDATION
// =====================================================

function validateUser(Users) {
  const schema = Joi.object({
    userId: Joi.number().required(),

    fullname: Joi.string().min(3).max(50).required(),

    email: Joi.string().email().required(),

    password: Joi.string().min(6).required(),

    role: Joi.string().valid("admin", "user").optional(),

    permissions: Joi.array().items(Joi.string()).optional(),
  });

  return schema.validate(Users);
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  UserModel,
  validateUser,
  ADMIN_PERMISSIONS,
  USER_PERMISSIONS,
};
