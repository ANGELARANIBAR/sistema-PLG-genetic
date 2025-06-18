import React, { useState } from 'react';
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
  Alert,
  FormHelperText,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import Routes from '../components/routes/Routes';
import './Planificacion.css';
import { fileUploadService } from '../services';

export default function Planificacion() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState({
    averias: false,
    bloqueos: false,
    mantenimiento: false,
    pedidos: false
  });
  const [selectedFiles, setSelectedFiles] = useState({
    averias: null,
    bloqueos: null,
    mantenimiento: null,
    pedidos: null
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [fileErrors, setFileErrors] = useState({
    averias: '',
    bloqueos: '',
    mantenimiento: '',
    pedidos: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event, fileType) => {
    const file = event.target.files[0];
    
    // Reset error for this file type
    setFileErrors(prev => ({
      ...prev,
      [fileType]: ''
    }));
    
    if (file) {
      try {
        // Validate file before setting it
        validateFile(file, fileType);
        
        setSelectedFiles(prev => ({
          ...prev,
          [fileType]: file
        }));
      } catch (error) {
        setFileErrors(prev => ({
          ...prev,
          [fileType]: error.message
        }));
      }
    }
  };

  const validateFile = (file, fileType) => {
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

  const handleUpload = async (fileType) => {
    const file = selectedFiles[fileType];
    if (!file) {
      setFileErrors(prev => ({
        ...prev,
        [fileType]: 'Por favor seleccione un archivo'
      }));
      return;
    }

    setLoading(prev => ({ ...prev, [fileType]: true }));
    
    try {
      let response;
      
      switch(fileType) {
        case 'averias':
          response = await fileUploadService.uploadAverias(file);
          break;
        case 'bloqueos':
          response = await fileUploadService.uploadBloqueos(file);
          break;
        case 'mantenimiento':
          response = await fileUploadService.uploadMantenimiento(file);
          break;
        case 'pedidos':
          response = await fileUploadService.uploadPedidos(file);
          break;
        default:
          throw new Error('Tipo de archivo no válido');
      }
      
      setNotification({
        open: true,
        message: `Archivo ${file.name} cargado correctamente`,
        severity: 'success'
      });
    } catch (error) {
      console.error(`Error uploading ${fileType} file:`, error);
      
      setNotification({
        open: true,
        message: error.message || `Error al cargar el archivo ${fileType}`,
        severity: 'error'
      });
    } finally {
      setLoading(prev => ({ ...prev, [fileType]: false }));
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleReplanification = async () => {
    setLoading(prev => ({ ...prev, replanification: true }));
    
    try {
      await fileUploadService.executeReplanification();
      
      setNotification({
        open: true,
        message: 'Replanificación ejecutada correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error executing replanification:', error);
      
      setNotification({
        open: true,
        message: error.message || 'Error al ejecutar la replanificación',
        severity: 'error'
      });
    } finally {
      setLoading(prev => ({ ...prev, replanification: false }));
    }
  };

  const renderFileUploadSection = (title, fileType) => (
    <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: fileErrors[fileType] ? 0 : 1 }}>
        <Button
          variant="contained"
          component="label"
          className="examine-button"
          disabled={loading[fileType]}
        >
          Examinar
          <input
            type="file"
            accept=".txt"
            hidden
            onChange={(e) => handleFileChange(e, fileType)}
          />
        </Button>
        
        <Typography sx={{ ml: 2, color: 'text.secondary', flexGrow: 1 }}>
          {selectedFiles[fileType]?.name || 'Ningún archivo seleccionado'}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          className="view-button"
          onClick={() => handleUpload(fileType)}
          disabled={!selectedFiles[fileType] || loading[fileType]}
          sx={{ ml: 2 }}
        >
          {loading[fileType] ? <CircularProgress size={24} color="inherit" /> : 'Cargar'}
        </Button>
      </Box>
      
      {fileErrors[fileType] && (
        <FormHelperText error>{fileErrors[fileType]}</FormHelperText>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Planificación</Typography>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        aria-label="planificacion tabs"
        className="plan-tabs"
        sx={{ mb: 3 }}
      >
        <Tab icon={<InfoIcon />} iconPosition="start" label="Configuración" />
        <Tab icon={<BarChartIcon />} iconPosition="start" label="Consideraciones" />
        <Tab icon={<AltRouteIcon />} iconPosition="start" label="Rutas" />
      </Tabs>
      
      {tabValue === 0 && (
        <Box>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Carga de Archivos</Typography>
            
            {renderFileUploadSection('Archivo de Pedidos', 'pedidos')}
            {renderFileUploadSection('Archivo de Bloqueos', 'bloqueos')}
            {renderFileUploadSection('Archivo de Averías', 'averias')}
            {renderFileUploadSection('Plan de Mantenimiento', 'mantenimiento')}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="secondary" 
                className="replan-button"
                onClick={handleReplanification}
                disabled={loading.replanification}
                sx={{ minWidth: 200 }}
              >
                {loading.replanification ? 
                  <CircularProgress size={24} color="inherit" /> : 
                  'Ejecutar Planificación'
                }
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
      
      {tabValue === 1 && (
        <Box>
          <Typography>Consideraciones de la planificación</Typography>
        </Box>
      )}
      
      {tabValue === 2 && (
        <Box>
          <Routes />
        </Box>
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