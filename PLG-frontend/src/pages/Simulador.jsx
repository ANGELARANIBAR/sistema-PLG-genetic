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
    Alert
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import MapVisualization from "../components/MapVisualization";
import { mapService } from "../services/mapService";

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
    const [colapsoInfo, setColapsoInfo] = useState(null);
    
    // UI states
    const [navbarHeight, setNavbarHeight] = useState(65);
    const [isPanelVisible, setIsPanelVisible] = useState(true);

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
        if (currentTime >= fechaHoraFinEntregas) {
            setIsContinuing(true);
            console.log("Llamndo a nuevo batch")
            fetch(`${API_BASE}/continue-simulation`, { method: "POST" })
                .then(() => {
                    // After continuing, fetch new fechaHoraFinEntregas
                    return fetch(`${API_BASE}/fecha-hora-fin-entregas`);
                })
                .then(res => res.json())
                .then(data => {
                    if (data) setFechaHoraFinEntregas(new Date(data));
                })
                .finally(() => setIsContinuing(false));
        }
    }, [currentTime, fechaHoraFinEntregas, isContinuing]);

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
                )}
            </Box>
        </Box>
    );
}
