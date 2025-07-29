import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  InputAdornment
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate } from 'react-router-dom';
import FormField from '../components/formField/FormField';
import { pedidosService } from '../services/pedidosService';
import './NuevoPedido.css';

export default function NuevoPedido() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    codigoCliente: '',
    coordenadas: '',
    cargaGLP: '',
    plazoEntrega: '',
    fechaRegistro: ''
  });

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleCancel = () => {
    navigate('/pedidos');
  };

  const handleSave = async () => {
    const now = new Date();
    // Formato local YYYY-MM-DD HH:mm:ss
    const pad = (n) => n.toString().padStart(2, '0');
    const fechaRegistro = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    // Parsear coordenadas en formato (x, y)
    let coordenadaX = null;
    let coordenadaY = null;
    if (formData.coordenadas) {
      // Eliminar paréntesis y espacios
      const coords = formData.coordenadas.replace(/[()]/g, '').split(',').map(s => s.trim());
      if (coords.length === 2) {
        coordenadaX = Number(coords[0]);
        coordenadaY = Number(coords[1]);
      }
    }
    // Extraer idCliente como el número después de 'c-'
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
    console.log('Datos a guardar:', dataToSave);
    try {
      await pedidosService.createPedido(dataToSave);
      navigate('/pedidos');
    } catch (error) {
      alert('Error al registrar el pedido. Intente nuevamente.');
    }
  };

  return (
    <Box sx={{ px: 3, pt: 2, pb: 5, backgroundColor: '#f9fafb', minHeight: '100vh' }}>      <Typography variant="h4" component="h1" className="main-title">
        Registrar nuevo pedido
      </Typography>

      <Typography variant="body1" className="subtitle">
        Complete el formulario para registrar un nuevo pedido de GLP. Recuerde que el plazo mínimo de entrega es de 4 horas.
      </Typography>
        <Paper sx={{ p: 4, borderRadius: 2, backgroundColor: 'white' }}>
        <div className="form-container">
          <div className="form-field-wrapper">
            <FormField
              titulo="Código del cliente*"
              placeholder="Ingrese el código del cliente"
              value={formData.codigoCliente}
              onChange={handleChange('codigoCliente')}
            />
          </div>
          <div className="form-field-wrapper">
            <FormField
              titulo="Dirección de entrega*"
              placeholder="Ingrese las coordenadas (x, y)"
              value={formData.coordenadas}
              onChange={handleChange('coordenadas')}
            />
          </div>
          <div className="form-field-wrapper">
            <FormField
              titulo="Carga GLP (en metros cúbicos)*"
              placeholder="Ingrese el volumen requerido"
              value={formData.cargaGLP}
              onChange={handleChange('cargaGLP')}
              type="number"
            />
          </div>
          <div className="form-field-wrapper">
            <FormField
              titulo="Plazo de entrega (horas)*"
              placeholder="Ingrese el número de horas del plazo"
              value={formData.plazoEntrega}
              onChange={handleChange('plazoEntrega')}
              type="number"
            />
          </div>
        </div>
        <div className="buttons-container">
            <Button
              variant="outlined"
              onClick={handleCancel}
              className="cancel-button"
            >
              Cancelar
            </Button>            <Button
              variant="contained"
              onClick={handleSave}
              className="save-button"
            >
              Guardar
            </Button>
          </div>
      </Paper>
    </Box>
  );
}
