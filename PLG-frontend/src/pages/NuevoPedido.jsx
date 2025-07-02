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
import './NuevoPedido.css';

export default function NuevoPedido() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombreCliente: '',
    coordenadas: '',
    correoElectronico: '',
    cargaGLP: '',
    fechaPedido: '',
    plazoEntrega: '',
    observaciones: ''
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

  const handleSave = () => {
    console.log('Saving form data:', formData);
    navigate('/pedidos');
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
              titulo="Nombre del cliente*"
              placeholder="Ingrese el nombre del cliente"
              value={formData.nombreCliente}
              onChange={handleChange('nombreCliente')}
            />
          </div>

          <div className="form-field-wrapper">
            <FormField
              titulo="Dirección de Entrega*"
              placeholder="Ingrese las coordenadas (x, y)"
              value={formData.coordenadas}
              onChange={handleChange('coordenadas')}
            />
          </div>

          <div className="form-field-wrapper">
            <FormField
              titulo="Correo electrónico"
              placeholder="Ingrese el correo electrónico"
              value={formData.correoElectronico}
              onChange={handleChange('correoElectronico')}
              type="email"
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
              titulo="Fecha de Pedido*"
              placeholder="AAAA-MM-DD HH:MM"
              value={formData.fechaPedido}
              onChange={handleChange('fechaPedido')}
              icono={<CalendarTodayIcon fontSize="small" />}
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
          <div className="form-field-wrapper full-width">
            <FormField
              titulo="Observaciones"
              placeholder="Ingrese cualquier observación o detalle adicional"
              value={formData.observaciones}
              onChange={handleChange('observaciones')}
              multiline
              rows={4}
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
