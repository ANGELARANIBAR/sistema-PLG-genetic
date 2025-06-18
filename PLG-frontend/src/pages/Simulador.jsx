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
    TextField
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

export default function Simulador() {
    // Simulation control states
    const [currentTime, setCurrentTime] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [simulationStarted, setSimulationStarted] = useState(false);
    
    // UI states
    const [navbarHeight, setNavbarHeight] = useState(65);

    // Load start time when component mounts
    useEffect(() => {
        const loadStartTime = async () => {
            try {
                const startTimeString = await mapService.fetchStartTime();
                setCurrentTime(new Date(startTimeString));
                setSimulationStarted(true);
            } catch (error) {
                console.error('Error loading start time:', error);
                // Fallback to current time if service fails
                setCurrentTime(new Date());
                setSimulationStarted(true);
            }
        };
        loadStartTime();
    }, []);

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
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        fullWidth
                                        color={isPlaying ? "secondary" : "primary"}
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
