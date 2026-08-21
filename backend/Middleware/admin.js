const admin = (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin only",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = admin;
