import React from 'react';
import { Box } from '@mui/material';
import './PaginationDots.css';

export default function PaginationDots({ count, active, onChange }) {
  return (
    <Box className="pagination-dots-container">
      {Array.from({ length: count }).map((_, index) => (
        <Box 
          key={index}
          className={`pagination-dot ${index === active ? 'active' : ''}`}
          onClick={() => onChange(index)}
        />
      ))}
    </Box>
  );
} 