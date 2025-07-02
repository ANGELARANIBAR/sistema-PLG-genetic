import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TuneIcon from '@mui/icons-material/Tune';
import AssignmentIcon from '@mui/icons-material/Assignment';
import './Flota.css';

export default function Flota() {
  const navigate = useNavigate();

  // Sample fleet data
  const vehicles = [
    { placa: 'ABC-145', tipo: 'A', carga: 14, fecha: '2025-09-23', estado: 'disponible' },
    { placa: 'ABC-145', tipo: 'A', carga: 14, fecha: '2025-09-23', estado: 'disponible' },
    { placa: 'ABC-145', tipo: 'A', carga: 14, fecha: '2025-03-23', estado: 'disponible' },
    { placa: 'ABC-145', tipo: 'A', carga: 14, fecha: '2025-03-23', estado: 'disponible' },
    { placa: 'ABC-145', tipo: 'A', carga: 14, fecha: '2025-08-23', estado: 'disponible' },
    { placa: 'ABC-145', tipo: 'A', carga: 14, fecha: '2025-08-23', estado: 'disponible' },
    { placa: 'ABC-145', tipo: 'A', carga: 14, fecha: '2025-03-23', estado: 'disponible' }
  ];

  const handleAddVehicle = () => {
    navigate('/nuevo-vehiculo');
  };

  const renderEstadoChip = (estado) => {
    return (
      <Chip 
        label="Disponible" 
        size="small" 
        className="status-chip status-disponible"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
        Flota
      </Typography>

      <Box sx={{ display: "flex", mt: 3, mb: 3, gap: 2, alignItems: "center" }}>
        <TextField
          placeholder="Buscar camión..."
          variant="outlined"
          size="small"
          fullWidth
          className="search-bar"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small">
                  <TuneIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          className="add-button"
          onClick={handleAddVehicle}
        >
          Nuevo camión
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Placa</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Carga GLP (m³)</TableCell>
              <TableCell>Fecha de fabricación</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((vehicle, index) => (
              <TableRow key={index}>
                <TableCell>{vehicle.placa}</TableCell>
                <TableCell>{vehicle.tipo}</TableCell>
                <TableCell>{vehicle.carga}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
                    {vehicle.fecha}
                  </Box>
                </TableCell>
                <TableCell>{renderEstadoChip(vehicle.estado)}</TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    sx={{ 
                      minWidth: 'auto', 
                      p: 0.5 
                    }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 