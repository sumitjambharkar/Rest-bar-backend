const mongoose = require("mongoose");

const saleReportSchema = new mongoose.Schema(
  {
    table: {
      type: String,
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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SaleReport", saleReportSchema);