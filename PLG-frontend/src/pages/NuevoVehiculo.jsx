import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { fetchTipoCamiones, addNuevoCamion } from '../services/flotaService';
import './NuevoVehiculo.css';

export default function NuevoVehiculo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tipoCamiones, setTipoCamiones] = useState([]);
  const [formData, setFormData] = useState({
    placa: '',
    tipoCamionId: '',
    observaciones: ''
  });

  useEffect(() => {
    const loadTipoCamiones = async () => {
      try {
        const tipos = await fetchTipoCamiones();
        setTipoCamiones(tipos);
      } catch (err) {
        setError('Error al cargar tipos de camión: ' + err.message);
      }
    };
    loadTipoCamiones();
  }, []);

  const handleCancel = () => {
    navigate('/flota');
  };

  const handleSave = async () => {
    if (!formData.placa || !formData.tipoCamionId) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await addNuevoCamion(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/flota');
      }, 1500);
    } catch (err) {
      setError('Error al guardar el camión: ' + err.message);
      // If the error indicates no system is available, show a more helpful message
      if (err.message.includes('Error al agregar nuevo camión')) {
        setError('No hay sistema disponible. El sistema se inicializará automáticamente cuando sea necesario.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
        Registrar nuevo vehículo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Complete el formulario para registrar un nuevo vehículo a la flota.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Camión agregado exitosamente. Redirigiendo...
        </Alert>
      )}
      
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
              Placa*
            </Typography>
            <TextField 
              fullWidth
              placeholder="Ingrese la placa del vehículo"
              size="small"
              value={formData.placa}
              onChange={(e) => handleInputChange('placa', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
              Tipo de Camión*
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={formData.tipoCamionId}
                onChange={(e) => handleInputChange('tipoCamionId', e.target.value)}
              >
                <MenuItem value="">Seleccione el tipo</MenuItem>
                {tipoCamiones.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.codigo} - Carga: {tipo.cargaGLPMax} m³, Peso: {tipo.pesoGLPMax} ton
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
              Observaciones
            </Typography>
            <TextField 
              fullWidth
              placeholder="Ingrese cualquier observación sobre el vehículo"
              multiline
              rows={4}
              value={formData.observaciones}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                className="cancel-button"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                className="save-button"
                onClick={handleSave}
                disabled={loading || !formData.placa || !formData.tipoCamionId}
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 