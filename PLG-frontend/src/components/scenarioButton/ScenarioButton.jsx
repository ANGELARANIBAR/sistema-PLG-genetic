// src/components/scenarioButton/ScenarioButton.jsx

import React from "react";
import { Box, Typography } from "@mui/material";
import "./ScenarioButton.css";

export default function ScenarioButton({ label, icon, selected, onClick, disabled, className }) {
  return (
    <Box
      className={`scenario-button ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${className || ''}`}
      onClick={!disabled ? onClick : undefined}
    >
      <Box className="scenario-content">
        <Typography className="scenario-label">{label}</Typography>
        <Box className="scenario-icon">
          {icon}
        </Box>
      </Box>
    </Box>
  );
}
