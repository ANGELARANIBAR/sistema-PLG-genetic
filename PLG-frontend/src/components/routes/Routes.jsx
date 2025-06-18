import React, { useState } from 'react';
import { Box, Grid, Button } from '@mui/material';
import RouteCard from '../routeCard/RouteCard';
import PaginationDots from '../paginationDots/PaginationDots';
import './Routes.css';

export default function Routes() {
  const [activePage, setActivePage] = useState(0);
  
  // Sample route data
  const routes = [
    { 
      id: 1, 
      routeNumber: 1, 
      vehicle: 'Camión ABC-123', 
      stops: 3, 
      estimatedTime: '8h 7min', 
      distance: 78 
    },
    { 
      id: 2, 
      routeNumber: 2, 
      vehicle: 'Camión ABC-123', 
      stops: 3, 
      estimatedTime: '8h 7min', 
      distance: 78 
    },
    { 
      id: 3, 
      routeNumber: 3, 
      vehicle: 'Camión ABC-123', 
      stops: 3, 
      estimatedTime: '8h 7min', 
      distance: 78 
    },
    { 
      id: 4, 
      routeNumber: 4, 
      vehicle: 'Camión DEF-456', 
      stops: 4, 
      estimatedTime: '9h 15min', 
      distance: 92 
    },
    { 
      id: 5, 
      routeNumber: 5, 
      vehicle: 'Camión GHI-789', 
      stops: 2, 
      estimatedTime: '6h 30min', 
      distance: 65 
    },
    { 
      id: 6, 
      routeNumber: 6, 
      vehicle: 'Camión JKL-012', 
      stops: 5, 
      estimatedTime: '10h 45min', 
      distance: 110 
    },
  ];

  // Group routes into pages of 3
  const routesPerPage = 3;
  const pageCount = Math.ceil(routes.length / routesPerPage);
  const visibleRoutes = routes.slice(
    activePage * routesPerPage, 
    (activePage + 1) * routesPerPage
  );

  return (
    <Box className="routes-container">
      <Grid container spacing={3}>
        {visibleRoutes.map(route => (
          <Grid item xs={12} sm={6} md={4} key={route.id}>
            <RouteCard 
              routeNumber={route.routeNumber}
              vehicle={route.vehicle}
              stops={route.stops}
              estimatedTime={route.estimatedTime}
              distance={route.distance}
            />
          </Grid>
        ))}
      </Grid>
      
      {pageCount > 1 && (
        <PaginationDots 
          count={pageCount} 
          active={activePage} 
          onChange={setActivePage} 
        />
      )}

      <Box className="action-buttons">
        <Button 
          variant="contained" 
          className="view-button"
        >
          Ver pedidos
        </Button>
        <Button 
          variant="contained" 
          className="view-button"
        >
          Ver flota
        </Button>
      </Box>
    </Box>
  );
} 