import React, { useEffect, useState, useCallback } from 'react';
import { SistemaPLG, TruckRoute, Node, Destination } from '../types/route';
import { fetchSystem, fetchTruckPosition, fetchStartTime, fetchTruckFuel, fetchTruckGLP, changeOrderState, registrarAveria, checkReplanning, fetchTruckDestination, fetchTruckState } from '../services/routeService';
import '../styles/MapStyles.css';

interface MapVisualizationProps {
  currentTime: Date | null;
  onPauseSimulation: () => void;
}

const MapVisualization: React.FC<MapVisualizationProps> = ({ currentTime, onPauseSimulation }) => {
  const [system, setSystem] = useState<SistemaPLG | null>(null);
  const [truckPositions, setTruckPositions] = useState<Map<number, Node>>(new Map());
  const [truckFuels, setTruckFuels] = useState<Map<number, number>>(new Map());
  const [truckGLPs, setTruckGLPs] = useState<Map<number, number>>(new Map());
  const [isReplanning, setIsReplanning] = useState<boolean>(false);
  const [averiaStartTime, setAveriaStartTime] = useState<Date | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: 'truck' | 'cisterna' | 'pedido', id: number } | null>(null);
  const [currentDestinations, setCurrentDestinations] = useState<Map<number, Destination>>(new Map());
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; truckId: number } | null>(null);
  const [lastSystemUpdate, setLastSystemUpdate] = useState<Date>(new Date());
  const [truckStates, setTruckStates] = useState<Map<number, string>>(new Map());

  const getCurrentDestination = useCallback(async (truck: TruckRoute) => {
    if (!currentTime) return null;
    
    try {
      const destination = await fetchTruckDestination(truck.truckId, currentTime);
      return destination;
    } catch (error) {
      console.error('Error fetching current destination:', error);
      return null;
    }
  }, [currentTime]);

  useEffect(() => {
    const loadSystem = async () => {
      try {
        const systemData = await fetchSystem();
        setSystem(systemData);
        const startTimeData = await fetchStartTime();
        setStartTime(startTimeData);
      } catch (error) {
        console.error('Error loading system data:', error);
      }
    };
    loadSystem();
  }, []);

  useEffect(() => {
    const updateTruckPositions = async () => {
      if (!currentTime || !system) return;

      const newPositions = new Map<number, Node>();
      const newFuels = new Map<number, number>();
      const newGLPs = new Map<number, number>();

      for (const truck of system.flota) {
        try {
          const position = await fetchTruckPosition(truck.truckId, currentTime);
          const fuel = await fetchTruckFuel(truck.truckId, currentTime);
          const glp = await fetchTruckGLP(truck.truckId, currentTime);

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

    updateTruckPositions();
  }, [currentTime, system]);

  useEffect(() => {
    const updateCurrentDestinations = async () => {
      if (!currentTime || !system) return;

      const newDestinations = new Map<number, Destination>();
      for (const truck of system.flota) {
        const destination = await getCurrentDestination(truck);
        if (destination) {
          newDestinations.set(truck.truckId, destination);
        }
      }
      setCurrentDestinations(newDestinations);
    };

    updateCurrentDestinations();
  }, [currentTime, system]);

  useEffect(() => {
    const updateTruckStates = async () => {
      if (!currentTime || !system) return;

      const newStates = new Map<number, string>();
      for (const truck of system.flota) {
        try {
          const state = await fetchTruckState(truck.truckId, currentTime);
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
  const containerWidth = 800; // Adjust based on your needs
  const containerHeight = 600; // Adjust based on your needs
  const scaleX = containerWidth / system.maxXmapa;
  const scaleY = containerHeight / system.maxYmapa;

  // Function to convert coordinates to screen position
  const toScreenPosition = (x: number, y: number) => ({
    x: x * scaleX,
    y: containerHeight - (y * scaleY) // Invert Y coordinate to start from bottom
  });

  const handleTruckRightClick = (e: React.MouseEvent, truckId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, truckId });
  };

  const handleAveriaOption = async (tipoAveria: number) => {
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

  const checkAndUpdateOrderState = async (truck: TruckRoute, currentDest: any) => {
    if (currentDest.destinationType === 'ENTREGA_PEDIDO' && currentDest.orderId && false) {
      try {
        await changeOrderState(truck.truckId, currentDest.orderId, 'COMPLETADO');
      } catch (error) {
        console.error('Error updating order state:', error);
      }
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        border: '1px solid #ccc',
        width: containerWidth,
        height: containerHeight,
        minWidth: containerWidth,
        minHeight: containerHeight
      }}>
        {/* Draw grid */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
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
        {system.flota.map((truck, index) => {
          const currentDest = currentDestinations.get(truck.truckId);
          if (!currentDest || !currentDest.route) return null;

          const color = `hsl(${(index * 360) / system.flota.length}, 70%, 50%)`;
          return (
            <svg
              key={`route-${truck.truckId}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <polyline
                points={currentDest.route.map((node: Node) => {
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

        {/* Draw blocked routes */}
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
              <svg
                key={`block-${index}-${nodeIndex}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              >
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
              </svg>
            );
          });
        })}

        {/* Draw pedidos */}
        {system.pedidos.map((pedido, index) => {
          const pos = toScreenPosition(pedido.ubicacion.x, pedido.ubicacion.y);
          return (
            <div
              key={`pedido-${index}`}
              style={{
                position: 'absolute',
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
          const truck = system.flota.find(t => t.truckId === truckId);
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
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: 15,
                height: 15,
                backgroundColor: selectedItem?.type === 'truck' && selectedItem.id === truckId ? '#ff0000' : '#0000ff',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '10px',
                fontWeight: 'bold',
                zIndex: 2,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedItem({ type: 'truck', id: truckId })}
              onContextMenu={(e) => {
                e.preventDefault();
                handleTruckRightClick(e, truckId);
              }}
              title={`Truck ${truck.codigo}
Combustible: ${currentFuel.toFixed(2)}
GLP: ${currentGLP.toFixed(2)}
Combustible final: ${Number(truck.fuelConsumed || 0).toFixed(2)}
${currentDest ? `\nEn: ${currentDest.destinationType}` : ''}`}
            >
              T{truckId}
            </div>
          );
        })}

        {/* Draw cisternas */}
        {system.cisternas.map((cisterna, index) => {
          const pos = toScreenPosition(cisterna.ubicacion.x, cisterna.ubicacion.y);
          return (
            <div
              key={`cisterna-${index}`}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: 20,
                height: 20,
                backgroundColor: selectedItem?.type === 'cisterna' && selectedItem.id === index ? '#ff0000' : (cisterna.principal ? '#ff0000' : '#00ff00'),
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 2,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedItem({ type: 'cisterna', id: index })}
              title={`${cisterna.principal ? 'Principal' : 'Secundaria'} Cisterna
GLP Actual: ${cisterna.cargaGLPActual.toFixed(2)} / ${cisterna.capacidadTotal.toFixed(2)}
Hora Abastecimiento: ${cisterna.horaAbastecimento}
${cisterna.operacionesGLPCisterna?.length ? `
Últimas operaciones:
${cisterna.operacionesGLPCisterna.slice(-3).map(op => 
  `- ${new Date(op.fechaHoraOperacion).toLocaleString()}: ${op.cantSalidaGLP.toFixed(2)} GLP (Camión ${op.placaCamion})`
).join('\n')}` : ''}`}
            >
              C{index + 1}
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

      {/* Fixed side menu */}
      <div style={{
        width: '300px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderLeft: '1px solid #ccc',
        padding: '20px',
        overflowY: 'auto',
        height: containerHeight
      }}>
        {selectedItem ? (
          selectedItem.type === 'truck' ? (
            <div>
              <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Información de camión
              </h3>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ marginBottom: '5px' }}>
                  <strong>Código:</strong> {system?.flota.find(t => t.truckId === selectedItem.id)?.codigo}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  <strong>Placa:</strong> {system?.flota.find(t => t.truckId === selectedItem.id)?.plate}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  <strong>Combustible actual:</strong> {Number(truckFuels.get(selectedItem.id) || 0).toFixed(2)}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  <strong>GLP actual:</strong> {Number(truckGLPs.get(selectedItem.id) || 0).toFixed(2)}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  <strong>Combustible final:</strong> {Number(system?.flota.find(t => t.truckId === selectedItem.id)?.fuelConsumed || 0).toFixed(2)}
                </div>
                {system?.flota.find(t => t.truckId === selectedItem.id) && (
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Estado camion:</strong> {truckStates.get(selectedItem.id) || 'N/A'}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '10px' }}>Registrar averia</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleAveriaOption(1)} 
                    style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    Tipo 1
                  </button>
                  <button 
                    onClick={() => handleAveriaOption(2)} 
                    style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    Tipo 2
                  </button>
                  <button 
                    onClick={() => handleAveriaOption(3)} 
                    style={{ 
                      padding: '8px 12px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    Tipo 3
                  </button>
                </div>
              </div>
            </div>
          ) : selectedItem.type === 'cisterna' ? (
            <div>
              <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Cisterna Information
              </h3>
              {system?.cisternas[selectedItem.id] && (
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Type:</strong> {system.cisternas[selectedItem.id].principal ? 'Principal' : 'Secundaria'}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Current GLP:</strong> {system.cisternas[selectedItem.id].cargaGLPActual.toFixed(2)}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Total Capacity:</strong> {system.cisternas[selectedItem.id].capacidadTotal.toFixed(2)}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Supply Time:</strong> {system.cisternas[selectedItem.id].horaAbastecimento}
                  </div>
                  {system.cisternas[selectedItem.id].operacionesGLPCisterna?.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Last Operations:</strong>
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
            <div>
              <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                Información de Pedido
              </h3>
              {system?.pedidos.find(p => p.id === selectedItem.id) && (
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Código de Pedido:</strong> {system.pedidos.find(p => p.id === selectedItem.id)?.numeroPedido}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>GLP Volumen:</strong> {system.pedidos.find(p => p.id === selectedItem.id)?.volumenGLP.toFixed(2)}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Hora Registro:</strong> {new Date(system.pedidos.find(p => p.id === selectedItem.id)?.fechaHoraRegistro || '').toLocaleString()}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Entrega Pedido Máximo:</strong> {new Date(system.pedidos.find(p => p.id === selectedItem.id)?.fechaHoraMaxEntrega || '').toLocaleString()}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Estado:</strong> {system.pedidos.find(p => p.id === selectedItem.id)?.estado}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Ubicación:</strong> ({system.pedidos.find(p => p.id === selectedItem.id)?.ubicacion.x}, {system.pedidos.find(p => p.id === selectedItem.id)?.ubicacion.y})
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>Combusitble total invertido:</strong> {system.pedidos.find(p => p.id === selectedItem.id)?.consumoCombustibleTotal.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', color: '#666' }}>
            Select a truck, cisterna, or order to view details
          </div>
        )}
      </div>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default MapVisualization; 