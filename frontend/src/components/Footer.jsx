import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      width: '100%',
      padding: '24px 0 16px 0',
      textAlign: 'center',
      fontSize: '13px',
      color: 'var(--text-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      letterSpacing: '0.3px',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <span>Developed by</span>
      <a 
        href="https://www.linkedin.com/in/vishanthkannan/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--accent-color)',
          textDecoration: 'none',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          borderBottom: '1px dashed transparent'
        }}
        onMouseEnter={(e) => {
          e.target.style.color = 'var(--text-primary)';
          e.target.style.borderBottomColor = 'var(--accent-color)';
        }}
        onMouseLeave={(e) => {
          e.target.style.color = 'var(--accent-color)';
          e.target.style.borderBottomColor = 'transparent';
        }}
      >
        vishanthkannan
      </a>
    </footer>
  );
};

export default Footer;
