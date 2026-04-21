import React from 'react';

const UiverseButton = ({ text = "SIGN IN", onClick }) => {
  return (
    <button type="submit" className="space-btn" onClick={onClick}>
      <strong>{text}</strong>
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
