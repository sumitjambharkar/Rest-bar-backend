const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    isOnline: {
      type: Boolean,
    },
    price: {
      type: Number,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
