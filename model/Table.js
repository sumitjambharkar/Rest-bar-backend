const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    table: {
      type:Number,
    },
    isOnline: {
      type: Boolean,
    },
    basket: [
      {
        name: {
          type: String,
        },
        price: {
          type: Number,
        },
        qty: {
          type: Number,
        },
        total: {
          type: Number,
        },
      },
    ],
    totalAmount: {
      type: Number,
    },
    paymentMethod: {
        type: String,
    },
    pickupAmount: {
        type: Number,
    },
    returnAmount:{
        type: Number,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", tableSchema);
