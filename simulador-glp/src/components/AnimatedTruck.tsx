// src/components/AnimatedTruck.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { createCustomIcon } from './icons/indexs';
import { fetchTruckPosition } from '../services/routeService';
import { Node } from '../types/route';
import { Popup } from 'react-leaflet';

interface AnimatedTruckProps {
  truckId: number;
  color: string;
  plate: string;
  startTime: Date;
  currentTime: Date | null;
}

const AnimatedTruck: React.FC<AnimatedTruckProps> = ({ truckId, color, plate, startTime, currentTime }) => {
  const map = useMap();
  const markerRef = useRef<L.Marker>(null);
  const [currentPosition, setCurrentPosition] = useState<Node | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const updatePosition = async () => {
      if (!currentTime) return;
      
      try {
        // Use the current simulation time directly since it's already calculated relative to start time
        const position = await fetchTruckPosition(truckId, currentTime);
        setCurrentPosition(position);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update position');
      }
    };

    updatePosition();
  }, [truckId, currentTime]);

  if (error) {
    console.error(`Error updating truck ${truckId}:`, error);
    return null;
  }

  if (!currentPosition) return null;

  return (
    <Marker
      ref={markerRef}
      position={[currentPosition.y, currentPosition.x]}
      icon={createCustomIcon('truck', color)}
    >
      <Popup>
        <div>
          <h3>Truck {plate}</h3>
          <p>Current Position: ({currentPosition.x.toFixed(2)}, {currentPosition.y.toFixed(2)})</p>
        </div>
      </Popup>
    </Marker>
  );
};

export default AnimatedTruck;