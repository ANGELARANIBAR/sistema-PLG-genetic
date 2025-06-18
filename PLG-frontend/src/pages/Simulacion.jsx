// src/pages/Simulacion.jsx
import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, TextField, InputAdornment, IconButton, Divider, Alert, FormHelperText, Chip } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScenarioSelector from "../components/scenarioSelector/ScenarioSelector";
import DateTimeInputs from "../components/datetimeInputs/DateTimeInputs";
import SimulationTabs from "../components/simulationTabs/SimulationTabs";
import { useNavigate } from 'react-router-dom';
import { simulationService } from "../services/simulationService";
import { fileUploadService } from "../services/fileUploadService";
import "./Simulacion.css";

export default function Simulacion() {
  const [tab, setTab] = useState(0);
  const [escenario, setEscenario] = useState("diario");
  const [fecha, setFecha] = useState("2025-03-23");
  const [hora, setHora] = useState("10:30");
  const [selectedFiles, setSelectedFiles] = useState({
    bloqueos: null,
    averias: null,
    mantenimiento: null,
    pedidos: null
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState({
    bloqueos: false,
    averias: false,
    mantenimiento: false,
    pedidos: false
  });
  const [errors, setErrors] = useState({
    bloqueos: '',
    averias: '',
    mantenimiento: '',
    pedidos: ''
  });
  const [uploadedStatus, setUploadedStatus] = useState({
    bloqueos: false,
    averias: false,
    mantenimiento: false,
    pedidos: false
  });
  
  const navigate = useNavigate();

  // Load uploaded status from localStorage on component mount
  useEffect(() => {
    const savedStatus = localStorage.getItem('uploadedFilesStatus');
    if (savedStatus) {
      try {
        setUploadedStatus(JSON.parse(savedStatus));
      } catch (e) {
        console.error('Error parsing saved upload status:', e);
      }
    }
  }, []);

  const handleFileChange = (event, fileType) => {
    const file = event.target.files[0];
    
    // Reset error for this file type
    setErrors(prev => ({...prev, [fileType]: ''}));
    
    if (!file) {
      setSelectedFiles(prev => ({...prev, [fileType]: null}));
      return;
    }
    
    try {
      // Basic validation on the frontend side
      if (!file.name.toLowerCase().endsWith('.txt')) {
        setErrors(prev => ({...prev, [fileType]: 'Solo se permiten archivos .txt'}));
        return;
      }
      
      // Size validation (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({...prev, [fileType]: 'El archivo es demasiado grande (máx 5MB)'}));
        return;
      }
      
      setSelectedFiles(prev => ({...prev, [fileType]: file}));
    } catch (error) {
      setErrors(prev => ({...prev, [fileType]: error.message || 'Error al seleccionar el archivo'}));
    }
  };

  const handleUpload = async (fileType) => {
    if (!selectedFiles[fileType]) {
      setErrors(prev => ({...prev, [fileType]: 'No se ha seleccionado ningún archivo'}));
      return;
    }
    
    try {
      setUploadLoading(prev => ({...prev, [fileType]: true}));
      
      let response;
      switch (fileType) {
        case 'averias':
          response = await fileUploadService.uploadAverias(selectedFiles[fileType]);
          break;
        case 'bloqueos':
          response = await fileUploadService.uploadBloqueos(selectedFiles[fileType]);
          break;
        case 'mantenimiento':
          response = await fileUploadService.uploadMantenimiento(selectedFiles[fileType]);
          break;
        case 'pedidos':
          response = await fileUploadService.uploadPedidos(selectedFiles[fileType]);
          break;
        default:
          throw new Error('Tipo de archivo no válido');
      }
      
      // Update uploaded status
      setUploadedStatus(prev => ({...prev, [fileType]: true}));
      localStorage.setItem('uploadedFilesStatus', JSON.stringify({
        ...uploadedStatus,
        [fileType]: true
      }));
      
      setMessage(`✅ Archivo ${fileType} cargado correctamente`);
      
      // Clear file selection after successful upload
      setSelectedFiles(prev => ({...prev, [fileType]: null}));
      
      // Reset the file input
      const fileInput = document.getElementById(`${fileType}-file-input`);
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error(`Error uploading ${fileType} file:`, error);
      setErrors(prev => ({...prev, [fileType]: error.message || `Error al cargar el archivo de ${fileType}`}));
      setMessage(`❌ Error al cargar el archivo de ${fileType}: ${error.message}`);
    } finally {
      setUploadLoading(prev => ({...prev, [fileType]: false}));
    }
  };

  const handleNext = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      // Check if at least one file has been uploaded
      if (!Object.values(uploadedStatus).some(status => status)) {
        setMessage("❌ Debe cargar al menos un archivo antes de iniciar la simulación");
        setIsLoading(false);
        return;
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

  const handleClearUploadedStatus = (fileType) => {
    setUploadedStatus(prev => {
      const newStatus = {...prev, [fileType]: false};
      localStorage.setItem('uploadedFilesStatus', JSON.stringify(newStatus));
      return newStatus;
    });
  };

  const getFileUploadSection = (fileType, label) => {
    return (
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="600" gutterBottom>
            {label}
          </Typography>
          {uploadedStatus[fileType] && (
            <Chip 
              icon={<CheckCircleIcon />} 
              label="Cargado" 
              color="success" 
              size="small" 
              onDelete={() => handleClearUploadedStatus(fileType)}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
          <input
            id={`${fileType}-file-input`}
            type="file"
            accept=".txt"
            onChange={(e) => handleFileChange(e, fileType)}
            style={{ display: 'none' }}
          />
          <label htmlFor={`${fileType}-file-input`}>
            <Button
              variant="contained"
              component="span"
              className="examine-button"
              disabled={uploadLoading[fileType]}
            >
              Examinar
            </Button>
          </label>
          <TextField
            fullWidth
            disabled
            value={selectedFiles[fileType] ? selectedFiles[fileType].name : "No se ha seleccionado archivo"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    edge="end"
                    onClick={() => handleUpload(fileType)}
                    disabled={!selectedFiles[fileType] || uploadLoading[fileType] || errors[fileType]}
                  >
                    <InfoIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {errors[fileType] && (
          <FormHelperText error>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ErrorIcon fontSize="small" />
              {errors[fileType]}
            </Box>
          </FormHelperText>
        )}
        
        <Button
          variant="contained"
          color="secondary"
          onClick={() => handleUpload(fileType)}
          disabled={!selectedFiles[fileType] || uploadLoading[fileType] || errors[fileType]}
          sx={{ mt: 1 }}
        >
          {uploadLoading[fileType] ? 'Cargando...' : 'Cargar'}
        </Button>
      </Box>
    );
  };

  return (
    <Box className="simulacion-container">
      <Typography variant="h4" fontWeight="700" gutterBottom>
        Simulaciones
      </Typography>

      <SimulationTabs value={tab} onChange={setTab} />

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

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button variant="contained" color="secondary" className="next-button" onClick={() => setTab(1)}>
              Siguiente
            </Button>
          </Box>
        </Paper>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Considerar que solo se permiten archivos en formato txt
          </Typography>

          {getFileUploadSection("bloqueos", "Bloqueos")}
          {getFileUploadSection("averias", "Averías")}
          {getFileUploadSection("mantenimiento", "Mantenimiento")}
          {getFileUploadSection("pedidos", "Pedidos")}

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
