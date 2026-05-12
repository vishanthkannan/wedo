import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label, chartColor }) => {
  if (active && payload && payload.length) {
    const color = chartColor || 'var(--accent-color)';
    const shadowColor = chartColor === '#ff4757' ? 'rgba(255, 71, 87, 0.4)' : 'var(--shadow-glow)';
    return (
      <div style={{ 
        padding: '8px 12px', 
        fontSize: '13px',
        backgroundColor: 'var(--hacker-checkbox-bg)',
        border: `1px solid ${color}`,
        color: color,
        boxShadow: `0 0 10px ${shadowColor}`
      }}>
        <p style={{ fontWeight: 600, marginBottom: '4px' }}>[ {label} ]</p>
        <p>COMPLETED: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const ProductivityChart = React.memo(({ data }) => {
  // Determine if the graph is consistent
  // Let's say consistent means completing tasks on at least half of the recorded days
  const activeDays = data.filter(d => d.completed > 0).length;
  const isConsistent = data.length === 0 || activeDays >= (data.length * 0.3); // Setting a reasonable threshold
  
  const chartColor = isConsistent ? 'var(--accent-color)' : '#ff4757';

  return (
    <motion.div 
      className="premium-card chart-container"
      style={{ border: '1px solid var(--card-border-blur)', background: 'var(--card-bg-blur)', padding: '0', overflow: 'hidden', height: 'auto' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div style={{ padding: '20px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          30-Day Activity {(!isConsistent && data.length > 0) && <span style={{ color: chartColor, marginLeft: '8px', fontSize: '12px' }}>(Inconsistent)</span>}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: chartColor, boxShadow: `0 0 8px ${chartColor}` }}></div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Completed</span>
        </div>
      </div>

      <div style={{ height: '240px', width: '100%', padding: '16px 24px 16px 16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.5}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} 
              tickLine={false} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              minTickGap={30}
              dy={10}
            />
            <Tooltip content={<CustomTooltip chartColor={chartColor} />} cursor={{ stroke: chartColor, strokeWidth: 1, strokeDasharray: '3 3' }} />
            <Area 
              type="monotone" 
              dataKey="completed" 
              stroke={chartColor} 
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCompleted)"
              dot={false}
              activeDot={{ r: 5, fill: 'var(--bg-primary)', stroke: chartColor, strokeWidth: 2 }}
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

export default ProductivityChart;
