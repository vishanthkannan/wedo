import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import TaskItem from '../components/TaskItem';
import ProductivityChart from '../components/ProductivityChart';
import MidnightSkyBackground from '../components/MidnightSkyBackground';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Plus, Flame, Volume2, VolumeX, LogOut, Check, Edit2, Trash2, Sun, Moon, GripVertical, User } from 'lucide-react';

const HackerCheckbox = React.memo(({ id, checked, onChange, disabled, isToday }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="checkbox-container" 
      onClick={() => !disabled && onChange(!checked)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input 
        className="checkbox-input" 
        id={id} 
        type="checkbox" 
        checked={checked} 
        readOnly 
      />
      <label className="checkbox-label" htmlFor={id} onClick={(e) => e.preventDefault()}>
        <span className="checkmark"></span>
        {isToday && <div className="grid-bg"></div>}
        
        {/* Only render expensive glitch overlays and particles when active/hovered for today */}
        {isToday && (isHovered || checked) && (
          <>
            <div className="glitch-overlay-h"></div>
            <div className="glitch-overlay-v"></div>
            <div className="binary-particles">
              <span style={{ left: '10%', animationDelay: '0s' }} className="particle">1</span>
              <span style={{ left: '30%', animationDelay: '-0.2s' }} className="particle">0</span>
              <span style={{ left: '50%', animationDelay: '-0.4s' }} className="particle">1</span>
              <span style={{ left: '70%', animationDelay: '-0.6s' }} className="particle">0</span>
              <span style={{ left: '90%', animationDelay: '-0.8s' }} className="particle">1</span>
            </div>
          </>
        )}
      </label>
    </div>
  );
});

const HabitRow = React.memo(({ 
  task, 
  today, 
  dateRange, 
  rowData, 
  editingTask, 
  setEditingTask, 
  editingValue, 
  setEditingValue, 
  editingType,
  setEditingType,
  handleUpdateTask, 
  handleDeleteBulkTask, 
  handleToggleTask, 
  handleCreateAndToggleTask,
  showDragHandle
}) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item 
      value={task} 
      className="tracker-row"
      dragListener={false}
      dragControls={dragControls}
    >
      <div className="tracker-cell tracker-task-name tracker-task-name-cell">
        {editingTask === task.title ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              className="premium-input" 
              style={{ padding: '4px 8px', fontSize: '13px', flex: '1 1 120px', minWidth: '80px' }}
              value={editingValue} 
              onChange={(e) => setEditingValue(e.target.value)} 
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateTask(task.title, editingValue, editingType, editingPriority);
                if (e.key === 'Escape') setEditingTask(null);
              }}
            />
            <select
              value={editingType}
              onChange={(e) => setEditingType(e.target.value)}
              className="premium-input"
              style={{ padding: '4px 8px', fontSize: '13px', flex: '0 0 auto', width: 'auto', minWidth: '70px' }}
            >
              <option value="daily">Daily</option>
              <option value="health">Health</option>
              <option value="study">Study</option>
              <option value="work">Work</option>
            </select>
            <button onClick={() => handleUpdateTask(task.title, editingValue, editingType)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)' }}>
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {showDragHandle && (
                <div 
                  onPointerDown={(e) => dragControls.start(e)}
                  className="drag-handle-wrapper"
                >
                  <GripVertical size={18} className="drag-handle" />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', lineHeight: '1.3' }}>{task.title}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>{task.type}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
              <button 
                className="tracker-edit-btn"
                onClick={() => { 
                  setEditingTask(task.title); 
                  setEditingValue(task.title); 
                  setEditingType(task.type || 'daily'); 
                }}
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
        const t = rowData?.[d];
        const isToday = d === today;
        return (
          <div key={d} className={`tracker-cell ${d > today ? 'disabled-cell' : ''}`}>
            {t ? (
              <HackerCheckbox 
                id={`checkbox-${t._id}`}
                checked={t.completed}
                onChange={(completed) => handleToggleTask(t._id, completed)}
                disabled={d > today}
                isToday={isToday}
              />
            ) : (
              <HackerCheckbox 
                id={`checkbox-new-${task.title}-${d}`}
                checked={false}
                onChange={() => handleCreateAndToggleTask(task.title, d, task.type, task.priority)}
                disabled={d > today}
                isToday={isToday}
              />
            )}
          </div>
        );
      })}
    </Reorder.Item>
  );
});

const MultiSelectDropdown = ({ activeTopics, setActiveTopics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const topics = ['all', 'daily', 'health', 'study', 'work'];

  const handleToggle = (topic) => {
    if (topic === 'all') {
      setActiveTopics(['all']);
    } else {
      let newTopics = activeTopics.filter(t => t !== 'all');
      if (newTopics.includes(topic)) {
        newTopics = newTopics.filter(t => t !== topic);
      } else {
        newTopics.push(topic);
      }
      if (newTopics.length === 0) newTopics = ['all'];
      setActiveTopics(newTopics);
    }
  };

  const getLabel = () => {
    if (activeTopics.includes('all')) return 'All Topics';
    if (activeTopics.length === 1) return activeTopics[0].charAt(0).toUpperCase() + activeTopics[0].slice(1);
    return `${activeTopics.length} Topics Selected`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: 100 }}>
      <div 
        className="premium-input" 
        style={{ 
          width: 'auto', 
          minWidth: '180px', 
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
          padding: '12px 20px'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getLabel()}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="premium-card"
            style={{ 
              position: 'absolute', 
              top: '100%', 
              right: 0, 
              width: '200px', 
              marginTop: '8px',
              padding: '16px',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            {topics.map(topic => (
              <label 
                key={topic} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  color: activeTopics.includes(topic) ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'color 0.2s'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={activeTopics.includes(topic)}
                  onChange={() => handleToggle(topic)}
                  style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                {topic === 'all' ? 'All Topics' : topic.charAt(0).toUpperCase() + topic.slice(1)}
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
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
  const [sortBy, setSortBy] = useState('default');
  const [selectedSortDomain, setSelectedSortDomain] = useState('daily');
  
  // Edit State
  const [editingTask, setEditingTask] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingType, setEditingType] = useState('daily');

  // Topic States
  const [activeTopics, setActiveTopics] = useState(['all']);
  const [newTaskTopic, setNewTaskTopic] = useState('daily');
  const [initialLoading, setInitialLoading] = useState(true);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    // Generate dates for the entire current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    const dates = [];
    for(let i = 1; i <= lastDay; i++) {
      const d = new Date(year, month, i);
      // Use local date string to avoid timezone shifts
      const dateStr = d.getFullYear() + '-' + 
                     String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(d.getDate()).padStart(2, '0');
      dates.push(dateStr);
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
  }, [dateRange, selectedDate, activeTopics]);

  const fetchTasksMatrix = async () => {
    const isFirstLoad = uniqueTasks.length === 0;
    if (isFirstLoad) {
      setInitialLoading(true);
    }
    try {
      const promises = dateRange.map(d => api.get(`/tasks?date=${d}`));
      const results = await Promise.all(promises);
      
      const newMatrix = {};
      const taskSet = new Map();

      results.forEach((res, i) => {
        const date = dateRange[i];
        res.data.forEach(task => {
          if (!taskSet.has(task.title)) {
            taskSet.set(task.title, { type: task.type });
          }
          if (!newMatrix[task.title]) {
            newMatrix[task.title] = {};
          }
          newMatrix[task.title][date] = task;
        });
      });

      setMatrixData(newMatrix);
      setUniqueTasks(Array.from(taskSet.entries()).map(([title, info]) => ({ title, type: info.type })));
    } catch (err) {
      console.error(err);
    } finally {
      if (isFirstLoad) {
        setInitialLoading(false);
      }
    }
  };

  const fetchAnalytics = async () => {
    try {
      const typeQuery = activeTopics.includes('all') ? 'all' : activeTopics.join(',');
      const res = await api.get(`/tasks/analytics/weekly?type=${typeQuery}`);
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

  const handleCreateAndToggleTask = async (title, date, type = 'daily', priority = 'moderate') => {
    try {
      playSound('click', soundEnabled);
      setTimeout(() => playSound('reward', soundEnabled), 300);
      window.dispatchEvent(new Event('taskCompleted'));
      
      // Optimistic update
      setMatrixData(prev => {
        const newMatrix = { ...prev };
        if (!newMatrix[title]) newMatrix[title] = {};
        newMatrix[title] = { ...newMatrix[title] };
        newMatrix[title][date] = { _id: 'temp-' + Date.now(), title, date, type, priority, completed: true };
        return newMatrix;
      });

      await api.post('/tasks', {
        title,
        type,
        priority,
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
        type: newTaskTopic,
        priority: 'moderate',
        date: today
      });
      setNewTaskTitle('');
      fetchTasksMatrix();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (oldTitle, newTitle, newType) => {
    if (!newTitle.trim()) {
      setEditingTask(null);
      return;
    }
    try {
      const taskObj = uniqueTasks.find(t => t.title === oldTitle);
      const oldType = taskObj?.type;
      
      if (newTitle !== oldTitle) {
        await api.put('/tasks/rename/bulk', { oldTitle, newTitle });
      }
      if (newType !== oldType) {
        await api.put('/tasks/type/bulk', { title: newTitle, newType });
      }
      
      setEditingTask(null);
      fetchTasksMatrix();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  // Computes the sorted list of tasks based on selected sorting option
  const sortedTasks = React.useMemo(() => {
    if (sortBy === 'default') return uniqueTasks;

    const list = [...uniqueTasks];

    if (sortBy === 'alpha') {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === 'type') {
      return list
        .filter(task => task.type === selectedSortDomain)
        .sort((a, b) => a.title.localeCompare(b.title));
    }

    if (sortBy === 'completion') {
      const getCompletionRate = (title) => {
        const row = matrixData[title];
        if (!row) return 0;
        let completedCount = 0;
        let totalCount = 0;
        dateRange.forEach(d => {
          if (d <= today) {
            totalCount++;
            if (row[d]?.completed) {
              completedCount++;
            }
          }
        });
        return totalCount === 0 ? 0 : completedCount / totalCount;
      };

      return list.sort((a, b) => getCompletionRate(b.title) - getCompletionRate(a.title));
    }

    return list;
  }, [uniqueTasks, sortBy, selectedSortDomain, matrixData, dateRange, today]);

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
    <>
      <AnimatePresence>
        {initialLoading && (
          <motion.div 
            className="loading-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="dashboard-loader">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="550"
                height="210"
                viewBox="0 0 550 210"
              >
                <path
                  id="back"
                  pathLength="100"
                  d="m0,130.08h44.51c7.08-3.45,11.54-24.65,19.42-24.81s13.23,22.54,21.03,24.81c10.03,2.92,29.69-14.6,39.91-12.4,4.58.98,9.34,12.36,14.02,12.4,3.54.03,7.25-9.31,10.79-9.17,3.24.13,6.17,7.93,9.17,9.17s9.68-1.48,12.4,0c2.4,1.3,3.45,10.3,5.93,9.17,3.23-1.48,2.82-103.01,8.09-103.01,6.96,0,12.35,137.53,16.72,137.53,3.9,0-.09-36.61,8.49-43.69,3.41-2.81,13.69,1.93,17.66,0,7.17-3.49,11.72-24.71,19.69-25.08,8.62-.4,15.39,22.86,23.73,25.08,8.99,2.38,26.51-12.76,35.6-10.79,5.58,1.21,11.46,15.82,17.12,15.1,3.88-.49,4.87-12.59,8.76-12.94,3.01-.28,5.7,7.46,8.49,8.63s9.75-1.43,12.54,0,4.03,9.39,7.01,9.71c4.98.54,2.64-103.55,8.63-103.55,5.16,0,8.8,111.51,12.94,111.64,5.02.16,5.01-15.2,9.3-17.8s15.02,2.06,19.42,0c7.39-3.46,12.74-25.17,20.9-25.08,8.97.09,13.68,25.85,22.38,28.04,9.17,2.31,25.4-15.93,34.79-14.83,4.95.58,11.31,10.3,16.04,11.87h44.51"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  id="front"
                  pathLength="100"
                  d="m0,130.08h44.51c7.08-3.45,11.54-24.65,19.42-24.81s13.23,22.54,21.03,24.81c10.03,2.92,29.69-14.6,39.91-12.4,4.58.98,9.34,12.36,14.02,12.4,3.54.03,7.25-9.31,10.79-9.17,3.24.13,6.17,7.93,9.17,9.17s9.68-1.48,12.4,0c2.4,1.3,3.45,10.3,5.93,9.17,3.23-1.48,2.82-103.01,8.09-103.01,6.96,0,12.35,137.53,16.72,137.53,3.9,0-.09-36.61,8.49-43.69,3.41-2.81,13.69,1.93,17.66,0,7.17-3.49,11.72-24.71,19.69-25.08,8.62-.4,15.39,22.86,23.73,25.08,8.99,2.38,26.51-12.76,35.6-10.79,5.58,1.21,11.46,15.82,17.12,15.1,3.88-.49,4.87-12.59,8.76-12.94,3.01-.28,5.7,7.46,8.49,8.63s9.75-1.43,12.54,0,4.03,9.39,7.01,9.71c4.98.54,2.64-103.55,8.63-103.55,5.16,0,8.8,111.51,12.94,111.64,5.02.16,5.01-15.2,9.3-17.8s15.02,2.06,19.42,0c7.39-3.46,12.74-25.17,20.9-25.08,8.97.09,13.68,25.85,22.38,28.04,9.17,2.31,25.4-15.93,34.79-14.83,4.95.58,11.31,10.3,16.04,11.87h44.51"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  fill="none"
                />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-container" style={{ filter: initialLoading ? 'blur(4px)' : 'none', transition: 'filter 0.3s ease' }}>
      <header className="app-header">
        <div className="user-info">
          <div className="user-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

              <div className="liquid-text-container">
                <span>{user?.name?.split(' ')[0]}</span>
                <span>{user?.name?.split(' ')[0]}</span>
              </div>
            </h3>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="profile-tooltip-container">
            <div className="profile-tooltip">
              <div className="profile-tooltip-card">
                <div className="profile-tooltip-user">
                  <div className="profile-tooltip-img">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="profile-tooltip-details">
                    <div className="profile-tooltip-name">{user?.name || 'User'}</div>
                  </div>
                </div>
                <div className="profile-tooltip-about">
                  <Flame size={14} style={{ color: '#F97316' }} />
                  <span>Streak: {user?.dailyStreak || 0} days</span>
                </div>
              </div>
            </div>
            
            <Link to="/profile" className="profile-tooltip-icon">
              <div className="profile-tooltip-layer">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span className="profile-icon-layer">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={20} style={{ color: 'var(--accent-color)' }} />
                  )}
                </span>
              </div>
              <div className="profile-tooltip-text">Profile</div>
            </Link>
          </div>
        </div>
      </header>

      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '24px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Analytics</h2>
            <MultiSelectDropdown activeTopics={activeTopics} setActiveTopics={setActiveTopics} />
          </div>
          {analytics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(max(300px, calc(50% - 24px)), 1fr))', gap: '24px' }}>
              {(activeTopics.includes('all') ? ['all'] : activeTopics).map(topic => (
                <ProductivityChart key={topic} data={analytics.chartData} activeTopics={[topic]} />
              ))}
            </div>
          )}
        </div>

        {/* Main Tasks Section */}
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>
              Your Habit Matrix
            </h2>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500', letterSpacing: '0.5px' }}>SORT BY</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="premium-input"
                style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', minHeight: '38px', cursor: 'pointer' }}
              >
                <option value="default">Default (Drag & Drop)</option>
                <option value="alpha">Alphabetical (A-Z)</option>
                <option value="type">Domain Name</option>
                <option value="completion">Completion Rate</option>
              </select>
              {sortBy === 'type' && (
                <select
                  value={selectedSortDomain}
                  onChange={(e) => setSelectedSortDomain(e.target.value)}
                  className="premium-input"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '13px', minHeight: '38px', cursor: 'pointer' }}
                >
                  <option value="daily">Daily</option>
                  <option value="health">Health</option>
                  <option value="study">Study</option>
                  <option value="work">Work</option>
                </select>
              )}
            </div>
          </div>
          
          <form className="add-task-form" onSubmit={handleAddTask} style={{ gap: '16px', alignItems: 'center' }}>
            <div className="form-control">
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <label>
                {Array.from("What is your next habit?").map((char, index) => (
                  <span key={index} style={{ transitionDelay: `${index * 25}ms` }}>
                    {char === ' ' ? '\u00a0' : char}
                  </span>
                ))}
              </label>
            </div>
            <select 
              value={newTaskTopic} 
              onChange={(e) => setNewTaskTopic(e.target.value)}
              className="premium-input add-task-type"
              style={{ width: 'auto' }}
            >
              <option value="daily">Daily</option>
              <option value="health">Health</option>
              <option value="study">Study</option>
              <option value="work">Work</option>
            </select>
            <button type="submit" className="add-item-btn">
              <span className="button__text">Add Habit</span>
              <span className="button__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" stroke="currentColor" height="24" fill="none" className="svg">
                  <line y2="19" y1="5" x2="12" x1="12"></line>
                  <line y2="12" y1="12" x2="19" x1="5"></line>
                </svg>
              </span>
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
              {sortedTasks.length === 0 ? (
                <div className="tracker-row">
                  <div className="tracker-cell" colSpan={dateRange.length + 1} style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>
                    No tasks found. Add one above!
                  </div>
                </div>
              ) : (
                <Reorder.Group axis="y" values={sortedTasks} onReorder={setUniqueTasks}>
                  {sortedTasks.map(task => (
                    <HabitRow 
                      key={task.title}
                      task={task}
                      today={today}
                      dateRange={dateRange}
                      rowData={matrixData[task.title]}
                      editingTask={editingTask}
                      setEditingTask={setEditingTask}
                      editingValue={editingValue}
                      setEditingValue={setEditingValue}
                      editingType={editingType}
                      setEditingType={setEditingType}
                      handleUpdateTask={handleUpdateTask}
                      handleDeleteBulkTask={handleDeleteBulkTask}
                      handleToggleTask={handleToggleTask}
                      handleCreateAndToggleTask={handleCreateAndToggleTask}
                      showDragHandle={sortBy === 'default'}
                    />
                  ))}
                </Reorder.Group>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Dashboard;
