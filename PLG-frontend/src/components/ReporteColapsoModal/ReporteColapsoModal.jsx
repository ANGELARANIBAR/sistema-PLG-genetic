import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Paper,
    Divider,
    Alert,
    Chip
} from '@mui/material';
import {
    Warning as WarningIcon,
    TrendingDown as TrendingDownIcon,
    Assignment as AssignmentIcon,
    LocalShipping as LocalShippingIcon,
    Schedule as ScheduleIcon,
    Speed as SpeedIcon
} from '@mui/icons-material';

const ReporteColapsoModal = ({ 
    open, 
    onClose, 
    colapsoInfo, 
    simulationStats,
    currentTime,
    simulationStartTime 
}) => {
    if (!colapsoInfo || !colapsoInfo.colapsoDetectado) return null;

    // Calcular tiempo transcurrido hasta el colapso
    const tiempoTranscurrido = simulationStartTime && currentTime 
        ? Math.round((currentTime - simulationStartTime) / (1000 * 60 * 60 * 24 * 1000/120000)) // días simulados
        : 0;

    const horasTranscurridas = simulationStartTime && currentTime
        ? Math.round((currentTime - simulationStartTime) / (1000 * 60 * 60))
        : 0;

    const KPICard = ({ title, value, unit, icon: Icon, color = 'primary' }) => (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 2, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <Icon sx={{ fontSize: 40, color: `${color}.main` }} />
            </Box>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: `${color}.main` }}>
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {unit}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                {title}
            </Typography>
        </Paper>
    );

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
                sx: { minHeight: '70vh' }
            }}
        >
            <DialogTitle sx={{ 
                bgcolor: 'error.main', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 2
            }}>
                <WarningIcon />
                REPORTE DE COLAPSO LOGÍSTICO
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
                {/* Alerta principal */}
                <Alert 
                    severity="error" 
                    sx={{ mb: 3 }}
                    icon={<WarningIcon />}
                >
                    <Typography variant="h6" component="div">
                        Sistema Colapsado - Después del Día 4
                    </Typography>
                    <Typography variant="body2">
                        {colapsoInfo.mensajeColapso}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        * Solo se reporta el pedido específico que causó el colapso después del día 4
                    </Typography>
                </Alert>

                {/* KPIs Principales */}
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                    📊 Indicadores Clave de Rendimiento (KPIs)
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard 
                            title="Pedido Colapso (Día 4+)"
                            value={colapsoInfo.pedidosNoAtendidos?.length || 0}
                            unit="pedido crítico"
                            icon={TrendingDownIcon}
                            color="error"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard 
                            title="Tiempo Hasta Colapso"
                            value={horasTranscurridas}
                            unit="horas simuladas"
                            icon={ScheduleIcon}
                            color="warning"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard 
                            title="Pedidos Procesados"
                            value={simulationStats?.pedidosAtendidos || 0}
                            unit="pedidos"
                            icon={AssignmentIcon}
                            color="success"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard 
                            title="Eficiencia del Sistema"
                            value={simulationStats?.pedidosAtendidos && colapsoInfo.pedidosNoAtendidos?.length 
                                ? Math.round((simulationStats.pedidosAtendidos / (simulationStats.pedidosAtendidos + colapsoInfo.pedidosNoAtendidos.length)) * 100)
                                : 0}
                            unit="%"
                            icon={SpeedIcon}
                            color="info"
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Detalles del Colapso */}
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    🚨 Detalles del Colapso
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Fecha de Colapso
                                </Typography>
                                <Typography variant="body1">
                                    {currentTime ? new Date(currentTime).toLocaleString() : 'N/A'}
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Duración de Simulación
                                </Typography>
                                <Typography variant="body1">
                                    {simulationStartTime && currentTime 
                                        ? `${Math.round((currentTime - simulationStartTime) / (1000 * 60))} minutos reales`
                                        : 'N/A'}
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Box>

                {/* Pedido Crítico que Causó el Colapso */}
                {colapsoInfo.pedidosNoAtendidos && colapsoInfo.pedidosNoAtendidos.length > 0 && (
                    <>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            🚨 Pedido Crítico que Causó el Colapso
                        </Typography>
                        <Paper elevation={1} sx={{ p: 2, bgcolor: 'error.light', border: '2px solid', borderColor: 'error.main' }}>
                            {colapsoInfo.pedidosNoAtendidos.map((pedido, index) => (
                                <Box key={index} sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px dashed', borderColor: 'error.main' }}>
                                    <Grid container spacing={2} alignItems="center">
                                        <Grid item xs={12} md={4}>
                                            <Typography variant="h6" fontWeight="bold" color="error.main">
                                                Pedido #{pedido.numeroPedido}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                El pedido que no pudo ser atendido después del día 4
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6} md={4}>
                                            <Typography variant="body2" color="text.secondary">
                                                Volumen GLP:
                                            </Typography>
                                            <Chip 
                                                label={`${pedido.volumenGLP} L`} 
                                                size="medium" 
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid item xs={6} md={4}>
                                            <Typography variant="body2" color="text.secondary">
                                                Fecha límite de entrega:
                                            </Typography>
                                            <Typography variant="body2" fontWeight="bold" color="error.main">
                                                {new Date(pedido.fechaHoraMaxEntrega).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            ))}
                        </Paper>
                    </>
                )}

                {/* Recomendaciones */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                        💡 Recomendaciones
                    </Typography>
                    <Paper elevation={1} sx={{ p: 2, bgcolor: 'info.light' }}>
                        <Typography variant="body2" component="div">
                            • <strong>Análisis de Capacidad:</strong> El sistema funcionó 4 días antes del colapso - evalúe si la demanda acumulada superó la capacidad<br/>
                            • <strong>Priorización de Pedidos:</strong> Implemente un sistema de prioridad para pedidos críticos después del día 4<br/>
                            • <strong>Gestión de Carga:</strong> Revise la distribución de carga durante los primeros 4 días para optimizar la capacidad restante<br/>
                            • <strong>Monitoreo Predictivo:</strong> Establezca alertas para pedidos en riesgo a partir del día 3<br/>
                            • <strong>Flexibilidad Operativa:</strong> Considere recursos adicionales o rutas alternativas para situaciones post día 4
                        </Typography>
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button 
                    onClick={onClose} 
                    variant="contained" 
                    color="primary"
                    size="large"
                >
                    Cerrar Reporte
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReporteColapsoModal; 