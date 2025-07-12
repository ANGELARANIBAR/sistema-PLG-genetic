import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  fetchStartTime,
  fetchSystem,
  fetchTruckPosition,
  fetchTruckFuel,
  fetchTruckGLP,
  fetchTruckDestination,

  fetchCisternaGLP,
  checkReplanning,
  registrarAveria,
  changeOrderState
} from "../../services/routeService";

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

  const [showLegend, setShowLegend] = useState(false);
  const [activeTruckTab, setActiveTruckTab] = useState('info');

  const getCurrentDestination = useCallback(async (truck) => {
    if (!currentTime) return null;

    try {
      const destination = await fetchTruckDestination(truck.truckId, currentTime);
      return destination;
    } catch (error) {
      console.error("Error fetching current destination:", error);
      return null;
    }
  }, [currentTime]);
  useEffect(() => {
    const loadSystem = async () => {
      try {
        const systemData = await fetchSystem();
        setSystem(systemData);
        const startTimeData = await fetchStartTime();
        if(startTimeData===null || startTimeData === undefined)return;
        setStartTime(startTimeData);
      } catch (error) {
        console.error("Error loading system data:", error);
      }
    };
    loadSystem();
  }, []);

  useEffect(() => {
    const updateTruckPositions = async () => {
      if (!currentTime || !system || !system.flota) return;

      const newPositions = new Map();
      const newFuels = new Map();
      const newGLPs = new Map();

      for (const truck of system.flota) {
        try {
          const position = await fetchTruckPosition(truck.truckId, currentTime);
          const fuel = await fetchTruckFuel(truck.truckId, currentTime);
          const glp = await fetchTruckGLP(truck.truckId, currentTime);

          if (position) newPositions.set(truck.truckId, position);
          if (fuel !== null) newFuels.set(truck.truckId, fuel);
          if (glp !== null) newGLPs.set(truck.truckId, glp);
        } catch (error) {
          console.error(`Error updating truck ${truck.truckId}:`, error);
        }
      }

      setTruckPositions(newPositions);
      setTruckFuels(newFuels);
      setTruckGLPs(newGLPs);
    };

    updateTruckPositions();
  }, [currentTime, system]);

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



  useEffect(() => {
    const updateCisternaGLPs = async () => {
      if (!currentTime || !system || !system.cisternas) return;

      const newGLPs = new Map();
      for (const cisterna of system.cisternas) {
        try {
          const glp = await fetchCisternaGLP(cisterna.id, currentTime);
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

  // Add effect to periodically fetch system data
  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const systemData = await fetchSystem();
        setSystem(systemData);
        setLastSystemUpdate(new Date());
      } catch (error) {
        console.error('Error fetching system data:', error);
      }
    };

    const interval = setInterval(fetchSystemData, 1000);
    return () => clearInterval(interval);
  }, []);

  // Add effect to check replanning status
  useEffect(() => {
    const checkReplanningStatus = async () => {
      try {
        const status = await checkReplanning();
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

  // Add click handler to close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  if (!system || !startTime) return <div>Loading...</div>;

  // Calculate scale factors to fit the map in the viewport
  const containerWidth = 1000;
  const containerHeight = 700;
  const scaleX = containerWidth / system.maxXmapa;
  const scaleY = containerHeight / system.maxYmapa;

  // Function to convert coordinates to screen position
  const toScreenPosition = (x, y) => ({
    x: x * scaleX,
    y: containerHeight - (y * scaleY) // Invert Y coordinate to start from bottom
  });

  const handleTruckRightClick = (e, truckId) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, truckId });
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

  const handleAveriaOption = async (tipoAveria) => {
    const truckId = contextMenu?.truckId || (selectedItem?.type === 'truck' ? selectedItem.id : null);
    
    if (!truckId || !currentTime) {
      console.error('No truck selected or current time available');
      return;
    }

    try {
      onPauseSimulation();
      await registrarAveria(truckId, tipoAveria, currentTime);
    } catch (error) {
      console.error('Error registering averia:', error);
    }

    setContextMenu(null);
  };

  const checkAndUpdateOrderState = async (truck, currentDest) => {
    if (currentDest.destinationType === 'ENTREGA_PEDIDO' && currentDest.orderId && false) {
      try {
        await changeOrderState(truck.truckId, currentDest.orderId, 'COMPLETADO');
      } catch (error) {
        console.error('Error updating order state:', error);
      }
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const getDestinationTypeLabel = (type) => {
    const labels = {
      'REABASTECIMIENTO': 'Refueling',
      'ENTREGA_PEDIDO': 'Order Delivery',
      'ENTREGAPEDIDO': 'Order Delivery',
      'REPLANIFICACION': 'Replanning'
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
    <div style={{ 
      position: "relative", 
      border: "1px solid #ccc",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        width: containerWidth,
        height: containerHeight,
        position: "relative"
      }}>
        {/* Draw grid */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {Array.from({ length: Math.ceil(system.maxXmapa) + 1 }, (_, x) => (
            <line
              key={`grid-x-${x}`}
              x1={x * scaleX}
              y1={0}
              x2={x * scaleX}
              y2={containerHeight}
              stroke="#ccc"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
          ))}
          {Array.from({ length: Math.ceil(system.maxYmapa) + 1 }, (_, y) => (
            <line
              key={`grid-y-${y}`}
              x1={0}
              y1={containerHeight - (y * scaleY)}
              x2={containerWidth}
              y2={containerHeight - (y * scaleY)}
              stroke="#ccc"
              strokeWidth="1"
              strokeDasharray="2,2"
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
            <svg
              key={`route-${truck.truckId}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
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

        {/* Draw pedidos */}
        {system?.pedidos?.map((pedido, index) => {
          const pos = toScreenPosition(pedido.ubicacion.x, pedido.ubicacion.y);
          return (
            <div
              key={`pedido-${index}`}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 20,
                height: 20,
                backgroundColor: selectedItem?.type === 'pedido' && selectedItem.id === pedido.id ? '#ff0000' : '#800080',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '2px solid #400040',
                zIndex: 2,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedItem({ type: 'pedido', id: pedido.id })}
              title={`Order ${pedido.numeroPedido} - GLP: ${pedido.volumenGLP.toFixed(2)}`}
            >
              P{index + 1}
            </div>
          );
        })}

        {/* Draw trucks */}
        {Array.from(truckPositions.entries()).map(([truckId, position]) => {
          const truck = system?.flota?.find(t => t.truckId === truckId);
          if (!truck) return null;

          const currentFuel = Number(truckFuels.get(truckId) || 0);
          const currentGLP = Number(truckGLPs.get(truckId) || 0);
          const pos = toScreenPosition(position.x, position.y);
          
          const currentDest = currentDestinations.get(truckId);
          if (currentDest) {
            checkAndUpdateOrderState(truck, currentDest);
          }

          return (
            <div
              key={`truck-${truckId}`}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 25,
                height: 25,
                backgroundColor: selectedItem?.type === 'truck' && selectedItem.id === truckId ? '#ff0000' : '#2196F3',
                borderRadius: '4px',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                border: '2px solid #1976D2',
                zIndex: 3,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedItem({ type: 'truck', id: truckId })}
              onContextMenu={(e) => handleTruckRightClick(e, truckId)}
              title={`Truck ${truck.plate} - Fuel: ${currentFuel}% - GLP: ${currentGLP}L`}
            >
              T{truckId}
            </div>
          );
        })}

        {/* Draw cisternas */}
        {system?.cisternas?.map((cisterna, index) => {
          const pos = toScreenPosition(cisterna.ubicacion.x, cisterna.ubicacion.y);
          const currentGLP = cisternaGLPs.get(cisterna.id) ?? cisterna.cargaGLPActual;
          return (
            <div
              key={`cisterna-${cisterna.id}`}
              style={{
                position: "absolute",
                left: pos.x,
                top: pos.y,
                width: 30,
                height: 30,
                backgroundColor: selectedItem?.type === 'cisterna' && selectedItem.id === index ? '#ff0000' : '#4CAF50',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                border: '3px solid #388E3C',
                zIndex: 2,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedItem({ type: 'cisterna', id: index })}
              title={`Cisterna ${cisterna.id} - GLP: ${currentGLP.toFixed(2)}L`}
            >
              C{cisterna.id}
            </div>
          );
        })}

        {/* Replanning overlay */}
        {isReplanning && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '5px',
            zIndex: 1000,
            fontSize: '24px',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            🚨 REPLANNING IN PROGRESS 🚨
            {averiaStartTime && (
              <div style={{ fontSize: '16px' }}>
                Started: {averiaStartTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}
      </div>      {/* Floating Truck Details Panel - ENCIMA de la grilla */}
      {/* Truck Details Panel */}
      {selectedItem && selectedItem.type === 'truck' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '400px',
          backgroundColor: 'white',
          border: '2px solid #2196F3',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>Truck Details</h3>
            <button 
              onClick={() => setSelectedItem(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* Truck Tabs */}
          <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '4px', marginBottom: '16px' }}>
            <button 
              style={{
                flex: 1,
                padding: '8px 12px',
                background: activeTruckTab === 'info' ? 'white' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                color: activeTruckTab === 'info' ? '#2196F3' : '#666',
                borderBottom: activeTruckTab === 'info' ? '2px solid #2196F3' : '2px solid transparent'
              }}
              onClick={() => setActiveTruckTab('info')}
            >
              Information
            </button>
            <button 
              style={{
                flex: 1,
                padding: '8px 12px',
                background: activeTruckTab === 'destinations' ? 'white' : 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '500',
                color: activeTruckTab === 'destinations' ? '#2196F3' : '#666',
                borderBottom: activeTruckTab === 'destinations' ? '2px solid #2196F3' : '2px solid transparent'
              }}
              onClick={() => setActiveTruckTab('destinations')}
            >
              Destinations
            </button>
          </div>

          <div style={{ fontSize: '14px' }}>
            {activeTruckTab === 'info' && (() => {
              const truck = system?.flota?.find(t => t.truckId === selectedItem.id);
              const currentFuel = truckFuels.get(selectedItem.id) || 0;
              const currentGLP = truckGLPs.get(selectedItem.id) || 0;
              
              
              if (!truck) return <p>Truck not found</p>;
              
              return (
                <div>
                  <p style={{ margin: '8px 0' }}><strong>Plate:</strong> {truck.plate}</p>
                  <p style={{ margin: '8px 0' }}><strong>Code:</strong> {truck.codigo}</p>
                  <p style={{ margin: '8px 0' }}><strong>State:</strong> {state}</p>
                  <p style={{ margin: '8px 0' }}><strong>Fuel:</strong> {currentFuel}%</p>
                  <p style={{ margin: '8px 0' }}><strong>GLP:</strong> {currentGLP}L</p>
                </div>
              );
            })()}

            {activeTruckTab === 'destinations' && (() => {
              const truck = system?.flota?.find(t => t.truckId === selectedItem.id);
              const destinations = getTruckDestinations(truck);
              const currentDest = currentDestinations.get(selectedItem.id);
              
              return destinations.length > 0 ? (
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {destinations.map((dest, index) => {
                    // Check if this destination matches the current destination
                    const isCurrentDestination = currentDest && 
                      dest.destinationType === currentDest.destinationType &&
                      dest.fechaHoraLlegada === currentDest.fechaHoraLlegada &&
                      dest.fechaHoraSalida === currentDest.fechaHoraSalida;
                    
                    return (
                      <div key={index} style={{ 
                        border: isCurrentDestination ? '2px solid #2196F3' : '1px solid #ddd', 
                        borderRadius: '4px', 
                        padding: '8px', 
                        marginBottom: '8px',
                        backgroundColor: isCurrentDestination ? '#e3f2fd' : '#fafafa',
                        boxShadow: isCurrentDestination ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '4px',
                          paddingBottom: '4px',
                          borderBottom: '1px solid #eee'
                        }}>
                          <span style={{ fontWeight: '600', fontSize: '11px' }}>
                            {getDestinationTypeLabel(dest.destinationType)}
                            {isCurrentDestination && (
                              <span style={{ 
                                marginLeft: '8px', 
                                color: '#2196F3', 
                                fontWeight: 'bold',
                                fontSize: '10px'
                              }}>
                                (CURRENT)
                              </span>
                            )}
                          </span>
                          <span style={{ 
                            color: getStatusColor(dest.status),
                            fontSize: '10px',
                            padding: '1px 4px',
                            borderRadius: '2px',
                            backgroundColor: 'rgba(0,0,0,0.1)'
                          }}>
                            {dest.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Location:</span>
                            <span>({dest.ubicacion?.x || 'N/A'}, {dest.ubicacion?.y || 'N/A'})</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Arrival:</span>
                            <span>{formatDateTime(dest.fechaHoraLlegada)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Departure:</span>
                            <span>{formatDateTime(dest.fechaHoraSalida)}</span>
                          </div>
                          {dest.glpOperacion && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>GLP Operation:</span>
                              <span>{dest.glpOperacion.toFixed(2)}L</span>
                            </div>
                          )}
                          {dest.saldoGLPCamion !== undefined && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>GLP Balance:</span>
                              <span>{dest.saldoGLPCamion.toFixed(2)}L</span>
                            </div>
                          )}
                          {dest.saldoCombustibleCamion !== undefined && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Fuel Balance:</span>
                              <span>{dest.saldoCombustibleCamion.toFixed(2)}L</span>
                            </div>
                          )}
                          {dest.orderId && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Order ID:</span>
                              <span>{dest.orderId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontStyle: 'italic' }}>
                  No destinations found for this truck.
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Floating Cisterna Details Panel - ENCIMA de la grilla */}
      {selectedItem && selectedItem.type === 'cisterna' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          backgroundColor: 'white',
          border: '2px solid #4CAF50',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>Cisterna Details</h3>
            <button 
              onClick={() => setSelectedItem(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
          {(() => {
            const cisterna = system?.cisternas?.[selectedItem.id];
            const currentGLP = cisternaGLPs.get(cisterna?.id) ?? cisterna?.cargaGLPActual;
            
            if (!cisterna) return <p>Cisterna not found</p>;
            
            return (
              <div style={{ fontSize: '14px' }}>
                <p style={{ margin: '8px 0' }}><strong>ID:</strong> {cisterna.id}</p>
                <p style={{ margin: '8px 0' }}><strong>Principal:</strong> {cisterna.principal ? 'Yes' : 'No'}</p>
                <p style={{ margin: '8px 0' }}><strong>Current GLP:</strong> {currentGLP?.toFixed(2)}L</p>
                <p style={{ margin: '8px 0' }}><strong>Total Capacity:</strong> {cisterna.capacidadTotal}L</p>
                <p style={{ margin: '8px 0' }}><strong>Location:</strong> ({cisterna.ubicacion.x}, {cisterna.ubicacion.y})</p>
              </div>
            );
          })()}
        </div>
      )}

      {/* Floating Order Details Panel - ENCIMA de la grilla */}
      {selectedItem && selectedItem.type === 'pedido' && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '300px',
          backgroundColor: 'white',
          border: '2px solid #800080',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#800080' }}>Order Details</h3>
            <button 
              onClick={() => setSelectedItem(null)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
          {(() => {
            const pedido = system?.pedidos?.find(p => p.id === selectedItem.id);
            
            if (!pedido) return <p>Order not found</p>;
            
            return (
              <div style={{ fontSize: '14px' }}>
                <p style={{ margin: '8px 0' }}><strong>Order Number:</strong> {pedido.numeroPedido}</p>
                <p style={{ margin: '8px 0' }}><strong>Volume:</strong> {pedido.volumenGLP}m³</p>
                <p style={{ margin: '8px 0' }}><strong>Status:</strong> {pedido.estado}</p>
                <p style={{ margin: '8px 0' }}><strong>Location:</strong> ({pedido.ubicacion.x}, {pedido.ubicacion.y})</p>
                <p style={{ margin: '8px 0' }}><strong>Max Delivery Time:</strong> {new Date(pedido.fechaHoraMaxEntrega).toLocaleString()}</p>
              </div>
            );
          })()}
        </div>
      )}      {/* Legend Toggle Button */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}
        onClick={() => setShowLegend(!showLegend)}
        title="Mostrar/Ocultar Leyenda"
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}>
          <div style={{
            width: '18px',
            height: '2px',
            backgroundColor: '#333',
            borderRadius: '1px'
          }}></div>
          <div style={{
            width: '18px',
            height: '2px',
            backgroundColor: '#333',
            borderRadius: '1px'
          }}></div>
          <div style={{
            width: '18px',
            height: '2px',
            backgroundColor: '#333',
            borderRadius: '1px'
          }}></div>
        </div>
      </div>

      {/* Legend Panel */}
      {showLegend && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '20px',
          width: '220px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>Leyenda</h4>
            <button 
              onClick={() => setShowLegend(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 16,
                height: 16,
                backgroundColor: '#2196F3',
                borderRadius: '4px',
                marginRight: '8px'
              }} />
              <span style={{ fontSize: '12px' }}>Camiones</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 16,
                height: 16,
                backgroundColor: '#4CAF50',
                borderRadius: '50%',
                marginRight: '8px'
              }} />
              <span style={{ fontSize: '12px' }}>Cisternas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 16,
                height: 16,
                backgroundColor: '#800080',
                borderRadius: '50%',
                marginRight: '8px'
              }} />
              <span style={{ fontSize: '12px' }}>Pedidos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 20,
                height: 2,
                backgroundColor: '#FF0000',
                marginRight: '8px'
              }} />
              <span style={{ fontSize: '12px' }}>Bloqueos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 20,
                height: 2,
                backgroundColor: 'hsl(200, 70%, 50%)',
                marginRight: '8px',
                border: '1px dashed #666'
              }} />
              <span style={{ fontSize: '12px' }}>Rutas Activas</span>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Registrar Avería</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleAveriaOption(1)} 
              style={{ 
                padding: '4px 8px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Tipo 1
            </button>
            <button 
              onClick={() => handleAveriaOption(2)} 
              style={{ 
                padding: '4px 8px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Tipo 2
            </button>
            <button 
              onClick={() => handleAveriaOption(3)} 
              style={{ 
                padding: '4px 8px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Tipo 3
            </button>
          </div>        </div>
      )}
    </div>
  );
};

MapVisualization.propTypes = {
  currentTime: PropTypes.instanceOf(Date),
  onPauseSimulation: PropTypes.func.isRequired,
};

export default MapVisualization;
