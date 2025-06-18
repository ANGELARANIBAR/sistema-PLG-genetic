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
import MapVisualization from "../components/MapVisualization/MapVisualization";
import { fetchStartTime } from "../services/routeService";

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
                const startTimeString = await fetchStartTime();
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
            {/* Main content area with MapVisualization */}
            <Box sx={{ 
                flexGrow: 1, 
                position: 'relative',
                width: 'calc(100vw - 350px)', // Subtract panel width
                height: '100%',
                overflow: "hidden",
                backgroundColor: "#fafafa"
            }}>
                {/* Fixed simulation controls overlay */}
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 1000,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        minWidth: 280
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Controles de Simulación
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Tiempo actual: {currentTime.toLocaleString()}
                        </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            onClick={() => setIsPlaying(!isPlaying)}
                            color={isPlaying ? "secondary" : "primary"}
                        >
                            {isPlaying ? 'Pausar' : 'Reproducir'}
                        </Button>
                        
                        <TextField
                            select
                            size="small"
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                            SelectProps={{ native: true }}
                            sx={{ minWidth: 80 }}
                        >
                            <option value={1}>1x</option>
                            <option value={2}>2x</option>
                            <option value={5}>5x</option>
                            <option value={10}>10x</option>
                        </TextField>
                    </Box>
                </Paper>

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
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                • Monitorear el estado de replanificación
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">Leyenda</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: '#0000ff',
                                        borderRadius: '50%',
                                        mr: 1
                                    }} />
                                    <Typography variant="caption">Camiones</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: '#ff0000',
                                        borderRadius: '50%',
                                        mr: 1
                                    }} />
                                    <Typography variant="caption">Cisterna Principal</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: '#00ff00',
                                        borderRadius: '50%',
                                        mr: 1
                                    }} />
                                    <Typography variant="caption">Cisterna Secundaria</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: '#800080',
                                        borderRadius: '50%',
                                        mr: 1
                                    }} />
                                    <Typography variant="caption">Pedidos</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{
                                        width: 20,
                                        height: 2,
                                        backgroundColor: '#FF0000',
                                        mr: 1
                                    }} />
                                    <Typography variant="caption">Bloqueos Activos</Typography>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Box>
        </Box>
    );
}

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
                const startTimeString = await fetchStartTime();
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
    
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

    /* ------------ Simulation state ------------ */
    const [almacenes, setAlmacenes] = useState(almacenesIniciales);
    const [camiones, setCamiones] = useState(camionesIniciales);
    /* ------------ Leyenda & Popover ------------ */
    const [showLegend, setShowLegend] = useState(false);
    const [popover, setPopover] = useState({ anchor: null, contenido: null });
    const abrirPopover = (e, contenido) => setPopover({ anchor: e.currentTarget, contenido });
    const cerrarPopover = () => setPopover({ anchor: null, contenido: null });

    /* ------------ WebSocket (recibe eventos) ------------ */
    const wsRef = useRef(null);
    useEffect(() => {
        const ws = new WebSocket("wss://tu-backend/simulaciones/123/stream");
        wsRef.current = ws;
        ws.onmessage = (ev) => {
            try {
                const d = JSON.parse(ev.data);
                if (d.type === "init") {
                    setAlmacenes(d.almacenes);
                    const dict = {};
                    d.camiones.forEach((c) => (dict[c.id] = { ...c, paso: 0, progreso: 0 }));
                    setCamiones(dict);
                }
                if (d.type === "updateRuta") {
                    setCamiones((p) => ({
                        ...p,
                        [d.camionId]: { ...p[d.camionId], ruta: d.ruta, paso: 0, progreso: 0 }
                    }));
                }
                // Maneja más tipos (averia, updateAlmacen, etc.)
            } catch (e) {
                console.error("WS message error", e);
            }
        };
        ws.onerror = (e) => console.error("WS error", e);
        ws.onclose = () => console.log("WS closed");
        return () => ws.close();
    }, []);

    /* ------------ Local animation ------------ */
    useEffect(() => {
        const INTERVAL = 80; // ms
        const FACTOR = 300; // 1 s real ≈ 5 min sim
        const id = setInterval(() => {
            setCamiones((prev) => {
                const copy = { ...prev };
                Object.values(copy).forEach((c) => {
                    if (c.paso >= c.ruta.length - 1) return;
                    const curr = c.ruta[c.paso];
                    const next = c.ruta[c.paso + 1];
                    const dist = Math.abs(next.x - curr.x) + Math.abs(next.y - curr.y); // Manhattan
                    const avance = ((INTERVAL / 1000) * FACTOR) / 60; // km simulados por tick
                    const prog = c.progreso + avance / dist;
                    if (prog >= 1) {
                        c.paso += 1;
                        c.progreso = 0;
                    } else {
                        c.progreso = prog;
                    }
                });
                return copy;
            });
        }, INTERVAL);
        return () => clearInterval(id);
    }, []);    /* ------------ Helpers ------------ */
    const { width, height, cs } = dims;
    const cellWidth = width / COLS;
    const cellHeight = height / ROWS;
    const offset = Math.min(cellWidth, cellHeight) * 0.5;    const calcPos = (a, b, prog) => {
        let { x, y } = a;
        if (a.x !== b.x) x += (b.x > a.x ? prog : -prog);
        if (a.y !== b.y) y += (b.y > a.y ? prog : -prog);
        return { 
            cx: x * cs, // Position at intersections
            cy: y * cs  // Position at intersections
        };
    };    /* ------------ Render ------------ */    return (
        <Box sx={{ display: 'flex', height: `calc(100vh - ${navbarHeight}px)` }}>            {/* Main content area */}
            <Box sx={{ 
                flexGrow: 1, 
                position: 'relative',
                width: 'calc(100vw - 300px)', // Always subtract panel width
                height: '100%', // Full height of parent container
                overflow: "hidden", // Remove scroll from main area
                backgroundColor: "#fafafa"
            }}>{/* Viewport - Full Screen */}
        <Box
            data-viewport="simulation"
            sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center", // Center vertically
                justifyContent: "center", // Center horizontally
                overflow: "hidden" // No scroll on viewport
            }}
        >{/* Grid container */}
            <Box
                sx={{
                    position: "relative",
                    width: `${width}px`,
                    height: `${height}px`,
                    display: "grid",
                    gridTemplateColumns: `repeat(${COLS}, ${cs}px)`,
                    gridTemplateRows: `repeat(${ROWS}, ${cs}px)`
                }}
            >{Array.from({ length: COLS * ROWS }).map((_, i) => (
                    <Box key={i} sx={{ 
                        border: "1px solid #e0e0e0", 
                        width: `${cs}px`,
                        height: `${cs}px`
                    }} />
                ))}                        {/* Almacenes */}
                        {almacenes.map((a) => (
                            <Box
                                key={a.id}
                                sx={{
                                    position: "absolute",
                                    top: `${a.y * cs}px`, // Position at intersection, not center
                                    left: `${a.x * cs}px`, // Position at intersection, not center
                                    width: `${Math.max(cs * 0.8, 8)}px`,
                                    height: `${Math.max(cs * 0.8, 8)}px`,
                                    backgroundColor: "black",
                                    borderRadius: "50%",
                                    zIndex: 15,
                                    cursor: "pointer",
                                    transform: 'translate(-50%, -50%)'
                                }}
                                onClick={(e) =>
                                    abrirPopover(
                                        e,
                                        <Box p={1}>
                                            <Typography variant="subtitle2">Almacén {a.id}</Typography>
                                            <Divider sx={{ my: 0.5 }} />
                                            <Typography variant="caption">Cap. restante: {a.capRestante} L</Typography>
                                        </Box>
                                    )
                                }
                            />
                        ))}{/* SVG layer */}
                <svg 
                    width={width} 
                    height={height} 
                    viewBox={`0 0 ${width} ${height}`}
                    style={{ position: "absolute", top: 0, left: 0 }}
                >                            {/* Rutas */}
                            {Object.values(camiones).map((c) => {
                                const { ruta, paso, color } = c;
                                const done = ruta.slice(0, paso + 1);
                                if (done.length < 2) return null;
                                const d = done.map((p, i) => `${i ? "L" : "M"}${p.x * cs} ${p.y * cs}`).join(" ");
                                return <path key={c.id + "_path"} d={d} stroke={color} strokeWidth="2" fill="none" />;
                            })}{/* Camiones */}
                            {Object.values(camiones).map((c) => {
                                const { ruta, paso, progreso, color, id, combustible } = c;
                                const a = ruta[paso];
                                const b = ruta[paso + 1] ?? a;
                                const { cx, cy } = calcPos(a, b, progreso);
                                return (
                                    <circle
                                        key={id}
                                        cx={cx}
                                        cy={cy}
                                        r={Math.max(cs * 0.3, 4)}
                                        fill={color}
                                        stroke="#000"
                                        strokeWidth="1"
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) =>
                                            abrirPopover(
                                                e,
                                                <Box p={1}>
                                                    <Typography variant="subtitle2">Camión {id}</Typography>
                                                    <Divider sx={{ my: 0.5 }} />
                                                    <Typography variant="caption">Combustible: {combustible.toFixed(0)} L</Typography>
                                                </Box>
                                            )
                                        }
                                    />
                                );
                            })}
                        </svg>
                    </Box>

                    {/* Legend popup in bottom-left corner */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            zIndex: 20
                        }}
                    >
                        <Tooltip title="Mostrar leyenda">
                            <IconButton
                                onClick={() => setShowLegend(!showLegend)}
                                sx={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    '&:hover': {
                                        backgroundColor: '#f5f5f5'
                                    }
                                }}
                            >
                                <LegendToggleIcon />
                            </IconButton>
                        </Tooltip>

                        {showLegend && (
                            <Paper
                                sx={{
                                    position: 'absolute',
                                    bottom: 48,
                                    left: 0,
                                    p: 2,
                                    minWidth: 200,
                                    boxShadow: 3
                                }}
                            >
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    Leyenda
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: 'black',
                                        borderRadius: '50%',
                                        mr: 1
                                    }} />
                                    <Typography variant="caption">Almacenes</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: 'deepskyblue',
                                        borderRadius: '50%',
                                        mr: 1
                                    }} />
                                    <Typography variant="caption">Camión C1</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Box sx={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: 'gold',
                                        borderRadius: '50%',
                                        mr: 1
                                    }} />
                                    <Typography variant="caption">Camión C2</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="caption" color="text.secondary">
                                    Haz clic en los elementos para más información
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                </Box>
            </Box>            {/* Right fixed panel - always visible */}
            <Box
                sx={{
                    width: 300,
                    height: '100%', // Full height of parent container
                    backgroundColor: 'white',
                    borderLeft: '1px solid #e0e0e0',
                    overflowY: 'auto',
                    flexShrink: 0,
                    position: 'relative'
                }}
            ><Box sx={{ 
                    p: 2,
                    height: '100%',
                    overflowY: 'auto'
                }}>
                    {/* Moved header content from main area */}
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                        Simulación Semanal
                    </Typography>
                    
                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        sx={{ textTransform: 'none', mb: 2 }}
                    >
                        Cancelar simulación
                    </Button>

                    {/* Progress info */}
                    <Box sx={{ mb: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Progreso
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Tiempo transcurrido: 16 m 23s
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                            Día 12/01/2025 Hora 16:27
                        </Typography>
                    </Box>

                    <Typography variant="h6" gutterBottom>
                        Panel de Control
                    </Typography>

                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">Estado de Camiones</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {Object.values(camiones).map((camion) => (
                                <Box key={camion.id} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <LocalShippingIcon sx={{ color: camion.color, mr: 1 }} />
                                        <Typography variant="subtitle2">{camion.id}</Typography>
                                    </Box>
                                    <Typography variant="caption" display="block">
                                        Velocidad: {camion.velocidad} km/h
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Combustible: {camion.combustible.toFixed(0)} L
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Progreso ruta: {camion.paso + 1}/{camion.ruta.length}
                                    </Typography>
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">Estado de Almacenes</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {almacenes.map((almacen) => (
                                <Box key={almacen.id} sx={{ mb: 2, p: 1, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <WarehouseIcon sx={{ mr: 1 }} />
                                        <Typography variant="subtitle2">{almacen.id}</Typography>
                                    </Box>
                                    <Typography variant="caption" display="block">
                                        Posición: ({almacen.x}, {almacen.y})
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Capacidad restante: {almacen.capRestante.toLocaleString()} L
                                    </Typography>
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>

                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="subtitle1">Configuración</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" gutterBottom>
                                Velocidad de simulación
                            </Typography>
                            <Button variant="outlined" size="small" sx={{ mr: 1, mb: 1 }}>
                                1x
                            </Button>
                            <Button variant="contained" size="small" sx={{ mr: 1, mb: 1 }}>
                                2x
                            </Button>
                            <Button variant="outlined" size="small" sx={{ mb: 1 }}>
                                5x
                            </Button>
                        </AccordionDetails>                    </Accordion>                </Box>
            </Box>            {/* Popover */}
            <Popover
                open={Boolean(popover.anchor)}
                anchorEl={popover.anchor}
                onClose={cerrarPopover}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                transformOrigin={{ vertical: "bottom", horizontal: "left" }}
                disableRestoreFocus
            >
                {popover.contenido}
            </Popover>
        </Box>
    );
}
