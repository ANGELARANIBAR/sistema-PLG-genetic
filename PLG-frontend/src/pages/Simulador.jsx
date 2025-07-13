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
    LinearProgress
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MapVisualization from "../components/MapVisualization";
import { mapService } from "../services/mapService";
import { useBatchRefreshMonitor } from "../hooks/useBatchRefreshMonitor";
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
    
    // UI states
    const [navbarHeight, setNavbarHeight] = useState(65);

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
            {/* Main content area with MapVisualization */}            <Box sx={{ 
                flexGrow: 1, 
                position: 'relative',
                width: 'calc(100vw - 350px)', // Subtract panel width
                height: '100%',
                overflow: "hidden",
                backgroundColor: "#fafafa"
            }}>
                {/* MapVisualization component */}
                <MapVisualization 
                    currentTime={currentTime} 
                    onPauseSimulation={handlePauseSimulation}
                />
            </Box>

            {/* Right fixed panel - always visible */}
            <Box
                sx={{
                    width: 350,
                    height: '100%',
                    backgroundColor: 'white',
                    borderLeft: '1px solid #e0e0e0',
                    overflowY: 'auto',
                    flexShrink: 0,
                    position: 'relative'
                }}
            >
                <Box sx={{ 
                    p: 2,
                    height: '100%',
                    overflowY: 'auto'
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
                    {showAutoPlayNotification && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold">Simulación reiniciada automáticamente</Typography>
                            <Typography variant="body2">La simulación se ha reiniciado después del procesamiento del nuevo batch y comenzará a reproducirse automáticamente.</Typography>
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
                        <Typography variant="caption" color="text.secondary">
                            Tiempo actual: {currentTime.toLocaleTimeString()}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                            Fecha: {currentTime.toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                            Velocidad: {playbackSpeed}x
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                            Estado: {isPlaying ? 'Ejecutándose' : 'Pausado'}
                        </Typography>
                    </Box>

                    <Typography variant="h6" gutterBottom>
                        Panel de Control
                    </Typography>

                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">Controles de Simulación</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" gutterBottom>
                                        Reproducción
                                    </Typography>
                                    <Button
                                        variant={isPlaying ? "contained" : "outlined"}
                                        startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                        onClick={() => {
                                            if (!colapsoInfo || !colapsoInfo.colapso) setIsPlaying(!isPlaying);
                                        }}
                                        fullWidth
                                        color={isPlaying ? "secondary" : "primary"}
                                        disabled={colapsoInfo && colapsoInfo.colapso}
                                    >
                                        {isPlaying ? 'Pausar' : 'Reproducir'}
                                    </Button>
                                </Box>
                                
                                <Box>
                                    <Typography variant="body2" gutterBottom>
                                        Velocidad de simulación
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {[1, 2, 5, 10].map((speed) => (
                                            <Button 
                                                key={speed}
                                                variant={playbackSpeed === speed ? "contained" : "outlined"}
                                                size="small" 
                                                onClick={() => setPlaybackSpeed(speed)}
                                                sx={{ flex: 1 }}
                                            >
                                                {speed}x
                                            </Button>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">Información del Sistema</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" gutterBottom>
                                Usa el mapa para:
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                • Hacer clic en camiones, cisternas y pedidos para ver detalles
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                • Hacer clic derecho en camiones para registrar averías
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                • Ver rutas activas y bloqueos en tiempo real
                            </Typography>                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                • Monitorear el estado de replanificación
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                • Usar el ícono de leyenda en la esquina inferior izquierda del mapa
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Box>
        </Box>
    );
}
