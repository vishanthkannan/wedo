import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import TaskItem from '../components/TaskItem';
import ProductivityChart from '../components/ProductivityChart';
import MidnightSkyBackground from '../components/MidnightSkyBackground';
import { playSound } from '../utils/audio';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Plus, Flame, Volume2, VolumeX, LogOut, Check, Edit2, Trash2, Sun, Moon, GripVertical } from 'lucide-react';

const HackerCheckbox = React.memo(({ id, checked, onChange, disabled }) => {
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
        <div className="grid-bg"></div>
        
        {/* Only render expensive glitch overlays and particles when active/hovered */}
        {(isHovered || checked) && (
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
        return (
          <div key={d} className={`tracker-cell ${d > today ? 'disabled-cell' : ''}`}>
            {t ? (
              <HackerCheckbox 
                id={`checkbox-${t._id}`}
                checked={t.completed}
                onChange={(completed) => handleToggleTask(t._id, completed)}
                disabled={d > today}
              />
            ) : (
              <HackerCheckbox 
                id={`checkbox-new-${task.title}-${d}`}
                checked={false}
                onChange={() => handleCreateAndToggleTask(task.title, d, task.type)}
                disabled={d > today}
              />
            )}
          </div>
        );
      })}
    </Reorder.Item>
  );
});

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
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
  const [activeTopic, setActiveTopic] = useState('all');
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
  }, [dateRange, selectedDate, activeTopic]);

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
      const res = await api.get(`/tasks/analytics/weekly${activeTopic !== 'all' ? `?type=${activeTopic}` : ''}`);
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
      <MidnightSkyBackground />
      <header className="app-header">
        <div className="user-info">
          <div className="loading" style={{ marginRight: '10px' }}>
            <svg height="48px" width="64px">
              <polyline id="back" points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"></polyline>
              <polyline id="front" points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24"></polyline>
            </svg>
          </div>
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
            className="header-icon-btn"
            onClick={() => setSoundEnabled(!soundEnabled)} 
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            className="header-icon-btn logout-btn"
            onClick={logout}
            title="Log Out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Analytics</h2>
            <select 
              value={activeTopic} 
              onChange={(e) => setActiveTopic(e.target.value)}
              className="premium-input"
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              <option value="all">All Topics</option>
              <option value="daily">Daily</option>
              <option value="health">Health</option>
              <option value="study">Study</option>
              <option value="work">Work</option>
            </select>
          </div>
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
