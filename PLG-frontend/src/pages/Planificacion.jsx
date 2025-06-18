import React, { useState, useEffect } from 'react';
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
  Snackbar,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import Routes from '../components/routes/Routes';
import { fileUploadService } from '../services/fileUploadService';
import { simulationService } from '../services/simulationService';
import './Planificacion.css';

export default function Planificacion() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [simulationStatus, setSimulationStatus] = useState({
    isRunning: false,
    percentage: 0,
    isReplanning: false
  });
  
  // File states
  const [pedidosFile, setPedidosFile] = useState(null);
  const [bloqueosFile, setBloqueosFile] = useState(null);
  const [averiasFile, setAveriasFile] = useState(null);
  const [mantenimientoFile, setMantenimientoFile] = useState(null);
  
  // Check simulation status periodically
  useEffect(() => {
    let intervalId;
    
    if (simulationStatus.isRunning && simulationStatus.percentage < 100) {
      intervalId = setInterval(async () => {
        try {
          const status = await simulationService.checkSimulationStatus();
          setSimulationStatus(prev => ({
            ...prev,
            percentage: status.percentage,
            isReplanning: status.isReplanning,
            isRunning: !status.isComplete
          }));
          
          if (status.isComplete) {
            setNotification({
              open: true,
              message: 'Simulación completada exitosamente',
              severity: 'success'
            });
          }
        } catch (error) {
          console.error('Error checking simulation status:', error);
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [simulationStatus.isRunning, simulationStatus.percentage]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleFileChange = (event, setFileFunction) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.txt')) {
      setFileFunction(file);
    } else {
      setNotification({
        open: true,
        message: 'Por favor, seleccione un archivo con formato .txt',
        severity: 'error'
      });
    }
  };
  
  const handleReplanificar = async () => {
    try {
      setLoading(true);
      
      // Check if at least one file is selected
      if (!pedidosFile && !bloqueosFile && !averiasFile && !mantenimientoFile) {
        setNotification({
          open: true,
          message: 'Por favor, seleccione al menos un archivo para cargar',
          severity: 'warning'
        });
        setLoading(false);
        return;
      }
      
      // Upload files and execute simulation
      const result = await fileUploadService.uploadFiles(
        averiasFile,
        bloqueosFile,
        pedidosFile,
        mantenimientoFile,
        true // ejecutarSimulacion = true
      );
      
      setNotification({
        open: true,
        message: 'Archivos cargados correctamente y simulación iniciada',
        severity: 'success'
      });
      
      // Set simulation as running and reset percentage
      setSimulationStatus({
        isRunning: true,
        percentage: 0,
        isReplanning: false
      });
      
      // Switch to Routes tab
      setTabValue(1);
      
    } catch (error) {
      setNotification({
        open: true,
        message: `Error: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  const getFileNameOrDefault = (file) => {
    return file ? file.name : 'No se ha seleccionado archivo';
  };

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
          disabled={loading || simulationStatus.isRunning}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Procesando...' : 'Replanificar'}
        </Button>
      </Box>
      
      {simulationStatus.isRunning && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {simulationStatus.isReplanning ? 'Replanificando...' : 'Simulando...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(simulationStatus.percentage)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={simulationStatus.percentage} 
            color={simulationStatus.isReplanning ? "secondary" : "primary"}
          />
        </Box>
      )}

      {tabValue === 0 && (
        <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Considerar que solo se permiten archivos en formato txt
          </Typography>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Bloqueos
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Button 
                variant="contained" 
                className="examine-button"
                component="label"
                disabled={simulationStatus.isRunning}
              >
                Examinar
                <input
                  type="file"
                  accept=".txt"
                  hidden
                  onChange={(e) => handleFileChange(e, setBloqueosFile)}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={getFileNameOrDefault(bloqueosFile)}
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Button 
                variant="contained" 
                className="examine-button"
                component="label"
                disabled={simulationStatus.isRunning}
              >
                Examinar
                <input
                  type="file"
                  accept=".txt"
                  hidden
                  onChange={(e) => handleFileChange(e, setAveriasFile)}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={getFileNameOrDefault(averiasFile)}
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
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Button 
                variant="contained" 
                className="examine-button"
                component="label"
                disabled={simulationStatus.isRunning}
              >
                Examinar
                <input
                  type="file"
                  accept=".txt"
                  hidden
                  onChange={(e) => handleFileChange(e, setMantenimientoFile)}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={getFileNameOrDefault(mantenimientoFile)}
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
              Pedidos
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Button 
                variant="contained" 
                className="examine-button"
                component="label"
                disabled={simulationStatus.isRunning}
              >
                Examinar
                <input
                  type="file"
                  accept=".txt"
                  hidden
                  onChange={(e) => handleFileChange(e, setPedidosFile)}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={getFileNameOrDefault(pedidosFile)}
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

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button 
              variant="contained" 
              className="view-button"
              disabled={simulationStatus.isRunning}
            >
              Ver pedidos
            </Button>
            <Button 
              variant="contained" 
              className="view-button"
              disabled={simulationStatus.isRunning}
            >
              Ver flota
            </Button>
          </Box>
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
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 