const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    latitude: {
      type: String,
      unique: true,
    },
    longitude: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", locationSchema);
