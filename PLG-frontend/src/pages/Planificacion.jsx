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
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import Routes from '../components/routes/Routes';
import fileService from '../services/fileService';
import './Planificacion.css';

export default function Planificacion() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Estado para archivos seleccionados
  const [selectedFiles, setSelectedFiles] = useState({
    pedidos: null,
    bloqueos: null,
    averias: null,
    planmantenimiento: null
  });
  
  // Estado para nombres de archivos mostrados
  const [fileNames, setFileNames] = useState({
    pedidos: "No se ha seleccionado archivo",
    bloqueos: "No se ha seleccionado archivo",
    averias: "No se ha seleccionado archivo",
    planmantenimiento: "No se ha seleccionado archivo"
  });
  
  // Estado para verificar si los archivos ya están subidos
  const [filesStatus, setFilesStatus] = useState({
    pedidos: false,
    bloqueos: false,
    averias: false,
    planmantenimiento: false
  });
  
  // Referencias para los inputs de archivos
  const pedidosInputRef = useRef();
  const bloqueosInputRef = useRef();
  const averiasInputRef = useRef();
  const mantenimientoInputRef = useRef();
  
  // Cargar estado de archivos al inicio
  useEffect(() => {
    checkFilesStatus();
  }, []);
  
  const checkFilesStatus = async () => {
    try {
      const status = await fileService.getFilesStatus();
      setFilesStatus(status);
      
      // Actualizar nombres de archivos si ya están subidos
      const updatedFileNames = {...fileNames};
      Object.keys(status).forEach(key => {
        if (status[key]) {
          updatedFileNames[key] = `${key}.txt (subido)`;
        }
      });
      setFileNames(updatedFileNames);
    } catch (error) {
      console.error('Error al verificar estado de archivos:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleFileChange = (event, fileType) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFiles({
        ...selectedFiles,
        [fileType]: file
      });
      setFileNames({
        ...fileNames,
        [fileType]: file.name
      });
    }
  };
  
  const handleFileClick = (fileType) => {
    switch (fileType) {
      case 'pedidos':
        pedidosInputRef.current.click();
        break;
      case 'bloqueos':
        bloqueosInputRef.current.click();
        break;
      case 'averias':
        averiasInputRef.current.click();
        break;
      case 'planmantenimiento':
        mantenimientoInputRef.current.click();
        break;
      default:
        break;
    }
  };
  
  const handleUploadFiles = async () => {
    // Verificar si hay al menos un archivo seleccionado
    if (!Object.values(selectedFiles).some(file => file !== null)) {
      setSnackbar({
        open: true,
        message: 'Por favor seleccione al menos un archivo para subir',
        severity: 'warning'
      });
      return;
    }
    
    setLoading(true);
    try {
      const result = await fileService.uploadFiles(selectedFiles);
      setSnackbar({
        open: true,
        message: 'Archivos subidos correctamente',
        severity: 'success'
      });
      
      // Actualizar estado de archivos después de la subida
      await checkFilesStatus();
      
      // Limpiar selección de archivos
      setSelectedFiles({
        pedidos: null,
        bloqueos: null,
        averias: null,
        planmantenimiento: null
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al subir archivos: ' + (error.response?.data || error.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleReplanificar = async () => {
    // Verificar si todos los archivos necesarios están subidos
    if (!filesStatus.pedidos) {
      setSnackbar({
        open: true,
        message: 'Debe subir el archivo de pedidos para ejecutar la simulación',
        severity: 'warning'
      });
      return;
    }
    
    setLoading(true);
    try {
      await fileService.ejecutarSimulacion();
      setSnackbar({
        open: true,
        message: 'Simulación ejecutada correctamente',
        severity: 'success'
      });
      // Cambiar a la pestaña de rutas
      setTabValue(1);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al ejecutar simulación: ' + (error.response?.data || error.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
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
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Replanificar'}
        </Button>
      </Box>

      {tabValue === 0 && (
        <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Considerar que solo se permiten archivos en formato txt
          </Typography>
          
          {/* Input para Pedidos */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Pedidos
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <input
                type="file"
                accept=".txt"
                ref={pedidosInputRef}
                style={{ display: 'none' }}
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
                        <InfoIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
          
          {/* Input para Bloqueos */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Bloqueos
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <input
                type="file"
                accept=".txt"
                ref={bloqueosInputRef}
                style={{ display: 'none' }}
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
                        <InfoIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
          
          {/* Input para Averías */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Averías
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <input
                type="file"
                accept=".txt"
                ref={averiasInputRef}
                style={{ display: 'none' }}
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
                        <InfoIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
          
          {/* Input para Mantenimiento */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Mantenimiento
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <input
                type="file"
                accept=".txt"
                ref={mantenimientoInputRef}
                style={{ display: 'none' }}
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
              onClick={handleUploadFiles}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Subir Archivos'}
            </Button>
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
          </Box>
        </Paper>
      )}

      {tabValue === 1 && (
        <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
          <Routes />
        </Paper>
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 