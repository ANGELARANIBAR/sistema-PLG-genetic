import React, { useState, useEffect } from 'react';
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
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TuneIcon from '@mui/icons-material/Tune';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { fetchFlota } from '../services/flotaService';
import './Flota.css';

export default function Flota() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadFlota = async () => {
      try {
        setLoading(true);
        const flotaData = await fetchFlota();
        setVehicles(flotaData);
        setError(null);
      } catch (err) {
        setError('Error al cargar la flota: ' + err.message);
        console.error('Error loading fleet:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFlota();
  }, []);

  const handleAddVehicle = () => {
    navigate('/nuevo-vehiculo');
  };

  const renderEstadoChip = (estado) => {
    const estadoMap = {
      'DISPONIBLE': { label: 'Disponible', className: 'status-disponible' },
      'EN_RUTA': { label: 'En Ruta', className: 'status-en-ruta' },
      'EN_RETORNO': { label: 'En Retorno', className: 'status-en-retorno' },
      'AVERIADO': { label: 'Averiado', className: 'status-averiado' },
      'DESPACHANDO': { label: 'Despachando', className: 'status-despachando' },
      'RECARGANDO': { label: 'Recargando', className: 'status-recargando' }
    };

    const estadoInfo = estadoMap[estado] || { label: estado, className: 'status-default' };

    return (
      <Chip 
        label={estadoInfo.label} 
        size="small" 
        className={`status-chip ${estadoInfo.className}`}
      />
    );
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.tipoCamion?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </Box>
    );
  }

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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
              <TableCell>Código</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Carga GLP (m³)</TableCell>
              <TableCell>Combustible</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVehicles.map((vehicle, index) => (
              <TableRow key={vehicle.truckId || index}>
                <TableCell>{vehicle.plate}</TableCell>
                <TableCell>{vehicle.codigo}</TableCell>
                <TableCell>{vehicle.tipoCamion?.codigo || 'N/A'}</TableCell>
                <TableCell>{vehicle.currentGLP?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>{vehicle.currentFuel?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>{renderEstadoChip(vehicle.destinations?.[vehicle.currentDestinationIndex]?.destinationType || 'DISPONIBLE')}</TableCell>
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