const mongoose = require('mongoose');

const DetailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    
  },
  address: {
    type: String,
    required: true,
  },
  gst: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Detail', DetailSchema);
