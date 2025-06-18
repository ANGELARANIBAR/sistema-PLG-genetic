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
  const [showLegend, setShowLegend] = useState(true);
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

  if (!system || !startTime) {
    return <div className="loading-message">Loading...</div>;
  }

  // Calculate scale factors to fit the map in the viewport
  const getContainerDimensions = () => {
    if (mapContainerRef.current) {
      const containerWidth = mapContainerRef.current.clientWidth - 300; // Subtract sidebar width
      const containerHeight = mapContainerRef.current.clientHeight;
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
      onPauseSimulation();
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

  const toggleLegend = () => {
    setShowLegend(!showLegend);
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
        {system.cisternas.map((cisterna, index) => {
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
        {system.pedidos.map((pedido, index) => {
          const pos = toScreenPosition(pedido.ubicacion.x, pedido.ubicacion.y);
          return (
            <div
              key={`pedido-${index}`}
              className={`pedido-marker ${selectedItem?.type === 'pedido' && selectedItem.id === pedido.id ? 'selected' : ''}`}
              style={{
                left: pos.x - 12,
                top: pos.y - 12
              }}
              onClick={(e) => handleMarkerClick(e, { type: 'pedido', id: pedido.id })}
              title={`Pedido ${pedido.numeroPedido} - GLP: ${pedido.volumenGLP.toFixed(2)}`}
            >
              <img src={pedidoIcon} alt="Pedido" className="marker-icon" />
              <span className="marker-label">P{index + 1}</span>
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

        {/* Botón para mostrar/ocultar leyenda */}
        <div className="legend-toggle" onClick={toggleLegend}>
          {showLegend ? 'Ocultar leyenda' : 'Mostrar leyenda'}
        </div>

        {/* Leyenda ocultable */}
        {showLegend && (
          <div className="map-legend">
            <div className="legend-header">
              <h4>Leyenda</h4>
              <button className="close-legend" onClick={toggleLegend}>×</button>
            </div>
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
        )}
      </div>

      {/* Sidebar */}
      <div className="map-sidebar">
        {selectedItem ? (
          selectedItem.type === 'truck' ? (
            <div className="info-section">
              <h3>Información de Camión</h3>
              <div className="info-item">
                <strong>Código:</strong> {system?.flota.find(t => t.truckId === selectedItem.id)?.codigo}
              </div>
              <div className="info-item">
                <strong>Placa:</strong> {system?.flota.find(t => t.truckId === selectedItem.id)?.plate}
              </div>
              <div className="info-item">
                <strong>Combustible actual:</strong> {Number(truckFuels.get(selectedItem.id) || 0).toFixed(2)}
              </div>
              <div className="info-item">
                <strong>GLP actual:</strong> {Number(truckGLPs.get(selectedItem.id) || 0).toFixed(2)}
              </div>
              <div className="info-item">
                <strong>Combustible final:</strong> {Number(system?.flota.find(t => t.truckId === selectedItem.id)?.fuelConsumed || 0).toFixed(2)}
              </div>
              {system?.flota.find(t => t.truckId === selectedItem.id) && (
                <div className="info-item">
                  <strong>Estado camión:</strong> {truckStates.get(selectedItem.id) || 'N/A'}
                </div>
              )}
              <div className="averia-buttons">
                <h4 style={{ marginBottom: '10px' }}>Registrar avería</h4>
                <div className="button-container">
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
            </div>
          ) : selectedItem.type === 'cisterna' ? (
            <div className="info-section">
              <h3>Información de Cisterna</h3>
              {system?.cisternas[selectedItem.id] && (
                <div>
                  <div className="info-item">
                    <strong>Tipo:</strong> {system.cisternas[selectedItem.id].principal ? 'Principal' : 'Secundaria'}
                  </div>
                  <div className="info-item">
                    <strong>GLP Actual:</strong> {(cisternaGLPs.get(system.cisternas[selectedItem.id].id) ?? system.cisternas[selectedItem.id].cargaGLPActual).toFixed(2)}
                  </div>
                  <div className="info-item">
                    <strong>Capacidad Total:</strong> {system.cisternas[selectedItem.id].capacidadTotal.toFixed(2)}
                  </div>
                  <div className="info-item">
                    <strong>Hora de Abastecimiento:</strong> {system.cisternas[selectedItem.id].horaAbastecimento}
                  </div>
                  {system.cisternas[selectedItem.id].operacionesGLPCisterna?.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Últimas Operaciones:</strong>
                      <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                        {system.cisternas[selectedItem.id].operacionesGLPCisterna.slice(-3).map((op, idx) => (
                          <div key={idx} style={{ marginBottom: '3px' }}>
                            {new Date(op.fechaHoraOperacion).toLocaleString()}: {op.cantSalidaGLP.toFixed(2)} GLP (Camión {op.placaCamion})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="info-section">
              <h3>Información de Pedido</h3>
              {system?.pedidos.find(p => p.id === selectedItem.id) && (
                <div>
                  <div className="info-item">
                    <strong>Código de Pedido:</strong> {system.pedidos.find(p => p.id === selectedItem.id)?.numeroPedido}
                  </div>
                  <div className="info-item">
                    <strong>Volumen GLP:</strong> {system.pedidos.find(p => p.id === selectedItem.id)?.volumenGLP.toFixed(2)}
                  </div>
                  <div className="info-item">
                    <strong>Hora Registro:</strong> {new Date(system.pedidos.find(p => p.id === selectedItem.id)?.fechaHoraRegistro || '').toLocaleString()}
                  </div>
                  <div className="info-item">
                    <strong>Entrega Máxima:</strong> {new Date(system.pedidos.find(p => p.id === selectedItem.id)?.fechaHoraMaxEntrega || '').toLocaleString()}
                  </div>
                  <div className="info-item">
                    <strong>Estado:</strong> {system.pedidos.find(p => p.id === selectedItem.id)?.estado}
                  </div>
                  <div className="info-item">
                    <strong>Ubicación:</strong> ({system.pedidos.find(p => p.id === selectedItem.id)?.ubicacion.x}, {system.pedidos.find(p => p.id === selectedItem.id)?.ubicacion.y})
                  </div>
                  <div className="info-item">
                    <strong>Combustible total:</strong> {system.pedidos.find(p => p.id === selectedItem.id)?.consumoCombustibleTotal.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="empty-selection">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p>Seleccione un camión, cisterna o pedido para ver detalles</p>
          </div>
        )}
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