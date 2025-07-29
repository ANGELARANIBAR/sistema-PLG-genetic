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
    Tab,
    Tooltip,
    Fab
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StopIcon from '@mui/icons-material/Stop';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import MapVisualization from "../components/MapVisualization";
import ItemListPanel from "../components/ItemListPanel/ItemListPanel";
import ItemDetailsPanel from "../components/ItemDetailsPanel/ItemDetailsPanel";
import BloqueosListPanel from "../components/BloqueosListPanel/BloqueosListPanel";
import SimulationReportModal from "../components/SimulationReportModal/SimulationReportModal";
import AddPedidoModal from "../components/AddPedidoModal/AddPedidoModal";
import { mapService } from "../services/mapService";
import { useBatchRefreshMonitor } from "../hooks/useBatchRefreshMonitor";
import { 
    fetchSystem, 
    fetchTruckFuel, 
    fetchTruckGLP, 
    fetchCisternaGLP,
    fetchTruckDestination 
} from "../services/routeService";
import { reportService } from "../services/reportService";
import { pedidosService } from "../services/pedidosService";
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
    const [lastProcessedFechaHoraFin, setLastProcessedFechaHoraFin] = useState(null);
    const [colapsoInfo, setColapsoInfo] = useState(null);
    const [showAutoPlayNotification, setShowAutoPlayNotification] = useState(false);
    const [fechaHoraFinEntregasUpdated, setFechaHoraFinEntregasUpdated] = useState(true);
    
    // Simulation tracking states
    const [simulationStartTime, setSimulationStartTime] = useState(null);
    const [realTimeElapsed, setRealTimeElapsed] = useState(0);
    
    // UI states
    const [activePanelTab, setActivePanelTab] = useState(0);
    const [isPanelVisible, setIsPanelVisible] = useState(true);
    
    // System data states
    const [system, setSystem] = useState(null);
    const [truckFuels, setTruckFuels] = useState(new Map());
    const [truckGLPs, setTruckGLPs] = useState(new Map());
    const [cisternaGLPs, setCisternaGLPs] = useState(new Map());
    const [currentDestinations, setCurrentDestinations] = useState(new Map());
    const [selectedItem, setSelectedItem] = useState(null);

    // Modal states
    const [showReportModal, setShowReportModal] = useState(false);
    const [showAddPedidoModal, setShowAddPedidoModal] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [isLoadingReport, setIsLoadingReport] = useState(false);
    const [forcePedidosTab, setForcePedidosTab] = useState(undefined);
    const [showPedidoSuccess, setShowPedidoSuccess] = useState(false);
    const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState(null);
    const [showAutoRefreshNotice, setShowAutoRefreshNotice] = useState(false);

    // Set the interval in hours here:
    const simulatedIntervalHours = 2;

    // Add this:
    const [fechaFinSimulation, setFechaFinSimulation] = useState(null);
    const fechaStartSimulationAbsolute = React.useRef(null);

    // Monitor for batch refresh notifications
    useBatchRefreshMonitor(true, 2000);

    // Helper function to format pedidos DTOs from database
    const formatPedidosFromDB = (pedidosDTO) => {
        return pedidosDTO.map(pedidoDTO => ({
            id: pedidoDTO.id || pedidoDTO.numeroPedido,
            numeroPedido: pedidoDTO.numeroPedido,
            volumenGLP: pedidoDTO.volumenGLP,
            fechaHoraRegistro: pedidoDTO.fechaHoraRegistro,
            fechaHoraMaxEntrega: pedidoDTO.fechaHoraMaxEntrega,
            tiempoMaxEntrega: pedidoDTO.tiempoMaxEntrega,
            estado: pedidoDTO.estado || 'PENDIENTE',
            completado: pedidoDTO.completado || false,
            consumoCombustibleTotal: pedidoDTO.consumoCombustibleTotal || 0,
            idCliente: pedidoDTO.idCliente,
            ubicacion: pedidoDTO.ubicacion ? {
                x: pedidoDTO.ubicacion.x,
                y: pedidoDTO.ubicacion.y
            } : { x: 0, y: 0 },
            volumenGLPEntregado: pedidoDTO.volumenGLPEntregado || 0
        }));
    };

    // Refresh only pedidos data from database
    const refreshPedidosData = async (showLoading = true) => {
        if (showLoading) setIsRefreshing(true);
        
        try {
            console.log('Refreshing pedidos data from database...');
            
            // Fetch fresh pedidos directly from database
            const freshPedidos = await pedidosService.fetchPedidosFresh();
            
            // Convert DTOs to the format expected by the system
            const formattedPedidos = formatPedidosFromDB(freshPedidos);
            
            // Update system with fresh pedidos data
            setSystem(prevSystem => ({
                ...prevSystem,
                pedidos: formattedPedidos
            }));
            
            setLastRefreshTime(new Date());
            console.log(`✅ Pedidos refreshed from DB: ${formattedPedidos.length} pedidos found`);
            
            // Log pedidos for debugging
            if (formattedPedidos.length > 0) {
                console.log('📋 Latest pedidos from DB:', formattedPedidos.map(p => ({
                    id: p.id,
                    numero: p.numeroPedido,
                    estado: p.estado,
                    registro: p.fechaHoraRegistro
                })));
            }
            
        } catch (error) {
            console.error('Error refreshing pedidos data:', error);
            // Fallback to full system refresh if pedidos refresh fails
            console.log('Falling back to full system refresh...');
            await refreshSystemData(false);
        } finally {
            if (showLoading) setIsRefreshing(false);
        }
    };

    // Refresh system data function  
    const refreshSystemData = async (showLoading = true) => {
        if (showLoading) setIsRefreshing(true);
        
        try {
            console.log('Refreshing full system data...');
            
            // Fetch updated system data
            const updatedSystem = await fetchSystem();
            setSystem(updatedSystem);
            
            setLastRefreshTime(new Date());
            console.log('System data refreshed successfully');
            
        } catch (error) {
            console.error('Error refreshing system data:', error);
        } finally {
            if (showLoading) setIsRefreshing(false);
        }
    };

    // Manual refresh handler
    const handleManualRefresh = async () => {
        console.log('🔄 Manual refresh triggered by user');
        
        try {
            await refreshPedidosData(true); // Use pedidos-specific refresh for better performance
            
            // Show success notification briefly
            setShowRefreshSuccess(true);
            setTimeout(() => {
                setShowRefreshSuccess(false);
            }, 2000);
            
        } catch (error) {
            console.error('❌ Manual refresh failed:', error);
        }
    };

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const autoRefreshInterval = setInterval(async () => {
            console.log('Auto-refreshing pedidos data (5-minute interval)');
            
            // Show brief notification for auto-refresh
            setShowAutoRefreshNotice(true);
            setTimeout(() => {
                setShowAutoRefreshNotice(false);
            }, 3000);
            
            await refreshPedidosData(false); // Don't show loading spinner for auto-refresh
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(autoRefreshInterval);
    }, []);

    // Keyboard shortcut for manual refresh (Ctrl+R or F5)
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Prevent default browser refresh and use our custom refresh
            if ((event.ctrlKey && event.key === 'r') || event.key === 'F5') {
                event.preventDefault();
                handleManualRefresh();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Modal handlers
    const handleOpenReportModal = async () => {
        setIsLoadingReport(true);
        try {
            const data = await reportService.getSimulationReport();
            setReportData(data);
            setShowReportModal(true);
        } catch (error) {
            console.error('Error loading report data:', error);
            alert('Error al cargar los datos del reporte');
        } finally {
            setIsLoadingReport(false);
        }
    };

    const handleCloseReportModal = () => {
        setShowReportModal(false);
        setReportData(null);
    };

    const handleOpenAddPedidoModal = () => {
        setShowAddPedidoModal(true);
    };

    const handleCloseAddPedidoModal = () => {
        setShowAddPedidoModal(false);
    };

    const handlePedidoAdded = async (pedidoData) => {
        console.log('Nuevo pedido agregado:', pedidoData);
        
        try {
            // Use the pedidos refresh function to update pedidos data specifically
            await refreshPedidosData(false);
            
            // Switch to pedidos tab to show the new pedido
            setForcePedidosTab(2); // Tab index 2 is for pedidos
            
            // Clear the force tab after a brief delay
            setTimeout(() => {
                setForcePedidosTab(undefined);
            }, 100);
            
            // Also refresh pedidos stats if report is open
            if (showReportModal) {
                const updatedReportData = await reportService.getSimulationReport();
                setReportData(updatedReportData);
            }
            
            // Show success notification
            setShowPedidoSuccess(true);
            setTimeout(() => {
                setShowPedidoSuccess(false);
            }, 4000);
            
            console.log('Sistema actualizado con el nuevo pedido');
        } catch (error) {
            console.error('Error al actualizar sistema después de agregar pedido:', error);
        }
    };

    // Check if simulation should show report automatically (for daily scenarios)
    useEffect(() => {
        const checkSimulationCompletion = async () => {
            try {
                // Only check for daily simulations
                const urlParams = new URLSearchParams(window.location.search);
                const scenario = sessionStorage.getItem('currentScenario') || 'diario';
                
                if (scenario === 'diario' && system && !isPlaying) {
                    const isCompleted = await reportService.isSimulationCompleted();
                    if (isCompleted && !showReportModal && !isLoadingReport) {
                        // Automatically show report after a brief delay
                        setTimeout(() => {
                            handleOpenReportModal();
                        }, 2000);
                    }
                }
            } catch (error) {
                console.error('Error checking simulation completion:', error);
            }
        };

        if (system) {
            checkSimulationCompletion();
        }
    }, [system, isPlaying, showReportModal, isLoadingReport]);

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
                //console.log("Fetched startTimeString:", startTimeString);
                const startTime = new Date(startTimeString);
                //console.log("Parsed startTime:", startTime);
                if (fechaStartSimulationAbsolute.current === null && startTime) {
                    fechaStartSimulationAbsolute.current = startTime; //unica vez
                    console.log("unica vez fecha inicio absoluta " + fechaStartSimulationAbsolute)
                    setFechaFinSimulation(new Date(startTime.getTime() + simulatedIntervalHours * 60 * 60 * 1000));
                }
                setCurrentTime(startTime);
                setSimulationStartTime(startTime);
                setSimulationStarted(true);
                //console.log("Simulation initialized:", startTime);
            } catch (error) {
                const currentDateTime = null;
                setCurrentTime(currentDateTime);
                setSimulationStartTime(currentDateTime);
                setSimulationStarted(true);
                console.error("Error initializing simulation:", error);
            }
            // Fetch fechaHoraFinEntregas
            try {
                //console.log("Function called");
                const res = await fetch(`${API_BASE}/fecha-hora-fin-entregas`);
                //console.log("Fetch completed");
                const data = await res.json();
                //console.log("JSON parsed:", data);
                if (data) {
                    const newValue = new Date(data);
                    if(fechaHoraFinEntregas === null || fechaHoraFinEntregas.getTime() !== newValue.getTime()){
                        //console.log("newValue:", newValue);
                        setFechaHoraFinEntregas(newValue);
                        //setLastProcessedFechaHoraFin(newValue);
                    }
                }
            } catch (e) {
                console.error("Error in fetch or parsing:", e);
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
                // Load base system data
                const systemData = await fetchSystem();
                
                // Load fresh pedidos from database to ensure we have the latest data
                try {
                    const freshPedidos = await pedidosService.fetchPedidosFresh();
                    const formattedPedidos = formatPedidosFromDB(freshPedidos);
                    
                    // Merge fresh pedidos with system data
                    systemData.pedidos = formattedPedidos;
                    console.log(`🚀 Initial load: ${formattedPedidos.length} pedidos loaded from database`);
                } catch (pedidosError) {
                    console.warn("Could not load fresh pedidos, using system pedidos:", pedidosError);
                    // Use system pedidos as fallback
                }
                
                setSystem(systemData);
                setLastRefreshTime(new Date()); // Set initial refresh time
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
        
        
        if (!currentTime || !fechaHoraFinEntregas || isContinuing || !fechaStartSimulationAbsolute) return;
        
        // Use the boolean flag ins(tead of comparing lastProcessedFechaHoraFin and fechaHoraFinEntregas
        //console.log("last proc: "+(lastProcessedFechaHoraFin !== null ? lastProcessedFechaHoraFin.getTime() : "nada"))
        //console.log("fin entre: "+fechaHoraFinEntregas.getTime())
        if (fechaHoraFinEntregas === null || 
            (fechaHoraFinEntregas!==null && lastProcessedFechaHoraFin!==null && 
                lastProcessedFechaHoraFin.getTime() === fechaHoraFinEntregas.getTime())) {
            return;
        }
        if (currentTime >= fechaHoraFinEntregas) {
    
            setIsContinuing(true);
            setLastProcessedFechaHoraFin(fechaHoraFinEntregas);
            setFechaHoraFinEntregasUpdated(false);
            //console.log("fin entregas : " + fechaHoraFinEntregas)
            //console.log("current time : " + currentTime)
            console.log("Llamando a nuevo batch")
            fetch(`${API_BASE}/continue-simulation`, { method: "POST" })
                
                .finally(() => setIsContinuing(false));
            
        }
        // Reset the flag after processing
    }, [currentTime, fechaHoraFinEntregas, isContinuing, lastProcessedFechaHoraFin, fechaHoraFinEntregasUpdated]);

    // Simulation time progression
    useEffect(() => {
        let intervalId;
    
        if (isPlaying && currentTime) {
            intervalId = setInterval(() => {
                setCurrentTime(new Date()); // Usa la hora real del sistema
                ///descomentar para sim semnanal
                // setCurrentTime(prevTime => {
                //     if (!prevTime) return new Date();
                //     // Use seconds instead of minutes for smoother movement
                //     return new Date(prevTime.getTime() + 1000 * playbackSpeed);
                // });
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

    
    useEffect(() => {
        const intervalId = setInterval(async () => {
            try {
                //console.log("Polling for fecha-hora-fin-entregas");
                const res = await fetch(`${API_BASE}/fecha-hora-fin-entregas`);
                const data = await res.json();
                //console.log("JSON parsed:", data);
                if (data) {
                    const newValue = new Date(data);
                    //console.log("new " + newValue.getTime());
                    //console.log(fechaHoraFinEntregas.getTime());
                    if (
                        fechaHoraFinEntregas === null ||
                        fechaHoraFinEntregas.getTime() !== newValue.getTime()
                    ) {
                        setFechaHoraFinEntregas(newValue);
                        //setFechaHoraFinEntregasUpdated(true);
                    }
                }
            } catch (e) {
                //console.error("Error in fetch or parsing:", e);
                setFechaHoraFinEntregas(null);
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [fechaHoraFinEntregas]);

    // Add the effect to call the API at each interval
    useEffect(() => {
        if (!currentTime || !fechaFinSimulation) return;
        //console.log(fechaFinSimulation)
        if (currentTime >= fechaFinSimulation) {
            setIsContinuing(true);
            setLastProcessedFechaHoraFin(fechaHoraFinEntregas);
            setFechaHoraFinEntregasUpdated(false);
            // Call the API
            console.log("Continuando la simulacion then")
            fetch(`${API_BASE}/continue-simulation`, { method: "POST" })
                .finally(() => {
                    // Advance fechaFinSimulation by another interval
                    setFechaFinSimulation(
                        prev => new Date(prev.getTime() + simulatedIntervalHours * 60 * 60 * 1000)
                    );
                });
        }
    }, [currentTime, fechaFinSimulation]);

    const handlePauseSimulation = () => {
        setIsPlaying(false);
    };

    const handleItemSelect = (item) => {
        setSelectedItem(item);
        // Switch to details tab when an item is selected (now tab 2 instead of 1)
        setActivePanelTab(2);
        // Show panel if it's hidden when an item is selected
        if (!isPanelVisible) {
            setIsPanelVisible(true);
        }
    };

    // Professional loading component
    const LoadingComponent = () => (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
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
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Top simulation control bar */}
            <Box sx={{
                backgroundColor: '#1f2937', // Same color as navbar
                color: 'white',
                borderBottom: '1px solid #374151',
                px: 3,
                py: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000
            }}>
                {/* Left side - Back button and title */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        onClick={() => window.history.back()}
                        sx={{ 
                            minWidth: 'auto',
                            width: 45,
                            height: 45,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                        aria-label="Volver"
                    >
                        <ArrowBackIcon sx={{ fontSize: 20 }} />
                    </Button>
                    
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'white' }}>
                        Simulación PLG
                    </Typography>
                </Box>

                {/* Center - Control buttons */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        onClick={() => {
                            if (!colapsoInfo || !colapsoInfo.colapso) setIsPlaying(!isPlaying);
                        }}
                        disabled={colapsoInfo && colapsoInfo.colapso}
                        sx={{ 
                            minWidth: 'auto',
                            width: 50,
                            height: 50,
                            borderRadius: '50%',
                            backgroundColor: isPlaying ? '#4caf50' : 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid',
                            borderColor: isPlaying ? '#4caf50' : 'rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            fontSize: '20px',
                            '&:hover': {
                                backgroundColor: isPlaying ? '#45a049' : 'rgba(255, 255, 255, 0.2)',
                                borderColor: isPlaying ? '#45a049' : 'rgba(255, 255, 255, 0.5)',
                                transform: 'scale(1.05)'
                            },
                            '&:disabled': {
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255, 255, 255, 0.3)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                        {isPlaying ? <PauseIcon sx={{ fontSize: 24 }} /> : <PlayArrowIcon sx={{ fontSize: 24 }} />}
                    </Button>

                    <Button
                        onClick={() => {
                            setIsPlaying(false);
                            window.history.back();
                        }}
                        sx={{ 
                            minWidth: 'auto',
                            width: 45,
                            height: 45,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '2px solid rgba(239, 68, 68, 0.5)',
                            color: '#ef4444',
                            '&:hover': {
                                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                borderColor: '#ef4444',
                                transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                        aria-label="Cancelar simulación"
                    >
                        <StopIcon sx={{ fontSize: 20 }} />
                    </Button>
                </Box>

                {/* Right side - Simulation info and panel toggle */}
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} fontWeight="bold">
                                Tiempo Real
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: 'white' }}>
                                {new Date().toLocaleString()}
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} fontWeight="bold">
                                Tiempo Simulado
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#60a5fa' }}>
                                {(currentTime !== null ? currentTime : new Date()).toLocaleString()}
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} fontWeight="bold">
                                Tiempo Simulado Transcurrido
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#34d399' }}>
                                {simulationStartTime && currentTime 
                                    ? Math.floor((currentTime - simulationStartTime) / (1000 * 60 * 60)) + 'h ' +
                                      Math.floor(((currentTime - simulationStartTime) % (1000 * 60 * 60)) / (1000 * 60)) + 'm'
                                    : '0h 0m'
                                }
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} fontWeight="bold">
                                Tiempo Real Transcurrido
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: '#fbbf24' }}>
                                {Math.floor(realTimeElapsed / 60)}m {realTimeElapsed % 60}s
                            </Typography>
                        </Box>

                        {/* Progress bar */}
                        {simulationStartTime && fechaHoraFinEntregas && (
                            <Box sx={{ width: 180 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} fontWeight="bold">
                                        Progreso
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#60a5fa' }} fontWeight="bold">
                                        {Math.round(((currentTime - simulationStartTime) / (fechaHoraFinEntregas - simulationStartTime)) * 100)}%
                                    </Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={Math.min(100, Math.max(0, ((currentTime - simulationStartTime) / (fechaHoraFinEntregas - simulationStartTime)) * 100))}
                                    sx={{ 
                                        height: 10, 
                                        borderRadius: 5,
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 5,
                                            background: isPlaying 
                                                ? 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%)'
                                                : 'linear-gradient(90deg, #9ca3af 0%, #6b7280 100%)'
                                        }
                                    }} 
                                />
                            </Box>
                        )}
                    </Box>

                    <Button
                        onClick={() => setIsPanelVisible(!isPanelVisible)}
                        sx={{
                            minWidth: 'auto',
                            width: 45,
                            height: 45,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderColor: 'rgba(255, 255, 255, 0.5)',
                                transform: 'scale(1.05)'
                            },
                            transition: 'all 0.2s ease'
                        }}
                        aria-label={isPanelVisible ? "Ocultar panel" : "Mostrar panel"}
                    >
                        {isPanelVisible ? <ChevronRightIcon sx={{ fontSize: 20 }} /> : <ChevronLeftIcon sx={{ fontSize: 20 }} />}
                    </Button>
                </Box>
            </Box>

            {/* Alerts section */}
            {(colapsoInfo?.colapso || showAutoPlayNotification || showPedidoSuccess || showAutoRefreshNotice || showRefreshSuccess) && (
                <Box sx={{ px: 3, py: 1 }}>
                    {colapsoInfo && colapsoInfo.colapso && (
                        <Alert severity="error" sx={{ mb: 1 }}>
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
                        <Alert severity="info" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">Simulación reiniciada automáticamente</Typography>
                            <Typography variant="body2">La simulación se ha reiniciado después del procesamiento del nuevo batch y comenzará a reproducirse automáticamente.</Typography>
                        </Alert>
                    )}
                    {showPedidoSuccess && (
                        <Alert severity="success" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">¡Pedido agregado exitosamente!</Typography>
                            <Typography variant="body2">El nuevo pedido se ha registrado y aparece en la pestaña "Pedidos" del panel de elementos. El sistema ha sido actualizado automáticamente.</Typography>
                        </Alert>
                    )}
                    {showRefreshSuccess && (
                        <Alert severity="success" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">¡Datos actualizados exitosamente!</Typography>
                            <Typography variant="body2">Los pedidos se han actualizado con los datos más recientes de la base de datos. Ahora puedes ver todos los pedidos más recientes.</Typography>
                        </Alert>
                    )}
                    {showAutoRefreshNotice && (
                        <Alert severity="info" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">Pedidos actualizados automáticamente</Typography>
                            <Typography variant="body2">Los pedidos se han actualizado con datos frescos de la base de datos. Ahora puedes ver los pedidos más recientes.</Typography>
                        </Alert>
                    )}
                </Box>
            )}

            {/* Main content area */}
            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Map visualization */}
                <Box sx={{ 
                    flexGrow: 1, 
                    position: 'relative',
                    width: isPanelVisible ? 'calc(100vw - 350px)' : '100vw',
                    height: '100%',
                    overflow: "hidden",
                    backgroundColor: "#fafafa",
                    transition: 'width 0.3s ease-in-out'
                }}>
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

                {/* Right panel */}
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
                            {/* Panel Header */}
                            <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Panel de Control
                                </Typography>
                                
                                {/* Tabs */}
                                <Tabs 
                                    value={activePanelTab} 
                                    onChange={(e, newValue) => setActivePanelTab(newValue)}
                                    variant="fullWidth"
                                >
                                    <Tab label="Elementos" />
                                    <Tab label="Bloqueos" />
                                    <Tab label="Detalles" disabled={!selectedItem} />
                                </Tabs>
                            </Box>

                            {/* Tab Content */}
                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                {/* Elements Tab */}
                                {activePanelTab === 0 && (
                                    <Box sx={{ height: '100%' }}>
                                        <ItemListPanel
                                            system={system}
                                            onItemSelect={handleItemSelect}
                                            selectedItem={selectedItem}
                                            truckFuels={truckFuels}
                                            truckGLPs={truckGLPs}
                                            cisternaGLPs={cisternaGLPs}
                                            currentTime={currentTime}
                                            forceActiveTab={forcePedidosTab}
                                            lastRefreshTime={lastRefreshTime}
                                            isRefreshing={isRefreshing}
                                        />
                                    </Box>
                                )}

                                {/* Bloqueos Tab */}
                                {activePanelTab === 1 && (
                                    <Box sx={{ height: '100%' }}>
                                        <BloqueosListPanel
                                            system={system}
                                            currentTime={currentTime}
                                            onItemSelect={handleItemSelect}
                                            selectedItem={selectedItem}
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

            {/* Floating Action Buttons */}
            <Box sx={{ 
                position: 'fixed', 
                bottom: 20, 
                right: isPanelVisible ? 370 : 20, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2, 
                zIndex: 1000,
                transition: 'right 0.3s ease-in-out'
            }}>
                <Tooltip title="Agregar Nuevo Pedido" placement="left">
                    <Fab
                        color="primary"
                        onClick={handleOpenAddPedidoModal}
                        sx={{ 
                            bgcolor: '#4caf50', 
                            '&:hover': { bgcolor: '#388e3c' },
                            boxShadow: '0 4px 20px rgba(76, 175, 80, 0.3)'
                        }}
                    >
                        <AddIcon />
                    </Fab>
                </Tooltip>
                
                <Tooltip 
                    title={
                        <Box>
                            <Typography variant="body2">Refrescar Pedidos</Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Datos frescos desde BD
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                Atajo: Ctrl+R o F5
                            </Typography>
                            {lastRefreshTime && (
                                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    Último: {lastRefreshTime.toLocaleTimeString()}
                                </Typography>
                            )}
                        </Box>
                    } 
                    placement="left"
                >
                    <Fab
                        color="secondary"
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                        sx={{ 
                            bgcolor: '#ff9800', 
                            '&:hover': { bgcolor: '#f57c00' },
                            boxShadow: '0 4px 20px rgba(255, 152, 0, 0.3)',
                            '&:disabled': {
                                bgcolor: '#ffcc80',
                                color: '#fff'
                            }
                        }}
                    >
                        <RefreshIcon 
                            sx={{ 
                                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                                '@keyframes spin': {
                                    '0%': {
                                        transform: 'rotate(0deg)',
                                    },
                                    '100%': {
                                        transform: 'rotate(360deg)',
                                    },
                                }
                            }} 
                        />
                    </Fab>
                </Tooltip>
                
                <Tooltip title="Ver Reporte de Simulación" placement="left">
                    <Fab
                        color="secondary"
                        onClick={handleOpenReportModal}
                        disabled={isLoadingReport}
                        sx={{ 
                            bgcolor: '#2196f3', 
                            '&:hover': { bgcolor: '#1976d2' },
                            boxShadow: '0 4px 20px rgba(33, 150, 243, 0.3)'
                        }}
                    >
                        <AssignmentIcon />
                    </Fab>
                </Tooltip>
            </Box>

            {/* Modals */}
            <SimulationReportModal
                open={showReportModal}
                onClose={handleCloseReportModal}
                reportData={reportData}
            />
            
            <AddPedidoModal
                open={showAddPedidoModal}
                onClose={handleCloseAddPedidoModal}
                onPedidoAdded={handlePedidoAdded}
            />
        </Box>
    );
}
