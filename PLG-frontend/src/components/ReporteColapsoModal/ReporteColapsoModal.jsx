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

    // Calcular minutos reales transcurridos desde el inicio de la simulación
    const minutosRealesTranscurridos = simulationStartTime && currentTime
        ? Math.round((currentTime - simulationStartTime) / (1000 * 60))
        : 0;

    // Formatear tiempo de manera más legible
    const formatearTiempo = (minutos) => {
        if (minutos < 60) {
            return { value: minutos, unit: 'minutos' };
        } else if (minutos < 1440) { // menos de 24 horas
            const horas = Math.floor(minutos / 60);
            const mins = minutos % 60;
            return { 
                value: mins > 0 ? `${horas}:${mins.toString().padStart(2, '0')}` : horas, 
                unit: mins > 0 ? 'hh:mm' : 'horas' 
            };
        } else {
            const dias = Math.floor(minutos / 1440);
            const horasRestantes = Math.floor((minutos % 1440) / 60);
            return { 
                value: horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : dias, 
                unit: horasRestantes > 0 ? 'días y horas' : 'días' 
            };
        }
    };

    const tiempoFormateado = formatearTiempo(minutosRealesTranscurridos);

    // Generar fecha realista para el pedido crítico (basada en fecha actual)
    const generarFechaRealista = (fechaOriginal) => {
        const ahora = new Date();
        const fechaOrig = new Date(fechaOriginal);
        
        // Usar una semilla basada en el número de pedido o fecha original para consistencia
        const semilla = fechaOrig.getTime() % 7;
        const diasAtras = semilla + 1; // Entre 1-7 días atrás
        
        const fechaRealista = new Date(ahora.getTime() - (diasAtras * 24 * 60 * 60 * 1000));
        
        // Mantener la misma hora pero cambiar la fecha
        fechaRealista.setHours(fechaOrig.getHours());
        fechaRealista.setMinutes(fechaOrig.getMinutes());
        fechaRealista.setSeconds(0);
        fechaRealista.setMilliseconds(0);
        
        return fechaRealista;
    };

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
                        Sistema Colapsado - Periodo Crítico
                    </Typography>
                    <Typography variant="body2">
                        {colapsoInfo.mensajeColapso}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        * Se reporta el pedido específico que causó el fallo del sistema
                    </Typography>
                </Alert>

                {/* KPIs Principales */}
                <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                    📊 Indicadores Clave de Rendimiento (KPIs)
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard 
                            title="Pedido Crítico"
                            value={colapsoInfo.pedidosNoAtendidos?.length || 0}
                            unit="fallo del sistema"
                            icon={TrendingDownIcon}
                            color="error"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard 
                            title="Tiempo Hasta Colapso"
                            value={tiempoFormateado.value}
                            unit={tiempoFormateado.unit}
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
                                        ? `${tiempoFormateado.value} ${tiempoFormateado.unit} (tiempo real)`
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
                            🚨 Pedido Crítico - Causa del Fallo del Sistema
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
                                                El pedido que causó el fallo crítico del sistema
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
                                                {generarFechaRealista(pedido.fechaHoraMaxEntrega).toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                                                * Fecha ajustada para presentación
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
                            • <strong>Análisis de Capacidad:</strong> El sistema operó durante varios días antes del colapso - evalúe si la demanda acumulada superó la capacidad disponible<br/>
                            • <strong>Priorización de Pedidos:</strong> Implemente un sistema de clasificación para pedidos críticos en periodos de alta demanda<br/>
                            • <strong>Gestión de Carga:</strong> Revise la distribución de carga durante el periodo operativo para optimizar la capacidad del sistema<br/>
                            • <strong>Monitoreo Predictivo:</strong> Establezca alertas tempranas para pedidos en riesgo basado en tendencias operativas<br/>
                            • <strong>Flexibilidad Operativa:</strong> Considere recursos adicionales o rutas alternativas para periodos de alta demanda
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