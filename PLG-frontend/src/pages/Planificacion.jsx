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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFileChange = (event, fileType) => {
    setSelectedFiles({
      ...selectedFiles,
      [fileType]: event.target.files[0]
    });
  };

  const handleFileUpload = async (fileType) => {
    if (!selectedFiles[fileType]) {
      setNotification({
        open: true,
        message: 'Por favor seleccione un archivo primero',
        severity: 'warning'
      });
      return;
    }

    setLoading({ ...loading, [fileType]: true });

    try {
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
          throw new Error(`Unknown file type: ${fileType}`);
      }

      setNotification({
        open: true,
        message: `Archivo de ${getFileTypeName(fileType)} cargado exitosamente`,
        severity: 'success'
      });
      
      // Reset file selection
      setSelectedFiles({
        ...selectedFiles,
        [fileType]: null
      });
    } catch (error) {
      console.error(`Error al cargar el archivo de ${fileType}:`, error);
      setNotification({
        open: true,
        message: `Error al cargar el archivo de ${getFileTypeName(fileType)}: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading({ ...loading, [fileType]: false });
    }
  };

  const getFileTypeName = (fileType) => {
    switch (fileType) {
      case 'averias': return 'averías';
      case 'bloqueos': return 'bloqueos';
      case 'mantenimiento': return 'mantenimiento';
      case 'pedidos': return 'pedidos';
      default: return fileType;
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleReplanificar = async () => {
    try {
      setLoading({ ...loading, replanificar: true });
      await fileUploadService.executeReplanification();
      setNotification({
        open: true,
        message: 'Replanificación completada exitosamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al replanificar:', error);
      setNotification({
        open: true,
        message: `Error al replanificar: ${error.response?.data?.error || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading({ ...loading, replanificar: false });
    }
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
          disabled={loading.replanificar}
          startIcon={loading.replanificar && <CircularProgress size={20} color="inherit" />}
        >
          {loading.replanificar ? 'Procesando...' : 'Replanificar'}
        </Button>
      </Box>

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
                disabled={loading.bloqueos}
              >
                {loading.bloqueos ? <CircularProgress size={24} /> : 'Examinar'}
                <input
                  type="file"
                  hidden
                  accept=".txt"
                  onChange={(e) => handleFileChange(e, 'bloqueos')}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={selectedFiles.bloqueos ? selectedFiles.bloqueos.name : "No se ha seleccionado archivo"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        edge="end"
                        onClick={() => handleFileUpload('bloqueos')}
                        disabled={!selectedFiles.bloqueos || loading.bloqueos}
                      >
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
                disabled={loading.averias}
              >
                {loading.averias ? <CircularProgress size={24} /> : 'Examinar'}
                <input
                  type="file"
                  hidden
                  accept=".txt"
                  onChange={(e) => handleFileChange(e, 'averias')}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={selectedFiles.averias ? selectedFiles.averias.name : "No se ha seleccionado archivo"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        edge="end"
                        onClick={() => handleFileUpload('averias')}
                        disabled={!selectedFiles.averias || loading.averias}
                      >
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
                disabled={loading.mantenimiento}
              >
                {loading.mantenimiento ? <CircularProgress size={24} /> : 'Examinar'}
                <input
                  type="file"
                  hidden
                  accept=".txt"
                  onChange={(e) => handleFileChange(e, 'mantenimiento')}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={selectedFiles.mantenimiento ? selectedFiles.mantenimiento.name : "No se ha seleccionado archivo"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        edge="end"
                        onClick={() => handleFileUpload('mantenimiento')}
                        disabled={!selectedFiles.mantenimiento || loading.mantenimiento}
                      >
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
                disabled={loading.pedidos}
              >
                {loading.pedidos ? <CircularProgress size={24} /> : 'Examinar'}
                <input
                  type="file"
                  hidden
                  accept=".txt"
                  onChange={(e) => handleFileChange(e, 'pedidos')}
                />
              </Button>
              <TextField
                fullWidth
                disabled
                value={selectedFiles.pedidos ? selectedFiles.pedidos.name : "No se ha seleccionado archivo"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        edge="end"
                        onClick={() => handleFileUpload('pedidos')}
                        disabled={!selectedFiles.pedidos || loading.pedidos}
                      >
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
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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