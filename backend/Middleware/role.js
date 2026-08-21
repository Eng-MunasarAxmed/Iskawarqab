// =====================================================
// ROLE MIDDLEWARE
// =====================================================

const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    console.error("ADMIN ROLE ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Role authorization error.",
    });
  }
};

// =====================================================
// USER OR ADMIN
// =====================================================

const userOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "user" && req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied.",
      });
    }

    next();
  } catch (error) {
    console.error("ROLE ERROR:", error);

    return res.status(500).json({
      status: false,
      message: "Role authorization error.",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  adminOnly,
  userOrAdmin,
};
