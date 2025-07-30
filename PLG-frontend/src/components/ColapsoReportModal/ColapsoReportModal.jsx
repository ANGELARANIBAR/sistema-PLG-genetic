import React from 'react';
import {
    Modal,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Divider,
    Chip,
    LinearProgress
} from '@mui/material';
import {
    Warning,
    Assessment,
    LocalShipping,
    Schedule,
    TrendingDown,
    LocationOn
} from '@mui/icons-material';
import './ColapsoReportModal.css';

const ColapsoReportModal = ({ open, onClose, reportData }) => {
    if (!reportData) return null;

    const formatNumber = (num) => {
        return typeof num === 'number' ? num.toFixed(2) : '0.00';
    };

    const formatDateTime = (dateStr) => {
        return dateStr ? new Date(dateStr).toLocaleString('es-ES') : 'N/A';
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box className="colapso-report-modal">
                <Box className="colapso-report-header">
                    <Warning className="colapso-icon" />
                    <Typography variant="h4" className="colapso-title">
                        🚨 REPORTE DE COLAPSO
                    </Typography>
                    <Typography variant="subtitle1" className="colapso-subtitle">
                        Simulación terminada por pedido no atendido
                    </Typography>
                </Box>

                <Box className="colapso-report-content">
                    {/* Resumen General */}
                    <Card className="kpi-card">
                        <CardContent>
                            <Typography variant="h6" className="card-title">
                                <Assessment /> Resumen General
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={3}>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number">
                                            {reportData.pedidosTotales}
                                        </Typography>
                                        <Typography variant="body2">Pedidos Totales</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={3}>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number success">
                                            {reportData.pedidosCompletados}
                                        </Typography>
                                        <Typography variant="body2">Completados</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={3}>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number warning">
                                            {reportData.pedidosPendientes}
                                        </Typography>
                                        <Typography variant="body2">Pendientes</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={3}>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number">
                                            {formatNumber(reportData.porcentajeCompletado)}%
                                        </Typography>
                                        <Typography variant="body2">% Completado</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                            <Box className="progress-container">
                                <Typography variant="body2">Progreso de Completado</Typography>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={reportData.porcentajeCompletado}
                                    className="progress-bar"
                                />
                            </Box>
                        </CardContent>
                    </Card>

                    {/* KPIs de Volumen */}
                    <Card className="kpi-card">
                        <CardContent>
                            <Typography variant="h6" className="card-title">
                                <TrendingDown /> Volumen de GLP
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number">
                                            {formatNumber(reportData.volumenTotalSolicitado)}
                                        </Typography>
                                        <Typography variant="body2">GLP Solicitado (L)</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number success">
                                            {formatNumber(reportData.volumenTotalEntregado)}
                                        </Typography>
                                        <Typography variant="body2">GLP Entregado (L)</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number">
                                            {formatNumber(reportData.porcentajeVolumenEntregado)}%
                                        </Typography>
                                        <Typography variant="body2">% Volumen Entregado</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* KPIs de Flota y Puntualidad */}
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <Card className="kpi-card">
                                <CardContent>
                                    <Typography variant="h6" className="card-title">
                                        <LocalShipping /> Flota
                                    </Typography>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number">
                                            {reportData.camionesTotales}
                                        </Typography>
                                        <Typography variant="body2">Camiones Totales</Typography>
                                    </Box>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number warning">
                                            {formatNumber(reportData.combustibleTotalConsumido)}
                                        </Typography>
                                        <Typography variant="body2">Combustible Consumido (L)</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={6}>
                            <Card className="kpi-card">
                                <CardContent>
                                    <Typography variant="h6" className="card-title">
                                        <Schedule /> Puntualidad
                                    </Typography>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number success">
                                            {reportData.pedidosATiempo}
                                        </Typography>
                                        <Typography variant="body2">A Tiempo</Typography>
                                    </Box>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number error">
                                            {reportData.pedidosTardios}
                                        </Typography>
                                        <Typography variant="body2">Tardíos</Typography>
                                    </Box>
                                    <Box className="kpi-item">
                                        <Typography variant="h4" className="kpi-number">
                                            {formatNumber(reportData.porcentajePuntualidad)}%
                                        </Typography>
                                        <Typography variant="body2">% Puntualidad</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Pedido Causante del Colapso */}
                    {reportData.pedidoCausante && (
                        <Card className="kpi-card colapso-causante">
                            <CardContent>
                                <Typography variant="h6" className="card-title error">
                                    <LocationOn /> Pedido Causante del Colapso
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Box className="causante-info">
                                            <Chip 
                                                label={`ID: ${reportData.pedidoCausante.id}`} 
                                                color="error" 
                                                variant="outlined"
                                            />
                                            <Chip 
                                                label={`Número: ${reportData.pedidoCausante.numeroPedido}`} 
                                                color="error" 
                                                variant="outlined"
                                            />
                                            <Chip 
                                                label={`${reportData.pedidoCausante.volumenGLP}L GLP`} 
                                                color="warning" 
                                                variant="outlined"
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" className="causante-detail">
                                            <strong>Fecha Límite:</strong><br />
                                            {formatDateTime(reportData.pedidoCausante.fechaHoraMaxEntrega)}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" className="causante-detail">
                                            <strong>Fecha Registro:</strong><br />
                                            {formatDateTime(reportData.pedidoCausante.fechaHoraRegistro)}
                                        </Typography>
                                    </Grid>
                                    {reportData.pedidoCausante.ubicacion && (
                                        <Grid item xs={12}>
                                            <Typography variant="body2" className="causante-detail">
                                                <strong>Ubicación:</strong> 
                                                ({formatNumber(reportData.pedidoCausante.ubicacion.x)}, {formatNumber(reportData.pedidoCausante.ubicacion.y)})
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tiempo de Simulación */}
                    {reportData.tiempoSimuladoHoras && (
                        <Card className="kpi-card">
                            <CardContent>
                                <Typography variant="h6" className="card-title">
                                    <Schedule /> Duración de la Simulación
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                        <Box className="kpi-item">
                                            <Typography variant="h4" className="kpi-number">
                                                {reportData.tiempoSimuladoHoras}
                                            </Typography>
                                            <Typography variant="body2">Horas Simuladas</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box className="kpi-item">
                                            <Typography variant="h4" className="kpi-number">
                                                {reportData.tiempoSimuladoMinutos}
                                            </Typography>
                                            <Typography variant="body2">Minutos Simulados</Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Box className="kpi-item">
                                            <Typography variant="h4" className="kpi-number">
                                                {formatNumber(reportData.promedioDestinosPorCamion)}
                                            </Typography>
                                            <Typography variant="body2">Destinos/Camión</Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Box>

                <Divider />

                <Box className="colapso-report-footer">
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={onClose}
                        size="large"
                    >
                        Cerrar Reporte
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ColapsoReportModal; 