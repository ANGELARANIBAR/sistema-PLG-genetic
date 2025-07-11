import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Alert,
    Tabs,
    Tab,
    Chip,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    LinearProgress
} from "@mui/material";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import GasMeterIcon from '@mui/icons-material/GasMeter';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import MapVisualization from "../components/MapVisualization";
import { mapService } from "../services/mapService";
import { useBatchRefreshMonitor } from "../hooks/useBatchRefreshMonitor";

/**
 * Simulador.jsx — Simulador con MapVisualization y controles de tiempo
 * ‣ Usa los servicios reales para obtener datos del sistema PLG
 * ‣ Controles de simulación con play/pause y velocidad
 * ‣ Panel lateral con información del estado
 */

const API_BASE = "/api/solution";

export default function Simulador() {
    // Simulation control states
    const [currentTime, setCurrentTime] = useState(null);
    const [realTime, setRealTime] = useState(new Date());
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [simulationStarted, setSimulationStarted] = useState(false);
    const [fechaHoraFinEntregas, setFechaHoraFinEntregas] = useState(null);
    const [isContinuing, setIsContinuing] = useState(false);
    const [lastProcessedFechaHoraFin, setLastProcessedFechaHoraFin] = useState(() => {
        // Try to get from sessionStorage on initialization
        const stored = sessionStorage.getItem('lastProcessedFechaHoraFin');
        return stored ? new Date(stored) : null;
    });
    const [colapsoInfo, setColapsoInfo] = useState(null);
    const [showAutoPlayNotification, setShowAutoPlayNotification] = useState(false);
    
    // UI states
    const [navbarHeight, setNavbarHeight] = useState(65);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    // Data states
    const [systemData, setSystemData] = useState(null);
    const [trucksData, setTrucksData] = useState([]);
    const [pedidosData, setPedidosData] = useState([]);
    const [cisternasData, setCisternasData] = useState([]);

    // Monitor for batch refresh notifications
    useBatchRefreshMonitor(true, 2000);

    // Check if we should auto-play after a refresh
    useEffect(() => {
        const shouldAutoPlay = sessionStorage.getItem('autoPlayAfterRefresh');
        if (shouldAutoPlay === 'true') {
            // Clear the flag
            sessionStorage.removeItem('autoPlayAfterRefresh');
            // Show notification
            setShowAutoPlayNotification(true);
            // Auto-play the simulation after a short delay to ensure everything is loaded
            setTimeout(() => {
                setIsPlaying(true);
                // Hide notification after 5 seconds
                setTimeout(() => {
                    setShowAutoPlayNotification(false);
                }, 5000);
            }, 2000);
        }
    }, []);

    // Load start time and fechaHoraFinEntregas when component mounts
    useEffect(() => {
        const loadStartTimeAndFin = async () => {
            try {
                const startTimeString = await mapService.fetchStartTime();
                setCurrentTime(new Date(startTimeString));
                setSimulationStarted(true);
            } catch (error) {
                setCurrentTime(new Date());
                setSimulationStarted(true);
            }
            // Fetch fechaHoraFinEntregas
            try {
                const res = await fetch(`${API_BASE}/fecha-hora-fin-entregas`);
                const data = await res.json();
                if (data) setFechaHoraFinEntregas(new Date(data));
            } catch (e) {
                setFechaHoraFinEntregas(null);
            }
        };
        loadStartTimeAndFin();
    }, []);

    // Load system data periodically
    useEffect(() => {
        const loadSystemData = async () => {
            try {
                const system = await mapService.fetchSystem();
                if (system) {
                    console.log('Sistema cargado:', system);
                    console.log('Camiones encontrados en flota:', system.flota?.length || 0);
                    setSystemData(system);
                    setTrucksData(system.flota || []); // Cambiado de camiones a flota
                    setPedidosData(system.pedidos || []);
                    setCisternasData(system.cisternas || []);
                }
            } catch (error) {
                console.error('Error loading system data:', error);
            }
        };

        loadSystemData();
        const interval = setInterval(loadSystemData, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);

    // Update truck data with real-time information
    useEffect(() => {
        if (!currentTime || !systemData?.flota?.length) return; // Cambiado de camiones a flota

        const updateTruckData = async () => {
            console.log('Actualizando datos de camiones en tiempo real...');
            const baseTrucks = systemData.flota || []; // Cambiado de camiones a flota
            console.log('Camiones base para actualizar:', baseTrucks.length);
            
            const updatedTrucks = await Promise.all(
                baseTrucks.map(async (truck) => {
                    try {
                        // Usar truckId en lugar de id
                        const truckId = truck.truckId || truck.id;
                        const [position, fuel, glp, destination, state] = await Promise.all([
                            mapService.fetchTruckPosition(truckId, currentTime),
                            mapService.fetchTruckFuel(truckId, currentTime),
                            mapService.fetchTruckGLP(truckId, currentTime),
                            mapService.fetchTruckDestination(truckId, currentTime),
                            mapService.fetchTruckState(truckId, currentTime)
                        ]);

                        const updatedTruck = {
                            ...truck,
                            id: truckId, // Asegurar que tenga id
                            currentPosition: position,
                            currentFuel: fuel,
                            currentGLP: glp,
                            currentDestination: destination,
                            currentState: state
                        };
                        
                        console.log(`Camión ${truckId} actualizado:`, {
                            position,
                            fuel,
                            glp,
                            state,
                            destination
                        });
                        
                        return updatedTruck;
                    } catch (error) {
                        console.error(`Error actualizando camión ${truck.truckId || truck.id}:`, error);
                        return truck;
                    }
                })
            );
            
            console.log('Camiones actualizados:', updatedTrucks.length);
            setTrucksData(updatedTrucks);
        };

        updateTruckData();
    }, [currentTime, systemData]);

    // Update pedidos data with real-time information
    useEffect(() => {
        if (!currentTime || !systemData?.pedidos?.length) return;

        const updatePedidosData = async () => {
            const basePedidos = systemData.pedidos || [];
            const updatedPedidos = await Promise.all(
                basePedidos.map(async (pedido) => {
                    try {
                        const estado = await mapService.fetchPedidoEstado(pedido.id, currentTime);
                        return {
                            ...pedido,
                            currentEstado: estado
                        };
                    } catch (error) {
                        return pedido;
                    }
                })
            );
            setPedidosData(updatedPedidos);
        };

        updatePedidosData();
    }, [currentTime, systemData]);

    // Update cisternas data with real-time information
    useEffect(() => {
        if (!currentTime || !systemData?.cisternas?.length) return;

        const updateCisternasData = async () => {
            const baseCisternas = systemData.cisternas || [];
            const updatedCisternas = await Promise.all(
                baseCisternas.map(async (cisterna) => {
                    try {
                        const glp = await mapService.fetchCisternaGLP(cisterna.id, currentTime);
                        return {
                            ...cisterna,
                            currentGLP: glp
                        };
                    } catch (error) {
                        return cisterna;
                    }
                })
            );
            setCisternasData(updatedCisternas);
        };

        updateCisternasData();
    }, [currentTime, systemData]);

    // Watch for currentTime >= fechaHoraFinEntregas to continue simulation
    useEffect(() => {
        
        if (!currentTime || !fechaHoraFinEntregas || isContinuing) return;
        
        // Check if we've already processed this specific fechaHoraFinEntregas
        if (lastProcessedFechaHoraFin && lastProcessedFechaHoraFin.getTime() === fechaHoraFinEntregas.getTime()) {
            return;
        }
        
        if (currentTime >= fechaHoraFinEntregas) {
            setIsContinuing(true);
            setLastProcessedFechaHoraFin(fechaHoraFinEntregas);
            // Store in sessionStorage to persist across page refreshes
            sessionStorage.setItem('lastProcessedFechaHoraFin', fechaHoraFinEntregas.toISOString());
            console.log("Llamando a nuevo batch")
            fetch(`${API_BASE}/continue-simulation`, { method: "POST" })
                .then(() => {
                    // After continuing, fetch new fechaHoraFinEntregas
                    return fetch(`${API_BASE}/fecha-hora-fin-entregas`);
                })
                .then(res => res.json())
                .then(data => {
                    if (data) {
                        setFechaHoraFinEntregas(new Date(data));
                    }
                })
                .finally(() => setIsContinuing(false));
        }
    }, [currentTime, fechaHoraFinEntregas, isContinuing, lastProcessedFechaHoraFin]);

    // Simulation time progression
    useEffect(() => {
        let intervalId;
    
        if (isPlaying && currentTime) {
            intervalId = setInterval(() => {
                setCurrentTime(prevTime => {
                    if (!prevTime) return new Date();
                    return new Date(prevTime.getTime() + 60000 * playbackSpeed);
                });
            }, 1000);
        }
    
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isPlaying, playbackSpeed, currentTime]);

    // Update real time every second
    useEffect(() => {
        const realTimeInterval = setInterval(() => {
            setRealTime(new Date());
        }, 1000);

        return () => clearInterval(realTimeInterval);
    }, []);

    // Poll for primer colapso info
    useEffect(() => {
        let intervalId;
        const checkColapso = async () => {
            const info = await mapService.fetchPrimerColapsoInfo();
            if (info && info.colapso) {
                setColapsoInfo(info);
                setIsPlaying(false);
            } else {
                setColapsoInfo(null);
            }
        };
        checkColapso();
        intervalId = setInterval(checkColapso, 2000);
        return () => clearInterval(intervalId);
    }, []);

    // Clear stored lastProcessedFechaHoraFin when we get a new fechaHoraFinEntregas
    useEffect(() => {
        if (fechaHoraFinEntregas && lastProcessedFechaHoraFin) {
            if (fechaHoraFinEntregas.getTime() !== lastProcessedFechaHoraFin.getTime()) {
                // New fechaHoraFinEntregas received, clear the stored value
                sessionStorage.removeItem('lastProcessedFechaHoraFin');
                setLastProcessedFechaHoraFin(null);
            }
        }
    }, [fechaHoraFinEntregas, lastProcessedFechaHoraFin]);

    const handlePauseSimulation = () => {
        setIsPlaying(false);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const getEstadoColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'pendiente': return 'warning';
            case 'en_progreso': case 'en progreso': return 'info';
            case 'entregado': return 'success';
            case 'cancelado': return 'error';
            default: return 'default';
        }
    };

    const getEstadoText = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'en_progreso': return 'En Progreso';
            case 'entregado': return 'Entregado';
            case 'pendiente': return 'Pendiente';
            case 'cancelado': return 'Cancelado';
            default: return estado || 'Desconocido';
        }
    };

    const getCisternaLevelInfo = (currentGLP, capacidad) => {
        // Check if values are too large (indicating unlimited capacity or very large values)
        if (!currentGLP || !capacidad || capacidad >= 999999 || currentGLP >= 999999) {
            return { 
                color: 'success', 
                text: 'Sin límite', 
                bgColor: '#e8f5e8',
                avatarColor: '#4CAF50',
                percentage: null
            };
        }
        
        const percentage = (currentGLP / capacidad) * 100;
        
        if (percentage >= 70) {
            return { 
                color: 'success', 
                text: 'Nivel Alto', 
                bgColor: '#e8f5e8',
                avatarColor: '#4CAF50',
                percentage
            };
        }
        if (percentage >= 30) {
            return { 
                color: 'warning', 
                text: 'Nivel Medio', 
                bgColor: '#fff3e0',
                avatarColor: '#FF9800',
                percentage
            };
        }
        return { 
            color: 'error', 
            text: 'Nivel Bajo', 
            bgColor: '#ffebee',
            avatarColor: '#F44336',
            percentage
        };
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 0: // Pedidos
                return (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                                Pedidos Activos
                            </Typography>
                            <Chip label={pedidosData.length} size="small" color="primary" />
                        </Box>
                        
                        {pedidosData.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay pedidos cargados
                                </Typography>
                            </Box>
                        ) : (
                            <List sx={{ padding: 0 }}>
                                {pedidosData.map((pedido, index) => (
                                    <ListItem 
                                        key={pedido.id} 
                                        sx={{ 
                                            px: 0, 
                                            py: 1,
                                            borderBottom: index < pedidosData.length - 1 ? '1px solid #f0f0f0' : 'none'
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                                                <ShoppingCartIcon fontSize="small" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <Box sx={{ width: '100%' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle2" fontWeight="medium">
                                                    Pedido #{pedido.numeroPedido}
                                                </Typography>
                                                <Chip 
                                                    label={getEstadoText(pedido.currentEstado)} 
                                                    color={getEstadoColor(pedido.currentEstado)}
                                                    size="small"
                                                />
                                            </Box>
                                            
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <LocalGasStationIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                    Volumen GLP: {pedido.volumenGLP && typeof pedido.volumenGLP === 'number' ? `${pedido.volumenGLP.toFixed(2)} m³` : 
                                                                  pedido.cantidadGLP && typeof pedido.cantidadGLP === 'number' ? `${pedido.cantidadGLP.toFixed(2)} m³` : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <EventIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                    Registro: {pedido.fechaHoraRegistro ? new Date(pedido.fechaHoraRegistro).toLocaleString() : 'N/A'}
                                                </Typography>
                                            </Box>                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <AccessTimeIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                    Entrega Máxima: {pedido.fechaHoraMaxEntrega ? new Date(pedido.fechaHoraMaxEntrega).toLocaleString() : 'Sin límite'}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationOnIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                    Ubicación: ({pedido.ubicacion?.x || '0'}, {pedido.ubicacion?.y || '0'})
                                </Typography>
                            </Box>
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                );
            
            case 1: // Camiones
                return (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                                Flota de Camiones
                            </Typography>
                            <Chip label={trucksData.length} size="small" color="primary" />
                        </Box>
                        
                        {trucksData.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay camiones cargados
                                </Typography>
                                {systemData?.flota?.length > 0 && (
                                    <Typography variant="caption" color="warning.main">
                                        Nota: Hay {systemData.flota.length} camiones en systemData pero no se están mostrando
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <List sx={{ padding: 0 }}>
                                {trucksData.map((truck, index) => (
                                    <ListItem 
                                        key={truck.truckId || truck.id || index} 
                                        sx={{ 
                                            px: 0, 
                                            py: 1,
                                            borderBottom: index < trucksData.length - 1 ? '1px solid #f0f0f0' : 'none'
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32 }}>
                                                <LocalShippingIcon fontSize="small" />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <Box sx={{ width: '100%' }}>
                                            <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1 }}>
                                                Camión {truck.codigo} - {truck.plate}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <LocalShippingIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                    Estado: {truck.currentState || 'Estado desconocido'}
                                                </Typography>
                                            </Box>
                                            {truck.currentPosition && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <PlaceIcon sx={{ fontSize: '1rem', mr: 1, color: 'success.main' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                        Posición: ({truck.currentPosition.x !== undefined ? truck.currentPosition.x.toFixed(1) : 'N/A'}, {truck.currentPosition.y !== undefined ? truck.currentPosition.y.toFixed(1) : 'N/A'})
                                                    </Typography>
                                                </Box>
                                            )}
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <LocalGasStationIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                    Combustible: {truck.currentFuel !== null && truck.currentFuel !== undefined 
                                                        ? `${typeof truck.currentFuel === 'number' ? truck.currentFuel.toFixed(2) : truck.currentFuel}L` 
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <GasMeterIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                    GLP: {truck.currentGLP !== null && truck.currentGLP !== undefined 
                                                        ? `${typeof truck.currentGLP === 'number' ? truck.currentGLP.toFixed(2) : truck.currentGLP} m³` 
                                                        : 'N/A'}
                                                </Typography>
                                            </Box>
                                            {truck.currentDestination && (
                                                truck.currentDestination.tipo && (
                                                    truck.currentDestination.x !== undefined && truck.currentDestination.y !== undefined ||
                                                    truck.currentDestination.ubicacion?.x !== undefined && truck.currentDestination.ubicacion?.y !== undefined
                                                )
                                            ) && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <LocationOnIcon sx={{ fontSize: '1rem', mr: 1, color: 'primary.main' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                        {truck.currentDestination.tipo} 
                                                        {truck.currentDestination.x !== undefined && truck.currentDestination.y !== undefined 
                                                            ? ` (${truck.currentDestination.x.toFixed(1)}, ${truck.currentDestination.y.toFixed(1)})`
                                                            : truck.currentDestination.ubicacion?.x !== undefined && truck.currentDestination.ubicacion?.y !== undefined
                                                                ? ` (${truck.currentDestination.ubicacion.x.toFixed(1)}, ${truck.currentDestination.ubicacion.y.toFixed(1)})`
                                                                : ''
                                                        }
                                                    </Typography>
                                                </Box>
                                            )}
                                            {truck.currentFuel !== null && truck.capacidadCombustible && (
                                                <Box sx={{ mt: 1, mr: 2 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Combustible ({Math.round((truck.currentFuel / truck.capacidadCombustible) * 100)}%)
                                                    </Typography>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={(truck.currentFuel / truck.capacidadCombustible) * 100}
                                                        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                                                        color={truck.currentFuel / truck.capacidadCombustible < 0.2 ? 'warning' : 'primary'}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                );
            
            case 2: // Cisternas
                return (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                                Red de Cisternas
                            </Typography>
                            <Chip label={cisternasData.length} size="small" color="primary" />
                        </Box>
                        
                        {cisternasData.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No hay cisternas cargadas
                                </Typography>
                            </Box>
                        ) : (
                            <List sx={{ padding: 0 }}>
                                {cisternasData.map((cisterna, index) => {
                                    // Get level info for color coding
                                    const levelInfo = getCisternaLevelInfo(cisterna.currentGLP, cisterna.capacidadTotal);
                                    
                                    return (
                                        <ListItem 
                                            key={cisterna.id} 
                                            sx={{ 
                                                px: 0, 
                                                py: 1,
                                                borderBottom: index < cisternasData.length - 1 ? '1px solid #f0f0f0' : 'none'
                                            }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar sx={{ 
                                                    bgcolor: levelInfo.avatarColor, 
                                                    width: 32, 
                                                    height: 32 
                                                }}>
                                                    <GasMeterIcon fontSize="small" />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <Box sx={{ width: '100%' }}>
                                                <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1 }}>
                                                    Cisterna #{cisterna.id}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <GasMeterIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                        Capacidad: {cisterna.capacidadTotal && typeof cisterna.capacidadTotal === 'number' && cisterna.capacidadTotal < 999999 ? `${cisterna.capacidadTotal.toFixed(2)} m³` : 'Sin límite'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <LocalGasStationIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                        GLP Actual: {cisterna.currentGLP !== null && typeof cisterna.currentGLP === 'number' ? 
                                                            (cisterna.currentGLP >= 999999 ? 'Sin límite' : `${cisterna.currentGLP.toFixed(2)} m³`) : 'N/A'}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <LocationOnIcon sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                                        Ubicación: ({typeof cisterna.ubicacion?.x === 'number' ? cisterna.ubicacion.x.toFixed(2) : '0'}, {typeof cisterna.ubicacion?.y === 'number' ? cisterna.ubicacion.y.toFixed(2) : '0'})
                                                    </Typography>
                                                </Box>
                                                
                                                {/* Show level info with progress bar for cisternas with capacity limit */}
                                                {levelInfo.percentage !== null && (
                                                    <Box sx={{ mt: 1, mr: 2 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                Nivel GLP ({Math.round(levelInfo.percentage)}%)
                                                            </Typography>
                                                            <Chip 
                                                                label={levelInfo.text} 
                                                                size="small" 
                                                                color={levelInfo.color}
                                                                sx={{ 
                                                                    height: 18, 
                                                                    fontSize: '0.65rem',
                                                                    backgroundColor: levelInfo.bgColor
                                                                }}
                                                            />
                                                        </Box>
                                                        <LinearProgress 
                                                            variant="determinate" 
                                                            value={levelInfo.percentage}
                                                            sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                                                            color={levelInfo.color}
                                                        />
                                                    </Box>
                                                )}
                                                
                                                {/* Show unlimited capacity chip */}
                                                {levelInfo.percentage === null && (
                                                    <Box sx={{ mt: 1, mr: 2 }}>
                                                        <Chip 
                                                            label="Capacidad Ilimitada" 
                                                            size="small" 
                                                            color="success"
                                                            sx={{ 
                                                                height: 18, 
                                                                fontSize: '0.65rem',
                                                                backgroundColor: '#e8f5e8'
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        )}
                    </Box>
                );
            
            default:
                return null;
        }
    };

    // Navbar height detection
    useEffect(() => {
        const calc = () => {
            const navbar = document.querySelector('nav') || document.querySelector('[role="navigation"]') || document.querySelector('.navbar');
            const actualNavHeight = navbar ? navbar.offsetHeight : 65;
            setNavbarHeight(actualNavHeight);
        };
        
        calc();
        window.addEventListener("resize", calc);
        return () => window.removeEventListener("resize", calc);
    }, []);

    if (!currentTime || !simulationStarted) {
        return (
            <Box sx={{ 
                display: 'flex', 
                height: `calc(100vh - ${navbarHeight}px)`,
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Typography variant="h6">Cargando simulación...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', height: `calc(100vh - ${navbarHeight}px)`, position: 'relative' }}>
            {/* Main content area with MapVisualization */}
            <Box sx={{ 
                flexGrow: 1, 
                position: 'relative',
                width: isPanelVisible ? 'calc(100vw - 350px)' : '100vw',
                height: '100%',
                overflow: "hidden",
                backgroundColor: "#fafafa",
                transition: 'width 0.3s ease'
            }}>
                {/* MapVisualization component */}
                <MapVisualization 
                    currentTime={currentTime} 
                    onPauseSimulation={handlePauseSimulation}
                />
                
                {/* Toggle button for panel */}
                <Button
                    variant="contained"
                    size="small"
                    onClick={() => setIsPanelVisible(!isPanelVisible)}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        minWidth: 'auto',
                        width: 40,
                        height: 40,
                        zIndex: 1000,
                        backgroundColor: 'primary.main',
                        '&:hover': {
                            backgroundColor: 'primary.dark',
                        }
                    }}
                >
                    {isPanelVisible ? '→' : '←'}
                </Button>
            </Box>

            {/* Right panel - collapsible */}
            <Box
                sx={{
                    width: isPanelVisible ? 350 : 0,
                    height: '100%',
                    backgroundColor: 'white',
                    borderLeft: isPanelVisible ? '1px solid #e0e0e0' : 'none',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                    transition: 'width 0.3s ease'
                }}
            >
                {isPanelVisible && (
                    <Box sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                    {/* Header */}
                    
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Simulación PLG
                    </Typography>
                    {colapsoInfo && colapsoInfo.colapso && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">¡Colapso logístico detectado!</Typography>
                            <Typography variant="body2">Fecha y hora del primer colapso: <b>{new Date(colapsoInfo.fechaHoraPrimerColapso).toLocaleString()}</b></Typography>
                            <Typography variant="body2">Pedido causante: <b>{colapsoInfo.pedidoCausanteId}</b></Typography>
                            <Typography variant="body2">Límite de entrega: <b>{new Date(colapsoInfo.limiteEntrega).toLocaleString()}</b></Typography>
                            <Typography variant="body2">Hora simulada de entrega: <b>{new Date(colapsoInfo.horaSimuladaEntrega).toLocaleString()}</b></Typography>
                            <Typography variant="body2">Entrega a cargo del camión: <b>{colapsoInfo.camionEntrega}</b></Typography>
                            <Typography variant="body2" color="error" fontWeight="bold">La simulación ha sido pausada.</Typography>
                        </Alert>
                    )}
                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        sx={{ textTransform: 'none', mb: 2 }}
                        onClick={() => window.history.back()}
                    >
                        Cancelar simulación
                    </Button>

                    {/* Progress info */}
                    <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Estado de la Simulación
                        </Typography>
                        
                        {/* Status info */}
                        <Box sx={{ 
                            p: 1.5, 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: 1, 
                            mb: 2,
                            border: '1px solid #e9ecef'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                    Simulación: {currentTime.toLocaleTimeString()}
                                </Typography>
                                <Chip 
                                    label={isPlaying ? 'En ejecución' : 'Pausado'} 
                                    color={isPlaying ? 'success' : 'default'}
                                    size="small"
                                />
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                {currentTime.toLocaleDateString()}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Tiempo real: {realTime.toLocaleTimeString()}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                {realTime.toLocaleDateString()}
                            </Typography>
                            
                            {/* Progress bar - 1 week simulation */}
                            <Box sx={{ mt: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Progreso de la simulación (1 semana)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {(() => {
                                            const startTime = new Date(systemData?.fechaHoraInicio || currentTime);
                                            const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // 1 semana en milisegundos
                                            const elapsedTime = currentTime.getTime() - startTime.getTime();
                                            const progress = Math.min(Math.max((elapsedTime / oneWeekInMs) * 100, 0), 100);
                                            return `${Math.round(progress)}%`;
                                        })()}
                                    </Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={(() => {
                                        const startTime = new Date(systemData?.fechaHoraInicio || currentTime);
                                        const oneWeekInMs = 7 * 24 * 60 * 60 * 1000; // 1 semana en milisegundos
                                        const elapsedTime = currentTime.getTime() - startTime.getTime();
                                        const progress = Math.min(Math.max((elapsedTime / oneWeekInMs) * 100, 0), 100);
                                        return progress;
                                    })()}
                                    sx={{ height: 6, borderRadius: 3 }}
                                    color={(() => {
                                        const startTime = new Date(systemData?.fechaHoraInicio || currentTime);
                                        const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
                                        const elapsedTime = currentTime.getTime() - startTime.getTime();
                                        const progress = (elapsedTime / oneWeekInMs) * 100;
                                        return progress >= 100 ? 'success' : 'primary';
                                    })()}
                                />
                                {/* Additional info: time remaining */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        {(() => {
                                            const startTime = new Date(systemData?.fechaHoraInicio || currentTime);
                                            const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
                                            const elapsedTime = currentTime.getTime() - startTime.getTime();
                                            const remainingTime = oneWeekInMs - elapsedTime;
                                            
                                            if (remainingTime <= 0) return "Simulación completada";
                                            
                                            const days = Math.floor(remainingTime / (24 * 60 * 60 * 1000));
                                            const hours = Math.floor((remainingTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                                            
                                            if (days > 0) return `${days}d ${hours}h restantes`;
                                            return `${hours}h restantes`;
                                        })()}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {(() => {
                                            const startTime = new Date(systemData?.fechaHoraInicio || currentTime);
                                            const elapsedTime = currentTime.getTime() - startTime.getTime();
                                            const days = Math.floor(elapsedTime / (24 * 60 * 60 * 1000));
                                            const hours = Math.floor((elapsedTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                                            
                                            if (days > 0) return `${days}d ${hours}h transcurridos`;
                                            return `${hours}h transcurridos`;
                                        })()}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Control buttons */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                            <Button
                                variant={isPlaying ? "contained" : "outlined"}
                                startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                onClick={() => {
                                    if (!colapsoInfo || !colapsoInfo.colapso) setIsPlaying(!isPlaying);
                                }}
                                color={isPlaying ? "error" : "primary"}
                                disabled={colapsoInfo && colapsoInfo.colapso}
                                sx={{ flex: 1 }}
                            >
                                {isPlaying ? 'Pausar' : 'Iniciar'}
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => window.history.back()}
                                sx={{ flex: 1 }}
                            >
                                Salir
                            </Button>
                        </Box>

                        {/* Collapse alert */}
                        {colapsoInfo && colapsoInfo.colapso && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" fontWeight="bold">¡Colapso logístico!</Typography>
                                <Typography variant="body2">
                                    Pedido {colapsoInfo.pedidoCausanteId} - Camión {colapsoInfo.camionEntrega}
                                </Typography>
                                <Typography variant="caption">
                                    {new Date(colapsoInfo.fechaHoraPrimerColapso).toLocaleString()}
                                </Typography>
                            </Alert>
                        )}
                    </Box>

                    {/* Tabs */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                            <Tab 
                                label="Pedidos" 
                                icon={<ShoppingCartIcon />} 
                                iconPosition="start"
                                sx={{ minHeight: 56, fontSize: '0.875rem' }}
                            />
                            <Tab 
                                label="Camiones" 
                                icon={<LocalShippingIcon />} 
                                iconPosition="start"
                                sx={{ minHeight: 56, fontSize: '0.875rem' }}
                            />
                            <Tab 
                                label="Cisternas" 
                                icon={<GasMeterIcon />} 
                                iconPosition="start"
                                sx={{ minHeight: 56, fontSize: '0.875rem' }}
                            />
                        </Tabs>
                    </Box>

                    {/* Tab content */}
                    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                        {renderTabContent()}
                    </Box>
                </Box>
                )}
            </Box>
        </Box>
    );
}
