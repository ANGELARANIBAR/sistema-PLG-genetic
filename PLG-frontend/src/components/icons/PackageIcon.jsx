import React from 'react';

const PackageIcon = ({ size = 16, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none"
      className={className}
    >
      {/* 3D Box - Front face */}
      <rect 
        x="1" 
        y="4" 
        width="12" 
        height="10" 
        fill="#FFB366" 
        stroke="#E8944A" 
        strokeWidth="1"
      />
      {/* 3D Box - Top face */}
      <polygon 
        points="1,4 3,2 15,2 13,4" 
        fill="#FFC999" 
        stroke="#E8944A" 
        strokeWidth="1"
      />
      {/* 3D Box - Right face */}
      <polygon 
        points="13,4 15,2 15,12 13,14" 
        fill="#FF9933" 
        stroke="#E8944A" 
        strokeWidth="1"
      />
      {/* Box tape - horizontal */}
      <line 
        x1="1" 
        y1="9" 
        x2="13" 
        y2="9" 
        stroke="#CC6600" 
        strokeWidth="1.5"
      />
      {/* Box tape - vertical */}
      <line 
        x1="7" 
        y1="4" 
        x2="7" 
        y2="14" 
        stroke="#CC6600" 
        strokeWidth="1.5"
      />
      {/* Box tape on top */}
      <line 
        x1="3" 
        y1="2" 
        x2="10" 
        y2="2" 
        stroke="#CC6600" 
        strokeWidth="1.2"
      />
    </svg>
  );
};

export default PackageIcon;
