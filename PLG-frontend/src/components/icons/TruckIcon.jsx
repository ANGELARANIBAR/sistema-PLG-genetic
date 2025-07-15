import React from 'react';

const TruckIcon = ({ size = 20, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      className={className}
    >
      {/* Truck cab */}
      <rect 
        x="3" 
        y="10" 
        width="6" 
        height="8" 
        fill="#3498db" 
        stroke="#2980b9" 
        strokeWidth="1"
      />
      {/* Truck trailer */}
      <rect 
        x="9" 
        y="8" 
        width="10" 
        height="10" 
        fill="#3498db" 
        stroke="#2980b9" 
        strokeWidth="1"
      />
      {/* Wheels */}
      <circle 
        cx="6" 
        cy="19" 
        r="2" 
        fill="#34495e"
      />
      <circle 
        cx="16" 
        cy="19" 
        r="2" 
        fill="#34495e"
      />
      {/* Window */}
      <rect 
        x="4" 
        y="11" 
        width="4" 
        height="3" 
        fill="#87ceeb"
      />
    </svg>
  );
};

export default TruckIcon;
