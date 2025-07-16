import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Paper,
    TextField,
    Alert,
    LinearProgress,
    Tabs,
    Tab
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MapVisualization from "../components/MapVisualization";
import ItemListPanel from "../components/ItemListPanel/ItemListPanel";
import ItemDetailsPanel from "../components/ItemDetailsPanel/ItemDetailsPanel";
import { mapService } from "../services/mapService";
import { useBatchRefreshMonitor } from "../hooks/useBatchRefreshMonitor";
import { 
    fetchSystem, 
    fetchTruckFuel, 
    fetchTruckGLP, 
    fetchCisternaGLP,
    fetchTruckDestination 
} from "../services/routeService";
import './Simulacion.css';

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
    
    // Simulation tracking states
    const [simulationStartTime, setSimulationStartTime] = useState(null);
    const [realTimeElapsed, setRealTimeElapsed] = useState(0);
    
    // UI states
    const [navbarHeight, setNavbarHeight] = useState(65);
    const [activePanelTab, setActivePanelTab] = useState(0);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    
    // System data states
    const [system, setSystem] = useState(null);
    const [truckFuels, setTruckFuels] = useState(new Map());
    const [truckGLPs, setTruckGLPs] = useState(new Map());
    const [cisternaGLPs, setCisternaGLPs] = useState(new Map());
    const [currentDestinations, setCurrentDestinations] = useState(new Map());
    const [selectedItem, setSelectedItem] = useState(null);

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
                const startTime = new Date(startTimeString);
                setCurrentTime(startTime);
                setSimulationStartTime(startTime);
                setSimulationStarted(true);
            } catch (error) {
                const currentDateTime = new Date();
                setCurrentTime(currentDateTime);
                setSimulationStartTime(currentDateTime);
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

    // Track real time elapsed during simulation
    useEffect(() => {
        let intervalId;
        
        if (isPlaying) {
            const startRealTime = Date.now();
            intervalId = setInterval(() => {
                setRealTimeElapsed(prev => prev + 1);
            }, 1000);
        }
        
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isPlaying]);

    // Load system data when component mounts
    useEffect(() => {
        const loadSystem = async () => {
            try {
                const systemData = await fetchSystem();
                setSystem(systemData);
            } catch (error) {
                console.error("Error loading system data:", error);
            }
        };
        loadSystem();
    }, []);

    // Update truck and cisterna data when currentTime changes
    useEffect(() => {
        const updateSystemData = async () => {
            if (!currentTime || !system) return;

            const newFuels = new Map();
            const newGLPs = new Map();
            const newCisternaGLPs = new Map();
            const newDestinations = new Map();

            // Update truck data
            if (system.flota) {
                for (const truck of system.flota) {
                    try {
                        const fuel = await fetchTruckFuel(truck.truckId, currentTime);
                        const glp = await fetchTruckGLP(truck.truckId, currentTime);
                        const destination = await fetchTruckDestination(truck.truckId, currentTime);

                        if (fuel !== null) newFuels.set(truck.truckId, fuel);
                        if (glp !== null) newGLPs.set(truck.truckId, glp);
                        if (destination) newDestinations.set(truck.truckId, destination);
                    } catch (error) {
                        console.error(`Error updating truck ${truck.truckId}:`, error);
                    }
                }
            }

            // Update cisterna data
            if (system.cisternas) {
                for (const cisterna of system.cisternas) {
                    try {
                        const glp = await fetchCisternaGLP(cisterna.id, currentTime);
                        if (glp !== null) newCisternaGLPs.set(cisterna.id, glp);
                    } catch (error) {
                        console.error(`Error updating cisterna ${cisterna.id}:`, error);
                    }
                }
            }

            setTruckFuels(newFuels);
            setTruckGLPs(newGLPs);
            setCisternaGLPs(newCisternaGLPs);
            setCurrentDestinations(newDestinations);
        };

        updateSystemData();
    }, [currentTime, system]);

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
                        // Clear lastProcessedFechaHoraFin before setting new fechaHoraFinEntregas
                        sessionStorage.removeItem('lastProcessedFechaHoraFin');
                        setLastProcessedFechaHoraFin(null);
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
                    // Use seconds instead of minutes for smoother movement
                    return new Date(prevTime.getTime() + 15000 * playbackSpeed);
                });
            }, 1000);
        }
    
        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isPlaying, playbackSpeed, currentTime]);

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

    const handleItemSelect = (item) => {
        setSelectedItem(item);
        // Switch to details tab when an item is selected (tab 2, not 1)
        setActivePanelTab(2);
        // Show panel if it's hidden when an item is selected
        if (!isPanelVisible) {
            setIsPanelVisible(true);
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

    // Professional loading component
    const LoadingComponent = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: `calc(100vh - ${navbarHeight}px)`,
                backgroundColor: '#f8f9fa',
                padding: 3
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    maxWidth: 400,
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <Typography variant="h5" component="h2" gutterBottom sx={{ color: '#1976d2', fontWeight: 600 }}>
                    Inicializando Simulación
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Preparando sistema de planificación logística...
                </Typography>
                
                <Box sx={{ width: '100%', mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Cargando datos
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            Inicializando...
                        </Typography>
                    </Box>
                    <LinearProgress 
                        sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#e3f2fd',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                backgroundColor: '#1976d2'
                            }
                        }} 
                    />
                </Box>
                
                <Typography variant="caption" color="text.secondary">
                    Configurando parámetros del sistema...
                </Typography>
            </Paper>
        </Box>
    );

    if (!currentTime || !simulationStarted) {
        return <LoadingComponent />;
    }

    return (
        <Box sx={{ display: 'flex', height: `calc(100vh - ${navbarHeight}px)` }}>
            {/* Main content area with MapVisualization */}
            <Box sx={{ 
                flexGrow: 1, 
                position: 'relative',
                width: isPanelVisible ? 'calc(100vw - 350px)' : '100vw',
                height: '100%',
                overflow: "hidden",
                backgroundColor: "#fafafa",
                transition: 'width 0.3s ease-in-out'
            }}>
                {/* Panel toggle button */}
                <Button
                    onClick={() => setIsPanelVisible(!isPanelVisible)}
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 1000,
                        minWidth: 'auto',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        border: '1px solid #e0e0e0',
                        color: '#1976d2',
                        '&:hover': {
                            backgroundColor: '#f5f5f5',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }
                    }}
                    aria-label={isPanelVisible ? "Ocultar panel" : "Mostrar panel"}
                >
                    {isPanelVisible ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </Button>

                {/* MapVisualization component */}
                <Box sx={{
                    width: '100%',
                    height: '100%',
                    '& .map-container': {
                        height: '100%',
                        width: '100%',
                        backgroundColor: '#ffffff !important'
                    },
                    '& .map-visualization': {
                        margin: '0 !important',
                        border: 'none !important',
                        padding: '0 !important',
                        height: '100%',
                        width: '100% !important',
                        backgroundColor: '#ffffff !important',
                        backgroundImage: 'none !important',
                        backgroundSize: 'auto !important'
                    }
                }}>
                    <MapVisualization 
                        currentTime={currentTime} 
                        onPauseSimulation={handlePauseSimulation}
                        onItemSelect={handleItemSelect}
                        selectedItem={selectedItem}
                    />
                </Box>
            </Box>

            {/* Right fixed panel - collapsible */}
            {isPanelVisible && (
                <Box
                    sx={{
                        width: 350,
                        height: '100%',
                        backgroundColor: 'white',
                        borderLeft: '1px solid #e0e0e0',
                        overflowY: 'auto',
                        flexShrink: 0,
                        position: 'relative',
                        transition: 'all 0.3s ease-in-out'
                    }}
                >
                    <Box sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Simulación PLG
                            </Typography>
                            
                            {/* Main Tabs */}
                            <Tabs 
                                value={activePanelTab} 
                                onChange={(e, newValue) => setActivePanelTab(newValue)}
                                variant="fullWidth"
                                sx={{ mb: 2 }}
                            >
                                <Tab label="Control" />
                                <Tab label="Elementos" />
                                <Tab label="Detalles" disabled={!selectedItem} />
                            </Tabs>

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
                            {showAutoPlayNotification && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Simulación reiniciada automáticamente</Typography>
                                    <Typography variant="body2">La simulación se ha reiniciado después del procesamiento del nuevo batch y comenzará a reproducirse automáticamente.</Typography>
                                </Alert>
                            )}
                        </Box>

                        {/* Tab Content */}
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            {/* Control Tab */}
                            {activePanelTab === 0 && (
                                <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
                                    {/* Botones de Control Principal */}
                                    <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
                                        <Button
                                            variant={isPlaying ? "contained" : "outlined"}
                                            startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                            onClick={() => {
                                                if (!colapsoInfo || !colapsoInfo.colapso) setIsPlaying(!isPlaying);
                                            }}
                                            color={isPlaying ? "success" : "primary"}
                                            disabled={colapsoInfo && colapsoInfo.colapso}
                                            sx={{ 
                                                textTransform: 'none',
                                                flex: 1,
                                                fontWeight: 'bold',
                                                py: 1.5
                                            }}
                                        >
                                            {isPlaying ? 'PAUSAR' : 'REPRODUCIR'}
                                        </Button>
                                        
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            sx={{ 
                                                textTransform: 'none',
                                                flex: 1,
                                                py: 1.5
                                            }}
                                            onClick={() => window.history.back()}
                                        >
                                            Cancelar
                                        </Button>
                                    </Box>

                                    {/* Estado de la Simulación */}
                                    <Box sx={{ mb: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                                        <Typography variant="body2" fontWeight="bold" gutterBottom sx={{ color: '#1976d2' }}>
                                            Estado de la Simulación
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Tiempo simulado: {currentTime.toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Tiempo real actual: {new Date().toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Tiempo real transcurrido: {Math.floor(realTimeElapsed / 60)}m {realTimeElapsed % 60}s
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            Velocidad: 1x
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            Estado: <strong style={{ color: isPlaying ? '#4caf50' : '#ff9800' }}>
                                                {isPlaying ? 'Ejecutándose' : 'Pausado'}
                                            </strong>
                                        </Typography>

                                        {/* Barra de progreso */}
                                        {simulationStartTime && fechaHoraFinEntregas && (
                                            <Box>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">
                                                        Progreso de Simulación
                                                    </Typography>
                                                    <Typography variant="caption" color="primary" fontWeight="bold">
                                                        {Math.round(((currentTime - simulationStartTime) / (fechaHoraFinEntregas - simulationStartTime)) * 100)}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={Math.min(100, Math.max(0, ((currentTime - simulationStartTime) / (fechaHoraFinEntregas - simulationStartTime)) * 100))}
                                                    sx={{ 
                                                        height: 10, 
                                                        borderRadius: 5,
                                                        backgroundColor: '#e3f2fd',
                                                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                                                        '& .MuiLinearProgress-bar': {
                                                            borderRadius: 5,
                                                            background: isPlaying 
                                                                ? 'linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)'
                                                                : 'linear-gradient(90deg, #9e9e9e 0%, #bdbdbd 100%)',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                                        }
                                                    }} 
                                                />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Inicio: {simulationStartTime.toLocaleTimeString()}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Fin: {fechaHoraFinEntregas.toLocaleTimeString()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* Elements Tab */}
                            {activePanelTab === 1 && (
                                <Box sx={{ height: '100%' }}>
                                    <ItemListPanel
                                        system={system}
                                        onItemSelect={handleItemSelect}
                                        selectedItem={selectedItem}
                                        truckFuels={truckFuels}
                                        truckGLPs={truckGLPs}
                                        cisternaGLPs={cisternaGLPs}
                                    />
                                </Box>
                            )}

                            {/* Details Tab */}
                            {activePanelTab === 2 && (
                                <Box sx={{ height: '100%', p: 2 }}>
                                    <ItemDetailsPanel
                                        selectedItem={selectedItem}
                                        system={system}
                                        truckFuels={truckFuels}
                                        truckGLPs={truckGLPs}
                                        cisternaGLPs={cisternaGLPs}
                                        currentDestinations={currentDestinations}
                                        currentTime={currentTime}
                                    />
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
