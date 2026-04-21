import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import TaskItem from '../components/TaskItem';
import ProductivityChart from '../components/ProductivityChart';
import MidnightSkyBackground from '../components/MidnightSkyBackground';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Flame, Volume2, VolumeX, LogOut, Check, Edit2, Trash2, Sun, Moon, GripVertical } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [matrixData, setMatrixData] = useState({});
  const [uniqueTasks, setUniqueTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Date handling
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [dateRange, setDateRange] = useState([]);
  
  // UI State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Edit State
  const [editingTask, setEditingTask] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  
  const scrollRef = useRef(null);

  useEffect(() => {
    // Generate dates (10 days total: 3 past, today, 6 future)
    const dates = [];
    for(let i = -3; i <= 6; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    setDateRange(dates);
    
    // Scroll to today initially
    setTimeout(() => {
      if (scrollRef.current) {
        const activeItem = scrollRef.current.querySelector('.active');
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (dateRange.length > 0) {
      fetchTasksMatrix();
    }
    fetchAnalytics();
  }, [dateRange, selectedDate]);

  const fetchTasksMatrix = async () => {
    try {
      const promises = dateRange.map(d => api.get(`/tasks?date=${d}`));
      const results = await Promise.all(promises);
      
      const newMatrix = {};
      const taskSet = new Map();

      results.forEach((res, i) => {
        const date = dateRange[i];
        res.data.forEach(task => {
          if (!taskSet.has(task.title)) {
            taskSet.set(task.title, task.type);
          }
          if (!newMatrix[task.title]) {
            newMatrix[task.title] = {};
          }
          newMatrix[task.title][date] = task;
        });
      });

      setMatrixData(newMatrix);
      setUniqueTasks(Array.from(taskSet.entries()).map(([title, type]) => ({ title, type })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/tasks/analytics/weekly');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (id, completed) => {
    try {
      setMatrixData(prev => {
        const newMatrix = { ...prev };
        for (const title in newMatrix) {
          let updated = false;
          const datesObj = { ...newMatrix[title] };
          for (const date in datesObj) {
            if (datesObj[date]?._id === id) {
              datesObj[date] = { ...datesObj[date], completed };
              updated = true;
            }
          }
          if (updated) newMatrix[title] = datesObj;
        }
        return newMatrix;
      });
      
      if (completed) {
        playSound('click', soundEnabled);
        // Simple reward logic placeholder for matrix
        setTimeout(() => playSound('reward', soundEnabled), 300);
        window.dispatchEvent(new Event('taskCompleted'));
      }
      
      await api.put(`/tasks/${id}`, { completed });
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      fetchTasksMatrix();
    }
  };

  const handleCreateAndToggleTask = async (title, date) => {
    try {
      playSound('click', soundEnabled);
      setTimeout(() => playSound('reward', soundEnabled), 300);
      window.dispatchEvent(new Event('taskCompleted'));
      
      // Optimistic update
      setMatrixData(prev => {
        const newMatrix = { ...prev };
        if (!newMatrix[title]) newMatrix[title] = {};
        newMatrix[title] = { ...newMatrix[title] };
        newMatrix[title][date] = { _id: 'temp-' + Date.now(), title, date, type: 'daily', completed: true };
        return newMatrix;
      });

      await api.post('/tasks', {
        title,
        type: 'daily',
        date,
        completed: true
      });
      
      fetchTasksMatrix();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
      fetchTasksMatrix();
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await api.post('/tasks', {
        title: newTaskTitle,
        type: 'daily',
        date: today
      });
      setNewTaskTitle('');
      fetchTasksMatrix();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameTask = async (oldTitle) => {
    if (!editingValue.trim() || editingValue === oldTitle) {
      setEditingTask(null);
      return;
    }
    try {
      await api.put('/tasks/rename/bulk', { oldTitle, newTitle: editingValue });
      setEditingTask(null);
      fetchTasksMatrix();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBulkTask = async (title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.delete(`/tasks/bulk?title=${encodeURIComponent(title)}`);
      fetchTasksMatrix();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  // Weekly msg logic
  const getWeeklyMessage = () => {
    if (!analytics) return '';
    const { completionPercent } = analytics;
    if (completionPercent >= 80) return "You're consistent this week — great work";
    if (completionPercent >= 50) return "Halfway there, keep pushing!";
    return "Let's build some momentum today!";
  };

  return (
    <div className="app-container">
      <MidnightSkyBackground />
      <header className="app-header">
        <div className="user-info">
          <div className="avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <div className="user-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h3>
              <div className="liquid-text-container">
                <span>{user?.name?.split(' ')[0]}</span>
                <span>{user?.name?.split(' ')[0]}</span>
              </div>
            </h3>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            onClick={toggleTheme} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            onClick={logout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
          {analytics && (
            <ProductivityChart data={analytics.chartData} />
          )}
        </div>

        {/* Main Tasks Section */}
        <div>
          <h2 className="section-title">
            Your Habit Matrix
          </h2>
          
          <form className="add-task-form" onSubmit={handleAddTask}>
            <input 
              type="text" 
              className="premium-input add-task-input" 
              placeholder="What new habit do you want to start?" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <button type="submit" className="premium-btn">
              <Plus size={18} />
            </button>
          </form>

          <div className="tracker-grid-container">
            <div className="tracker-grid">
              <div className="tracker-row header-row">
                <div className="tracker-cell tracker-header tracker-task-name">Tasks</div>
                {dateRange.map(d => (
                  <div key={d} className={`tracker-cell tracker-header ${d > today ? 'disabled-header' : ''}`}>
                    {new Date(d).getDate()}
                  </div>
                ))}
              </div>
              {uniqueTasks.length === 0 ? (
                <div className="tracker-row">
                  <div className="tracker-cell" colSpan={dateRange.length + 1} style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>
                    No tasks found. Add one above!
                  </div>
                </div>
              ) : (
                <Reorder.Group axis="y" values={uniqueTasks} onReorder={setUniqueTasks}>
                  {uniqueTasks.map(task => (
                    <Reorder.Item 
                      key={task.title} 
                      value={task} 
                      className="tracker-row"
                    >
                      <div className="tracker-cell tracker-task-name tracker-task-name-cell">
                        {editingTask === task.title ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                            <input 
                              type="text" 
                              className="premium-input" 
                              style={{ padding: '4px 8px', fontSize: '13px', width: '100%', minWidth: '100px' }}
                              value={editingValue} 
                              onChange={(e) => setEditingValue(e.target.value)} 
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameTask(task.title);
                                if (e.key === 'Escape') setEditingTask(null);
                              }}
                            />
                            <button onClick={() => handleRenameTask(task.title)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)' }}>
                              <Check size={16} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                              <GripVertical size={18} className="drag-handle" />
                              <span>{task.title}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                className="tracker-edit-btn"
                                onClick={() => { setEditingTask(task.title); setEditingValue(task.title); }}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                className="tracker-edit-btn tracker-delete-btn"
                                onClick={() => handleDeleteBulkTask(task.title)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {dateRange.map(d => {
                        const t = matrixData[task.title]?.[d];
                        return (
                          <div key={d} className={`tracker-cell ${d > today ? 'disabled-cell' : ''}`}>
                            {t ? (
                              <div className="checkbox-container" onClick={() => d <= today && handleToggleTask(t._id, !t.completed)}>
                                <input 
                                  className="checkbox-input" 
                                  id={`checkbox-${t._id}`} 
                                  type="checkbox" 
                                  checked={t.completed} 
                                  readOnly 
                                />
                                <label className="checkbox-label" htmlFor={`checkbox-${t._id}`} onClick={(e) => e.preventDefault()}>
                                  <span className="checkmark"></span>
                                  <div className="grid-bg"></div>
                                  <div className="glitch-overlay-h"></div>
                                  <div className="glitch-overlay-v"></div>
                                  <div className="binary-particles">
                                    <span style={{ left: '10%', animationDelay: '0s' }} className="particle">1</span>
                                    <span style={{ left: '30%', animationDelay: '-0.2s' }} className="particle">0</span>
                                    <span style={{ left: '50%', animationDelay: '-0.4s' }} className="particle">1</span>
                                    <span style={{ left: '70%', animationDelay: '-0.6s' }} className="particle">0</span>
                                    <span style={{ left: '90%', animationDelay: '-0.8s' }} className="particle">1</span>
                                  </div>
                                </label>
                              </div>
                            ) : (
                              <div className="checkbox-container" onClick={() => d <= today && handleCreateAndToggleTask(task.title, d)}>
                                <input 
                                  className="checkbox-input" 
                                  id={`checkbox-new-${task.title}-${d}`} 
                                  type="checkbox" 
                                  checked={false} 
                                  readOnly 
                                />
                                <label className="checkbox-label" htmlFor={`checkbox-new-${task.title}-${d}`} onClick={(e) => e.preventDefault()}>
                                  <span className="checkmark"></span>
                                  <div className="grid-bg"></div>
                                  <div className="glitch-overlay-h"></div>
                                  <div className="glitch-overlay-v"></div>
                                  <div className="binary-particles">
                                    <span style={{ left: '10%', animationDelay: '0s' }} className="particle">1</span>
                                    <span style={{ left: '30%', animationDelay: '-0.2s' }} className="particle">0</span>
                                    <span style={{ left: '50%', animationDelay: '-0.4s' }} className="particle">1</span>
                                    <span style={{ left: '70%', animationDelay: '-0.6s' }} className="particle">0</span>
                                    <span style={{ left: '90%', animationDelay: '-0.8s' }} className="particle">1</span>
                                  </div>
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </div>
          </div>
        </div>

        {/* Empty placeholder to keep the grid layout balanced */}
        <div></div>
      </div>
    </div>
  );
};

export default Dashboard;
