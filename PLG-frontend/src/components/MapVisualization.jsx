import React, { useEffect, useState, useCallback, useRef } from 'react';
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

const MapVisualization = ({ currentTime, onPauseSimulation }) => {
  const [system, setSystem] = useState(null);
  const [truckPositions, setTruckPositions] = useState(new Map());
  const [truckFuels, setTruckFuels] = useState(new Map());
  const [truckGLPs, setTruckGLPs] = useState(new Map());
  const [cisternaGLPs, setCisternaGLPs] = useState(new Map());
  const [isReplanning, setIsReplanning] = useState(false);
  const [averiaStartTime, setAveriaStartTime] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
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
  const [activeTruckTab, setActiveTruckTab] = useState('info');
  const mapContainerRef = useRef(null);

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
        setSelectedItem(null);
      }
    }
  }, [pedidosEstados, selectedItem]);

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

  if (!system || !startTime) {
    return (
      <div className="loading-message">
        <div>Cargando simulación...</div>
        {planificationPercentage !== null && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Progreso de planificación: {planificationPercentage.toFixed(1)}%
          </div>
        )}
      </div>
    );
  }

  // Calculate scale factors to fit the map in the viewport
  const getContainerDimensions = () => {
    if (mapContainerRef.current) {
      const containerWidth = mapContainerRef.current.clientWidth - 300; // Subtract sidebar width
      const containerHeight = mapContainerRef.current.clientHeight - 20; // Subtract padding
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
      setSelectedItem(item);
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
      'EN_MANTENIMIENTO': 'En Mantenimiento'
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
      <div className="map-visualization" style={{ width: containerWidth }}>
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

          const color = `hsl(${(index * 360) / (system.flota?.length || 1)}, 70%, 50%)`;
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
                stroke={color}
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
            
            return (
              <svg key={`block-${index}-${nodeIndex}`} className="blocked-route">
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="#FF0000"
                  strokeWidth="8"
                  strokeDasharray="10,10"
                  className="pulsing-line"
                />
                {/* Añadir un símbolo de bloqueo en el medio */}
                <circle
                  cx={(pos1.x + pos2.x) / 2}
                  cy={(pos1.y + pos2.y) / 2}
                  r="8"
                  fill="#FF0000"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <line
                  x1={(pos1.x + pos2.x) / 2 - 5}
                  y1={(pos1.y + pos2.y) / 2 - 5}
                  x2={(pos1.x + pos2.x) / 2 + 5}
                  y2={(pos1.y + pos2.y) / 2 + 5}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <line
                  x1={(pos1.x + pos2.x) / 2 - 5}
                  y1={(pos1.y + pos2.y) / 2 + 5}
                  x2={(pos1.x + pos2.x) / 2 + 5}
                  y2={(pos1.y + pos2.y) / 2 - 5}
                  stroke="#FFFFFF"
                  strokeWidth="2"
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
          
          const currentDest = currentDestinations.get(truckId);
          if (currentDest) {
            checkAndUpdateOrderState(truck, currentDest);
          }

          return (
            <div
              key={`truck-${truckId}`}
              className={`truck-marker ${selectedItem?.type === 'truck' && selectedItem.id === truckId ? 'selected' : ''} direction-${direction}`}
              style={{
                left: pos.x - 12,
                top: pos.y - 12
              }}
              onClick={(e) => handleMarkerClick(e, { type: 'truck', id: truckId })}
              onContextMenu={(e) => handleTruckRightClick(e, truckId)}
              title={`Camión ${truck.codigo}
Combustible: ${currentFuel.toFixed(2)}
GLP: ${currentGLP.toFixed(2)}
Combustible final: ${Number(truck.fuelConsumed || 0).toFixed(2)}
${currentDest ? `\nEn: ${currentDest.destinationType}` : ''}`}
            >
              <img src={getTruckIcon(truckId)} alt="Truck" className="marker-icon" />
              <div className={`direction-arrow direction-${direction}`}></div>
              <span className="marker-label">T{truckId}</span>
            </div>
          );
        })}

        {/* Draw cisternas */}
        {system?.cisternas?.map((cisterna, index) => {
          const pos = toScreenPosition(cisterna.ubicacion.x, cisterna.ubicacion.y);
          const currentGLP = cisternaGLPs.get(cisterna.id) ?? cisterna.cargaGLPActual;
          return (
            <div
              key={`cisterna-${index}`}
              className={`cisterna-marker ${cisterna.principal ? 'principal' : 'secundaria'} ${selectedItem?.type === 'cisterna' && selectedItem.id === index ? 'selected' : ''}`}
              style={{
                left: pos.x - 12,
                top: pos.y - 12
              }}
              onClick={(e) => handleMarkerClick(e, { type: 'cisterna', id: index })}
              title={`${cisterna.principal ? 'Principal' : 'Secundaria'} Cisterna
GLP Actual: ${currentGLP.toFixed(2)} / ${cisterna.capacidadTotal.toFixed(2)}
Hora Abastecimiento: ${cisterna.horaAbastecimento}
${cisterna.operacionesGLPCisterna?.length ? `
Últimas operaciones:
${cisterna.operacionesGLPCisterna.slice(-3).map(op => 
`- ${new Date(op.fechaHoraOperacion).toLocaleString()}: ${op.cantSalidaGLP.toFixed(2)} GLP (Camión ${op.placaCamion})`
).join('\n')}` : ''}`}
            >
              <img src={cisternaIcon} alt="Cisterna" className="marker-icon" />
              <span className="marker-label">C{index + 1}</span>
            </div>
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
            return (
              <div
                key={`pedido-${pedido.id}`}
                className={`pedido-marker ${selectedItem?.type === 'pedido' && selectedItem.id === pedido.id ? 'selected' : ''}`}
                style={{
                  left: pos.x - 12,
                  top: pos.y - 12
                }}
                onClick={(e) => handleMarkerClick(e, { type: 'pedido', id: pedido.id })}
                title={`Pedido ${pedido.numeroPedido} - GLP: ${pedido.volumenGLP.toFixed(2)}`}
              >
                <img src={pedidoIcon} alt="Pedido" className="marker-icon" />
                <span className="marker-label">P{pedido.id}</span>
              </div>
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

      {/* Sidebar */}
      <div className="map-sidebar">
        {selectedItem ? (
          selectedItem.type === 'truck' ? (
            <div className="info-section">
              <h3>Información de Camión</h3>
              
              {/* Truck Tabs */}
              <div className="truck-tabs">
                <button 
                  className={`truck-tab-button ${activeTruckTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTruckTab('info')}
                >
                  Detalle
                </button>
                <button 
                  className={`truck-tab-button ${activeTruckTab === 'destinations' ? 'active' : ''}`}
                  onClick={() => setActiveTruckTab('destinations')}
                >
                  Destinos
                </button>
              </div>

              <div className="truck-tab-content">
                {activeTruckTab === 'info' && (
                  <div className="info-content">
                    <div className="info-item">
                      <strong>Código:</strong> <span>{system?.flota.find(t => t.truckId === selectedItem.id)?.codigo}</span>
                    </div>
                    <div className="info-item">
                      <strong>Placa:</strong> <span>{system?.flota.find(t => t.truckId === selectedItem.id)?.plate}</span>
                    </div>
                    <div className="info-item">
                      <strong>Tipo:</strong> <span>{system?.flota.find(t => t.truckId === selectedItem.id)?.tipoCamion?.id || 'N/A'}</span>
                    </div>
                    
                    <div className="info-item">
                      <strong>Combustible actual:</strong> <span>{Number(truckFuels.get(selectedItem.id) || 0).toFixed(2)}</span>
                    </div>
                    <div className="info-item">
                      <strong>GLP actual:</strong> <span>{Number(truckGLPs.get(selectedItem.id) || 0).toFixed(2)}L</span>
                    </div>
                    <div className="info-item">
                      <strong>Capacidad GLP:</strong> <span>{system?.flota.find(t => t.truckId === selectedItem.id)?.tipoCamion?.cargaGLPMax?.toFixed(2) || 'N/A'}L</span>
                    </div>
                    <div className="info-item">
                      <strong>Capacidad Combustible:</strong> <span>{system?.flota.find(t => t.truckId === selectedItem.id)?.tipoCamion?.capCombustibleMax?.toFixed(2) || 'N/A'}L</span>
                    </div>
                    <div className="info-item">
                      <strong>Velocidad Promedio:</strong> <span>{system?.flota.find(t => t.truckId === selectedItem.id)?.tipoCamion?.velocidadPromedio?.toFixed(2) || 'N/A'} nodes/min</span>
                    </div>
                    <div className="info-item">
                      <strong>Combustible consumido:</strong> <span>{Number(system?.flota.find(t => t.truckId === selectedItem.id)?.fuelConsumed || 0).toFixed(2)}L</span>
                    </div>
                    
                    {/* Averia Buttons */}
                    <div className="averia-section">
                      <h4>Registrar avería</h4>
                      <div className="averia-buttons">
                        <button 
                          onClick={() => handleAveriaOption(1)} 
                          className="averia-button tipo-1"
                        >
                          Tipo 1
                        </button>
                        <button 
                          onClick={() => handleAveriaOption(2)} 
                          className="averia-button tipo-2"
                        >
                          Tipo 2
                        </button>
                        <button 
                          onClick={() => handleAveriaOption(3)} 
                          className="averia-button tipo-3"
                        >
                          Tipo 3
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTruckTab === 'destinations' && (
                  <div className="destinations-content">
                    {(() => {
                      const truck = system?.flota?.find(t => t.truckId === selectedItem.id);
                      const destinations = truck?.destinations || [];
                      const currentDest = currentDestinations.get(selectedItem.id);
                      
                      return destinations.length > 0 ? (
                        <div className="destinations-list">
                          {destinations.map((dest, index) => {
                            // Check if this destination matches the current destination
                            const isCurrentDestination = currentDest && 
                              dest.destinationType === currentDest.destinationType &&
                              dest.arrivalTime === currentDest.arrivalTime &&
                              dest.departureTime === currentDest.departureTime;
                            
                            return (
                              <div 
                                key={index} 
                                className={`destination-item ${isCurrentDestination ? 'current-destination' : ''}`}
                                style={{
                                  border: isCurrentDestination ? '2px solid #2196F3' : '1px solid #ddd',
                                  backgroundColor: isCurrentDestination ? '#e3f2fd' : '#fafafa',
                                  boxShadow: isCurrentDestination ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none'
                                }}
                              >
                                <div className="destination-header">
                                  <span className="destination-type">
                                    {getDestinationTypeLabel(dest.destinationType)}
                                    {isCurrentDestination && (
                                      <span style={{ 
                                        marginLeft: '8px', 
                                        color: '#2196F3', 
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                      }}>
                                        (ACTUAL)
                                      </span>
                                    )}
                                  </span>
                                  <span className="destination-status" style={{ color: getStatusColor(dest.status) }}>
                                    {dest.status}
                                  </span>
                                </div>
                                <div className="destination-details">
                                  <div className="detail-row">
                                    <label>Ubicación:</label>
                                    <span>({dest.route[dest.route.length-1]?.x || 'N/A'}, {dest.route[dest.route.length-1]?.y || 'N/A'})</span>
                                  </div>
                                  <div className="detail-row">
                                    <label>Llegada:</label>
                                    <span>{formatDateTime(dest.arrivalTime)}</span>
                                  </div>
                                  <div className="detail-row">
                                    <label>Salida:</label>
                                    <span>{formatDateTime(dest.departureTime)}</span>
                                  </div>
                                  {dest.operacionGLP !== undefined && (
                                    <div className="detail-row">
                                      <label>Operación GLP:</label>
                                      <span>{dest.operacionGLP.toFixed(2)}L</span>
                                    </div>
                                  )}
                                  {dest.saldoGLPCamion !== undefined && (
                                    <div className="detail-row">
                                      <label>Saldo GLP:</label>
                                      <span>{dest.saldoGLPCamion.toFixed(2)}L</span>
                                    </div>
                                  )}
                                  {dest.orderId && (
                                    <div className="detail-row">
                                      <label>ID Pedido:</label>
                                      <span>{dest.orderId}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="no-destinations">No se encontraron destinos para este camión.</div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          ) : selectedItem.type === 'cisterna' ? (
            <div className="info-section">
              <h3>Información de Cisterna</h3>
              {system?.cisternas?.[selectedItem.id] && (
                <div className="info-content">
                  <div className="info-item">
                    <strong>Tipo:</strong> <span>{system.cisternas[selectedItem.id].principal ? 'Principal' : 'Secundaria'}</span>
                  </div>
                  <div className="info-item">
                    <strong>GLP Actual:</strong> <span>{(cisternaGLPs.get(system.cisternas[selectedItem.id].id) ?? system.cisternas[selectedItem.id].cargaGLPActual).toFixed(2)}</span>
                  </div>
                  <div className="info-item">
                    <strong>Capacidad Total:</strong> <span>{system.cisternas[selectedItem.id].capacidadTotal.toFixed(2)}</span>
                  </div>
                  <div className="info-item">
                    <strong>Hora de Abastecimiento:</strong> <span>{system.cisternas[selectedItem.id].horaAbastecimento}</span>
                  </div>
                  {system.cisternas[selectedItem.id].operacionesGLPCisterna?.length > 0 && (
                    <div className="operaciones-section">
                      <strong>Últimas Operaciones:</strong>
                      <div className="operaciones-list">
                        {system.cisternas[selectedItem.id].operacionesGLPCisterna.slice(-3).map((op, idx) => (
                          <div key={idx} className="operacion-item">
                            {new Date(op.fechaHoraOperacion).toLocaleString()}: {op.cantSalidaGLP.toFixed(2)} GLP (Camión {op.placaCamion})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : selectedItem.type === 'pedido' ? (
            <div className="info-section">
              <h3>Información de Pedido</h3>
              {system?.pedidos?.find(p => p.id === selectedItem.id) && (
                <div className="info-content">
                  <div className="info-item">
                    <strong>Código de Pedido:</strong> <span>{system.pedidos.find(p => p.id === selectedItem.id)?.numeroPedido}</span>
                  </div>
                  <div className="info-item">
                    <strong>Volumen GLP:</strong> <span>{system.pedidos.find(p => p.id === selectedItem.id)?.volumenGLP.toFixed(2)}</span>
                  </div>
                  <div className="info-item">
                    <strong>Hora Registro:</strong> <span>{new Date(system.pedidos.find(p => p.id === selectedItem.id)?.fechaHoraRegistro || '').toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <strong>Entrega Máxima:</strong> <span>{new Date(system.pedidos.find(p => p.id === selectedItem.id)?.fechaHoraMaxEntrega || '').toLocaleString()}</span>
                  </div>
                  <div className="info-item">
                    <strong>Estado:</strong> <span>{pedidoEstadoLoading ? 'Cargando...' : (pedidoEstado ?? system.pedidos.find(p => p.id === selectedItem.id)?.estado)}</span>
                  </div>
                  <div className="info-item">
                    <strong>Ubicación:</strong> <span>({system.pedidos.find(p => p.id === selectedItem.id)?.ubicacion.x}, {system.pedidos.find(p => p.id === selectedItem.id)?.ubicacion.y})</span>
                  </div>
                  <div className="info-item">
                    <strong>Combustible total:</strong> <span>{system.pedidos.find(p => p.id === selectedItem.id)?.consumoCombustibleTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : null
        ) : (
          <div className="info-section">
            <h3>Información del Sistema</h3>
            <div className="info-content">
              <div className="info-item">
                <strong>Flota:</strong> <span>{system?.flota?.length || 0} camiones</span>
              </div>
              <div className="info-item">
                <strong>Pedidos:</strong> <span>{system?.pedidos?.length || 0} pedidos</span>
              </div>
              <div className="info-item">
                <strong>Cisternas:</strong> <span>{system?.cisternas?.length || 0} cisternas</span>
              </div>
              {planificationPercentage !== null && (
                <div className="info-item">
                  <strong>Progreso:</strong> <span>{planificationPercentage.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leyenda fija en la columna de información */}
        <div className="sidebar-legend">
          <h4>Leyenda</h4>
          <div className="legend-content">
            <div className="legend-item">
              <div className="legend-icon truck-legend">
                <img src={truckIconUp} alt="Camión" className="legend-img" />
              </div>
              <span>Camión</span>
            </div>
            <div className="legend-item">
              <div className="legend-icon cisterna-legend">
                <img src={cisternaIcon} alt="Cisterna" className="legend-img" />
              </div>
              <span>Cisterna</span>
            </div>
            <div className="legend-item">
              <div className="legend-icon pedido-legend">
                <img src={pedidoIcon} alt="Pedido" className="legend-img" />
              </div>
              <span>Pedido</span>
            </div>
            <div className="legend-item">
              <div className="legend-line route-legend"></div>
              <span>Ruta</span>
            </div>
            <div className="legend-item">
              <div className="legend-block">
                <div className="legend-block-line"></div>
                <div className="legend-block-symbol">✕</div>
              </div>
              <span>Bloqueo</span>
            </div>
          </div>
        </div>
      </div>

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
                  setSelectedItem(item);
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

export default MapVisualization; 