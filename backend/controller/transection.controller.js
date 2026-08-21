const {
  validateTransection,
  TransectionModel,
} = require("../model/transection.service");

const Get = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "admin") {
      filter.userId = req.user.id;
    }
    const transections = await TransectionModel.find(filter)
      .populate("categoryId", "name amount")
      .populate("userId", "fullname");
    res.json({
      status: true,
      message: "Transections retrieved successfully",
      data: transections,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: error.message });
  }
};

const Post = async (req, res) => {
  try {
    const { error } = validateTransection(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      });
    }

    const newTransection = new TransectionModel({
      amount: req.body.amount,
      categoryId: req.body.categoryId,
      userId: req.user.id,
      type: req.body.type,
    });

    await newTransection.save();

    res.status(201).json({
      status: true,
      message: "Transection created successfully",
      data: newTransection,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// PUT
const Put = async (req, res) => {
  try {
    const transection = await TransectionModel.findById(req.params.id);

    if (!transection) {
      return res.status(404).json({
        status: false,
        message: "Transection not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      transection.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        status: false,
        message: "Access denied",
      });
    }

    const updated = await TransectionModel.findByIdAndUpdate(
      req.params.id,
      {
        amount: req.body.amount,
        categoryId: req.body.categoryId,
        type: req.body.type,
      },
      { new: true },
    );

    res.json({
      status: true,
      message: "Transection updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = {
  Get,
  Post,
  Put,
};
