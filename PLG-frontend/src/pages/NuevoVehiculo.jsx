import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNavigate } from 'react-router-dom';
import FormField from '../components/formField/FormField';
import './NuevoVehiculo.css';

export default function NuevoVehiculo() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    tipo: '',
    pesoBruto: '',
    cargaGLP: '',
    pesoCargaGLP: '',
    unidades: ''
  });

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  const handleCancel = () => {
    navigate('/flota');
  };

  const handleSave = () => {
    console.log('Saving vehicle type data:', formData);
    // Aquí se agregaría la lógica para guardar el nuevo tipo de vehículo
    navigate('/flota');
  };  return (
    <Box sx={{ px: 3, pt: 2, pb: 5, backgroundColor: '#f9fafb', minHeight: '100vh' }}>      <Typography variant="h4" component="h1" className="main-title">
        Registrar nuevo tipo de vehículo
      </Typography>

      <Typography variant="body1" className="subtitle">
        Complete el formulario para registrar un nuevo tipo de camión cisterna en el sistema. Todos los campos son obligatorios.
      </Typography>

      <Paper sx={{ p: 4, borderRadius: 2, backgroundColor: 'white' }}>
        <div className="form-container">
          <div className="form-field-wrapper">
            <FormField
              titulo="Tipo*"
              placeholder="Ingrese el código del tipo (ej: TA, TB)"
              value={formData.tipo}
              onChange={handleChange('tipo')}
              icono={<LocalShippingIcon fontSize="small" />}
            />
          </div>          <div className="form-field-wrapper">
            <FormField
              titulo="Peso Bruto (Toneladas)*"
              placeholder="Ingrese el peso del vehículo vacío"
              value={formData.pesoBruto}
              onChange={handleChange('pesoBruto')}
              type="number"
              step="0.1"
            />
          </div>

          <div className="form-field-wrapper">
            <FormField
              titulo="Carga GLP (m³)*"
              placeholder="Ingrese la capacidad del tanque"
              value={formData.cargaGLP}
              onChange={handleChange('cargaGLP')}
              type="number"
            />
          </div>

          <div className="form-field-wrapper">
            <FormField
              titulo="Peso Carga GLP (Toneladas)*"
              placeholder="Ingrese el peso del GLP cuando está lleno"
              value={formData.pesoCargaGLP}
              onChange={handleChange('pesoCargaGLP')}
              type="number"
              step="0.1"
            />
          </div>

          <div className="form-field-wrapper">
            <FormField
              titulo="Unidades*"
              placeholder="Ingrese el número de unidades disponibles"
              value={formData.unidades}
              onChange={handleChange('unidades')}
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
          </Button>
          <Button
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