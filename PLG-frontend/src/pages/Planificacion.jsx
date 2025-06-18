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
  CircularProgress,
  Snackbar,
  Alert,
  FormHelperText,
  Chip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Routes from '../components/routes/Routes';
import './Planificacion.css';
import { fileUploadService } from '../services';

export default function Planificacion() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState({
    averias: false,
    bloqueos: false,
    mantenimiento: false,
    pedidos: false,
    replanificacion: false
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
  const [errors, setErrors] = useState({
    averias: '',
    bloqueos: '',
    mantenimiento: '',
    pedidos: ''
  });
  const [uploadedStatus, setUploadedStatus] = useState({
    averias: false,
    bloqueos: false,
    mantenimiento: false,
    pedidos: false
  });

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

  // Save uploaded status to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('uploadedFilesStatus', JSON.stringify(uploadedStatus));
  }, [uploadedStatus]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event, fileType) => {
    const file = event.target.files[0];
    
    // Reset error for this file type
    setErrors(prev => ({...prev, [fileType]: ''}));
    
    if (!file) {
      setSelectedFiles(prev => ({...prev, [fileType]: null}));
      return;
    }
    
    try {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith('.txt')) {
        setErrors(prev => ({...prev, [fileType]: 'Solo se permiten archivos .txt'}));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({...prev, [fileType]: 'El archivo es demasiado grande (máx 5MB)'}));
        return;
      }

      // Validate file is not empty
      if (file.size === 0) {
        setErrors(prev => ({...prev, [fileType]: 'El archivo está vacío'}));
        return;
      }
      
      // Read file content to validate format
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        
        // Check if file has content
        if (!content || content.trim() === '') {
          setErrors(prev => ({...prev, [fileType]: 'El archivo está vacío'}));
          return;
        }
        
        // Check if file has at least one line with comma-separated values
        const hasValidFormat = content.split('\n')
          .some(line => line.trim() !== '' && line.includes(',') && !line.startsWith('#'));
        
        if (!hasValidFormat) {
          setErrors(prev => ({
            ...prev, 
            [fileType]: 'El formato del archivo no es válido. Debe contener al menos una línea con valores separados por comas.'
          }));
          return;
        }
        
        // All validations passed
        setSelectedFiles(prev => ({...prev, [fileType]: file}));
      };
      
      reader.onerror = () => {
        setErrors(prev => ({...prev, [fileType]: 'Error al leer el archivo'}));
      };
      
      reader.readAsText(file);
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
      setLoading(prev => ({...prev, [fileType]: true}));
      
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
      
      setNotification({
        open: true,
        message: `Archivo ${fileType} cargado correctamente`,
        severity: 'success'
      });
      
      // Clear file selection after successful upload
      setSelectedFiles(prev => ({...prev, [fileType]: null}));
      
      // Reset the file input
      const fileInput = document.getElementById(`${fileType}-file-input`);
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error(`Error uploading ${fileType} file:`, error);
      setErrors(prev => ({...prev, [fileType]: error.message || `Error al cargar el archivo de ${fileType}`}));
      setNotification({
        open: true,
        message: error.message || `Error al cargar el archivo de ${fileType}`,
        severity: 'error'
      });
    } finally {
      setLoading(prev => ({...prev, [fileType]: false}));
    }
  };

  const handleReplanification = async () => {
    // Check if at least one file has been uploaded
    if (!Object.values(uploadedStatus).some(status => status)) {
      setNotification({
        open: true,
        message: 'Debe cargar al menos un archivo antes de ejecutar la replanificación',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(prev => ({...prev, replanificacion: true}));
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
      setLoading(prev => ({...prev, replanificacion: false}));
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({...prev, open: false}));
  };

  const handleClearUploadedStatus = (fileType) => {
    setUploadedStatus(prev => ({...prev, [fileType]: false}));
  };

  const getFileUploadSection = (fileType, label) => {
    return (
      <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1">{label}</Typography>
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
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
              color="primary"
              className="examine-button"
              disabled={loading[fileType]}
            >
              Examinar...
            </Button>
          </label>
          <Typography variant="body2" className="file-name">
            {selectedFiles[fileType] ? selectedFiles[fileType].name : 'Ningún archivo seleccionado'}
          </Typography>
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
          disabled={!selectedFiles[fileType] || loading[fileType] || errors[fileType]}
          className="upload-button"
          sx={{ mt: 1 }}
        >
          {loading[fileType] ? <CircularProgress size={24} /> : 'Cargar'}
        </Button>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Planificación</Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} className="plan-tabs">
            <Tab icon={<AltRouteIcon />} iconPosition="start" label="Planificación" />
            <Tab icon={<BarChartIcon />} iconPosition="start" label="Consideraciones" />
          </Tabs>
        </Box>
        
        <Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Carga de Archivos</Typography>
                {getFileUploadSection('averias', 'Archivo de Averías')}
                {getFileUploadSection('bloqueos', 'Archivo de Bloqueos')}
                {getFileUploadSection('mantenimiento', 'Archivo de Plan de Mantenimiento')}
                {getFileUploadSection('pedidos', 'Archivo de Pedidos')}
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleReplanification}
                    disabled={loading.replanificacion}
                    className="replan-button"
                    sx={{ px: 4, py: 1.5 }}
                  >
                    {loading.replanificacion ? (
                      <CircularProgress size={24} />
                    ) : (
                      'Ejecutar Replanificación'
                    )}
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Rutas</Typography>
                <Routes />
              </Box>
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">Consideraciones para la planificación</Typography>
              <Typography variant="body1" sx={{ mt: 2 }}>
                Para una correcta planificación, tenga en cuenta lo siguiente:
              </Typography>
              <ul>
                <li>
                  <Typography variant="body2">
                    Los archivos deben estar en formato .txt con los campos separados por comas.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    El archivo de averías debe contener la información de las averías que pueden ocurrir.
                    Formato: ID_CAMION,TURNO_OCURRENCIA,TIPO_AVERIA
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    El archivo de bloqueos debe contener la información de los bloqueos en las rutas.
                    Formato: X_INICIO,Y_INICIO,X_FIN,Y_FIN
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    El archivo de plan de mantenimiento debe contener la información de los mantenimientos programados.
                    Formato: CODIGO_CAMION,FECHA,DESCRIPCION
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    El archivo de pedidos debe contener la información de los pedidos a entregar.
                    Formato: ID,X,Y,CANTIDAD_GLP,FECHA_ENTREGA,VENTANA_HORARIA_INICIO,VENTANA_HORARIA_FIN,PRIORIDAD
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Los archivos pueden contener comentarios que comienzan con el carácter #.
                  </Typography>
                </li>
              </ul>
            </Box>
          )}
        </Box>
      </Paper>
      
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