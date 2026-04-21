const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['daily', 'todo'], required: true },
  completed: { type: Boolean, default: false },
  date: { type: String, required: true } // format: YYYY-MM-DD
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
