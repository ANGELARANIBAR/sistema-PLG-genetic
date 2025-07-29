import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Assignment as ReportIcon,
  CheckCircle as CheckIcon,
  LocalShipping as TruckIcon,
  AccessTime as TimeIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';
import './SimulationReportModal.css';

const SimulationReportModal = ({ open, onClose, reportData }) => {
  if (!reportData) return null;

  const {
    pedidosCompletados = 0,
    totalPedidos = 0,
    volumenEntregado = 0,
    volumenTotal = 0,
    totalCamiones = 0,
    camionesEnRuta = 0,
    camionesDisponibles = 0,
    consumoCombustible = 0,
    fechaInicio,
    fechaFin,
    duracionTotal,
    sistemaOperativo = true
  } = reportData;

  const porcentajePedidos = totalPedidos > 0 ? (pedidosCompletados / totalPedidos) * 100 : 0;
  const porcentajeVolumen = volumenTotal > 0 ? (volumenEntregado / volumenTotal) * 100 : 0;
  const pedidosPendientes = totalPedidos - pedidosCompletados;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <ReportIcon />
        Reporte Final de Simulación
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Resumen General */}
        <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 600 }}>
            Resumen General
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckIcon sx={{ color: '#4caf50' }} />
                <Typography variant="body1" fontWeight={500}>
                  Pedidos Completados: {pedidosCompletados} / {totalPedidos}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={porcentajePedidos} 
                sx={{ height: 8, borderRadius: 4, bgcolor: '#e0e0e0' }}
              />
              <Typography variant="caption" sx={{ color: '#666' }}>
                {porcentajePedidos.toFixed(1)}% completado
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="body1" fontWeight={500}>
                  Volumen GLP Entregado: {volumenEntregado.toFixed(2)} / {volumenTotal.toFixed(2)} m³
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={porcentajeVolumen} 
                sx={{ height: 8, borderRadius: 4, bgcolor: '#e0e0e0' }}
              />
              <Typography variant="caption" sx={{ color: '#666' }}>
                {porcentajeVolumen.toFixed(1)}% del volumen total
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Estadísticas de Pedidos */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#4caf50', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReportIcon className="icon" />
                Estadísticas de Pedidos
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Total de Pedidos:</Typography>
                <Typography variant="h6" fontWeight={600}>{totalPedidos}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Completados:</Typography>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>{pedidosCompletados}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="orange">Pendientes:</Typography>
                <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 600 }}>{pedidosPendientes}</Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Volumen Total GLP:</Typography>
                <Typography variant="h6" fontWeight={600}>{volumenTotal.toFixed(2)} m³</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary">Volumen Entregado:</Typography>
                <Typography variant="h6" fontWeight={600}>{volumenEntregado.toFixed(2)} m³</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Estado de la Flota */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#2196f3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TruckIcon />
                Estado de la Flota
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Total de Camiones:</Typography>
                <Typography variant="h6" fontWeight={600}>{totalCamiones}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">En Ruta:</Typography>
                <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 600 }}>{camionesEnRuta}</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Disponibles:</Typography>
                <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>{camionesDisponibles}</Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              <Box>
                <Typography variant="body2" color="textSecondary">Consumo Combustible:</Typography>
                <Typography variant="h6" fontWeight={600}>{consumoCombustible.toFixed(2)} L</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Tiempo de Simulación */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#ff9800', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon />
                Tiempo de Simulación
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Fecha de Inicio:</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {fechaInicio ? new Date(fechaInicio).toLocaleString('es-ES') : 'N/A'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">Fecha de Fin:</Typography>
                <Typography variant="body1" fontWeight={500}>
                  {fechaFin ? new Date(fechaFin).toLocaleString('es-ES') : 'N/A'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary">Duración Total:</Typography>
                <Typography variant="h6" fontWeight={600}>{duracionTotal || '1h 13m'}</Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Estado del Sistema */}
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#9c27b0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ChartIcon />
                Estado del Sistema
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CheckIcon sx={{ color: '#4caf50' }} />
                <Typography variant="body1" fontWeight={500}>Sistema Operativo Sin Colapsos</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${porcentajePedidos.toFixed(0)}% Completado`}
                  color="error"
                  size="small"
                  sx={{ bgcolor: '#f44336', color: 'white' }}
                />
                <Chip 
                  label={`${porcentajeVolumen.toFixed(0)}% Volumen`}
                  color="error"
                  size="small"
                  sx={{ bgcolor: '#f44336', color: 'white' }}
                />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
        <Button 
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{ 
            bgcolor: '#1976d2',
            px: 4,
            py: 1,
            borderRadius: 2,
            fontWeight: 600
          }}
        >
          CERRAR REPORTE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SimulationReportModal; 