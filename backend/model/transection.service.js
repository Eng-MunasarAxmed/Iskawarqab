const mongoose = require("mongoose");
const Joi = require("joi");
const transectionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    type: {
      type: String,
      enum: ["income", "expense", "savings"],
      required: true,
    },
  },
  { timestamps: true },
);

const TransectionModel = mongoose.model("Transections", transectionSchema);
function validateTransection(transection) {
  const schema = Joi.object({
    amount: Joi.number().required(),
    categoryId: Joi.string().required(),
    userId: Joi.string().optional(),
    type: Joi.string().valid("income", "expense", "savings").required(),
  });
  return schema.validate(transection);
}

module.exports = {
  TransectionModel,
  validateTransection,
};
