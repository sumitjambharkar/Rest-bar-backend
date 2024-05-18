const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
    },
    status : {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
