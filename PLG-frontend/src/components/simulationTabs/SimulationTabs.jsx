// src/components/simulationTabs/SimulationTabs.jsx
import React from "react";
import { Tabs, Tab, Box } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import "./SimulationTabs.css";

export default function SimulationTabs({ value, onChange }) {
  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs 
        value={value} 
        onChange={(_, v) => onChange(v)}
        className="simulation-tabs"
      >
        <Tab 
          icon={<BarChartIcon />} 
          iconPosition="start" 
          label="Parámetros" 
          className={value === 0 ? "active-tab" : ""}
        />
        <Tab 
          icon={<AssignmentIcon />} 
          iconPosition="start" 
          label="Consideraciones" 
          className={value === 1 ? "active-tab" : ""}
        />
        <Tab 
          icon={<PlayCircleOutlineIcon />} 
          iconPosition="start" 
          label="Simulación" 
          className={value === 2 ? "active-tab" : ""}
          disabled={value < 2}
        />
      </Tabs>
    </Box>
  );
}
