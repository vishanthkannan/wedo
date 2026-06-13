const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, dailyStreak: user.dailyStreak, longestStreak: user.longestStreak, monthlyReportEnabled: user.monthlyReportEnabled } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Streak logic update on login
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).toISOString().split('T')[0] : null;
    
    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastLogin !== yesterdayStr) {
        user.dailyStreak = 0; // missed a day
      }
      user.lastLoginDate = new Date();
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, dailyStreak: user.dailyStreak, longestStreak: user.longestStreak, monthlyReportEnabled: user.monthlyReportEnabled } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify the Google OAuth token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user (Generate a secure random password since they login via Google)
      const randomPassword = Math.random().toString(36).slice(-10) + Date.now().toString(36);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name,
        email,
        password: hashedPassword,
        profileImage: picture || '',
        dailyStreak: 0,
      });
      await user.save();
    } else if (picture && !user.profileImage) {
      user.profileImage = picture;
      await user.save();
    }

    // Streak logic update on login
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate).toISOString().split('T')[0] : null;
    
    if (lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastLogin !== yesterdayStr) {
        user.dailyStreak = 0; // missed a day
      }
      user.lastLoginDate = new Date();
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, profileImage: user.profileImage, dailyStreak: user.dailyStreak, longestStreak: user.longestStreak, monthlyReportEnabled: user.monthlyReportEnabled } });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(400).json({ message: 'Google authentication failed' });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, profileImage, monthlyReportEnabled } = req.body;
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (monthlyReportEnabled !== undefined) user.monthlyReportEnabled = monthlyReportEnabled;
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      dailyStreak: user.dailyStreak,
      longestStreak: user.longestStreak,
      lastLoginDate: user.lastLoginDate,
      createdAt: user.createdAt,
      monthlyReportEnabled: user.monthlyReportEnabled
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update password
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send manual test report email
router.post('/send-test-report', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { sendMonthlyReport } = require('../services/emailService');
    const result = await sendMonthlyReport(user);

    let message = 'Test report sent successfully!';
    if (result.previewUrl) {
      message = `Test report sent successfully! Preview link: ${result.previewUrl}`;
    } else if (result.smtpFailed) {
      message = `Test report compiled successfully! Outgoing mail failed (API key missing or delivery error). PDF saved locally: ${result.localPdf}`;
    } else if (result.localPdf) {
      message = `Test report compiled successfully! PDF saved to: ${result.localPdf}`;
    }

    res.json({ 
      message, 
      previewUrl: result.previewUrl, 
      smtpFailed: result.smtpFailed, 
      localPreview: result.localPreview,
      localPdf: result.localPdf
    });
  } catch (error) {
    console.error('Send test report error:', error);
    res.status(500).json({ message: 'Failed to send test report email' });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
