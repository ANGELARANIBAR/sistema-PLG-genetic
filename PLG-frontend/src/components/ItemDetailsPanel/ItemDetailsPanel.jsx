import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Divider,
    Paper,
    Chip,
    Grid,
    LinearProgress,
    Card,
    CardContent,
    Button,
    Alert
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import SpeedIcon from '@mui/icons-material/Speed';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TimerIcon from '@mui/icons-material/Timer';
import WarningIcon from '@mui/icons-material/Warning';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { fetchTruckDestination, registrarAveria } from '../../services/routeService';
import { mapService } from '../../services/mapService';

const ItemDetailsPanel = ({ 
    selectedItem, 
    system, 
    truckFuels, 
    truckGLPs, 
    cisternaGLPs, 
    currentDestinations,
    currentTime 
}) => {
    const [activeTruckTab, setActiveTruckTab] = useState(0);
    const [latestTruck, setLatestTruck] = useState(null);
    const [localSystem, setLocalSystem] = useState(system);

    useEffect(() => {
        
        const fetchLatestTruck = async () => {
            if (selectedItem?.type === 'truck' && selectedItem.id) {
                const systemData = await mapService.fetchSystem();
                const truck = systemData?.flota?.find(t => t.truckId === selectedItem.id);
                system = systemData;
                setLatestTruck(truck || null);
            } else {
                setLatestTruck(null);
            }
        };
        fetchLatestTruck();
    }, [selectedItem]);

    useEffect(() => {
    async function fetchSys() {
        const data = await mapService.fetchSystem();
        setLocalSystem(data);
        // setLatestTruck como antes
    }
    fetchSys();
    }, [selectedItem]);

    if (!selectedItem || !system) {
        return (
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Selecciona un elemento para ver sus detalles
                </Typography>
            </Paper>
        );
    }

    const getTruckDestinations = (truck) => {
        if (!truck || !currentTime) return [];
        
        const truckDestinations = truck.destinations || [];
        return truckDestinations.map((destino, index) => ({
            ...destino,
            index
        }));
    };

    const getDestinationTypeLabel = (type) => {
        const labels = {
            'REABASTECIMIENTO': 'Reabastecimiento',
            'ENTREGA PEDIDO': 'Entrega de Pedido',
            'EN_RECARGA_GLP': 'Recarga de GLP',
            'EN_RECARGA_COMBUSTIBLE': 'Recarga de Combustible',
            'EN_MANTENIMIENTO': 'En Mantenimiento',
            'AVERIADO': 'Averiado',
            'CIS': 'Cisterna',
            'CLIENTE': 'Cliente', 
            'GRI': 'Grifo'
        };
        return labels[type] || type;
    };

    const getStatusColor = (status) => {
        const colors = {
            'COMPLETADO': 'success',
            'EN_CURSO': 'info',
            'PENDIENTE': 'warning',
            'CANCELADO': 'error',
            'PENDING': 'warning',
            'IN_PROGRESS': 'info',
            'COMPLETED': 'success',
            'CANCELLED': 'error'
        };
        return colors[status] || 'default';
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const handleAveriaOption = async (tipoAveria) => {
        if (!selectedItem || selectedItem.type !== 'truck' || !currentTime) return;
        
        try {
            const averiaData = {
                truckId: selectedItem.id,
                tipoAveria: tipoAveria,
                fechaHoraAveria: currentTime.toISOString()
            };
            
            await registrarAveria(averiaData);
            alert(`Avería tipo ${tipoAveria} registrada exitosamente para el camión ${selectedItem.id}`);
        } catch (error) {
            console.error('Error registering breakdown:', error);
            alert('Error al registrar la avería: ' + error.message);
        }
    };

    if (selectedItem.type === 'truck') {
        const truck = latestTruck || system?.flota?.find(t => t.truckId === selectedItem.id);
        const currentFuel = truckFuels.get(selectedItem.id) || 0;
        const currentGLP = truckGLPs.get(selectedItem.id) || 0;
        const destinations = getTruckDestinations(truck);
        const currentDest = currentDestinations.get(selectedItem.id);

        if (!truck) return (
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" color="error">Camión no encontrado</Typography>
            </Paper>
        );

        const fuelPercentage = (currentFuel / (truck.tipoCamion?.capCombustibleMax || 100)) * 100;
        const glpPercentage = (currentGLP / (truck.tipoCamion?.cargaGLPMax || 100)) * 100;

        return (
            <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocalShippingIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="primary" fontWeight="bold">
                        Detalles del Camión {truck.codigo}
                    </Typography>
                </Box>
                
                <Tabs 
                    value={activeTruckTab} 
                    onChange={(e, newValue) => setActiveTruckTab(newValue)}
                    sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Información General" />
                    <Tab label="Destinos" />
                    <Tab label="Averías" />
                </Tabs>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {activeTruckTab === 0 && (
                        <Grid container spacing={2}>
                            {/* Información básica */}
                            <Grid item xs={12}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            Información Básica
                                        </Typography>
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Código:</Typography>
                                                <Typography variant="body1" fontWeight="bold">{truck.codigo}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Placa:</Typography>
                                                <Typography variant="body1" fontWeight="bold">{truck.plate}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                                                <Typography variant="body1">{truck.tipoCamion?.id || 'N/A'}</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Velocidad Promedio:</Typography>
                                                <Typography variant="body1">{truck.tipoCamion?.velocidadPromedio?.toFixed(2) || 'N/A'} nodes/min</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Estado actual */}
                            {currentDest && (
                                <Grid item xs={12}>
                                    <Card elevation={2}>
                                        <CardContent>
                                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                Estado Actual
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <TimerIcon sx={{ mr: 1, color: 'info.main' }} />
                                                <Typography variant="body1">
                                                    {getDestinationTypeLabel(currentDest.destinationType)}
                                                </Typography>
                                            </Box>
                                            {currentDest.ubicacion && (
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <LocationOnIcon sx={{ mr: 1, color: 'success.main' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Destino: ({currentDest.ubicacion.x}, {currentDest.ubicacion.y})
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}

                            {/* Combustible */}
                            <Grid item xs={12}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <LocalGasStationIcon color="error" sx={{ mr: 1 }} />
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                Combustible
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">Actual: {currentFuel.toFixed(2)}L</Typography>
                                                <Typography variant="body2">{fuelPercentage.toFixed(1)}%</Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={Math.min(fuelPercentage, 100)} 
                                                sx={{ height: 8, borderRadius: 4 }}
                                                color={fuelPercentage > 50 ? 'success' : fuelPercentage > 20 ? 'warning' : 'error'}
                                            />
                                        </Box>
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Capacidad Máx:</Typography>
                                                <Typography variant="body2">{truck.tipoCamion?.capCombustibleMax?.toFixed(2) || 'N/A'}L</Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">Consumido:</Typography>
                                                <Typography variant="body2">{Number(truck.fuelConsumed || 0).toFixed(2)}L</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* GLP */}
                            <Grid item xs={12}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <PropaneTankIcon color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                GLP
                                            </Typography>
                                        </Box>
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="body2">Actual: {currentGLP.toFixed(2)}L</Typography>
                                                <Typography variant="body2">{glpPercentage.toFixed(1)}%</Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={Math.min(glpPercentage, 100)} 
                                                sx={{ height: 8, borderRadius: 4 }}
                                                color={glpPercentage > 50 ? 'success' : glpPercentage > 20 ? 'warning' : 'error'}
                                            />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Capacidad Máxima: {truck.tipoCamion?.cargaGLPMax?.toFixed(2) || 'N/A'}L
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {activeTruckTab === 1 && (
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Lista de Destinos
                            </Typography>
                            {destinations.length > 0 ? (
                                destinations.map((dest, index) => {
                                    const isCurrentDestination = currentDest && 
                                        dest.destinationType === currentDest.destinationType &&
                                        dest.arrivalTime === currentDest.arrivalTime &&
                                        dest.departureTime === currentDest.departureTime;
                                    
                                    return (
                                        <Card 
                                            key={index} 
                                            elevation={isCurrentDestination ? 4 : 2}
                                            sx={{ 
                                                mb: 2,
                                                border: isCurrentDestination ? '2px solid' : '1px solid',
                                                borderColor: isCurrentDestination ? 'primary.main' : 'divider',
                                                backgroundColor: isCurrentDestination ? 'primary.light' : 'background.paper',
                                                color: isCurrentDestination ? 'primary.contrastText' : 'text.primary'
                                            }}
                                        >
                                            <CardContent sx={{ pb: '12px !important' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                    <Typography variant="body1" fontWeight="bold">
                                                        {getDestinationTypeLabel(dest.destinationType)}
                                                        {isCurrentDestination && (
                                                            <Chip 
                                                                label="ACTUAL" 
                                                                size="small" 
                                                                color="secondary" 
                                                                sx={{ ml: 1, fontSize: '10px', height: '20px' }}
                                                            />
                                                        )}
                                                    </Typography>
                                                    {dest.destinationType === 'ENTREGA PEDIDO' && (
                                                        <Chip 
                                                            label={dest.status || 'PENDIENTE'} 
                                                            size="small" 
                                                            color={getStatusColor(dest.status)}
                                                            sx={{ fontSize: '10px', height: '20px' }}
                                                        />
                                                    )}
                                                </Box>
                                                
                                                <Grid container spacing={1} sx={{ mt: 1 }}>
                                                    <Grid item xs={12}>
                                                        <Typography variant="caption" display="block">
                                                            <strong>Ubicación:</strong> ({dest.ubicacion?.x || 'N/A'}, {dest.ubicacion?.y || 'N/A'})
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" display="block">
                                                            <strong>Llegada:</strong> {formatDateTime(dest.arrivalTime)}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="caption" display="block">
                                                            <strong>Salida:</strong> {formatDateTime(dest.departureTime)}
                                                        </Typography>
                                                    </Grid>
                                                    {dest.glpOperacion && (
                                                        <Grid item xs={6}>
                                                            <Typography variant="caption" display="block">
                                                                <strong>Operación GLP:</strong> {dest.glpOperacion.toFixed(2)}L
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                    {dest.saldoGLPCamion !== undefined && (
                                                        <Grid item xs={6}>
                                                            <Typography variant="caption" display="block">
                                                                <strong>Saldo GLP:</strong> {dest.saldoGLPCamion.toFixed(2)}L
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                    {dest.saldoCombustibleCamion !== undefined && (
                                                        <Grid item xs={6}>
                                                            <Typography variant="caption" display="block">
                                                                <strong>Saldo Combustible:</strong> {dest.saldoCombustibleCamion.toFixed(2)}L
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                    {dest.orderId && (
                                                        <Grid item xs={6}>
                                                            <Typography variant="caption" display="block">
                                                                <strong>ID Pedido:</strong> {dest.orderId}
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                    No hay destinos programados para este camión
                                </Typography>
                            )}
                        </Box>
                    )}

                    {activeTruckTab === 2 && (
                        <Box>
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    Registra una avería para este camión. Esto pausará la simulación y activará la replanificación.
                                </Typography>
                            </Alert>
                            
                            <Card elevation={2}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <WarningIcon color="warning" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Registrar Avería
                                        </Typography>
                                    </Box>
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Selecciona el tipo de avería que deseas registrar:
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <Button 
                                                variant="outlined"
                                                color="warning"
                                                fullWidth
                                                onClick={() => handleAveriaOption(1)}
                                                sx={{ 
                                                    height: '60px',
                                                    flexDirection: 'column',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Avería<br/>Tipo 1
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button 
                                                variant="outlined"
                                                color="error"
                                                fullWidth
                                                onClick={() => handleAveriaOption(2)}
                                                sx={{ 
                                                    height: '60px',
                                                    flexDirection: 'column',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Avería<br/>Tipo 2
                                            </Button>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Button 
                                                variant="outlined"
                                                color="error"
                                                fullWidth
                                                onClick={() => handleAveriaOption(3)}
                                                sx={{ 
                                                    height: '60px',
                                                    flexDirection: 'column',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Avería<br/>Tipo 3
                                            </Button>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Box>
                    )}
                </Box>
            </Paper>
        );
    }

    if (selectedItem.type === 'cisterna') {
        const cisterna = system?.cisternas?.[selectedItem.id];
        const currentGLP = cisternaGLPs.get(cisterna?.id) ?? cisterna?.cargaGLPActual;

        if (!cisterna) return (
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" color="error">Cisterna no encontrada</Typography>
            </Paper>
        );

        const glpPercentage = (currentGLP / cisterna.capacidadTotal) * 100;

        return (
            <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PropaneTankIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="success.main" fontWeight="bold">
                        Detalles de la Cisterna {cisterna.id}
                    </Typography>
                </Box>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Grid container spacing={2}>
                        {/* Información básica */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Información Básica
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">ID:</Typography>
                                            <Typography variant="body1" fontWeight="bold">{cisterna.id}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Tipo:</Typography>
                                            <Chip 
                                                label={cisterna.principal ? 'Principal' : 'Secundaria'} 
                                                color={cisterna.principal ? 'primary' : 'default'}
                                                size="small"
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Ubicación:</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LocationOnIcon sx={{ mr: 1, color: 'success.main' }} />
                                                <Typography variant="body1">
                                                    ({cisterna.ubicacion.x}, {cisterna.ubicacion.y})
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Hora de Abastecimiento:</Typography>
                                            <Typography variant="body1">{cisterna.horaAbastecimento}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Capacidad GLP */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <PropaneTankIcon color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Capacidad GLP
                                        </Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2">Actual: {currentGLP?.toFixed(2)}L</Typography>
                                            <Typography variant="body2">{glpPercentage.toFixed(1)}%</Typography>
                                        </Box>
                                        <LinearProgress 
                                            variant="determinate" 
                                            value={Math.min(glpPercentage, 100)} 
                                            sx={{ height: 8, borderRadius: 4 }}
                                            color={glpPercentage > 70 ? 'success' : glpPercentage > 30 ? 'warning' : 'error'}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Capacidad Total: {cisterna.capacidadTotal.toFixed(2)}L
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Operaciones GLP */}
                        {cisterna.operacionesGLPCisterna?.length > 0 && (
                            <Grid item xs={12}>
                                <Card elevation={2}>
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            Últimas Operaciones GLP
                                        </Typography>
                                        {cisterna.operacionesGLPCisterna.slice(-3).map((op, idx) => (
                                            <Card key={idx} variant="outlined" sx={{ mb: 1, p: 1 }}>
                                                <Grid container spacing={1}>
                                                    <Grid item xs={12}>
                                                        <Typography variant="caption" color="text.secondary">
                                                            <TimerIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                                            {new Date(op.fechaHoraOperacion).toLocaleString()}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            {op.cantSalidaGLP.toFixed(2)}L GLP
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Camión {op.camionId}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Card>
                                        ))}
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Paper>
        );
    }

    if (selectedItem.type === 'pedido') {
        const pedido = localSystem?.pedidos?.find(p => p.id === selectedItem.id);

        if (!pedido) return (
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" color="error">Pedido no encontrado</Typography>
            </Paper>
        );

        const getEstadoColor = (estado) => {
            switch (estado) {
                case 'PENDIENTE': return 'warning';
                case 'EN_PROGRESO': return 'info';
                case 'COMPLETADO': return 'success';
                case 'ENTREGADO': return 'success';
                case 'CANCELADO': return 'error';
                default: return 'default';
            }
        };

        return (
            <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ShoppingCartIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="secondary" fontWeight="bold">
                        Detalles del Pedido {pedido.numeroPedido}
                    </Typography>
                </Box>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Grid container spacing={2}>
                        {/* Información básica */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Información Básica
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Código de Pedido:</Typography>
                                            <Typography variant="body1" fontWeight="bold">{pedido.numeroPedido}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">ID:</Typography>
                                            <Typography variant="body1">{pedido.id}</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Volumen GLP:</Typography>
                                            <Typography variant="body1" fontWeight="bold">{pedido.volumenGLP.toFixed(2)}m³</Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="text.secondary">Estado:</Typography>
                                            <Chip 
                                                label={pedido.estado} 
                                                color={getEstadoColor(pedido.estado)}
                                                size="small"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Ubicación:</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LocationOnIcon sx={{ mr: 1, color: 'secondary.main' }} />
                                                <Typography variant="body1">
                                                    ({pedido.ubicacion.x}, {pedido.ubicacion.y})
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Fechas importantes */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <TimerIcon color="info" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Cronología
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Hora de Registro:</Typography>
                                            <Typography variant="body1">
                                                {new Date(pedido.fechaHoraRegistro || '').toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Entrega Máxima:</Typography>
                                            <Typography variant="body1" fontWeight="bold" color="error.main">
                                                {new Date(pedido.fechaHoraMaxEntrega || '').toLocaleString()}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Consumo de combustible */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <LocalGasStationIcon color="error" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Consumo de Recursos
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">Combustible Total Estimado:</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {pedido.consumoCombustibleTotal?.toFixed(2) || '0.00'}L
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Estado del pedido en tiempo real */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Estado en Tiempo Real
                                    </Typography>
                                    <Alert 
                                        severity={getEstadoColor(pedido.estado)} 
                                        sx={{ 
                                            '& .MuiAlert-message': { 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                width: '100%'
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: '100%' }}>
                                            <Typography variant="body1" fontWeight="bold">
                                                Estado: {pedido.estado}
                                            </Typography>
                                            {pedido.estado === 'PENDIENTE' && (
                                                <Typography variant="body2">
                                                    El pedido está esperando ser procesado y asignado a un camión.
                                                </Typography>
                                            )}
                                            {pedido.estado === 'EN_PROGRESO' && (
                                                <Typography variant="body2">
                                                    El pedido está siendo procesado y está en ruta de entrega.
                                                </Typography>
                                            )}
                                            {pedido.estado === 'COMPLETADO' && (
                                                <Typography variant="body2">
                                                    El pedido ha sido entregado exitosamente.
                                                </Typography>
                                            )}
                                            {pedido.estado === 'ENTREGADO' && (
                                                <Typography variant="body2">
                                                    El pedido ha sido entregado al cliente.
                                                </Typography>
                                            )}
                                        </Box>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        );
    }

    if (selectedItem.type === 'bloqueo') {
        const bloqueo = selectedItem.data;

        if (!bloqueo) return (
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" color="error">Bloqueo no encontrado</Typography>
            </Paper>
        );

        const isActive = currentTime ? 
            currentTime >= new Date(bloqueo.fechaHoraInicio) && currentTime <= new Date(bloqueo.fechaHoraFin) :
            false;

        return (
            <Paper elevation={3} sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="h6" color="error" fontWeight="bold">
                        Detalles del Bloqueo #{selectedItem.id}
                    </Typography>
                </Box>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <Grid container spacing={2}>
                        {/* Estado del bloqueo */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Estado Actual
                                    </Typography>
                                    <Chip 
                                        label={isActive ? 'ACTIVO' : 'INACTIVO'} 
                                        color={isActive ? 'error' : 'default'}
                                        size="medium"
                                        sx={{ fontWeight: 'bold', fontSize: '14px' }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Información temporal */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <TimerIcon color="info" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Duración del Bloqueo
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Fecha/Hora de Inicio:</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {new Date(bloqueo.fechaHoraInicio).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Fecha/Hora de Fin:</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {new Date(bloqueo.fechaHoraFin).toLocaleString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary">Duración Total:</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {Math.round((new Date(bloqueo.fechaHoraFin) - new Date(bloqueo.fechaHoraInicio)) / (1000 * 60))} minutos
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Rutas afectadas */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <LocationOnIcon color="warning" sx={{ mr: 1 }} />
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            Rutas Bloqueadas
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Número de segmentos bloqueados: {bloqueo.rutasBloqueadas?.length || 0}
                                    </Typography>
                                    {bloqueo.rutasBloqueadas && bloqueo.rutasBloqueadas.length > 0 && (
                                        <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                                            {bloqueo.rutasBloqueadas.map((ruta, index) => (
                                                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        Punto {index + 1}: ({ruta.x?.toFixed(1)}, {ruta.y?.toFixed(1)})
                                                    </Typography>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Información adicional */}
                        <Grid item xs={12}>
                            <Card elevation={2}>
                                <CardContent>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                        Información Adicional
                                    </Typography>
                                    <Alert 
                                        severity={isActive ? 'error' : 'info'}
                                        sx={{ 
                                            '& .MuiAlert-message': { 
                                                display: 'flex', 
                                                alignItems: 'center',
                                                width: '100%'
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: '100%' }}>
                                            <Typography variant="body1" fontWeight="bold">
                                                {isActive ? 'Bloqueo Activo' : 'Bloqueo Inactivo'}
                                            </Typography>
                                            <Typography variant="body2">
                                                {isActive ? 
                                                    'Este bloqueo está actualmente activo y afecta las rutas de los vehículos en el mapa.' :
                                                    'Este bloqueo no está activo en el momento actual.'
                                                }
                                            </Typography>
                                        </Box>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
        );
    }

    return (
        <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" color="text.secondary">
                Tipo de elemento no reconocido
            </Typography>
        </Paper>
    );
};

export default ItemDetailsPanel;
