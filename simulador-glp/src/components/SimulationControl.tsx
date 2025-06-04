import React, { useState, useEffect } from 'react';
import { fetchStartTime } from '../services/routeService';
import MapVisualization from './MapVisualization';

const SimulationControl: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    const loadStartTime = async () => {
      try {
        const startTimeString = await fetchStartTime(); // Suponiendo que devuelve una cadena
        setCurrentTime(new Date(startTimeString)); // Convierte la cadena en Date
      } catch (error) {
        console.error('Error loading start time:', error);
      }
    };
    loadStartTime();
  }, []);
  

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
  
    if (isPlaying && currentTime) {
      intervalId = setInterval(() => {
        setCurrentTime(prevTime => {
          //console.log(prevTime)
          if (!prevTime) return new Date(); // Inicializa si `prevTime` es null
          return new Date(prevTime.getTime() + 60000 * playbackSpeed);
        });
      }, 1000);
    }
  
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying, playbackSpeed]);  
  

  const handlePauseSimulation = () => {
    setIsPlaying(false);
  };

  if (!currentTime) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
        <div style={{
          position: 'fixed',  // 🔹 Mantiene el menú fijo
          top: '10px',
          left: '10px',
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
        <h3>Simulation Controls</h3>
        <label>Current Time: {currentTime.toLocaleString()}</label>
        <div style={{ marginTop: '10px' }}>
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{ marginLeft: '10px' }}
          >
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={5}>5x</option>
            <option value={10}>10x</option>
          </select>
        </div>
      </div>

      <MapVisualization 
        currentTime={currentTime} 
        onPauseSimulation={handlePauseSimulation}
      />
    </div>
  );
};

export default SimulationControl; 