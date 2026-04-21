const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dailyStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
