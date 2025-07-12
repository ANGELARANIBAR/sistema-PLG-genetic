import React, { useState, useEffect } from 'react';
import { mapService } from '../services/mapService';

const TruckDetailsPanel = ({ truckId, system, truckFuels, truckGLPs, truckStates, currentTime, onClose, onPauseSimulation }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [destinations, setDestinations] = useState([]);

  const truck = system?.flota.find(t => t.truckId === truckId);
  const currentFuel = Number(truckFuels.get(truckId) || 0);
  const currentGLP = Number(truckGLPs.get(truckId) || 0);
  const state = truckStates.get(truckId) || 'UNKNOWN';

  useEffect(() => {
    if (!truck || !currentTime) {
      setDestinations([]);
      return;
    }

    // Get destinations from the truck data in the system
    const truckDestinations = truck.destinations || [];
    const formattedDestinations = truckDestinations.map((destino, index) => {
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

    setDestinations(formattedDestinations);
  }, [truck, currentTime]);

  const handleAveriaOption = async (tipoAveria) => {
    if (!truckId || !currentTime) {
      console.error('No truck selected or current time available');
      return;
    }

    try {
      if (onPauseSimulation) {
        onPauseSimulation();
      }
      await mapService.registrarAveria(truckId, tipoAveria, currentTime);
    } catch (error) {
      console.error('Error registering averia:', error);
    }
  };

  if (!truck) {
    return (
      <div className="truck-details-panel">
        <div className="panel-header">
          <h3>Truck Details</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <p>Truck not found</p>
      </div>
    );
  }

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const getDestinationTypeLabel = (type) => {
    const labels = {
      'REABASTECIMIENTO': 'Refueling',
      'ENTREGA_PEDIDO': 'Order Delivery',
      'REPLANIFICACION': 'Replanning',
      'AVERIADO': 'Breakdown',
      'REABASTECIMIENTO': 'Refueling',
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

  return (
    <div className="truck-details-panel">
      <div className="panel-header">
        <h3>Truck {truck.codigo}</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>

      <div className="tab-container">
        <div className="tab-buttons">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Detalles
          </button>
          <button 
            className={`tab-button ${activeTab === 'destinations' ? 'active' : ''}`}
            onClick={() => setActiveTab('destinations')}
          >
            Destinations
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'info' && (
            <div className="info-tab">
              <div className="info-grid">
                <div className="info-item">
                  <label>Code:</label>
                  <span>{truck.codigo}</span>
                </div>
                <div className="info-item">
                  <label>Plate:</label>
                  <span>{truck.plate}</span>
                </div>
                <div className="info-item">
                  <label>Type:</label>
                  <span>{truck.tipo?.codigo || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>State:</label>
                  <span style={{ color: getStatusColor(state) }}>{state}</span>
                </div>
                <div className="info-item">
                  <label>Current Fuel:</label>
                  <span>{currentFuel.toFixed(2)}%</span>
                </div>
                <div className="info-item">
                  <label>Current GLP:</label>
                  <span>{currentGLP.toFixed(2)}L</span>
                </div>
                <div className="info-item">
                  <label>Max GLP Capacity:</label>
                  <span>{truck.tipo?.cargaGLPMax?.toFixed(2) || 'N/A'}L</span>
                </div>
                <div className="info-item">
                  <label>Max Fuel Capacity:</label>
                  <span>{truck.tipo?.capCombustibleMax?.toFixed(2) || 'N/A'}L</span>
                </div>
                <div className="info-item">
                  <label>Average Speed:</label>
                  <span>{truck.tipo?.velocidadPromedio?.toFixed(2) || 'N/A'} nodes/min</span>
                </div>
                <div className="info-item">
                  <label>Total Fuel Consumed:</label>
                  <span>{Number(truck.fuelConsumed || 0).toFixed(2)}L</span>
                </div>
              </div>
              
              {/* Averia Buttons */}
              <div className="averia-section">
                <h4>Register Breakdown</h4>
                <div className="averia-buttons">
                  <button 
                    onClick={() => handleAveriaOption(1)} 
                    className="averia-button tipo-1"
                  >
                    Type 1
                  </button>
                  <button 
                    onClick={() => handleAveriaOption(2)} 
                    className="averia-button tipo-2"
                  >
                    Type 2
                  </button>
                  <button 
                    onClick={() => handleAveriaOption(3)} 
                    className="averia-button tipo-3"
                  >
                    Type 3
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'destinations' && (
            <div className="destinations-tab">
              {destinations.length > 0 ? (
                <div className="destinations-list">
                  {destinations.map((dest, index) => {
                    // For TruckDetailsPanel, we need to get the current destination from the system
                    // Since this component doesn't have access to currentDestinations, we'll use a different approach
                    // We'll check if this destination is currently active based on time
                    const isCurrentDestination = currentTime && 
                      dest.fechaHoraLlegada && 
                      dest.fechaHoraSalida &&
                      new Date(dest.fechaHoraLlegada) <= currentTime && 
                      new Date(dest.fechaHoraSalida) >= currentTime;
                    
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
                                (CURRENT)
                              </span>
                            )}
                          </span>
                          <span className="destination-status" style={{ color: getStatusColor(dest.status) }}>
                            {dest.status}
                          </span>
                        </div>
                        <div className="destination-details">
                          <div className="detail-row">
                            <label>Location:</label>
                            <span>({dest.ubicacion?.x || 'N/A'}, {dest.ubicacion?.y || 'N/A'})</span>
                          </div>
                          <div className="detail-row">
                            <label>Arrival:</label>
                            <span>{formatDateTime(dest.fechaHoraLlegada)}</span>
                          </div>
                          <div className="detail-row">
                            <label>Departure:</label>
                            <span>{formatDateTime(dest.fechaHoraSalida)}</span>
                          </div>
                          {dest.glpOperacion && (
                            <div className="detail-row">
                              <label>GLP Operation:</label>
                              <span>{dest.glpOperacion.toFixed(2)}L</span>
                            </div>
                          )}
                          {dest.saldoGLPCamion !== undefined && (
                            <div className="detail-row">
                              <label>GLP Balance:</label>
                              <span>{dest.saldoGLPCamion.toFixed(2)}L</span>
                            </div>
                          )}
                          {dest.saldoCombustibleCamion !== undefined && (
                            <div className="detail-row">
                              <label>Fuel Balance:</label>
                              <span>{dest.saldoCombustibleCamion.toFixed(2)}L</span>
                            </div>
                          )}
                          {dest.orderId && (
                            <div className="detail-row">
                              <label>Order ID:</label>
                              <span>{dest.orderId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-destinations">No destinations found for this truck.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TruckDetailsPanel; 