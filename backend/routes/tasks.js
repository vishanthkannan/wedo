const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Get tasks for a specific date
router.get('/', protect, async (req, res) => {
  try {
    const { date } = req.query; // format: YYYY-MM-DD
    if (!date) return res.status(400).json({ message: 'Date is required' });
    
    let tasks = await Task.find({ user: req.user, date });

    // Auto-create daily routines if they don't exist for this date
    if (tasks.length === 0) {
      // Check if user has any daily routines from the past
      const pastDailies = await Task.find({ user: req.user, type: 'daily' }).sort({ createdAt: -1 });
      
      if (pastDailies.length > 0) {
        // Extract unique daily tasks titles
        const uniqueDailies = [...new Set(pastDailies.map(t => t.title))];
        
        const newDailies = uniqueDailies.map(title => ({
          user: req.user,
          title,
          type: 'daily',
          date,
          completed: false
        }));
        
        await Task.insertMany(newDailies);
        tasks = await Task.find({ user: req.user, date });
      }
    }
    
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create task
router.post('/', protect, async (req, res) => {
  try {
    const { title, type, date, completed } = req.body;
    const task = new Task({ user: req.user, title, type, date, completed: completed || false });
    await task.save();

    // Streak logic check when completing daily routines on creation
    if (task.completed && task.type === 'daily') {
      const allDailies = await Task.find({ user: req.user, date: task.date, type: 'daily' });
      const allCompleted = allDailies.every(t => t.completed);
      if (allCompleted) {
        const user = await User.findById(req.user);
        const today = new Date().toISOString().split('T')[0];
        if (task.date === today) {
           user.dailyStreak += 1;
           if (user.dailyStreak > user.longestStreak) {
             user.longestStreak = user.dailyStreak;
           }
           await user.save();
        }
      }
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rename tasks by title
router.put('/rename/bulk', protect, async (req, res) => {
  try {
    const { oldTitle, newTitle } = req.body;
    if (!oldTitle || !newTitle) {
      return res.status(400).json({ message: 'Old and new titles required' });
    }
    await Task.updateMany(
      { user: req.user, title: oldTitle },
      { $set: { title: newTitle } }
    );
    res.json({ message: 'Tasks renamed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const wasCompleted = task.completed;
    task.completed = req.body.completed !== undefined ? req.body.completed : task.completed;
    task.title = req.body.title || task.title;
    await task.save();

    // Streak logic check when completing daily routines
    if (!wasCompleted && task.completed && task.type === 'daily') {
      // Check if all daily routines for this date are completed
      const allDailies = await Task.find({ user: req.user, date: task.date, type: 'daily' });
      const allCompleted = allDailies.every(t => t.completed);
      
      if (allCompleted) {
        const user = await User.findById(req.user);
        // Only increment if we haven't already incremented today based on last login check
        const today = new Date().toISOString().split('T')[0];
        if (task.date === today) {
           // Basic streak increment - in a real app, ensure we don't increment multiple times a day
           // We simplify for this demo
           user.dailyStreak += 1;
           if (user.dailyStreak > user.longestStreak) {
             user.longestStreak = user.dailyStreak;
           }
           await user.save();
        }
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete tasks by title
router.delete('/bulk', protect, async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    await Task.deleteMany({ user: req.user, title });
    res.json({ message: 'Tasks deleted successfully' });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.user.toString() !== req.user) {
      return res.status(404).json({ message: 'Task not found' });
    }
    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get monthly performance
router.get('/analytics/weekly', protect, async (req, res) => {
  try {
    const today = new Date();
    const dates = [];
    for(let i=29; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const tasks = await Task.find({ user: req.user, date: { $in: dates } });
    
    let totalCompleted = 0;
    let totalTasks = tasks.length;
    let completionByDay = {};
    
    dates.forEach(d => completionByDay[d] = { total: 0, completed: 0 });

    tasks.forEach(t => {
      completionByDay[t.date].total += 1;
      if (t.completed) {
        completionByDay[t.date].completed += 1;
        totalCompleted += 1;
      }
    });

    const completionPercent = totalTasks === 0 ? 0 : Math.round((totalCompleted / totalTasks) * 100);

    const chartData = dates.map(d => ({
      name: new Date(d).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC' // Force UTC to match our YYYY-MM-DD storage format
      }),
      date: d,
      completed: completionByDay[d].completed,
      total: completionByDay[d].total
    }));

    res.json({
      totalCompleted,
      completionPercent,
      chartData,
      streak: (await User.findById(req.user)).dailyStreak
    });

  } catch (error) {
    console.error('Error in analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
