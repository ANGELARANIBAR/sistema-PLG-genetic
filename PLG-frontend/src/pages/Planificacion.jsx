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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
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
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  
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
            addLog('Simulación completada exitosamente');
            setNotification({
              open: true,
              message: 'Simulación completada exitosamente',
              severity: 'success'
            });
          }
        } catch (error) {
          console.error('Error checking simulation status:', error);
          addLog(`Error al verificar el estado de la simulación: ${error.message}`);
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [simulationStatus.isRunning, simulationStatus.percentage]);
  
  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [...prevLogs, `[${timestamp}] ${message}`]);
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleFileChange = (event, setFileFunction, fileType) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.txt')) {
        setFileFunction(file);
        addLog(`Archivo ${fileType} seleccionado: ${file.name} (${formatFileSize(file.size)})`);
      } else {
        addLog(`Error: El archivo ${file.name} no es un archivo .txt`);
        setNotification({
          open: true,
          message: 'Por favor, seleccione un archivo con formato .txt',
          severity: 'error'
        });
      }
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };
  
  const handleReplanificar = async () => {
    try {
      setLoading(true);
      addLog('Iniciando proceso de replanificación...');
      
      // Check if at least one file is selected
      if (!pedidosFile && !bloqueosFile && !averiasFile && !mantenimientoFile) {
        addLog('Error: No se ha seleccionado ningún archivo');
        setNotification({
          open: true,
          message: 'Por favor, seleccione al menos un archivo para cargar',
          severity: 'warning'
        });
        setLoading(false);
        return;
      }
      
      // Log which files will be uploaded
      addLog('Archivos a cargar:');
      if (pedidosFile) addLog(`- Pedidos: ${pedidosFile.name}`);
      if (bloqueosFile) addLog(`- Bloqueos: ${bloqueosFile.name}`);
      if (averiasFile) addLog(`- Averías: ${averiasFile.name}`);
      if (mantenimientoFile) addLog(`- Mantenimiento: ${mantenimientoFile.name}`);
      
      // Upload files and execute simulation
      addLog('Enviando archivos al servidor...');
      const result = await fileUploadService.uploadFiles(
        averiasFile,
        bloqueosFile,
        pedidosFile,
        mantenimientoFile,
        true // ejecutarSimulacion = true
      );
      
      addLog(`Respuesta del servidor: ${result}`);
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
      addLog(`Error en el proceso de replanificación: ${error.message}`);
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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => setLogDialogOpen(true)}
          >
            Ver Logs
          </Button>
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
                  onChange={(e) => handleFileChange(e, setPedidosFile, 'pedidos')}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={getFileNameOrDefault(pedidosFile)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" title="Archivo de pedidos con formato: tiempoSolicitud:x,y,c-idCliente,volumenm3,tiempoMaxEntregah">
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
                  onChange={(e) => handleFileChange(e, setBloqueosFile, 'bloqueos')}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={getFileNameOrDefault(bloqueosFile)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" title="Archivo de bloqueos con formato: tiempoInicio-tiempoFin:x1,y1,x2,y2,...">
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
                  onChange={(e) => handleFileChange(e, setAveriasFile, 'averías')}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={getFileNameOrDefault(averiasFile)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" title="Archivo de averías con formato: TipoAvería_CodigoCamión_TurnoIncidencia">
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
                  onChange={(e) => handleFileChange(e, setMantenimientoFile, 'mantenimiento')}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={getFileNameOrDefault(mantenimientoFile)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" title="Archivo de plan de mantenimiento con formato: FechaAAAAMMDD:CodigoCamión">
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
      
      {/* Log Dialog */}
      <Dialog
        open={logDialogOpen}
        onClose={() => setLogDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Logs de Operación</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Box sx={{ 
              maxHeight: '400px', 
              overflowY: 'auto', 
              fontFamily: 'monospace',
              backgroundColor: '#f5f5f5',
              p: 2,
              borderRadius: 1
            }}>
              {logs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay logs disponibles
                </Typography>
              ) : (
                logs.map((log, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    {log}
                  </Typography>
                ))
              )}
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Cerrar</Button>
          <Button onClick={() => setLogs([])}>Limpiar logs</Button>
        </DialogActions>
      </Dialog>
      
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