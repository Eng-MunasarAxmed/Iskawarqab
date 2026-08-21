const {
  CategoryModel,
  validateCategory,
  validateUpdate,
} = require("../model/category.service");

const { UserModel: userModel } = require("../model/user.service");

// GET ALL
const Get = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "admin") {
      filter.userId = req.user.id;
    }
    const categories = await CategoryModel.find(filter).populate(
      "userId",
      "fullname",
    );

    res.status(200).json({
      status: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// ==========================================
// CREATE CATEGORY
// ==========================================
const Post = async (req, res) => {
  try {
    const { error } = validateCategory(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        message: error.details[0].message,
      });
    }

    // Magaca category-ga
    const categoryName = req.body.name.trim();

    // Hubi inuu user-kan horey u leeyahay category-kan
    const existingCategory = await CategoryModel.findOne({
      userId: req.user.id,
      name: {
        $regex: `^${categoryName}$`,
        $options: "i",
      },
    });

    if (existingCategory) {
      return res.status(400).json({
        status: false,
        message: `Category "${categoryName}" Hore Ayyad U Sameysatay`,
      });
    }

    // Samee category cusub
    const newCategory = new CategoryModel({
      name: categoryName,
      userId: req.user.id,
    });

    await newCategory.save();

    // Soo celi category-ga iyo user information
    const category = await CategoryModel.findById(newCategory._id).populate(
      "userId",
      "userId fullname email role",
    );

    res.status(201).json({
      status: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("CATEGORY CREATE ERROR:", error);

    // Duplicate index
    if (error.code === 11000) {
      return res.status(400).json({
        status: false,
        message: "This category Hore Ayyad U Sameysatay",
      });
    }

    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// PUT
const Put = async (req, res) => {
  try {
    const category = await CategoryModel.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Category not found",
      });
    }

    if (
      req.user.role !== "admin" &&
      category.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        status: false,
        message: "Access denied",
      });
    }

    const name = req.body.name?.trim();

    // Haddii name la beddelayo
    if (name) {
      const existingCategory = await CategoryModel.findOne({
        userId: category.userId,
        name: {
          $regex: `^${name}$`,
          $options: "i",
        },
        _id: {
          $ne: category._id,
        },
      });

      if (existingCategory) {
        return res.status(400).json({
          status: false,
          message: `Category "${name}" Hore Ayaad U Sameysatay`,
        });
      }

      category.name = name;
    }

    await category.save();

    const updated = await CategoryModel.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        type: req.body.type,
      },
      { new: true },
    );

    res.json({
      status: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// DELETE
const Delete = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Access denied. Admin kaliya ayaa tirtiri kara!",
      });
    }

    const id = req.params.id;

    const category = await CategoryModel.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        status: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Category deleted successfully",
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
  Delete,
};
