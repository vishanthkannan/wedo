import React from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';

const TaskItem = ({ task, onToggle, onDelete }) => {
  return (
    <motion.div 
      className="task-item"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      layout
    >
      <div 
        className={`task-checkbox ${task.completed ? 'completed' : ''}`}
        onClick={() => onToggle(task._id, !task.completed, task.type)}
      >
        {task.completed && <Check size={16} />}
      </div>
      
      <div className="task-content">
        <div className={`task-title ${task.completed ? 'completed' : ''}`}>
          {task.title}
        </div>
        <span className="task-type-badge">
          {task.type === 'daily' ? 'Routine' : 'Task'}
        </span>
      </div>
      
      <button className="task-delete" onClick={() => onDelete(task._id)}>
        <Trash2 size={18} />
      </button>
    </motion.div>
  );
};

export default TaskItem;
