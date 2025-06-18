// src/pages/Simulacion.jsx
import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, TextField, InputAdornment, IconButton, Divider, Alert, FormHelperText } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import ScenarioSelector from "../components/scenarioSelector/ScenarioSelector";
import DateTimeInputs from "../components/datetimeInputs/DateTimeInputs";
import SimulationTabs from "../components/simulationTabs/SimulationTabs";
import { useNavigate } from 'react-router-dom';
import { simulationService } from "../services/simulationService";
import "./Simulacion.css";

export default function Simulacion() {
  const [tab, setTab] = useState(0);
  const [escenario, setEscenario] = useState("diario");
  const [fecha, setFecha] = useState("2025-03-23");
  const [hora, setHora] = useState("10:30");
  const [selectedFiles, setSelectedFiles] = useState({ 
    bloqueos: null, 
    averias: null, 
    mantenimientos: null,
    pedidos: null 
  });
  const [fileErrors, setFileErrors] = useState({
    bloqueos: "",
    averias: "",
    mantenimientos: "",
    pedidos: ""
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parametersSubmitted, setParametersSubmitted] = useState(false);
  const navigate = useNavigate();

  // Prevent direct access to tab 1 if parameters haven't been submitted
  useEffect(() => {
    if (tab === 1 && !parametersSubmitted) {
      setTab(0);
    }
  }, [tab, parametersSubmitted]);

  const validateFile = (file) => {
    // Check if it's a text file
    if (!file.name.toLowerCase().endsWith('.txt')) {
      throw new Error('Solo se permiten archivos de texto (.txt)');
    }
    
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('El archivo es demasiado grande (máximo 5MB)');
    }
  };

  const handleFileUpload = (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          // Reset error for this file type
          setFileErrors(prev => ({
            ...prev,
            [type]: ""
          }));
          
          // Validate file
          validateFile(file);
          
          setSelectedFiles((prev) => ({ ...prev, [type]: file }));

          const text = await file.text();
          const lines = text.split("\n").map((line) => line.trim());

          let parsedData;
          if (type === "averias") {
            parsedData = lines.map((line) => {
              const [turno, codigo, tipo] = line.split("_");
              return { turno, codigo, tipo };
            });
          } else if (type === "mantenimientos" || type === "bloqueos" || type === "pedidos") {
            parsedData = lines.map((line) => {
              return { raw: line };
            });
          }

          console.log(`Datos procesados (${type}):`, parsedData);
        } catch (error) {
          setFileErrors(prev => ({
            ...prev,
            [type]: error.message
          }));
        }
      }
    };
    input.click();
  };

  const handleNextToConsiderations = () => {
    // Validate date and time
    if (!fecha || !hora) {
      setMessage("❌ Por favor complete la fecha y hora");
      return;
    }
    
    setParametersSubmitted(true);
    setTab(1);
    setMessage("");
  };

  const uploadFiles = async () => {
    try {
      // Upload pedidos file
      if (selectedFiles.pedidos) {
        await simulationService.uploadPedidosFile(selectedFiles.pedidos);
      }
      
      // Upload bloqueos file
      if (selectedFiles.bloqueos) {
        await simulationService.uploadBloqueosFile(selectedFiles.bloqueos);
      }
      
      // Upload averias file
      if (selectedFiles.averias) {
        await simulationService.uploadAveriasFile(selectedFiles.averias);
      }
      
      // Upload mantenimiento file
      if (selectedFiles.mantenimientos) {
        await simulationService.uploadMantenimientoFile(selectedFiles.mantenimientos);
      }
      
      return true;
    } catch (error) {
      console.error('Error uploading files:', error);
      setMessage(`❌ Error al cargar los archivos: ${error.message}`);
      return false;
    }
  };

  const handleNext = async () => {
    // Validate files are uploaded
    const requiredFiles = ['bloqueos', 'averias', 'mantenimientos', 'pedidos'];
    const missingFiles = requiredFiles.filter(fileType => !selectedFiles[fileType]);
    
    if (missingFiles.length > 0) {
      setMessage(`❌ Por favor cargue los siguientes archivos: ${missingFiles.join(', ')}`);
      return;
    }
    
    setIsLoading(true);
    setMessage("");

    try {
      // First upload all files
      const filesUploaded = await uploadFiles();
      if (!filesUploaded) {
        throw new Error("Error al cargar los archivos");
      }
      
      // Combine fecha and hora into a single datetime string
      const fechaHoraInicio = `${fecha}T${hora}:00`;
      
      // Initialize the fechaHoraInicio in the backend
      await simulationService.initializeFechaHora(fechaHoraInicio);
      
      // Execute the simulation with the specified fechaHoraInicio
      await simulationService.executeSimulationWithFecha(fechaHoraInicio);
      
      setMessage("✅ Simulación iniciada correctamente con fecha y hora personalizada");
      
      // Navigate to the simulator after a short delay
      setTimeout(() => {
        navigate('/visualizador');
      }, 2000);
      
    } catch (error) {
      setMessage(`❌ Error al iniciar la simulación: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (newValue) => {
    // Only allow changing to tab 1 if parameters have been submitted
    if (newValue === 1 && !parametersSubmitted) {
      return;
    }
    setTab(newValue);
  };

  return (
    <Box className="simulacion-container">
      <Typography variant="h4" fontWeight="700" gutterBottom>
        Simulaciones
      </Typography>

      <SimulationTabs value={tab} onChange={handleTabChange} />

      {tab === 0 && (
        <Paper variant="outlined" className="simulacion-paper">
          <Typography variant="h6" className="section-title">
            Elección de escenario
          </Typography>
          
          <ScenarioSelector value={escenario} onChange={setEscenario} />

          <Box sx={{ mt: 4 }}>
            <DateTimeInputs
              date={fecha}
              time={hora}
              onDateChange={setFecha}
              onTimeChange={setHora}
            />
          </Box>

          {message && (
            <Alert 
              severity={message.includes('✅') ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              {message}
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              className="next-button" 
              onClick={handleNextToConsiderations}
            >
              Siguiente
            </Button>
          </Box>
        </Paper>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Considerar que solo se permiten archivos en formato txt
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Pedidos
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
              <Button
                variant="contained"
                className="examine-button"
                onClick={() => handleFileUpload("pedidos")}
              >
                Examinar
              </Button>
              <TextField
                fullWidth
                disabled
                value={selectedFiles.pedidos?.name || "No se ha seleccionado archivo"}
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
            {fileErrors.pedidos && (
              <FormHelperText error>{fileErrors.pedidos}</FormHelperText>
            )}
          </Box>

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
                value={selectedFiles.bloqueos?.name || "No se ha seleccionado archivo"}
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
            {fileErrors.bloqueos && (
              <FormHelperText error>{fileErrors.bloqueos}</FormHelperText>
            )}
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
                value={selectedFiles.averias?.name || "No se ha seleccionado archivo"}
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
            {fileErrors.averias && (
              <FormHelperText error>{fileErrors.averias}</FormHelperText>
            )}
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
                value={selectedFiles.mantenimientos?.name || "No se ha seleccionado archivo"}
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
            {fileErrors.mantenimientos && (
              <FormHelperText error>{fileErrors.mantenimientos}</FormHelperText>
            )}
          </Box>

          {message && (
            <Alert 
              severity={message.includes('✅') ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              {message}
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setTab(0)}
              disabled={isLoading}
            >
              Volver
            </Button>

            <Button
              variant="contained"
              color="secondary"
              className="next-button"
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando simulación...' : 'Iniciar simulación'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
