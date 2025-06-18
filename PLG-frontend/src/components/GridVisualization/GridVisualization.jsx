import React from "react";
import { Box } from "@mui/material";
import PropTypes from "prop-types";
import "./GridVisualization.css";

const GridVisualization = ({ rows, cols, cellSize, onCellClick }) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: "1px",
        backgroundColor: "#e0e0e0",
      }}
    >
      {Array.from({ length: rows * cols }).map((_, index) => (
        <Box
          key={index}
          sx={{
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            backgroundColor: "#ffffff",
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
          onClick={() => onCellClick(index)}
        />
      ))}
    </Box>
  );
};

GridVisualization.propTypes = {
  rows: PropTypes.number.isRequired,
  cols: PropTypes.number.isRequired,
  cellSize: PropTypes.number.isRequired,
  onCellClick: PropTypes.func,
};

GridVisualization.defaultProps = {
  onCellClick: () => {},
};

export default GridVisualization;
