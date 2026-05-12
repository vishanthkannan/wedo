import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const CustomTooltip = ({ active, payload, label, singleColor }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ 
        padding: '8px 12px', 
        fontSize: '13px',
        backgroundColor: 'var(--hacker-checkbox-bg)',
        border: `1px solid ${singleColor || 'var(--accent-color)'}`,
        color: 'var(--text-primary)',
        boxShadow: `0 0 10px var(--shadow-glow)`
      }}>
        <p style={{ fontWeight: 600, marginBottom: '6px', color: singleColor || 'var(--accent-color)' }}>[ {label} ]</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color, marginBottom: '2px', fontSize: '12px' }}>
            <span style={{ textTransform: 'uppercase' }}>{entry.name === 'completed' ? 'Total' : entry.name}</span>: {entry.value || 0}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PALETTE = ['#1e90ff', '#2ed573', '#ff4757', '#ffa502', '#ff7f50', '#a4b0be'];

const ProductivityChart = React.memo(({ data, activeTopics = ['all'] }) => {
  const isSingle = activeTopics.length === 1;
  const singleKey = activeTopics[0] === 'all' ? 'completed' : activeTopics[0];

  let chartColor = 'var(--accent-color)';
  let statusText = '';
  
  if (isSingle && data && data.length >= 3) {
    const last3 = data.slice(-3);
    const is3DayStreak = last3.every(d => (d[singleKey] || 0) > 0);
    
    if (is3DayStreak) {
      chartColor = '#2ed573'; // Green
      statusText = '(3-Day Streak!)';
    } else {
      const today = data[data.length - 1];
      const yesterday = data[data.length - 2];
      if (today && yesterday) {
        if ((today[singleKey] || 0) > (yesterday[singleKey] || 0)) {
          chartColor = '#1e90ff'; // Blue
          statusText = '(Trending Up)';
        } else if ((today[singleKey] || 0) < (yesterday[singleKey] || 0)) {
          chartColor = '#ff4757'; // Red
          statusText = '(Trending Down)';
        } else {
          chartColor = 'var(--accent-color)';
          statusText = '';
        }
      }
    }
  }

  const keysToRender = activeTopics.includes('all') ? ['completed'] : activeTopics;

  return (
    <motion.div 
      className="premium-card chart-container"
      style={{ border: '1px solid var(--card-border-blur)', background: 'var(--card-bg-blur)', padding: '0', overflow: 'hidden', height: 'auto' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div style={{ padding: '20px 24px 0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          {singleKey === 'completed' ? 'Overall' : singleKey} Activity {isSingle && statusText && <span style={{ color: chartColor, marginLeft: '8px', fontSize: '12px' }}>{statusText}</span>}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {keysToRender.map((key, i) => {
            const color = isSingle ? chartColor : PALETTE[i % PALETTE.length];
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}` }}></div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {key === 'completed' ? 'Total' : key}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: '240px', width: '100%', padding: '16px 24px 16px 16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {keysToRender.map((key, i) => {
                const color = isSingle ? chartColor : PALETTE[i % PALETTE.length];
                return (
                  <linearGradient key={`color-${key}`} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0.0}/>
                  </linearGradient>
                );
              })}
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} 
              tickLine={false} 
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              minTickGap={30}
              dy={10}
            />
            <Tooltip content={<CustomTooltip singleColor={isSingle ? chartColor : null} />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '3 3' }} />
            {keysToRender.map((key, i) => {
              const color = isSingle ? chartColor : PALETTE[i % PALETTE.length];
              return (
                <Area 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={color} 
                  strokeWidth={isSingle ? 3 : 2}
                  fillOpacity={1}
                  fill={`url(#color-${key})`}
                  dot={false}
                  activeDot={{ r: 5, fill: 'var(--bg-primary)', stroke: color, strokeWidth: 2 }}
                  animationDuration={1500}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
});

export default ProductivityChart;
