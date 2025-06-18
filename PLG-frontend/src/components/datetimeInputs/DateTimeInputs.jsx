// src/components/datetimeInputs/DateTimeInputs.jsx
import React from "react";
import { Grid, TextField, Typography, Box, InputAdornment } from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import "./DateTimeInputs.css";

export default function DateTimeInputs({ date, time, onDateChange, onTimeChange }) {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Tiempo de inicio
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" className="input-label">
            Fecha inicial*
          </Typography>
          <TextField
            fullWidth
            placeholder="YYYY-MM-DD"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="datetime-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayIcon className="input-icon" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" className="input-label">
            Hora inicial*
          </Typography>
          <TextField
            fullWidth
            placeholder="HH:MM"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="datetime-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccessTimeIcon className="input-icon" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
