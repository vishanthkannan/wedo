import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  editingPriority,
  setEditingPriority,
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
            <select
              value={editingPriority}
              onChange={(e) => setEditingPriority(e.target.value)}
              className="premium-input"
              style={{ padding: '4px 8px', fontSize: '13px', flex: '0 0 auto', width: 'auto', minWidth: '70px' }}
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
            <button onClick={() => handleUpdateTask(task.title, editingValue, editingType, editingPriority)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-color)' }}>
              <Check size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              {showDragHandle && (
                <div 
                  onPointerDown={(e) => dragControls.start(e)}
                  className="drag-handle-wrapper"
                >
                  <GripVertical size={18} className="drag-handle" />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{task.title}</span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{task.type}</span>
                  <span className={`priority-badge priority-${task.priority || 'moderate'}`}>
                    {task.priority || 'moderate'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="tracker-edit-btn"
                onClick={() => { 
                  setEditingTask(task.title); 
                  setEditingValue(task.title); 
                  setEditingType(task.type || 'daily'); 
                  setEditingPriority(task.priority || 'moderate');
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
  
  // Edit State
  const [editingTask, setEditingTask] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingType, setEditingType] = useState('daily');
  const [editingPriority, setEditingPriority] = useState('moderate');

  // Topic States
  const [activeTopics, setActiveTopics] = useState(['all']);
  const [newTaskTopic, setNewTaskTopic] = useState('daily');
  const [newTaskPriority, setNewTaskPriority] = useState('moderate');
  
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
    try {
      const promises = dateRange.map(d => api.get(`/tasks?date=${d}`));
      const results = await Promise.all(promises);
      
      const newMatrix = {};
      const taskSet = new Map();

      results.forEach((res, i) => {
        const date = dateRange[i];
        res.data.forEach(task => {
          if (!taskSet.has(task.title)) {
            taskSet.set(task.title, { type: task.type, priority: task.priority || 'moderate' });
          }
          if (!newMatrix[task.title]) {
            newMatrix[task.title] = {};
          }
          newMatrix[task.title][date] = task;
        });
      });

      setMatrixData(newMatrix);
      setUniqueTasks(Array.from(taskSet.entries()).map(([title, info]) => ({ title, type: info.type, priority: info.priority })));
    } catch (err) {
      console.error(err);
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
        priority: newTaskPriority,
        date: today
      });
      setNewTaskTitle('');
      setNewTaskPriority('moderate');
      fetchTasksMatrix();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (oldTitle, newTitle, newType, newPriority) => {
    if (!newTitle.trim()) {
      setEditingTask(null);
      return;
    }
    try {
      const taskObj = uniqueTasks.find(t => t.title === oldTitle);
      const oldType = taskObj?.type;
      const oldPriority = taskObj?.priority;
      
      if (newTitle !== oldTitle) {
        await api.put('/tasks/rename/bulk', { oldTitle, newTitle });
      }
      if (newType !== oldType) {
        await api.put('/tasks/type/bulk', { title: newTitle, newType });
      }
      if (newPriority !== oldPriority) {
        await api.put('/tasks/priority/bulk', { title: newTitle, newPriority });
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

    if (sortBy === 'priority-desc' || sortBy === 'priority-asc') {
      const priorityWeights = { high: 3, moderate: 2, low: 1 };
      return list.sort((a, b) => {
        const wA = priorityWeights[a.priority] || 2;
        const wB = priorityWeights[b.priority] || 2;
        return sortBy === 'priority-desc' ? wB - wA : wA - wB;
      });
    }

    if (sortBy === 'type') {
      return list.sort((a, b) => a.type.localeCompare(b.type));
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
  }, [uniqueTasks, sortBy, matrixData, dateRange, today]);

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
      <header className="app-header">
        <div className="user-info">
          <div className="user-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '42px', height: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div className="pyramid-loader" style={{ position: 'absolute', transform: 'scale(1.2) rotateX(-20deg)', transformOrigin: 'center' }}>
                  <div className="wrapper">
                    <span className="side side1"></span>
                    <span className="side side2"></span>
                    <span className="side side3"></span>
                    <span className="side side4"></span>
                    <span className="shadow"></span>
                  </div>  
                </div>
              </div>
              <div className="liquid-text-container">
                <span>{user?.name?.split(' ')[0]}</span>
                <span>{user?.name?.split(' ')[0]}</span>
              </div>
            </h3>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button 
            className="header-icon-btn"
            onClick={() => navigate('/profile')}
            title="Profile Settings"
            style={{ 
              padding: user?.profileImage ? '0' : '8px', 
              overflow: 'hidden', 
              width: '38px', 
              height: '38px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={20} />
            )}
          </button>
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
        <div>
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
                <option value="priority-desc">Priority (High to Low)</option>
                <option value="priority-asc">Priority (Low to High)</option>
                <option value="type">Domain Name</option>
                <option value="completion">Completion Rate</option>
              </select>
            </div>
          </div>
          
          <form className="add-task-form" onSubmit={handleAddTask}>
            <input 
              type="text" 
              className="premium-input add-task-input" 
              placeholder="What new habit do you want to start?" 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
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
            <select 
              value={newTaskPriority} 
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="premium-input add-task-priority"
              style={{ width: 'auto' }}
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
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
              {uniqueTasks.length === 0 ? (
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
                      editingPriority={editingPriority}
                      setEditingPriority={setEditingPriority}
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

        {/* Empty placeholder to keep the grid layout balanced */}
        <div></div>
      </div>
    </div>
  );
};

export default Dashboard;
