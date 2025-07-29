import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  InputAdornment,
  Alert,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  LocalGasStation as GasIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { pedidosService } from '../../services/pedidosService';
import './AddPedidoModal.css';

const AddPedidoModal = ({ open, onClose, onPedidoAdded }) => {
  const [formData, setFormData] = useState({
    codigoCliente: '',
    coordenadas: '',
    cargaGLP: '',
    plazoEntrega: '',
    fechaRegistro: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      codigoCliente: '',
      coordenadas: '',
      cargaGLP: '',
      plazoEntrega: '',
      fechaRegistro: ''
    });
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

  const validateForm = () => {
    if (!formData.codigoCliente.trim()) {
      setError('El código del cliente es obligatorio');
      return false;
    }
    
    if (!formData.coordenadas.trim()) {
      setError('Las coordenadas son obligatorias');
      return false;
    }
    
    if (!formData.cargaGLP || parseFloat(formData.cargaGLP) <= 0) {
      setError('La carga de GLP debe ser mayor a 0');
      return false;
    }
    
    if (!formData.plazoEntrega || parseFloat(formData.plazoEntrega) < 4) {
      setError('El plazo de entrega debe ser mínimo de 4 horas');
      return false;
    }
    
    // Validate coordinates format (x, y)
    const coordRegex = /^\s*\(\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*\)\s*$/;
    if (!coordRegex.test(formData.coordenadas)) {
      setError('Las coordenadas deben tener el formato (x, y)');
      return false;
    }
    
    // Validate client code format c-number
    if (!formData.codigoCliente.startsWith('c-') || 
        isNaN(Number(formData.codigoCliente.substring(2)))) {
      setError('El código del cliente debe tener el formato c-número');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const fechaRegistro = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      
      // Parse coordinates
      let coordenadaX = null;
      let coordenadaY = null;
      const coords = formData.coordenadas.replace(/[()]/g, '').split(',').map(s => s.trim());
      if (coords.length === 2) {
        coordenadaX = Number(coords[0]);
        coordenadaY = Number(coords[1]);
      }
      
      // Extract client ID
      let idCliente = null;
      if (formData.codigoCliente && formData.codigoCliente.startsWith('c-')) {
        const idStr = formData.codigoCliente.substring(2).trim();
        idCliente = Number(idStr);
      }
      
      const dataToSave = {
        idCliente,
        numeroPedido: formData.codigoCliente,
        volumen: Number(formData.cargaGLP),
        coordenadaX,
        coordenadaY,
        tiempoMaxEntrega: Number(formData.plazoEntrega),
        fechaRegistro
      };
      
      await pedidosService.createPedido(dataToSave);
      
      setSuccess('¡Pedido registrado exitosamente!');
      
      // Notify parent component
      if (onPedidoAdded) {
        onPedidoAdded(dataToSave);
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating pedido:', error);
      setError('Error al registrar el pedido. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      className="add-pedido-modal"
      PaperProps={{
        sx: { borderRadius: 3, minHeight: '500px' }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#4caf50', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pr: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon />
          Agregar Nuevo Pedido
        </Box>
        <IconButton 
          onClick={handleClose} 
          sx={{ color: 'white' }}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
          Complete el formulario para registrar un nuevo pedido de GLP durante la simulación.
          El plazo mínimo de entrega es de 4 horas.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Código del cliente"
              value={formData.codigoCliente}
              onChange={handleChange('codigoCliente')}
              placeholder="c-123"
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              helperText="Formato: c-número (ej: c-123)"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Coordenadas de entrega"
              value={formData.coordenadas}
              onChange={handleChange('coordenadas')}
              placeholder="(12.5, 8.3)"
              required
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              helperText="Formato: (x, y) coordenadas de ubicación"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Carga de GLP"
              type="number"
              value={formData.cargaGLP}
              onChange={handleChange('cargaGLP')}
              placeholder="15.5"
              required
              disabled={loading}
              inputProps={{ min: 0.1, step: 0.1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <GasIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">m³</InputAdornment>
              }}
              helperText="Volumen en metros cúbicos"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Plazo de entrega"
              type="number"
              value={formData.plazoEntrega}
              onChange={handleChange('plazoEntrega')}
              placeholder="24"
              required
              disabled={loading}
              inputProps={{ min: 4, step: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ScheduleIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">horas</InputAdornment>
              }}
              helperText="Mínimo 4 horas"
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          size="large"
          disabled={loading}
          sx={{ 
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none'
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ 
            bgcolor: '#4caf50',
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              bgcolor: '#388e3c'
            }
          }}
        >
          {loading ? 'Guardando...' : 'Guardar Pedido'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPedidoModal; 