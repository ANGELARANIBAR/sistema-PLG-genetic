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
  const [truckStates, setTruckStates] = useState(new Map());
  const [overlappingItems, setOverlappingItems] = useState([]);
  const [showOverlapMenu, setShowOverlapMenu] = useState(false);
  const [truckDirections, setTruckDirections] = useState(new Map());
  const [pedidoEstado, setPedidoEstado] = useState(null);
  const [pedidoEstadoLoading, setPedidoEstadoLoading] = useState(false);
  const [pedidosEstados, setPedidosEstados] = useState({});
  const [planificationPercentage, setPlanificationPercentage] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);
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
      if (!currentTime || !system) return;

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

  // Update truck states
  useEffect(() => {
    const updateTruckStates = async () => {
      if (!currentTime || !system) return;

      const newStates = new Map();
      for (const truck of system.flota) {
        try {
          const state = await mapService.fetchTruckState(truck.truckId, currentTime);
          if (state) {
            newStates.set(truck.truckId, state);
          }
        } catch (error) {
          console.error(`Error updating truck ${truck.truckId} state:`, error);
        }
      }
      setTruckStates(newStates);
    };

    updateTruckStates();
  }, [currentTime, system]);

  // Update cisterna GLP
  useEffect(() => {
    const updateCisternaGLPs = async () => {
      if (!currentTime || !system) return;

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
      setShowTooltip(null);
      setShowLegend(false);
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
      const containerWidth = mapContainerRef.current.clientWidth - 20; // Just padding
      const containerHeight = mapContainerRef.current.clientHeight - 20; // Just padding
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
        const truck = system.flota.find(t => t.truckId === truckId);
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
      // Show tooltip instead of selecting
      setShowTooltip({
        item,
        x: e.clientX,
        y: e.clientY
      });
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

  return (
    <div className="map-container" ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div className="map-visualization" style={{ width: containerWidth, height: containerHeight }}>
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
        {system.flota.map((truck, index) => {
          const currentDest = currentDestinations.get(truck.truckId);
          if (!currentDest || !currentDest.route) return null;

          const color = `hsl(${(index * 360) / system.flota.length}, 70%, 50%)`;
          return (
            <svg key={`route-${truck.truckId}`} className="route-line">
              <polyline
                points={currentDest.route.map((node) => {
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
        {system.bloqueos.map((bloqueo, index) => {
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
          const truck = system.flota.find(t => t.truckId === truckId);
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
              className={`truck-marker direction-${direction}`}
              style={{
                left: pos.x - 12,
                top: pos.y - 12
              }}
              onClick={(e) => handleMarkerClick(e, { type: 'truck', id: truckId })}
              onContextMenu={(e) => handleTruckRightClick(e, truckId)}
            >
              <img src={getTruckIcon(truckId)} alt="Truck" className="marker-icon" />
              <div className={`direction-arrow direction-${direction}`}></div>
              <span className="marker-label">T{truckId}</span>
            </div>
          );
        })}

        {/* Draw cisternas */}
        {system.cisternas.map((cisterna, index) => {
          const pos = toScreenPosition(cisterna.ubicacion.x, cisterna.ubicacion.y);
          const currentGLP = cisternaGLPs.get(cisterna.id) ?? cisterna.cargaGLPActual;
          return (
            <div
              key={`cisterna-${index}`}
              className={`cisterna-marker ${cisterna.principal ? 'principal' : 'secundaria'}`}
              style={{
                left: pos.x - 12,
                top: pos.y - 12
              }}
              onClick={(e) => handleMarkerClick(e, { type: 'cisterna', id: index })}
            >
              <img src={cisternaIcon} alt="Cisterna" className="marker-icon" />
              <span className="marker-label">C{index + 1}</span>
            </div>
          );
        })}

        {/* Draw pedidos */}
        {system.pedidos
          .filter((pedido) => {
            const estado = pedidosEstados[pedido.id] ?? pedido.estado;
            return estado !== 'ENTREGADO';
          })
          .map((pedido, index) => {
            const pos = toScreenPosition(pedido.ubicacion.x, pedido.ubicacion.y);
            return (
              <div
                key={`pedido-${pedido.id}`}
                className="pedido-marker"
                style={{
                  left: pos.x - 12,
                  top: pos.y - 12
                }}
                onClick={(e) => handleMarkerClick(e, { type: 'pedido', id: pedido.id })}
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

      {/* Legend Toggle Button */}
      <button
        className="legend-toggle"
        onClick={(e) => {
          e.stopPropagation();
          setShowLegend(!showLegend);
        }}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          width: '50px',
          height: '50px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ width: '20px', height: '2px', backgroundColor: 'white' }}></div>
          <div style={{ width: '20px', height: '2px', backgroundColor: 'white' }}></div>
          <div style={{ width: '20px', height: '2px', backgroundColor: 'white' }}></div>
        </div>
        <span style={{ fontSize: '8px', marginTop: '2px' }}>LEYENDA</span>
      </button>

      {/* Legend Panel */}
      {showLegend && (
        <div
          className="legend-panel"
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '20px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '15px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            minWidth: '200px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>Leyenda</h4>
          <div className="legend-content">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <img src={truckIconUp} alt="Camión" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              <span style={{ fontSize: '12px' }}>Camión</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <img src={cisternaIcon} alt="Cisterna" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              <span style={{ fontSize: '12px' }}>Cisterna</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <img src={pedidoIcon} alt="Pedido" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
              <span style={{ fontSize: '12px' }}>Pedido</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ 
                width: '20px', 
                height: '2px', 
                backgroundColor: '#666', 
                marginRight: '8px',
                borderRadius: '1px'
              }}></div>
              <span style={{ fontSize: '12px' }}>Ruta</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ 
                width: '20px', 
                height: '2px', 
                backgroundColor: '#FF0000', 
                marginRight: '8px',
                borderRadius: '1px'
              }}></div>
              <span style={{ fontSize: '12px' }}>Bloqueo</span>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (() => {
        // Calculate tooltip position to keep it visible
        const tooltipWidth = 300;
        const tooltipHeight = 200; // Estimated height
        const padding = 10;
        
        let tooltipX = showTooltip.x + padding;
        let tooltipY = showTooltip.y + padding;
        
        // Check right boundary
        if (tooltipX + tooltipWidth > window.innerWidth) {
          tooltipX = showTooltip.x - tooltipWidth - padding;
        }
        
        // Check bottom boundary
        if (tooltipY + tooltipHeight > window.innerHeight) {
          tooltipY = showTooltip.y - tooltipHeight - padding;
        }
        
        // Ensure tooltip doesn't go off the left edge
        if (tooltipX < padding) {
          tooltipX = padding;
        }
        
        // Ensure tooltip doesn't go off the top edge
        if (tooltipY < padding) {
          tooltipY = padding;
        }
        
        return (
          <div
            className="tooltip-panel"
            style={{
              position: 'fixed',
              top: tooltipY,
              left: tooltipX,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '12px',
              zIndex: 2000,
              maxWidth: '300px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showTooltip.item.type === 'truck' && (() => {
            const truck = system?.flota.find(t => t.truckId === showTooltip.item.id);
            const currentFuel = Number(truckFuels.get(showTooltip.item.id) || 0);
            const currentGLP = Number(truckGLPs.get(showTooltip.item.id) || 0);
            const currentDest = currentDestinations.get(showTooltip.item.id);
            return (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Camión {truck?.codigo}</div>
                <div><strong>Placa:</strong> {truck?.plate}</div>
                <div><strong>Combustible:</strong> {currentFuel.toFixed(2)}</div>
                <div><strong>GLP:</strong> {currentGLP.toFixed(2)}</div>
                <div><strong>Estado:</strong> {truckStates.get(showTooltip.item.id) || 'N/A'}</div>
                {currentDest && <div><strong>En:</strong> {currentDest.destinationType}</div>}
                <div style={{ marginTop: '8px', fontSize: '10px', color: '#ccc' }}>
                  Clic derecho para registrar avería
                </div>
              </div>
            );
          })()}
          
          {showTooltip.item.type === 'cisterna' && (() => {
            const cisterna = system?.cisternas[showTooltip.item.id];
            const currentGLP = cisternaGLPs.get(cisterna?.id) ?? cisterna?.cargaGLPActual;
            return (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Cisterna {cisterna?.principal ? 'Principal' : 'Secundaria'}
                </div>
                <div><strong>GLP Actual:</strong> {currentGLP?.toFixed(2)}</div>
                <div><strong>Capacidad:</strong> {cisterna?.capacidadTotal?.toFixed(2)}</div>
                <div><strong>Hora Abastecimiento:</strong> {cisterna?.horaAbastecimento}</div>
              </div>
            );
          })()}
          
          {showTooltip.item.type === 'pedido' && (() => {
            const pedido = system?.pedidos.find(p => p.id === showTooltip.item.id);
            const estado = pedidosEstados[showTooltip.item.id] ?? pedido?.estado;
            return (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Pedido {pedido?.numeroPedido}</div>
                <div><strong>Volumen GLP:</strong> {pedido?.volumenGLP?.toFixed(2)}</div>
                <div><strong>Estado:</strong> {estado}</div>
                <div><strong>Registro:</strong> {new Date(pedido?.fechaHoraRegistro || '').toLocaleString()}</div>
                <div><strong>Entrega Máxima:</strong> {new Date(pedido?.fechaHoraMaxEntrega || '').toLocaleString()}</div>
                <div><strong>Ubicación:</strong> ({pedido?.ubicacion.x}, {pedido?.ubicacion.y})</div>
              </div>
            );
          })()}
        </div>
        );
      })()}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 2000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '12px' }}>Registrar Avería</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button 
              onClick={() => handleAveriaOption(1)} 
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#000000'
              }}
            >
              Tipo 1
            </button>
            <button 
              onClick={() => handleAveriaOption(2)} 
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#000000'
              }}
            >
              Tipo 2
            </button>
            <button 
              onClick={() => handleAveriaOption(3)} 
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                fontSize: '12px',
                color: '#000000'
              }}
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
            position: 'fixed',
            top: showOverlapMenu.y,
            left: showOverlapMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '6px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 2000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '12px' }}>Seleccionar elemento</div>
          <div className="overlap-items">
            {overlappingItems.map((item, index) => (
              <div 
                key={`overlap-${index}`}
                style={{
                  padding: '4px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '12px',
                  marginBottom: '2px'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={() => {
                  setShowTooltip({
                    item,
                    x: showOverlapMenu.x,
                    y: showOverlapMenu.y
                  });
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