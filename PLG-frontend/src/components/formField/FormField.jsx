import React from 'react';
import { Typography, TextField, InputAdornment } from '@mui/material';
import './FormField.css';

const FormField = ({
  titulo,
  placeholder,
  value,
  onChange, 
  type = 'text',
  multiline = false,
  rows = 1,
  icono = null
}) => {
  return (
    <div className="form-field">
      <Typography variant="subtitle2">{titulo}</Typography>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
        multiline={multiline}
        rows={rows}
        InputProps={{
          startAdornment: icono ? (
            <InputAdornment position="start">{icono}</InputAdornment>
          ) : null
        }}
      />
    </div>
  );
}

export default FormField;