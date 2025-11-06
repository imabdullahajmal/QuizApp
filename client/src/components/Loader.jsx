import React from 'react';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 18, height: 18, border: '3px solid #ccc', borderTop: '3px solid #333', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div>{message}</div>
    </div>
  );
};

export default Loader;
