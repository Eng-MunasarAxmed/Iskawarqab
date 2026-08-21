const jwt = require("jsonwebtoken");
const { UserModel } = require("../model/user.service");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        status: false,
        message: "Access denied. No token provided",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    const verifyToken = jwt.verify(token, process.env.SECRET_KEY);

    // =================================================
    // GET CURRENT USER FROM DATABASE
    // =================================================

    const user = await UserModel.findById(verifyToken.id);

    if (!user) {
      return res.status(401).json({
        status: false,
        message: "User account not found.",
      });
    }

    // =================================================
    // ADMIN
    // =================================================

    if (user.role === "admin") {
      // Admin can continue
    } else {
      // =================================================
      // CHECK APPROVAL
      // =================================================

      if (user.accountStatus !== "approved") {
        return res.status(403).json({
          status: false,
          message: "Your account is waiting for admin approval.",
        });
      }

      // =================================================
      // CHECK ACTIVE / INACTIVE
      // =================================================

      if (String(user.status).toLowerCase() !== "active") {
        return res.status(403).json({
          status: false,
          message:
            "Your account is inactive. Please contact the administrator.",
        });
      }
    }

    // =================================================
    // CURRENT USER
    // =================================================

    req.user = {
      id: user._id,
      userId: user.userId,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      status: user.status,
      accountStatus: user.accountStatus,
    };

    next();
  } catch (error) {
    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      status: false,
      message: "Invalid token",
    });
  }
};

module.exports = auth;
