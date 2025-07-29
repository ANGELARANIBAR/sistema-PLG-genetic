// src/pages/Simulacion.jsx
import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, TextField, InputAdornment, IconButton, Divider, Alert } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import ScenarioSelector from "../components/scenarioSelector/ScenarioSelector";
import DateTimeInputs from "../components/datetimeInputs/DateTimeInputs";
import { useNavigate } from 'react-router-dom';
import { simulationService } from "../services/simulationService";
import "./Simulacion.css";

export default function Simulacion() {
  const [escenario, setEscenario] = useState("diario");
  const [fecha, setFecha] = useState("2025-03-23");
  const [hora, setHora] = useState("10:30");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      // Combine fecha and hora into a single datetime string
      const fechaHoraInicio = `${fecha}T${hora}:00`;
      
      // Store current scenario in sessionStorage for the simulator
      sessionStorage.setItem('currentScenario', escenario);
      
      // Initialize the fechaHoraInicio in the backend
      //await simulationService.initializeFechaHora(fechaHoraInicio);
      if(escenario === "diario"){
        console.log("Diario")
        await simulationService.executeOperacionDiariaWithFecha(fechaHoraInicio);
      }
      else if(escenario === "semanal"){
        console.log("Semanal")
        await simulationService.executeSimulationWithFecha(fechaHoraInicio);
      }
      else{
        console.log("Colapso")
        await simulationService.executeColapsoWithFecha(fechaHoraInicio);
      }
      // Execute the simulation with the specified fechaHoraInicio
      
      setMessage("✅ Simulación iniciada correctamente con fecha y hora personalizada");
      
      // Navigate to the simulator after a short delay
      setTimeout(() => {
        navigate('/visualizador');
      }, 2000);
      
    } catch (error) {
      setMessage(`❌ Error al iniciar la simulación: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box className="simulacion-container">
      <Typography variant="h4" fontWeight="700" gutterBottom>
        Simulaciones
      </Typography>

      {/* Parámetros Section */}
      <Paper variant="outlined" className="simulacion-paper">
        <Typography variant="h6" className="section-title">
          Elección de escenario
        </Typography>
        
        <ScenarioSelector value={escenario} onChange={setEscenario} />

        {escenario !== "diario" && (
          <Box sx={{ mt: 4 }}>
            <DateTimeInputs
              date={fecha}
              time={hora}
              onDateChange={setFecha}
              onTimeChange={setHora}
            />
          </Box>
        )}

        {message && (
          <Alert 
            severity={message.includes('✅') ? 'success' : 'error'} 
            sx={{ mt: 2 }}
          >
            {message}
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
          <Button
            variant="contained"
            color="secondary"
            className="next-button"
            onClick={handleNext}
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando simulación...' : 'Iniciar simulación'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
