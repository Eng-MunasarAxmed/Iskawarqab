const mongoose = require("mongoose");
const Joi = require("joi");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
  },
  { timestamps: true },
);

const CategoryModel = mongoose.model("Category", categorySchema);

// CREATE VALIDATION
function validateCategory(data) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(15).required(),
  });

  return schema.validate(data, { abortEarly: false });
}

// UPDATE VALIDATION
function validateUpdate(data) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(15),
  });

  return schema.validate(data, { abortEarly: false });
}

module.exports = {
  CategoryModel,
  validateCategory,
  validateUpdate,
};
