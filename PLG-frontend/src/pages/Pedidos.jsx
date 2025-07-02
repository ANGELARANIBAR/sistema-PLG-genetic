import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Tab, 
  Tabs, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  InputAdornment,
  Chip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import BarChartIcon from "@mui/icons-material/BarChart";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { fetchPedidos } from "../services/pedidosService";
import { getPedidos, filterPedidosByEstado, searchPedidosByCliente } from "../services/pedidosData";
import "./Pedidos.css";

export default function Pedidos() {
  const [tabValue, setTabValue] = useState(0);
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        setIsLoading(true);
        // Usar la función getPedidos que incluye fallback a datos dummy
        const data = await getPedidos();
        setPedidos(data);
        setFilteredPedidos(data);
      } catch (error) {
        console.error("Error al cargar los pedidos:", error);
        // En caso de error total, usar array vacío
        setPedidos([]);
        setFilteredPedidos([]);
      } finally {
        setIsLoading(false);
      }
    };

    cargarPedidos();
  }, []);

  // Filtrar pedidos cuando cambie el tab o el término de búsqueda
  useEffect(() => {
    let filtered = pedidos;
    
    // Filtrar por estado según el tab activo
    const estadoFiltros = ['todos', 'pendiente', 'en_proceso', 'entregado'];
    const estadoActivo = estadoFiltros[tabValue];
    filtered = filterPedidosByEstado(filtered, estadoActivo);
    
    // Filtrar por término de búsqueda
    filtered = searchPedidosByCliente(filtered, searchTerm);
    
    setFilteredPedidos(filtered);
  }, [pedidos, tabValue, searchTerm]);
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleNuevoPedido = () => {
    navigate('/nuevo-pedido');
  };

  const handleCargarArchivo = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.csv';

  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const match = file.name.match(/ventas(\d{4})(\d{2})/);
    if (!match) {
      alert('Nombre de archivo no válido. Debe ser del tipo ventasYYYYMM.txt');
      return;
    }

    const anio = parseInt(match[1]);
    const mes = parseInt(match[2]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const contenido = e.target.result;
      const lineas = contenido.split('\n').map(l => l.trim()).filter(Boolean);

      const pedidos = [];

      for (let linea of lineas) {
        try {
          const [fechaStr, resto] = linea.split(':');
          const partes = resto.split(',');

          if (partes.length < 5) {
            console.warn("Línea ignorada por formato incorrecto:", linea);
            continue;
          }

          const dia = parseInt(fechaStr.match(/(\d+)d/)?.[1] || '0');
          const hora = parseInt(fechaStr.match(/(\d+)h/)?.[1] || '0');
          const minuto = parseInt(fechaStr.match(/(\d+)m/)?.[1] || '0');

          const posX = parseFloat(partes[0]);
          const posY = parseFloat(partes[1]);
          const cliente = partes[2];
          const volumen = parseInt(partes[3].replace('m3', ''));
          const plazoMinutos = parseInt(partes[4].replace('h', '')) * 60;

          pedidos.push({
            cliente,
            coordenadaX: posX,
            coordenadaY: posY,
            volumen,
            plazoMinutos,
            fechaRegistro: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}T${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`
          });
        } catch (error) {
          console.error("Error procesando línea:", linea, error);
        }
      }

      try {
        console.log("Pedidos que se enviarán:", pedidos);

        const res = await fetch("/api/pedidos/registrar-masivo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedidos)
        });

        if (res.ok) {
          alert("Pedidos históricos cargados correctamente.");
        } else {
          alert("Error al registrar los pedidos.");
        }
      } catch (error) {
        console.error("Error de red:", error);
      }
    };

    reader.readAsText(file);
  };

  input.click();
};

  // Render the status chip based on the estado
  const renderEstadoChip = (estado) => {
    if (estado === "entregado") {
      return (
        <Chip 
          label="Entregado" 
          size="small" 
          className={`status-chip status-completado`}
        />
      );
    } else if (estado === "pendiente") {
      return (
        <Chip 
          label="Pendiente" 
          size="small" 
          className={`status-chip status-pendiente`}
        />
      );
    } else if (estado === "en_proceso") {
      return (
        <Chip 
          label="En progreso" 
          size="small" 
          className={`status-chip status-en-progreso`}
        />
      );
    } else {
      return (
        <Chip 
          label={estado} 
          size="small" 
          className={`status-chip status-default`}
        />
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" fontWeight="700" gutterBottom>
        Gestión de Pedidos
      </Typography>

      <Box
        sx={{
          display: "flex",
          mt: 3,
          mb: 2,
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >        <TextField
          placeholder="Buscar pedido..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{
            flexGrow: 1,          
            minWidth: 250,    
            flexShrink: 1,    
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          className="add-button"
          onClick={handleNuevoPedido}
        >
          Nuevo pedido
        </Button>

        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          className="upload-button"
          onClick={handleCargarArchivo}
        >
          CARGAR ARCHIVO
        </Button>
      </Box>


      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="inherit"
          className="filter-tabs"
        >
          <Tab icon={<BarChartIcon />} iconPosition="start" label="Todos" />
          <Tab icon={<ScheduleIcon />} iconPosition="start" label="Pendientes" />
          <Tab icon={<HourglassEmptyIcon />} iconPosition="start" label="En progreso" />
          <Tab icon={<CheckCircleIcon />} iconPosition="start" label="Entregados" />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Carga (m³)</TableCell>
              <TableCell>Plazo de entrega (horas)</TableCell>
              <TableCell>Fecha de Pedido</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Cargando pedidos...
                </TableCell>
              </TableRow>
            ) : filteredPedidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay pedidos disponibles.
                </TableCell>
              </TableRow>
            ) : (
              filteredPedidos.map((pedido, index) => (
                <TableRow key={pedido.id || index}>
                  <TableCell>{pedido.id}</TableCell>
                  <TableCell>{pedido.nombreCliente}</TableCell>
                  <TableCell>{pedido.cargaGLP}</TableCell>
                  <TableCell>{pedido.plazoEntrega} h</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
                      {pedido.fechaPedido}
                    </Box>
                  </TableCell>
                  <TableCell>{renderEstadoChip(pedido.estado)}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      <VisibilityIcon />
                    </Button>
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