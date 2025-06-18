import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();

  const handleRegisterOrder = () => {
    navigate('/nuevo-pedido');
  };

  const handleViewMonitoring = () => {
    navigate('/pedidos');
  };

  return (
    <Box className="home-container">
      <Container maxWidth="md">
        <Box className="home-content">
          <Typography variant="h3" component="h1" className="home-title">
            Sistema de Gestión de Distribución de GLP
          </Typography>
          
          <Typography variant="h6" component="p" className="home-subtitle">
            Optimice sus operaciones de planificación de distribución de Gas Licuado 
            de Petróleo con nuestra solución integral
          </Typography>
          
          <Box className="home-buttons">
            <Button 
              variant="contained" 
              color="primary" 
              className="register-button"
              onClick={handleRegisterOrder}
            >
              Registrar nuevo pedido
            </Button>
            
            <Button 
              variant="outlined" 
              className="monitoring-button"
              onClick={handleViewMonitoring}
            >
              Ver monitoreo en tiempo real
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
} 