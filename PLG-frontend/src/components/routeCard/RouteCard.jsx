import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import './RouteCard.css';

export default function RouteCard({ 
  routeNumber, 
  vehicle, 
  stops, 
  estimatedTime, 
  distance 
}) {
  return (
    <Box className="route-card">
      <Typography variant="h6" className="route-title">
        Ruta #{routeNumber}
      </Typography>
      
      <Box className="route-info-item">
        <DirectionsBusIcon className="route-icon" />
        <Typography variant="body2" className="route-text">
          {vehicle}
        </Typography>
      </Box>
      
      <Box className="route-info-item">
        <LocationOnIcon className="route-icon" />
        <Typography variant="body2" className="route-text">
          {stops} paradas
        </Typography>
      </Box>
      
      <Box className="route-info-item">
        <AccessTimeIcon className="route-icon" />
        <Typography variant="body2" className="route-text">
          Tiempo estimado: {estimatedTime}
        </Typography>
      </Box>
      
      <Typography variant="body2" className="route-distance">
        Distancia: {distance} km
      </Typography>
      
      <Button 
        variant="contained" 
        className="view-map-button"
      >
        Ver en mapa
      </Button>
    </Box>
  );
} 