import React from 'react';

const RouteIcon = ({ size = 20, className = '' }) => {
  return (
    <div 
      className={`legend-line route-legend ${className}`}
      style={{
        width: size,
        height: '3px',
        backgroundColor: '#000000',
        borderStyle: 'dashed',
        borderWidth: '0 0 2px 0',
        borderColor: '#000000',
        backgroundImage: 'linear-gradient(to right, #000000 50%, transparent 50%)',
        backgroundSize: '8px 2px',
        backgroundRepeat: 'repeat-x'
      }}
    />
  );
};

export default RouteIcon;
