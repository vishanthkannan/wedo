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
  handleUpdateTask, 
  handleDeleteBulkTask, 
  handleToggleTask, 
  handleCreateAndToggleTask 
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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
            <input 
              type="text" 
              className="premium-input" 
              style={{ padding: '4px 8px', fontSize: '13px', flex: '1', minWidth: '80px' }}
              value={editingValue} 
              onChange={(e) => setEditingValue(e.target.value)} 
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUpdateTask(task.title, editingValue, editingType);
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
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <div 
                onPointerDown={(e) => dragControls.start(e)}
                className="drag-handle-wrapper"
              >
                <GripVertical size={18} className="drag-handle" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span>{task.title}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{task.type}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className="tracker-edit-btn"
                onClick={() => { setEditingTask(task.title); setEditingValue(task.title); setEditingType(task.type || 'daily'); }}
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
                onChange={() => handleCreateAndToggleTask(task.title, d, task.type)}
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
  
  // Edit State
  const [editingTask, setEditingTask] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingType, setEditingType] = useState('daily');

  // Topic States
  const [activeTopics, setActiveTopics] = useState(['all']);
  const [newTaskTopic, setNewTaskTopic] = useState('daily');
  
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

  const handleCreateAndToggleTask = async (title, date, type = 'daily') => {
    try {
      playSound('click', soundEnabled);
      setTimeout(() => playSound('reward', soundEnabled), 300);
      window.dispatchEvent(new Event('taskCompleted'));
      
      // Optimistic update
      setMatrixData(prev => {
        const newMatrix = { ...prev };
        if (!newMatrix[title]) newMatrix[title] = {};
        newMatrix[title] = { ...newMatrix[title] };
        newMatrix[title][date] = { _id: 'temp-' + Date.now(), title, date, type, completed: true };
        return newMatrix;
      });

      await api.post('/tasks', {
        title,
        type,
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
      const oldType = uniqueTasks.find(t => t.title === oldTitle)?.type;
      
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
          <div className="svg-frame">
            <svg style={{ '--i': 0, '--j': 0 }}>
              <g id="out1">
                <path
                  d="M72 172C72 116.772 116.772 72 172 72C227.228 72 272 116.772 272 172C272 227.228 227.228 272 172 272C116.772 272 72 227.228 72 172ZM197.322 172C197.322 158.015 185.985 146.678 172 146.678C158.015 146.678 146.678 158.015 146.678 172C146.678 185.985 158.015 197.322 172 197.322C185.985 197.322 197.322 185.985 197.322 172Z"
                ></path>
                <path
                  mask="url(#path-1-inside-1_111_3212)"
                  strokeMiterlimit="16"
                  strokeWidth="2"
                  stroke="#00FFFF"
                  d="M72 172C72 116.772 116.772 72 172 72C227.228 72 272 116.772 272 172C272 227.228 227.228 272 172 272C116.772 272 72 227.228 72 172ZM197.322 172C197.322 158.015 185.985 146.678 172 146.678C158.015 146.678 146.678 158.015 146.678 172C146.678 185.985 158.015 197.322 172 197.322C185.985 197.322 197.322 185.985 197.322 172Z"
                ></path>
              </g>
            </svg>
            <svg style={{ '--i': 1, '--j': 1 }}>
              <g id="out2">
                <mask fill="white" id="path-2-inside-2_111_3212">
                  <path
                    d="M102.892 127.966C93.3733 142.905 88.9517 160.527 90.2897 178.19L94.3752 177.88C93.1041 161.1 97.3046 144.36 106.347 130.168L102.892 127.966Z"
                  ></path>
                  <path
                    d="M93.3401 194.968C98.3049 211.971 108.646 226.908 122.814 237.541L125.273 234.264C111.814 224.163 101.99 209.973 97.2731 193.819L93.3401 194.968Z"
                  ></path>
                  <path
                    d="M152.707 92.3592C140.33 95.3575 128.822 101.199 119.097 109.421L121.742 112.55C130.981 104.739 141.914 99.1897 153.672 96.3413L152.707 92.3592Z"
                  ></path>
                  <path
                    d="M253.294 161.699C255.099 175.98 253.132 190.4 247.59 203.639L243.811 202.057C249.075 189.48 250.944 175.74 249.23 162.214L253.294 161.699Z"
                  ></path>
                  <path
                    d="M172 90.0557C184.677 90.0557 197.18 92.9967 208.528 98.6474C219.875 104.298 229.757 112.505 237.396 122.621L234.126 125.09C226.869 115.479 217.481 107.683 206.701 102.315C195.921 96.9469 184.043 94.1529 172 94.1529V90.0557Z"
                  ></path>
                  <path
                    d="M244.195 133.235C246.991 138.442 249.216 143.937 250.83 149.623L246.888 150.742C245.355 145.34 243.242 140.12 240.586 135.174L244.195 133.235Z"
                  ></path>
                  <path
                    d="M234.238 225.304C223.932 237.338 210.358 246.126 195.159 250.604C179.961 255.082 163.79 255.058 148.606 250.534L149.775 246.607C164.201 250.905 179.563 250.928 194.001 246.674C208.44 242.42 221.335 234.071 231.126 222.639L234.238 225.304Z"
                  ></path>
                </mask>                <path
                  mask="url(#path-2-inside-2_111_3212)"
                  fill="#00FFFF"
                  d="M102.892 127.966C93.3733 142.905 88.9517 160.527 90.2897 178.19L94.3752 177.88C93.1041 161.1 97.3046 144.36 106.347 130.168L102.892 127.966ZM93.3401 194.968C98.3049 211.971 108.646 226.908 122.814 237.541L125.273 234.264C111.814 224.163 101.99 209.973 97.2731 193.819L93.3401 194.968ZM152.707 92.3592C140.33 95.3575 128.822 101.199 119.097 109.421L121.742 112.55C130.981 104.739 141.914 99.1897 153.672 96.3413L152.707 92.3592ZM253.294 161.699C255.099 175.98 253.132 190.4 247.59 203.639L243.811 202.057C249.075 189.48 250.944 175.74 249.23 162.214L253.294 161.699ZM172 90.0557C184.677 90.0557 197.18 92.9967 208.528 98.6474C219.875 104.298 229.757 112.505 237.396 122.621L234.126 125.09C226.869 115.479 217.481 107.683 206.701 102.315C195.921 96.9469 184.043 94.1529 172 94.1529V90.0557ZZM244.195 133.235C246.991 138.442 249.216 143.937 250.83 149.623L246.888 150.742C245.355 145.34 243.242 140.12 240.586 135.174L244.195 133.235ZM234.238 225.304C223.932 237.338 210.358 246.126 195.159 250.604C179.961 255.082 163.79 255.058 148.606 250.534L149.775 246.607C164.201 250.905 179.563 250.928 194.001 246.674C208.44 242.42 221.335 234.071 231.126 222.639L234.238 225.304Z"
                ></path>
              </g>
              <path
                stroke="#00FFFF"
                d="M240.944 172C240.944 187.951 235.414 203.408 225.295 215.738C215.176 228.068 201.095 236.508 185.45 239.62C169.806 242.732 153.567 240.323 139.5 232.804C125.433 225.285 114.408 213.12 108.304 198.384C102.2 183.648 101.394 167.25 106.024 151.987C110.654 136.723 120.434 123.537 133.696 114.675C146.959 105.813 162.884 101.824 178.758 103.388C194.632 104.951 209.472 111.97 220.751 123.249"
                id="out3"
              ></path>
            </svg>

            <svg style={{ '--i': 1, '--j': 3 }}>
              <g id="inner1">
                <path
                  fill="#00FFFF"
                  d="M145.949 124.51L148.554 129.259C156.575 124.859 165.672 122.804 174.806 123.331C183.94 123.858 192.741 126.944 200.203 132.236C207.665 137.529 213.488 144.815 217.004 153.261C220.521 161.707 221.59 170.972 220.09 179.997L224.108 180.665L224.102 180.699L229.537 181.607C230.521 175.715 230.594 169.708 229.753 163.795L225.628 164.381C224.987 159.867 224.987 159.867 225.628 164.381ZM224.638 164.522C224.009 160.091 222.819 155.735 221.082 151.563C217.246 142.352 210.897 134.406 202.758 128.634C194.62 122.862 185.021 119.496 175.06 118.922C165.432 118.367 155.841 120.441 147.311 124.914L148.954 127.91C156.922 123.745 165.876 122.333C174.864 122.333C184.185 122.87 193.166 126.019 200.782 131.421C208.397 136.822 214.339 144.257 217.928 152.877C221.388 161.188 222.526 170.276 221.23 179.173L224.262 179.677C224.998 174.671 225.35 169.535 224.638 164.522Z"
                  clipRule="evenodd"
                  fillRule="evenodd"
                ></path>
                <path
                  fill="#00FFFF"
                  d="M139.91 220.713C134.922 217.428 130.469 213.395 126.705 208.758L130.983 205.286L130.985 205.288L134.148 202.721C141.342 211.584 151.417 217.642 162.619 219.839C173.821 222.036 185.438 220.232 195.446 214.742L198.051 219.491C197.759 219.651 197.465 219.809 197.17 219.963C186.252 225.693 173.696 227.531 161.577 225.154C154.613 223.789 148.041 221.08 142.202 217.234L139.91 220.713ZM142.752 216.399C148.483 220.174 154.934 222.833 161.769 224.173C173.658 226.504 185.977 224.704 196.689 219.087L195.046 216.09C185.035 221.323 173.531 222.998 162.427 220.82C151.323 218.643 141.303 212.747 134.01 204.122L131.182 206.5C134.451 210.376 138.515 213.607 142.752 216.399Z"
                  clipRule="evenodd"
                  fillRule="evenodd"
                ></path>
              </g>
            </svg>

            <svg style={{ '--i': 2, '--j': 4 }}>
              <path
                fill="#00FFFF"
                d="M180.956 186.056C183.849 184.212 186.103 181.521 187.41 178.349C188.717 175.177 189.013 171.679 188.258 168.332C187.503 164.986 185.734 161.954 183.192 159.65C180.649 157.346 177.458 155.883 174.054 155.46C170.649 155.038 167.197 155.676 164.169 157.288C161.14 158.9 158.683 161.407 157.133 164.468C155.582 167.528 155.014 170.992 155.505 174.388C155.997 177.783 157.524 180.944 159.879 183.439L161.129 182.259C159.018 180.021 157.648 177.186 157.207 174.141C156.766 171.096 157.276 167.989 158.667 165.245C160.057 162.5 162.261 160.252 164.977 158.806C167.693 157.36 170.788 156.788 173.842 157.167C176.895 157.546 179.757 158.858 182.037 160.924C184.317 162.99 185.904 165.709 186.581 168.711C187.258 171.712 186.992 174.849 185.82 177.694C184.648 180.539 182.627 182.952 180.032 184.606L180.956 186.056Z"
                id="center1"
              ></path>
              <path
                fill="#00FFFF"
                d="M172 166.445C175.068 166.445 177.556 168.932 177.556 172C177.556 175.068 175.068 177.556 172 177.556C168.932 177.556 166.444 175.068 166.444 172C166.444 168.932 168.932 166.445 172 166.445ZM172 177.021C174.773 177.021 177.021 174.773 177.021 172C177.021 169.227 174.773 166.979 172 166.979C169.227 166.979 166.979 169.227 166.979 172C166.979 174.773 169.227 177.021 172 177.021Z"
                id="center"
              ></path>
            </svg>
          </div>
          <div className="user-details" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="loading" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <svg height="24px" width="32px" viewBox="0 0 64 48">
                  <polyline id="back" points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"></polyline>
                  <polyline id="front" points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"></polyline>
                </svg>
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
          >
            <User size={20} />
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
              {uniqueTasks.length === 0 ? (
                <div className="tracker-row">
                  <div className="tracker-cell" colSpan={dateRange.length + 1} style={{ padding: '40px', color: 'var(--text-secondary)', textAlign: 'center', width: '100%' }}>
                    No tasks found. Add one above!
                  </div>
                </div>
              ) : (
                <Reorder.Group axis="y" values={uniqueTasks} onReorder={setUniqueTasks}>
                  {uniqueTasks.map(task => (
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
