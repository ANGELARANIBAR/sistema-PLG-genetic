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
import { pedidosService  } from "../services/pedidosService";
import "./Pedidos.css";

export default function Pedidos() {
  const [tabValue, setTabValue] = useState(0);
  const [pedidos, setPedidos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        const data = await pedidosService.fetchPedidos();
        console.log("Pedidos cargados:", data);
        setPedidos(data);
      } catch (error) {
        console.error("Error al cargar los pedidos:", error);
      }
    };

    cargarPedidos();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
            const numeroPedido = partes[2];
            let idCliente = 0;
            if (numeroPedido && numeroPedido.startsWith('c-')) {
              const idStr = numeroPedido.substring(2).trim();
              idCliente = Number(idStr);
            }
            const volumen = parseInt(partes[3].replace('m3', ''));
            const tiempoMaxEntrega = parseInt(partes[4].replace('h', ''));

            pedidos.push({
              idCliente,
              numeroPedido,
              coordenadaX: posX,
              coordenadaY: posY,
              volumen,
              tiempoMaxEntrega,
              fechaRegistro: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:00`
            });
          } catch (error) {
            console.error("Error procesando línea:", linea, error);
          }
        }

        try {
          console.log("Pedidos que se enviarán:", pedidos);
          await pedidosService.createMultiplePedidos(pedidos);
        } catch (error) {
          console.error("Error al crear pedidos:", error);
          alert('Error al registrar los pedidos. Ver consola para más detalles.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };


  // Render the status chip based on the estado
  const renderEstadoChip = (estado) => {
    if (estado === "ENTREGADO") {
      return (
        <Chip 
          label="Entregado" 
          size="small" 
          className={`status-chip status-completado`}
        />
      );
    } else if (estado === "PENDIENTE") {
      return (
        <Chip 
          label="Pendiente" 
          size="small" 
          className={`status-chip status-pendiente`}
        />
      );
    } else if (estado === "ASIGNADO" || estado === "EN_RUTA") {
      return (
        <Chip 
          label="En progreso" 
          size="small" 
          className={`status-chip status-pendiente`}
        />
      );
    } else if (estado === "VENCIDO") {
      return (
        <Chip 
          label="Vencido" 
          size="small" 
          className={`status-chip status-pendiente`}
        />
      );
    }
    return null;
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
      >
        <TextField
          placeholder="Buscar pedido..."
          variant="outlined"
          size="small"
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


      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="inherit"
          className="filter-tabs"
        >
          <Tab icon={<BarChartIcon />} iconPosition="start" label="Todos" />
          <Tab icon={<ScheduleIcon />} iconPosition="start" label="En progreso" />
          <Tab icon={<CheckCircleIcon />} iconPosition="start" label="Completos" />
          <Tab icon={<HourglassEmptyIcon />} iconPosition="start" label="Pendientes" />
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
          </TableHead>
          <TableBody>
            {pedidos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay pedidos disponibles.
                </TableCell>
              </TableRow>
            ) : (
              pedidos.map((pedido, index) => (
                <TableRow key={index}>
                  <TableCell>{pedido.id}</TableCell>
                  <TableCell>{'c-' + pedido.idCliente}</TableCell>
                  <TableCell>{pedido.volumenGLP}</TableCell>
                  <TableCell>{pedido.tiempoMaxEntrega / 3600} h</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
                      {new Date(pedido.fechaHoraRegistro).toLocaleString("es-PE")}
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