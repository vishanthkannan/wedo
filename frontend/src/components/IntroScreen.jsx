import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

const IntroScreen = () => {

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'var(--bg-primary)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}
    >
      <div className="loader">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 100 100"
          width="100"
          height="100"
          className="inline-block"
        >
          <defs>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              y2="2"
              x2="0"
              y1="62"
              x1="0"
              id="wedo-gradient-b"
            >
              <stop stopColor="#0369a1"></stop>
              <stop stopColor="#67e8f9" offset="1.5"></stop>
            </linearGradient>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              y2="0"
              x2="0"
              y1="64"
              x1="0"
              id="wedo-gradient-c"
            >
              <stop stopColor="#0369a1"></stop>
              <stop stopColor="#22d3ee" offset="1"></stop>
            </linearGradient>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              y2="2"
              x2="0"
              y1="62"
              x1="0"
              id="wedo-gradient-d"
            >
              <stop stopColor="#38bdf8"></stop>
              <stop stopColor="#075985" offset="1.5"></stop>
            </linearGradient>
          </defs>
          <path
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="12"
            stroke="url(#wedo-gradient-d)"
            d="M 15,20 L 35,80 L 50,50 L 65,80 L 85,20"
            className="dash"
            pathLength="360"
          ></path>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 100 100"
          width="100"
          height="100"
          className="inline-block"
        >
          <path
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="8"
            stroke="url(#wedo-gradient-b)"
            d="M 20,20 L 80,20 
            L 80,27 L 27,27 L 27,50
            L 70,50 L 70,57 
            L 25,57 L 25,80 
            L 80,80 L 80,87 L 20,87 Z"
            className="dash"
            id="E"
            pathLength="360"
          ></path>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 100 100"
          width="100"
          height="100"
          className="inline-block"
        >
          <path
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="12"
            stroke="url(#wedo-gradient-b)"
            d="M 25,20 L 25,80 C 85,80 85,20 25,20 Z"
            className="dash"
            pathLength="360"
          ></path>
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 100 100"
          width="100"
          height="100"
          className="inline-block"
        >
          <path
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="11"
            stroke="url(#wedo-gradient-c)"
            d="M 50,15  
            A 35,35 0 0 1 85,50  
            A 35,35 0 0 1 50,85  
            A 35,35 0 0 1 15,50  
            A 35,35 0 0 1 50,15 Z"
            className="dash"
            id="o"
            pathLength="360"
          ></path>
        </svg>
      </div>
      
    </motion.div>
  );
};

export default IntroScreen;
