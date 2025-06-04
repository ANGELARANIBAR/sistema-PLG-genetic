// src/components/RouteMap.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Rectangle } from 'react-leaflet';
import L from 'leaflet';
import { fetchSystem, fetchTruckPosition, fetchStartTime } from '../services/routeService';
import { SistemaPLG, Node, Bloqueo } from '../types/route';
import { createCustomIcon } from './icons/indexs';
import AnimatedTruck from './AnimatedTruck';
import 'leaflet/dist/leaflet.css';
import '../styles/MapStyles.css';

const RouteMap: React.FC = () => {
  const [system, setSystem] = useState<SistemaPLG | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulationTime, setSimulationTime] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [systemData, startTimeData] = await Promise.all([
          fetchSystem(),
          fetchStartTime()
        ]);
        setSystem(systemData);
        setStartTime(new Date(startTimeData));
        setSimulationTime(new Date(startTimeData));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update simulation time every second
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setSimulationTime(prev => {
        if (!prev || !startTime) return null;
        return new Date(startTime.getTime() + (prev.getTime() - startTime.getTime() + 1000));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  if (loading) return <div>Loading system data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!system || !startTime) return <div>No system data available</div>;

  // Function to check if a block is currently active based on simulation time
  const isBlockActive = (bloqueo: Bloqueo) => {
    console.log(simulationTime)
    if (!simulationTime) return false;
    const startTime = new Date(bloqueo.fechaHoraInicio);
    const endTime = new Date(bloqueo.fechaHoraFin);
    console.log("Bloqueo esta activo: ")
    console.log(simulationTime >= startTime && simulationTime <= endTime)
    return simulationTime >= startTime && simulationTime <= endTime;
  };

  // Generate axis numbers
  const xAxisNumbers = Array.from({ length: Math.ceil(system.maxXmapa) + 1 }, (_, i) => i);
  const yAxisNumbers = Array.from({ length: Math.ceil(system.maxYmapa) + 1 }, (_, i) => i);

  // Generate grid cells
  const gridCells = [];
  for (let x = 0; x < system.maxXmapa; x++) {
    for (let y = 0; y < system.maxYmapa; y++) {
      gridCells.push(
        <Rectangle
          key={`grid-${x}-${y}`}
          bounds={[
            [y, x],
            [y + 1, x + 1]
          ]}
          pathOptions={{
            fill: false,
            color: '#ccc',
            weight: 1,
            opacity: 0.5
          }}
        />
      );
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Simulation Time Display */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <h3>Simulation Time</h3>
        <p>Start: {startTime.toLocaleString()}</p>
        <p>Current: {simulationTime?.toLocaleString()}</p>
      </div>

      {/* X-axis numbers */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '50px',
        right: '50px',
        height: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '0 10px'
      }}>
        {xAxisNumbers.map(num => (
          <span key={`x-${num}`} style={{ fontSize: '12px' }}>{num}</span>
        ))}
      </div>

      {/* Y-axis numbers */}
      <div style={{
        position: 'absolute',
        top: '50px',
        bottom: '50px',
        left: '0',
        width: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '10px 0'
      }}>
        {yAxisNumbers.map(num => (
          <span key={`y-${num}`} style={{ fontSize: '12px' }}>{num}</span>
        ))}
      </div>

      <MapContainer
        center={[system.maxYmapa / 2, system.maxXmapa / 2]}
        zoom={13}
        style={{ height: '100vh', width: '100%', marginLeft: '20px', marginBottom: '20px' }}
        crs={L.CRS.Simple}
        minZoom={-2}
        maxZoom={2}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Grid Overlay */}
        {gridCells}
        
        {/* Blocked Streets */}
        {system.bloqueos.map((bloqueo, index) => {
          console.log(`Estado de bloqueo: ${isBlockActive(bloqueo)}`);
          if (!isBlockActive(bloqueo)) return null;

          return bloqueo.rutasBloqueadas.map((node, nodeIndex) => {
            if (nodeIndex === bloqueo.rutasBloqueadas.length - 1) return null;
            
            const nextNode = bloqueo.rutasBloqueadas[nodeIndex + 1];
            return (
              <Polyline
                key={`block-${index}-${nodeIndex}`}
                positions={[
                  [node.y, node.x],
                  [nextNode.y, nextNode.x]
                ]}
                color="#FF0000"
                weight={8}
                opacity={0.8}
                dashArray="10, 10"
                className="pulsing-line"
              >
                <Popup>
                  <div>
                    <h3>Blocked Street</h3>
                    <p>Blocked until: {new Date(bloqueo.fechaHoraFin).toLocaleString()}</p>
                  </div>
                </Popup>
              </Polyline>
            );
          });
        })}
        
        {/* Cisternas */}
        {system.cisternas.map((cisterna) => (
          <Marker
            key={`cistern-${cisterna.ubicacion.x}-${cisterna.ubicacion.y}`}
            position={[cisterna.ubicacion.y, cisterna.ubicacion.x]}
            icon={createCustomIcon('cistern', cisterna.principal ? '#FF0000' : '#0000FF')}
          >
            <Popup>
              <div>
                <h3>{cisterna.principal ? 'Principal Cistern' : 'Cistern'}</h3>
                <p>GLP: {cisterna.cargaGLPActual.toFixed(2)} / {cisterna.capacidadTotal.toFixed(2)}</p>
                <p>Supply Time: {cisterna.horaAbastecimento}</p>
                <p>Location: ({cisterna.ubicacion.x}, {cisterna.ubicacion.y})</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Pedidos */}
        {system.pedidos.map((pedido) => (
          <Marker
            key={`order-${pedido.id}`}
            position={[pedido.ubicacion.y, pedido.ubicacion.x]}
            icon={createCustomIcon('cistern', '#00FF00')}
          >
            <Popup>
              <div>
                <h3>Order {pedido.numeroPedido}</h3>
                <p>GLP Volume: {pedido.volumenGLP.toFixed(2)}</p>
                <p>Max Delivery Time: {new Date(pedido.fechaHoraMaxEntrega).toLocaleString()}</p>
                <p>Status: {pedido.estado}</p>
                <p>Location: ({pedido.ubicacion.x}, {pedido.ubicacion.y})</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Animated Trucks */}
        {system.flota.map((truck) => (
          <AnimatedTruck
            key={`truck-${truck.truckId}`}
            truckId={truck.truckId}
            color={getRandomColor(truck.truckId)}
            plate={truck.plate}
            startTime={startTime}
            currentTime={simulationTime}
          />
        ))}
      </MapContainer>
    </div>
  );
};

const getRandomColor = (truckId: number) => {
  const colors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
    '#00FFFF', '#FFA500', '#800080', '#008000', '#800000'
  ];
  return colors[truckId % colors.length];
};

export default RouteMap;