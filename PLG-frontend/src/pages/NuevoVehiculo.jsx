import React from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './NuevoVehiculo.css';

export default function NuevoVehiculo() {
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate('/flota');
  };

  const handleSave = () => {
    // Here you would add code to save the vehicle data
    // For now, just navigate back to the flota page
    navigate('/flota');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
        Registrar nuevo vehículo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Complete el formulario para registrar un nuevo vehículo a la flota.
      </Typography>
      
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
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
              Tipo*
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                defaultValue=""
              >
                <MenuItem value="">Seleccione el tipo</MenuItem>
                <MenuItem value="A">Tipo A</MenuItem>
                <MenuItem value="B">Tipo B</MenuItem>
                <MenuItem value="C">Tipo C</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
              Carga GLP (m³)*
            </Typography>
            <TextField 
              fullWidth
              placeholder="Ingrese la capacidad de carga"
              size="small"
              type="number"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
              Fecha de fabricación*
            </Typography>
            <TextField 
              fullWidth
              placeholder="YYYY-MM-DD"
              size="small"
              type="date"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight="500" gutterBottom>
              Estado*
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                defaultValue="disponible"
              >
                <MenuItem value="disponible">Disponible</MenuItem>
                <MenuItem value="mantenimiento">En mantenimiento</MenuItem>
                <MenuItem value="reparacion">En reparación</MenuItem>
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
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                className="cancel-button"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button 
                variant="contained" 
                color="secondary"
                className="save-button"
                onClick={handleSave}
              >
                Guardar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
} 