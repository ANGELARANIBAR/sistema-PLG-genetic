import React, { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { mapService } from '../services/mapService';
import '../styles/MapStyles.css';
// Importar iconos
import truckIcon from '../assets/icons/truck-icon.svg';
import truckIconUp from '../assets/icons/truck-icon-up.svg';
import truckIconDown from '../assets/icons/truck-icon-down.svg';
import truckIconLeft from '../assets/icons/truck-icon-left.svg';
import truckIconRight from '../assets/icons/truck-icon-right.svg';
import cisternaIcon from '../assets/icons/cisterna-icon.svg';
import pedidoIcon from '../assets/icons/pedido-icon.svg';
import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import CustomTooltip from './CustomTooltip/CustomTooltip';

const MapVisualization = ({ currentTime, onPauseSimulation, onItemSelect, selectedItem: externalSelectedItem }) => {
  const [system, setSystem] = useState(null);
  const [truckPositions, setTruckPositions] = useState(new Map());
  const [truckFuels, setTruckFuels] = useState(new Map());
  const [truckGLPs, setTruckGLPs] = useState(new Map());
  const [cisternaGLPs, setCisternaGLPs] = useState(new Map());
  const [isReplanning, setIsReplanning] = useState(false);
  const [averiaStartTime, setAveriaStartTime] = useState(null);
  const [internalSelectedItem, setInternalSelectedItem] = useState(null);
  const [currentDestinations, setCurrentDestinations] = useState(new Map());
  const [startTime, setStartTime] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [lastSystemUpdate, setLastSystemUpdate] = useState(new Date());

  const [overlappingItems, setOverlappingItems] = useState([]);
  const [showOverlapMenu, setShowOverlapMenu] = useState(false);
  const [truckDirections, setTruckDirections] = useState(new Map());
  const [pedidoEstado, setPedidoEstado] = useState(null);
  const [pedidoEstadoLoading, setPedidoEstadoLoading] = useState(false);
  const [pedidosEstados, setPedidosEstados] = useState({});
  const [planificationPercentage, setPlanificationPercentage] = useState(null);
  const mapContainerRef = useRef(null);
  const [legendVisible, setLegendVisible] = useState(false);

  // Use external selectedItem if provided, otherwise use internal state
  const selectedItem = externalSelectedItem || internalSelectedItem;

  // Toggle legend visibility
  const handleLegendToggle = () => {
    setLegendVisible((prev) => !prev);
  };

  const getCurrentDestination = useCallback(async (truck) => {
    if (!currentTime) return null;
    
    try {
      const destination = await mapService.fetchTruckDestination(truck.truckId, currentTime);
      return destination;
    } catch (error) {
      console.error('Error fetching current destination:', error);
      return null;
    }
  }, [currentTime]);

  // Load initial system data
  useEffect(() => {
    const loadSystem = async () => {
      try {
        const systemData = await mapService.fetchSystem();
        setSystem(systemData);
        const startTimeData = await mapService.fetchStartTime();
        if(startTimeData===null || startTimeData === undefined)return;
        setStartTime(startTimeData);
      } catch (error) {
        console.error('Error loading system data:', error);
      }
    };
    loadSystem();
  }, []);

  // Update truck positions, fuel, and GLP
  useEffect(() => {
    const updateTruckData = async () => {
      if (!currentTime || !system) return;

      const newPositions = new Map();
      const newFuels = new Map();
      const newGLPs = new Map();
      if(system.flota === null || system.flota === undefined)
        return;
      for (const truck of system.flota) {
        try {
          const [position, fuel, glp] = await Promise.all([
            mapService.fetchTruckPosition(truck.truckId, currentTime),
            mapService.fetchTruckFuel(truck.truckId, currentTime),
            mapService.fetchTruckGLP(truck.truckId, currentTime)
          ]);

          if (position) {
            newPositions.set(truck.truckId, position);
          }
          if (fuel !== null) {
            newFuels.set(truck.truckId, fuel);
          }
          if (glp !== null) {
            newGLPs.set(truck.truckId, glp);
          }
        } catch (error) {
          console.error(`Error updating truck ${truck.truckId}:`, error);
        }
      }

      setTruckPositions(newPositions);
      setTruckFuels(newFuels);
      setTruckGLPs(newGLPs);
    };

    updateTruckData();
  }, [currentTime, system]);

  // Update current destinations
  useEffect(() => {
    const updateCurrentDestinations = async () => {
      if (!currentTime || !system || !system.flota) return;

      const newDestinations = new Map();
      for (const truck of system.flota) {
        const destination = await getCurrentDestination(truck);
        if (destination) {
          newDestinations.set(truck.truckId, destination);
        }
      }
      setCurrentDestinations(newDestinations);
    };

    updateCurrentDestinations();
  }, [currentTime, system, getCurrentDestination]);



  // Update cisterna GLP
  useEffect(() => {
    const updateCisternaGLPs = async () => {
      if (!currentTime || !system || !system.cisternas) return;

      const newGLPs = new Map();
      for (const cisterna of system.cisternas) {
        try {
          const glp = await mapService.fetchCisternaGLP(cisterna.id, currentTime);
          if (glp !== null) {
            newGLPs.set(cisterna.id, glp);
          }
        } catch (error) {
          console.error(`Error updating cisterna ${cisterna.id} GLP:`, error);
        }
      }
      setCisternaGLPs(newGLPs);
    };

    updateCisternaGLPs();
  }, [currentTime, system]);

  // Periodically fetch system data
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const systemData = await mapService.fetchSystem();
        setSystem(systemData);
        setLastSystemUpdate(new Date());
      } catch (error) {
        console.error('Error fetching system data:', error);
      }
    };

    const interval = setInterval(fetchSystemData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check replanning status
  useEffect(() => {
    const checkReplanningStatus = async () => {
      try {
        const status = await mapService.checkReplanning();
        setIsReplanning(status);
        if (status && system?.averiaStartTime) {
          setAveriaStartTime(new Date(system.averiaStartTime));
        } else {
          setAveriaStartTime(null);
        }
      } catch (error) {
        console.error('Error checking replanning status:', error);
      }
    };

    const interval = setInterval(checkReplanningStatus, 1000);
    return () => clearInterval(interval);
  }, [system]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setShowOverlapMenu(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Adjust map size on window resize
  useEffect(() => {
    const handleResize = () => {
      // Force rerender to update dimensions
      setLastSystemUpdate(new Date());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Determine truck direction based on current and previous positions
  useEffect(() => {
    if (!system) return;

    const newDirections = new Map();
    const previousPositions = new Map(truckPositions);

    Array.from(truckPositions.entries()).forEach(([truckId, currentPos]) => {
      const prevPos = previousPositions.get(truckId);
      
      if (prevPos) {
        if (Math.abs(currentPos.x - prevPos.x) > Math.abs(currentPos.y - prevPos.y)) {
          // Moving horizontally
          if (currentPos.x > prevPos.x) {
            newDirections.set(truckId, 'right');
          } else if (currentPos.x < prevPos.x) {
            newDirections.set(truckId, 'left');
          }
        } else {
          // Moving vertically
          if (currentPos.y > prevPos.y) {
            newDirections.set(truckId, 'up');
          } else if (currentPos.y < prevPos.y) {
            newDirections.set(truckId, 'down');
          }
        }
      } else {
        // Default direction if no previous position
        newDirections.set(truckId, 'up');
      }
    });

    setTruckDirections(newDirections);
  }, [truckPositions, system]);

  // Fetch real-time estado for all pedidos
  useEffect(() => {
    let isMounted = true;
    const fetchAllEstados = async () => {
      if (!system || !system.pedidos || !currentTime) {
        setPedidosEstados({});
        return;
      }
      const estados = {};
      await Promise.all(system.pedidos.map(async (pedido) => {
        try {
          const estado = await mapService.fetchPedidoEstado(pedido.id, currentTime);
          estados[pedido.id] = estado;
        } catch {
          estados[pedido.id] = null;
        }
      }));
      if (isMounted) setPedidosEstados(estados);
    };
    fetchAllEstados();
    return () => { isMounted = false; };
  }, [system, currentTime]);

  // Prevent selecting a pedido that is ENTREGADO
  useEffect(() => {
    if (selectedItem && selectedItem.type === 'pedido') {
      const estado = pedidosEstados[selectedItem.id];
      if (estado === 'ENTREGADO') {
        // Clear selection - prefer using external callback if available
        if (onItemSelect) {
          onItemSelect(null);
        } else {
          setInternalSelectedItem(null);
        }
      }
    }
  }, [pedidosEstados, selectedItem, onItemSelect]);

  // Fetch planification percentage periodically
  useEffect(() => {
    const fetchPercentage = async () => {
      try {
        const percentage = await mapService.fetchPlanificationPercentage();
        if (percentage !== null) {
          setPlanificationPercentage(percentage);
        }
      } catch (error) {
        console.error('Error fetching planification percentage:', error);
      }
    };

    // Fetch immediately
    fetchPercentage();

    // Set up interval to fetch every 2 seconds
    const interval = setInterval(fetchPercentage, 2000);

    return () => clearInterval(interval);
  }, []);

  // Professional loading component
  const LoadingComponent = ({ percentage }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
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
        
        {percentage !== null && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progreso de planificación
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {percentage.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={percentage} 
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
        )}
        
        <Typography variant="caption" color="text.secondary">
          Cargando datos del sistema...
        </Typography>
      </Paper>
    </Box>
  );

  if (!system || !startTime) {
    return <LoadingComponent percentage={planificationPercentage} />;
  }

  // Calculate scale factors to fit the map in the viewport
  const getContainerDimensions = () => {
    if (mapContainerRef.current) {
      const containerWidth = mapContainerRef.current.clientWidth - 80; // Subtract padding + margin
      const containerHeight = mapContainerRef.current.clientHeight - 80; // Subtract padding + margin
      return { containerWidth, containerHeight };
    }
    return { containerWidth: 800, containerHeight: 600 };
  };

  const { containerWidth, containerHeight } = getContainerDimensions();
  const scaleX = containerWidth / (system?.maxXmapa || 100);
  const scaleY = containerHeight / (system?.maxYmapa || 100);

  // Function to convert coordinates to screen position
  const toScreenPosition = (x, y) => ({
    x: x * scaleX,
    y: containerHeight - (y * scaleY) // Invert Y coordinate to start from bottom
  });

  // Function to check for overlapping items at a position
  const findItemsAtPosition = (x, y) => {
    const items = [];
    const threshold = 15; // Pixel threshold for overlap detection

    // Check trucks
    Array.from(truckPositions.entries()).forEach(([truckId, position]) => {
      const pos = toScreenPosition(position.x, position.y);
      if (Math.abs(pos.x - x) < threshold && Math.abs(pos.y - y) < threshold) {
        const truck = system?.flota?.find(t => t.truckId === truckId);
        if (truck) {
          items.push({ type: 'truck', id: truckId, label: `Camión ${truck.codigo}` });
        }
      }
    });

    // Check pedidos
    system?.pedidos.forEach((pedido) => {
      const pos = toScreenPosition(pedido.ubicacion.x, pedido.ubicacion.y);
      if (Math.abs(pos.x - x) < threshold && Math.abs(pos.y - y) < threshold) {
        items.push({ type: 'pedido', id: pedido.id, label: `Pedido ${pedido.numeroPedido}` });
      }
    });

    // Check cisternas
    system?.cisternas.forEach((cisterna, index) => {
      const pos = toScreenPosition(cisterna.ubicacion.x, cisterna.ubicacion.y);
      if (Math.abs(pos.x - x) < threshold && Math.abs(pos.y - y) < threshold) {
        items.push({ type: 'cisterna', id: index, label: `Cisterna ${cisterna.principal ? 'Principal' : 'Secundaria'}` });
      }
    });

    return items;
  };

  const handleMarkerClick = (e, item) => {
    e.stopPropagation();
    const items = findItemsAtPosition(e.clientX, e.clientY);
    
    if (items.length > 1) {
      setOverlappingItems(items);
      setShowOverlapMenu({ x: e.clientX, y: e.clientY });
    } else {
      // Use external onItemSelect if available, otherwise use internal state
      if (onItemSelect) {
        onItemSelect(item);
      } else {
        setInternalSelectedItem(item);
      }
    }
  };

  const handleTruckRightClick = (e, truckId) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, truckId });
  };

  const handleAveriaOption = async (tipoAveria) => {
    const truckId = contextMenu?.truckId || (selectedItem?.type === 'truck' ? selectedItem.id : null);
    
    if (!truckId || !currentTime) {
      console.error('No truck selected or current time available');
      return;
    }

    try {
      //onPauseSimulation();
      await mapService.registrarAveria(truckId, tipoAveria, currentTime);
    } catch (error) {
      console.error('Error registering averia:', error);
    }

    setContextMenu(null);
  };

  const checkAndUpdateOrderState = async (truck, currentDest) => {
    if (currentDest.destinationType === 'ENTREGA_PEDIDO' && currentDest.orderId && false) {
      try {
        await mapService.changeOrderState(truck.truckId, currentDest.orderId, 'COMPLETADO');
      } catch (error) {
        console.error('Error updating order state:', error);
      }
    }
  };

  // Get truck icon based on direction
  const getTruckIcon = (truckId) => {
    const direction = truckDirections.get(truckId) || 'up';
    switch (direction) {
      case 'up': return truckIconUp;
      case 'down': return truckIconDown;
      case 'left': return truckIconLeft;
      case 'right': return truckIconRight;
      default: return truckIconUp;
    }
  };

  // Get truck color based on GLP capacity percentage
  const getTruckColorFilter = (currentGLP, maxGLP) => {
    if (!maxGLP || maxGLP === 0) return 'none';
    
    const percentage = (currentGLP / maxGLP) * 100;
    
    if (percentage >= 70) {
      // Verde brillante (70-100%)
      return 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%) hue-rotate(120deg)';
    } else if (percentage >= 30) {
      // Amarillo brillante (30-69%)
      return 'brightness(0) saturate(100%) invert(85%) sepia(100%) saturate(1000%) hue-rotate(0deg) brightness(100%) contrast(100%)';
    } else {
      // Rojo brillante (0-29%)
      return 'brightness(0) saturate(100%) invert(17%) sepia(95%) saturate(7498%) hue-rotate(356deg) brightness(100%) contrast(118%)';
    }
  };

  // Function to calculate the remaining route based on truck position
  const calculateRemainingRoute = (truckId, currentDest, truckPosition) => {
    if (!currentDest || !currentDest.route || !truckPosition || !truckPosition.x || !truckPosition.y) {
      return null;
    }

    const route = currentDest.route;
    const truckPos = { x: truckPosition.x, y: truckPosition.y };
    
    // Find the best segment the truck is currently on
    let bestSegmentIndex = 0;
    let minDistance = Infinity;
    
    for (let i = 0; i < route.length - 1; i++) {
      const node1 = route[i];
      const node2 = route[i + 1];
      
      // Skip if nodes are undefined or don't have x,y properties
      if (!node1 || !node2 || !node1.x || !node1.y || !node2.x || !node2.y) {
        continue;
      }
      
      // Calculate distance from truck to line segment
      const distance = distanceToLineSegment(truckPos, node1, node2);
      
      if (distance < minDistance) {
        minDistance = distance;
        bestSegmentIndex = i;
      }
    }

    // If truck is very close to the last node, consider route complete
    if (bestSegmentIndex >= route.length - 2) {
      const lastNode = route[route.length - 1];
      if (!lastNode || !lastNode.x || !lastNode.y) {
        return null; // Invalid last node
      }
      
      const distanceToLast = Math.sqrt(
        Math.pow(lastNode.x - truckPos.x, 2) + Math.pow(lastNode.y - truckPos.y, 2)
      );
      
      if (distanceToLast < 2) { // Within 2 units of last node
        return null; // Route is complete
      }
    }

    // Return the remaining portion of the route (from current segment to end)
    return route.slice(bestSegmentIndex);
  };

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = (point, lineStart, lineEnd) => {
    // Add null checks for all parameters
    if (!point || !lineStart || !lineEnd || 
        !point.x || !point.y || 
        !lineStart.x || !lineStart.y || 
        !lineEnd.x || !lineEnd.y) {
      return Infinity; // Return a large distance if any parameter is invalid
    }
    
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const getDestinationTypeLabel = (type) => {
    const labels = {
      'REABASTECIMIENTO': 'Reabastecimiento',
      'ENTREGA PEDIDO': 'Entrega de Pedido',
      'EN_RECARGA_GLP': 'Recarga de GLP',
      'EN_RECARGA_COMBUSTIBLE': 'Recarga de Combustible',
      'EN_MANTENIMIENTO': 'En Mantenimiento',
      'AVERIADO': 'Averiado'

    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      'COMPLETADO': '#4CAF50',
      'EN_CURSO': '#2196F3',
      'PENDIENTE': '#FF9800',
      'CANCELADO': '#F44336'
    };
    return colors[status] || '#666';
  };

  const getTruckDestinations = (truck) => {
    if (!truck || !currentTime) return [];

    const truckDestinations = truck.destinations || [];
    return truckDestinations.map((destino, index) => {
      // Determine status based on current time
      let status;
      if (currentTime.isBefore(destino.arrivalTime)) {
        status = 'PENDIENTE';
      } else if (currentTime.isAfter(destino.departureTime)) {
        status = 'COMPLETADO';
      } else {
        status = 'EN_CURSO';
      }

      return {
        destinationType: destino.destinationType || 'UNKNOWN',
        ubicacion: {
          x: destino.route && destino.route.length > 0 ? destino.route[0].x : 0,
          y: destino.route && destino.route.length > 0 ? destino.route[0].y : 0
        },
        fechaHoraLlegada: destino.arrivalTime,
        fechaHoraSalida: destino.departureTime,
        glpOperacion: destino.fuelConsumed, // Using fuelConsumed as GLP operation
        saldoGLPCamion: destino.saldoGLPCamion,
        saldoCombustibleCamion: destino.fuelConsumed, // Using fuelConsumed as fuel balance
        estadoCamion: destino.destinationType,
        status: status,
        orderId: destino.orderId || null
      };
    });
  };

  return (
    <div className="map-container" ref={mapContainerRef}>
      <div className="map-visualization">
        {/* Draw grid */}
        <svg className="grid-svg">
          {Array.from({ length: Math.ceil(system.maxXmapa) + 1 }, (_, x) => (
            <line
              key={`grid-x-${x}`}
              x1={x * scaleX}
              y1={0}
              x2={x * scaleX}
              y2={containerHeight}
              stroke="#e0e0e0"
              strokeWidth="0.8"
              strokeDasharray="3,3"
            />
          ))}
          {Array.from({ length: Math.ceil(system.maxYmapa) + 1 }, (_, y) => (
            <line
              key={`grid-y-${y}`}
              x1={0}
              y1={containerHeight - (y * scaleY)}
              x2={containerWidth}
              y2={containerHeight - (y * scaleY)}
              stroke="#e0e0e0"
              strokeWidth="0.8"
              strokeDasharray="3,3"
            />
          ))}
        </svg>

        {/* Draw current routes */}
        {system?.flota?.map((truck, index) => {
          const currentDest = currentDestinations.get(truck.truckId);
          const truckPosition = truckPositions.get(truck.truckId);
          
          if (!currentDest || !currentDest.route) return null;

          // Calculate the remaining route based on truck position
          const remainingRoute = calculateRemainingRoute(truck.truckId, currentDest, truckPosition);
          
          // If no remaining route, don't render anything
          if (!remainingRoute || remainingRoute.length < 2) return null;

          return (
            <svg key={`route-${truck.truckId}`} className="route-line">
              <polyline
                points={remainingRoute
                  .filter(node => node && node.x !== undefined && node.y !== undefined)
                  .map((node) => {
                    const pos = toScreenPosition(node.x, node.y);
                    return `${pos.x},${pos.y}`;
                  }).join(' ')}
                fill="none"
                stroke="#333333"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
          );
        })}

        {/* Draw blocked routes with improved visibility */}
        {system?.bloqueos?.map((bloqueo, index) => {
          let isActive = false;
          if (currentTime) {
            isActive = currentTime >= new Date(bloqueo.fechaHoraInicio) &&
              currentTime <= new Date(bloqueo.fechaHoraFin);
          }
          if (!isActive) return null;

          return bloqueo.rutasBloqueadas.map((node, nodeIndex) => {
            if (nodeIndex === bloqueo.rutasBloqueadas.length - 1) return null;
            
            const nextNode = bloqueo.rutasBloqueadas[nodeIndex + 1];
            const pos1 = toScreenPosition(node.x, node.y);
            const pos2 = toScreenPosition(nextNode.x, nextNode.y);
            const isSelected = selectedItem?.type === 'bloqueo' && selectedItem.id === index;
            
            return (
              <svg key={`block-${index}-${nodeIndex}`} className={`blocked-route ${isSelected ? 'selected' : ''}`}>
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke={isSelected ? "#FF6B6B" : "#FF0000"}
                  strokeWidth={isSelected ? "3" : "2"}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => handleMarkerClick(e, { type: 'bloqueo', id: index, data: bloqueo })}
                />
              </svg>
            );
          });
        })}

        {/* Draw trucks with direction arrows */}
        {Array.from(truckPositions.entries()).map(([truckId, position]) => {
          const truck = system?.flota?.find(t => t.truckId === truckId);
          if (!truck) return null;

          const currentFuel = Number(truckFuels.get(truckId) || 0);
          const currentGLP = Number(truckGLPs.get(truckId) || 0);
          const pos = toScreenPosition(position.x, position.y);
          const direction = truckDirections.get(truckId) || 'up';
          
          // Calcular el filtro de color basado en la capacidad de GLP
          const maxGLP = truck.tipoCamion?.cargaGLPMax || 0;
          const colorFilter = getTruckColorFilter(currentGLP, maxGLP);
          
          const currentDest = currentDestinations.get(truckId);
          if (currentDest) {
            checkAndUpdateOrderState(truck, currentDest);
          }

          // Preparar datos para el tooltip
          const tooltipData = {
            codigo: truck.codigo,
            ubicacion: { x: position.x.toFixed(1), y: position.y.toFixed(1) },
            placa: truck.plate || 'N/A',
            tipo: truck.tipoCamion?.id || 'N/A',
            combustibleActual: currentFuel.toFixed(2),
            combustibleMax: truck.tipoCamion?.capCombustibleMax?.toFixed(2) || 'N/A',
            combustibleConsumido: Number(truck.fuelConsumed || 0).toFixed(2),
            glpActual: currentGLP.toFixed(2),
            glpMax: truck.tipoCamion?.cargaGLPMax?.toFixed(2) || 'N/A',
            velocidad: truck.tipoCamion?.velocidadPromedio?.toFixed(2) || 'N/A',
            estadoActual: currentDest ? getDestinationTypeLabel(currentDest.destinationType) : null
          };

          return (
            <CustomTooltip
              key={`truck-${truckId}`}
              content={tooltipData}
              type="truck"
            >
              <div
                className={`truck-marker ${selectedItem?.type === 'truck' && selectedItem.id === truckId ? 'selected' : ''} direction-${direction}`}
                style={{
                  left: pos.x - 12,
                  top: pos.y - 12
                }}
                onClick={(e) => handleMarkerClick(e, { type: 'truck', id: truckId })}
                onContextMenu={(e) => handleTruckRightClick(e, truckId)}
              >
                <img 
                  src={getTruckIcon(truckId)} 
                  alt="Truck" 
                  className="marker-icon" 
                  style={{ filter: colorFilter }}
                />
                <div className={`direction-arrow direction-${direction}`}></div>
                <span className="marker-label">T{truckId}</span>
              </div>
            </CustomTooltip>
          );
        })}

        {/* Draw cisternas */}
        {system?.cisternas?.map((cisterna, index) => {
          const pos = toScreenPosition(cisterna.ubicacion.x, cisterna.ubicacion.y);
          const currentGLP = cisternaGLPs.get(cisterna.id) ?? cisterna.cargaGLPActual;
          const porcentajeGLP = ((currentGLP / cisterna.capacidadTotal) * 100).toFixed(1);
          
          // Preparar datos para el tooltip
          const tooltipData = {
            tipo: cisterna.principal ? 'Cisterna Principal' : 'Cisterna Secundaria',
            ubicacion: { x: cisterna.ubicacion.x, y: cisterna.ubicacion.y },
            glpActual: currentGLP.toFixed(2),
            capacidadTotal: cisterna.capacidadTotal.toFixed(2),
            porcentaje: porcentajeGLP,
            horaAbastecimiento: cisterna.horaAbastecimento,
            operaciones: cisterna.operacionesGLPCisterna?.slice(-3).map(op => ({
              fecha: new Date(op.fechaHoraOperacion).toLocaleString(),
              cantidad: op.cantSalidaGLP.toFixed(2),
              camion: op.camionId || op.placaCamion
            })) || []
          };

          return (
            <CustomTooltip
              key={`cisterna-${index}`}
              content={tooltipData}
              type="cisterna"
            >
              <div
                className={`cisterna-marker ${cisterna.principal ? 'principal' : 'secundaria'} ${selectedItem?.type === 'cisterna' && selectedItem.id === index ? 'selected' : ''}`}
                style={{
                  left: pos.x - 12,
                  top: pos.y - 12
                }}
                onClick={(e) => handleMarkerClick(e, { type: 'cisterna', id: index })}
              >
                <img src={cisternaIcon} alt="Cisterna" className="marker-icon" />
                <span className="marker-label">C{index + 1}</span>
              </div>
            </CustomTooltip>
          );
        })}

        {/* Draw pedidos */}
        {system?.pedidos
          ?.filter((pedido) => {
            const estado = pedidosEstados[pedido.id] ?? pedido.estado;
            return estado !== 'ENTREGADO';
          })
          ?.map((pedido, index) => {
            const pos = toScreenPosition(pedido.ubicacion.x, pedido.ubicacion.y);
            const estado = pedidosEstados[pedido.id] ?? pedido.estado;
            const fechaRegistro = new Date(pedido.fechaHoraRegistro);
            const fechaMaxEntrega = new Date(pedido.fechaHoraMaxEntrega);
            
            // Preparar datos para el tooltip
            const tooltipData = {
              numeroPedido: pedido.numeroPedido,
              ubicacion: { x: pedido.ubicacion.x, y: pedido.ubicacion.y },
              volumenGLP: pedido.volumenGLP.toFixed(2),
              fechaRegistro: fechaRegistro.toLocaleDateString() + ' ' + fechaRegistro.toLocaleTimeString(),
              fechaMaxEntrega: fechaMaxEntrega.toLocaleDateString() + ' ' + fechaMaxEntrega.toLocaleTimeString(),
              estado: estado,
              combustibleTotal: pedido.consumoCombustibleTotal?.toFixed(2) || 'N/A'
            };

            return (
              <CustomTooltip
                key={`pedido-${pedido.id}`}
                content={tooltipData}
                type="pedido"
              >
                <div
                  className={`pedido-marker ${selectedItem?.type === 'pedido' && selectedItem.id === pedido.id ? 'selected' : ''}`}
                  style={{
                    left: pos.x - 12,
                    top: pos.y - 12
                  }}
                  onClick={(e) => handleMarkerClick(e, { type: 'pedido', id: pedido.id })}
                >
                  <img 
                    src={pedidoIcon} 
                    alt="Pedido" 
                    className="marker-icon" 
                    style={{ 
                      filter: 'brightness(0) saturate(100%) invert(25%) sepia(45%) saturate(2000%) hue-rotate(210deg) brightness(90%) contrast(110%)'
                    }}
                  />
                  <span className="marker-label">P{pedido.id}</span>
                </div>
              </CustomTooltip>
            );
          })}

        {/* Replanning overlay */}
        {isReplanning && (
          <div className="replanning-overlay">
            <div>Replanificando...</div>
            <div style={{ fontSize: '14px' }}>
              Última actualización: {lastSystemUpdate.toLocaleTimeString()}
            </div>
            <div style={{ fontSize: '14px' }}>
              Inicio de avería: {system?.averiaStartTime ? new Date(system.averiaStartTime).toLocaleString() : 'N/A'}
            </div>
          </div>
        )}
      </div>

      {/* Legend Toggle Button */}
      <button
        className="legend-toggle-btn"
        onClick={handleLegendToggle}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: '#f3f3f3',
          border: '1px solid #ddd',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#333',
          fontSize: '14px',
          width: '44px',
          height: '44px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          outline: 'none',
          padding: '8px',
          gap: '2px'
        }}
        title="Mostrar/Ocultar leyenda"
        onMouseEnter={(e) => {
          e.target.style.background = '#e0e0e0';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = '#f3f3f3';
          e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        }}
      >
        <div style={{ width: '20px', height: '2px', backgroundColor: '#333', borderRadius: '1px' }}></div>
        <div style={{ width: '20px', height: '2px', backgroundColor: '#333', borderRadius: '1px' }}></div>
        <div style={{ width: '20px', height: '2px', backgroundColor: '#333', borderRadius: '1px' }}></div>
      </button>

      {/* Floating Legend */}
      {legendVisible && (
        <div 
          className="floating-legend"
          style={{
            position: 'absolute',
            bottom: 80,
            left: 20,
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid #ddd',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            minWidth: '200px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#333', fontWeight: '600' }}>Leyenda</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={truckIconUp} alt="Camión" style={{ width: '16px', height: '16px' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#333' }}>Camión</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={cisternaIcon} alt="Cisterna" style={{ width: '16px', height: '16px' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#333' }}>Cisterna</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img 
                  src={pedidoIcon} 
                  alt="Pedido" 
                  style={{ 
                    width: '16px', 
                    height: '16px',
                    filter: 'brightness(0) saturate(100%) invert(25%) sepia(45%) saturate(2000%) hue-rotate(210deg) brightness(90%) contrast(110%)'
                  }} 
                />
              </div>
              <span style={{ fontSize: '12px', color: '#333' }}>Pedido</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ 
                  width: '16px', 
                  height: '2px', 
                  background: '#333333', 
                  borderRadius: '1px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: 'inherit',
                    animation: 'dashMove 2s linear infinite',
                    backgroundImage: 'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.3) 50%)',
                    backgroundSize: '8px 100%'
                  }}></div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#333' }}>Ruta</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ 
                  width: '16px', 
                  height: '3px', 
                  backgroundColor: '#FF0000', 
                  borderRadius: '1px',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#FF0000',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '6px',
                    fontWeight: 'bold'
                  }}>✕</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#333' }}>Bloqueo</span>
            </div>
            
            {/* Separador para colores de GLP */}
            <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #ddd' }} />
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '4px', color: '#666' }}>
              Nivel de GLP en Camiones:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={truckIconUp} alt="Camión Verde" style={{ width: '16px', height: '16px', filter: 'brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%) hue-rotate(120deg)' }} />
              </div>
              <span style={{ fontSize: '11px', color: '#333' }}>Alto (70-100%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={truckIconUp} alt="Camión Amarillo" style={{ width: '16px', height: '16px', filter: 'brightness(0) saturate(100%) invert(85%) sepia(100%) saturate(1000%) hue-rotate(0deg) brightness(100%) contrast(100%)' }} />
              </div>
              <span style={{ fontSize: '11px', color: '#333' }}>Medio (30-69%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={truckIconUp} alt="Camión Rojo" style={{ width: '16px', height: '16px', filter: 'brightness(0) saturate(100%) invert(17%) sepia(95%) saturate(7498%) hue-rotate(356deg) brightness(100%) contrast(118%)' }} />
              </div>
              <span style={{ fontSize: '11px', color: '#333' }}>Bajo (0-29%)</span>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Registrar Avería</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => handleAveriaOption(1)} 
              className="tipo-averia"
            >
              Tipo 1
            </button>
            <button 
              onClick={() => handleAveriaOption(2)} 
              className="tipo-averia"
            >
              Tipo 2
            </button>
            <button 
              onClick={() => handleAveriaOption(3)} 
              className="tipo-averia"
            >
              Tipo 3
            </button>
          </div>
        </div>
      )}

      {/* Overlap Selection Menu */}
      {showOverlapMenu && (
        <div 
          className="overlap-menu"
          style={{
            top: showOverlapMenu.y,
            left: showOverlapMenu.x
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Seleccionar elemento</div>
          <div className="overlap-items">
            {overlappingItems.map((item, index) => (
              <div 
                key={`overlap-${index}`}
                className="overlap-item"
                onClick={() => {
                  // Use external onItemSelect if available, otherwise use internal state
                  if (onItemSelect) {
                    onItemSelect(item);
                  } else {
                    setInternalSelectedItem(item);
                  }
                  setShowOverlapMenu(false);
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

MapVisualization.propTypes = {
  currentTime: PropTypes.instanceOf(Date),
  onPauseSimulation: PropTypes.func.isRequired,
  onItemSelect: PropTypes.func,
  selectedItem: PropTypes.shape({
    type: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
  }),
};

export default MapVisualization; 