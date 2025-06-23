// src/components/scenarioSelector/ScenarioSelector.jsx
import React from "react";
import { Box } from "@mui/material";
import TodayIcon from "@mui/icons-material/Today";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ScenarioButton from "../scenarioButton/ScenarioButton";
import "./ScenarioSelector.css";

export default function ScenarioSelector({ value, onChange }) {
  const scenarios = [
    { key: "diario", label: "Operación diaria", icon: <TodayIcon />, clickable: true, disabled: false },
    { key: "semanal", label: "Semanal", icon: <CalendarMonthIcon />, clickable: true, disabled: false },
    { key: "colapso", label: "Colapso logístico", icon: <WarningAmberIcon />, clickable: true, disabled: false },
  ];

  return (
    <Box className="scenario-container">
      {scenarios.map((s) => (
        <ScenarioButton
          key={s.key}
          label={s.label}
          icon={s.icon}
          selected={value === s.key}
          onClick={s.clickable ? () => onChange(s.key) : undefined}
          className={s.disabled ? "disabled" : ""}
        />
      ))}
    </Box>
  );
}
