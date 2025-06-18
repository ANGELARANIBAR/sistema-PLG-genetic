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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import BarChartIcon from '@mui/icons-material/BarChart';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import Routes from '../components/routes/Routes';
import { fileService } from '../services/fileService';
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
  
  // Estado para el modal de visualización de pedidos
  const [pedidosModalOpen, setPedidosModalOpen] = useState(false);
  const [pedidosContent, setPedidosContent] = useState([]);
  
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
  
  const handleOpenPedidos = () => {
    // Si hay un archivo seleccionado, leer su contenido
    if (selectedFiles.pedidos) {
      readPedidosFile(selectedFiles.pedidos);
    } 
    // Si no hay archivo seleccionado pero ya está subido, mostrar mensaje
    else if (filesStatus.pedidos) {
      setSnackbar({
        open: true,
        message: 'El archivo ya está subido al servidor. Puede ejecutar la simulación.',
        severity: 'info'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Primero debe seleccionar un archivo de pedidos',
        severity: 'warning'
      });
    }
  };
  
  const readPedidosFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      const parsedPedidos = lines.map(line => {
        const [tiempo, datos] = line.split(':');
        if (!datos) return null;
        
        // Parsear el tiempo (formato: "01d06h00m")
        const tiempoMatch = tiempo.match(/(\d+)d(\d+)h(\d+)m/);
        let tiempoFormateado = '';
        if (tiempoMatch) {
          const [_, dias, horas, minutos] = tiempoMatch;
          tiempoFormateado = `${dias} días, ${horas} horas, ${minutos} minutos`;
        }
        
        // Parsear los datos (formato: "42,42,c-1,10m3,3h")
        const datosArray = datos.split(',');
        if (datosArray.length < 5) return null;
        
        const [posX, posY, cliente, volumen, tiempoEntrega] = datosArray;
        
        return {
          tiempo: tiempoFormateado,
          posX,
          posY,
          cliente: cliente.replace('c-', ''),
          volumen: volumen.replace('m3', ''),
          tiempoEntrega: tiempoEntrega.replace('h', '')
        };
      }).filter(pedido => pedido !== null);
      
      setPedidosContent(parsedPedidos);
      setPedidosModalOpen(true);
    };
    
    reader.onerror = () => {
      setSnackbar({
        open: true,
        message: 'Error al leer el archivo',
        severity: 'error'
      });
    };
    
    reader.readAsText(file);
  };
  
  const handleClosePedidosModal = () => {
    setPedidosModalOpen(false);
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
              onClick={handleOpenPedidos}
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
      
      {/* Modal para visualizar pedidos */}
      <Dialog
        open={pedidosModalOpen}
        onClose={handleClosePedidosModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Visualización de Pedidos
        </DialogTitle>
        <DialogContent>
          {pedidosContent.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tiempo</TableCell>
                    <TableCell>Posición X</TableCell>
                    <TableCell>Posición Y</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Volumen (m³)</TableCell>
                    <TableCell>Tiempo Máx. Entrega (h)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedidosContent.map((pedido, index) => (
                    <TableRow key={index}>
                      <TableCell>{pedido.tiempo}</TableCell>
                      <TableCell>{pedido.posX}</TableCell>
                      <TableCell>{pedido.posY}</TableCell>
                      <TableCell>{pedido.cliente}</TableCell>
                      <TableCell>{pedido.volumen}</TableCell>
                      <TableCell>{pedido.tiempoEntrega}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" sx={{ mt: 2 }}>
              No hay datos disponibles
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePedidosModal} color="primary">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
      
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