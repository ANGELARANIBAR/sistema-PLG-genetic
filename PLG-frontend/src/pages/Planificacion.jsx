import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Paper, 
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import Routes from '../components/routes/Routes';
import './Planificacion.css';

const API_URL = 'http://localhost:8080/api/solution';

export default function Planificacion() {
  const [tabValue, setTabValue] = useState(0);
  const [filesStatus, setFilesStatus] = useState({
    pedidos: false,
    bloqueos: false,
    averias: false,
    planmantenimiento: false
  });
  const [selectedFiles, setSelectedFiles] = useState({
    pedidos: null,
    bloqueos: null,
    averias: null,
    planmantenimiento: null
  });
  const [fileNames, setFileNames] = useState({
    pedidos: "No se ha seleccionado archivo",
    bloqueos: "No se ha seleccionado archivo",
    averias: "No se ha seleccionado archivo",
    planmantenimiento: "No se ha seleccionado archivo"
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [startDateTime, setStartDateTime] = useState(new Date());
  
  const fileInputRefs = {
    pedidos: useRef(null),
    bloqueos: useRef(null),
    averias: useRef(null),
    planmantenimiento: useRef(null)
  };

  // Cargar el estado de los archivos al iniciar
  useEffect(() => {
    checkFilesStatus();
  }, []);

  const checkFilesStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/upload-files-status`);
      if (response.ok) {
        const data = await response.json();
        setFilesStatus(data);
      }
    } catch (error) {
      console.error("Error al verificar el estado de los archivos:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event, fileType) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFiles(prev => ({
        ...prev,
        [fileType]: file
      }));
      setFileNames(prev => ({
        ...prev,
        [fileType]: file.name
      }));
    }
  };

  const handleFileClick = (fileType) => {
    fileInputRefs[fileType].current.click();
  };

  const handleUploadFiles = async () => {
    const formData = new FormData();
    
    // Agregar solo los archivos seleccionados al FormData
    Object.keys(selectedFiles).forEach(fileType => {
      if (selectedFiles[fileType]) {
        formData.append(fileType, selectedFiles[fileType]);
      }
    });
    
    // Verificar si hay archivos para subir
    if ([...formData.entries()].length === 0) {
      setNotification({
        open: true,
        message: 'No se ha seleccionado ningún archivo para subir',
        severity: 'warning'
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/upload-files`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setNotification({
          open: true,
          message: 'Archivos subidos correctamente',
          severity: 'success'
        });
        
        // Limpiar los archivos seleccionados
        setSelectedFiles({
          pedidos: null,
          bloqueos: null,
          averias: null,
          planmantenimiento: null
        });
        
        // Actualizar el estado de los archivos
        checkFilesStatus();
      } else {
        setNotification({
          open: true,
          message: 'Error al subir los archivos',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Error al subir archivos:", error);
      setNotification({
        open: true,
        message: 'Error al subir los archivos: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleSetStartDateTime = async () => {
    try {
      const response = await fetch(`${API_URL}/inicializar-fecha-hora`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fechaHoraInicio: startDateTime.toISOString() }),
      });
      
      if (response.ok) {
        setNotification({
          open: true,
          message: 'Fecha y hora de inicio configurada correctamente',
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Error al configurar la fecha y hora de inicio',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Error al configurar fecha y hora:", error);
      setNotification({
        open: true,
        message: 'Error al configurar fecha y hora: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleReplanificar = async () => {
    // Primero configuramos la fecha y hora de inicio
    await handleSetStartDateTime();
    
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/ejecutar-simulacion`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setNotification({
          open: true,
          message: 'Planificación ejecutada correctamente',
          severity: 'success'
        });
        // Cambiar a la pestaña de rutas
        setTabValue(1);
      } else {
        setNotification({
          open: true,
          message: 'Error al ejecutar la planificación',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error("Error al ejecutar planificación:", error);
      setNotification({
        open: true,
        message: 'Error al ejecutar la planificación: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const allFilesUploaded = filesStatus.pedidos && filesStatus.bloqueos && 
                          filesStatus.averias && filesStatus.planmantenimiento;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
        Planificación de Rutas
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="inherit"
            className="plan-tabs"
          >
            <Tab icon={<BarChartIcon />} iconPosition="start" label="Consideraciones" />
            <Tab icon={<AltRouteIcon />} iconPosition="start" label="Rutas" />
          </Tabs>
        </Box>
        <Button 
          variant="contained" 
          color="secondary" 
          className="replan-button"
          onClick={handleReplanificar}
          disabled={loading || !allFilesUploaded}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Replanificar'}
        </Button>
      </Box>

      {tabValue === 0 && (
        <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Considerar que solo se permiten archivos en formato txt
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Fecha y hora de inicio de simulación
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Stack direction="row" spacing={2} alignItems="center">
                <DateTimePicker
                  label="Fecha y hora de inicio"
                  value={startDateTime}
                  onChange={(newValue) => setStartDateTime(newValue)}
                  sx={{ width: '100%' }}
                />
                <Button 
                  variant="outlined"
                  onClick={handleSetStartDateTime}
                >
                  Establecer
                </Button>
              </Stack>
            </LocalizationProvider>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Pedidos
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <input
                type="file"
                accept=".txt"
                style={{ display: 'none' }}
                ref={fileInputRefs.pedidos}
                onChange={(e) => handleFileChange(e, 'pedidos')}
              />
              <Button 
                variant="contained" 
                className="examine-button"
                onClick={() => handleFileClick('pedidos')}
              >
                Examinar
              </Button>
              <TextField
                fullWidth
                disabled
                value={fileNames.pedidos}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <InfoIcon color={filesStatus.pedidos ? "success" : "inherit"} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Bloqueos
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <input
                type="file"
                accept=".txt"
                style={{ display: 'none' }}
                ref={fileInputRefs.bloqueos}
                onChange={(e) => handleFileChange(e, 'bloqueos')}
              />
              <Button 
                variant="contained" 
                className="examine-button"
                onClick={() => handleFileClick('bloqueos')}
              >
                Examinar
              </Button>
              <TextField
                fullWidth
                disabled
                value={fileNames.bloqueos}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <InfoIcon color={filesStatus.bloqueos ? "success" : "inherit"} />
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <input
                type="file"
                accept=".txt"
                style={{ display: 'none' }}
                ref={fileInputRefs.averias}
                onChange={(e) => handleFileChange(e, 'averias')}
              />
              <Button 
                variant="contained" 
                className="examine-button"
                onClick={() => handleFileClick('averias')}
              >
                Examinar
              </Button>
              <TextField
                fullWidth
                disabled
                value={fileNames.averias}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <InfoIcon color={filesStatus.averias ? "success" : "inherit"} />
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <input
                type="file"
                accept=".txt"
                style={{ display: 'none' }}
                ref={fileInputRefs.planmantenimiento}
                onChange={(e) => handleFileChange(e, 'planmantenimiento')}
              />
              <Button 
                variant="contained" 
                className="examine-button"
                onClick={() => handleFileClick('planmantenimiento')}
              >
                Examinar
              </Button>
              <TextField
                fullWidth
                disabled
                value={fileNames.planmantenimiento}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <InfoIcon color={filesStatus.planmantenimiento ? "success" : "inherit"} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button 
              variant="contained" 
              className="view-button"
            >
              Ver pedidos
            </Button>
            <Button 
              variant="contained" 
              className="view-button"
            >
              Ver flota
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleUploadFiles}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Cargar archivos'}
            </Button>
          </Box>
          
          {!allFilesUploaded && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Debe cargar todos los archivos necesarios antes de ejecutar la planificación.
            </Alert>
          )}
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
          <Routes />
        </Paper>
      )}

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 