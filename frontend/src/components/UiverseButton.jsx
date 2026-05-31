import React from 'react';

const UiverseButton = ({ text = "SIGN IN", onClick, disabled }) => {
  return (
    <button 
      type="submit" 
      className="space-btn" 
      onClick={onClick}
      disabled={disabled}
      style={disabled ? { opacity: 0.6, cursor: 'not-allowed', pointerEvents: 'none' } : {}}
    >
      <strong>{disabled ? "LOADING..." : text}</strong>
      <div id="container-stars">
        <div id="stars"></div>
      </div>

      <div id="glow">
        <div className="circle"></div>
        <div className="circle"></div>
      </div>
    </button>
  );
};

export default UiverseButton;
