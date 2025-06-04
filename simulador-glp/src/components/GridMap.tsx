import React, { useEffect, useState } from 'react';
import { TruckRoute, Destination, Node } from '../types/route';
import { fetchRoutes, fetchStartTime } from '../services/routeService';
import '../styles/GridMap.css';

interface GridCell {
  x: number;
  y: number;
  type: 'empty' | 'truck' | 'delivery' | 'refuel' | 'transfer';
  truckId?: number;
  plate?: string;
  orderNumber?: string | null;
}

const GridMap: React.FC = () => {
  const [routes, setRoutes] = useState<TruckRoute[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Initialize grid
  useEffect(() => {
    const initializeGrid = () => {
      const gridSize = 20; // 20x20 grid
      const newGrid: GridCell[][] = Array(gridSize).fill(null).map((_, y) =>
        Array(gridSize).fill(null).map((_, x) => ({
          x,
          y,
          type: 'empty'
        }))
      );
      setGrid(newGrid);
    };

    initializeGrid();
  }, []);

  // Load routes and start time
  useEffect(() => {
    const loadData = async () => {
      try {
        const [routesData, startTimeStr] = await Promise.all([
          fetchRoutes(),
          fetchStartTime()
        ]);
        setRoutes(routesData);
        setStartTime(new Date(startTimeStr));
        setCurrentTime(new Date(startTimeStr));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update truck positions based on current time
  useEffect(() => {
    if (!currentTime || !routes.length) return;

    const updateGrid = () => {
      const newGrid: GridCell[][] = grid.map(row => row.map(cell => ({ ...cell, type: 'empty' }))); // Asegurar que cada elemento sea tipo GridCell
    
      routes.forEach(route => {
        route.destinations.forEach(destination => {
          if (!destination.route) return;
    
          const currentPosition = findCurrentPosition(destination, currentTime);
          console.log(currentPosition)
          if (currentPosition) {
            const { x, y } = currentPosition;
            if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
              newGrid[y][x] = {
                x,
                y,
                type: 'truck',
                truckId: route.truckId,
                plate: route.plate
              };
            }
          }
    
          if (destination.route.length > 0) {
            const lastNode = destination.route[destination.route.length - 1];
            const { x, y } = lastNode;
            if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
              newGrid[y][x] = {
                x,
                y,
                type: destination.destinationType === 'ENTREGA_PEDIDO' ? 'delivery' :
                      destination.destinationType === 'REABASTECIMIENTO' ? 'refuel' :
                      destination.destinationType === 'TRASVASE' ? 'transfer' : 'empty',
                orderNumber: destination.orderNumber
              };
            }
          }
        });
      });
    
      setGrid(newGrid); // Asegurar que newGrid tiene la estructura correcta
    };
    

    updateGrid();
  }, [currentTime, routes]);

  // Update time every second
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (!prev) return null;
        return new Date(prev.getTime() + 1000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const findCurrentPosition = (destination: Destination, currentTime: Date): Node | null => {
    if (!destination.route || destination.route.length < 2) return null;

    const arrivalTime = destination.arrivalTime ? new Date(destination.arrivalTime) : null;
    const departureTime = destination.departureTime ? new Date(destination.departureTime) : null;

    if (!arrivalTime || !departureTime) return null;

    if (currentTime < arrivalTime) return destination.route[0];
    if (currentTime > departureTime) return destination.route[destination.route.length - 1];

    // Calculate progress between arrival and departure
    const totalDuration = departureTime.getTime() - arrivalTime.getTime();
    const elapsed = currentTime.getTime() - arrivalTime.getTime();
    const progress = elapsed / totalDuration;

    const index = Math.floor(progress * (destination.route.length - 1));
    return destination.route[index];
  };

  if (loading) return <div>Loading routes...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!startTime) return <div>No start time available</div>;

  return (
    <div className="grid-map">
      <div className="grid-container">
        {grid.map((row, y) => (
          <div key={y} className="grid-row">
            {row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                className={`grid-cell ${cell.type}`}
                title={`${cell.type}${cell.plate ? ` - ${cell.plate}` : ''}${cell.orderNumber ? ` - ${cell.orderNumber}` : ''}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="time-display">
        Current Time: {currentTime?.toLocaleString()}
      </div>
    </div>
  );
};

export default GridMap; 