import React from 'react';

const BlockIcon = ({ size = 20, className = '' }) => {
  return (
    <div 
      className={`legend-block ${className}`}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: size,
        height: size 
      }}
    >
      <div 
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#FF0000',
          borderRadius: '1px'
        }}
      />
    </div>
  );
};

export default BlockIcon;
