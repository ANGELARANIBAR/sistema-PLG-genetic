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
  IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { getTiposVehiculos } from '../services/vehiculosData';
import './Flota.css';

export default function Flota() {
  const navigate = useNavigate();
  const [tiposVehiculos, setTiposVehiculos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cargarTiposVehiculos = async () => {
      try {
        setIsLoading(true);
        const data = await getTiposVehiculos();
        setTiposVehiculos(data);
      } catch (error) {
        console.error("Error al cargar tipos de vehículos:", error);
        setTiposVehiculos([]);
      } finally {
        setIsLoading(false);
      }
    };

    cargarTiposVehiculos();
  }, []);
  // Filtrar tipos de vehículos basado en la búsqueda
  const filteredTiposVehiculos = tiposVehiculos.filter(tipo =>
    tipo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tipo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };  const handleAddTipoVehiculo = () => {
    navigate('/nuevo-tipo-vehiculo');
  };

  const handleEditTipoVehiculo = (tipoId) => {
    navigate(`/nuevo-tipo-vehiculo/${tipoId}`);
  };

  const renderEstadoChip = (estado) => {
    const estadoConfig = {
      'activo': { label: 'Activo', className: 'status-activo' },
      'descontinuado': { label: 'Descontinuado', className: 'status-descontinuado' },
      'mantenimiento': { label: 'En mantenimiento', className: 'status-mantenimiento' }
    };

    const config = estadoConfig[estado] || { label: estado, className: 'status-default' };
    
    return (
      <Chip 
        label={config.label} 
        size="small" 
        className={`status-chip ${config.className}`}
      />
    );
  };
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
        Flota - Tipos de Vehículos
      </Typography>

      <Box sx={{ display: "flex", mt: 3, mb: 3, gap: 2, alignItems: "center" }}>
        <TextField
          placeholder="Buscar tipo de vehículo..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
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
          onClick={handleAddTipoVehiculo}
        >
          Nuevo tipo
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Table sx={{ minWidth: 650 }}>          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Peso Bruto/Tara (Ton)</TableCell>
              <TableCell>Carga GLP (m³)</TableCell>
              <TableCell>Peso Carga GLP (Ton)</TableCell>
              <TableCell>Unidades</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando tipos de vehículos...
                </TableCell>
              </TableRow>) : filteredTiposVehiculos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay tipos de vehículos disponibles.
                </TableCell>
              </TableRow>
            ) : (
              filteredTiposVehiculos.map((tipo, index) => (
                <TableRow key={tipo.id || index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocalShippingIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      <strong>{tipo.codigo}</strong>
                    </Box>
                  </TableCell>
                  <TableCell>{tipo.tara}</TableCell>
                  <TableCell>{tipo.cargaGLP}</TableCell>
                  <TableCell>{tipo.pesoGLP}</TableCell>
                  <TableCell>
                    <Chip 
                      label={tipo.unidades} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{renderEstadoChip(tipo.estado)}</TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      sx={{ 
                        minWidth: 'auto', 
                        p: 0.5 
                      }}
                      onClick={() => handleEditTipoVehiculo(tipo.id)}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 