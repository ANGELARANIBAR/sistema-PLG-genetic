// src/pages/Configuracion.jsx
import React, { useState } from "react";
import { Box, Paper, Typography, Button, TextField, InputAdornment, IconButton, Alert } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import "./Configuracion.css";

export default function Configuracion() {
  const [selectedFiles, setSelectedFiles] = useState({ bloqueos: "", averias: "", mantenimientos: "" });
  const [message, setMessage] = useState("");

  const handleFileUpload = (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        setSelectedFiles((prev) => ({ ...prev, [type]: file.name }));

        const text = await file.text();
        const lines = text.split("\n").map((line) => line.trim());

        let parsedData;
        if (type === "averias") {
          parsedData = lines.map((line) => {
            const [turno, codigo, tipo] = line.split("_");
            return { turno, codigo, tipo };
          });
        } else if (type === "mantenimientos" || type === "bloqueos") {
          parsedData = lines.map((line) => {
            return { raw: line };
          });
        }

        console.log(`Datos procesados (${type}):`, parsedData);
        setMessage(`✅ Archivo procesado correctamente (${type}). Revisa la consola para más detalles.`);
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(""), 3000);
      }
    };
    input.click();
  };

  return (
    <Box className="configuracion-container">
      <Typography variant="h4" fontWeight="700" gutterBottom>
        Configuración
      </Typography>

      <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="600" gutterBottom>
          Carga de archivos de configuración
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Considerar que solo se permiten archivos en formato txt
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Bloqueos
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
            <Button
              variant="contained"
              className="examine-button"
              onClick={() => handleFileUpload("bloqueos")}
            >
              Examinar
            </Button>
            <TextField
              fullWidth
              disabled
              value={selectedFiles.bloqueos || "No se ha seleccionado archivo"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <InfoIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Averías
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
            <Button
              variant="contained"
              className="examine-button"
              onClick={() => handleFileUpload("averias")}
            >
              Examinar
            </Button>
            <TextField
              fullWidth
              disabled
              value={selectedFiles.averias || "No se ha seleccionado archivo"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <InfoIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            Mantenimiento
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
            <Button
              variant="contained"
              className="examine-button"
              onClick={() => handleFileUpload("mantenimientos")}
            >
              Examinar
            </Button>
            <TextField
              fullWidth
              disabled
              value={selectedFiles.mantenimientos || "No se ha seleccionado archivo"}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end">
                      <InfoIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>

        {message && (
          <Alert 
            severity={message.includes('✅') ? 'success' : 'error'} 
            sx={{ mt: 3 }}
          >
            {message}
          </Alert>
        )}
      </Paper>
    </Box>
  );
}
