// src/pages/Simulacion.jsx
import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Button, TextField, InputAdornment, IconButton, Divider, Alert } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import ScenarioSelector from "../components/scenarioSelector/ScenarioSelector";
import DateTimeInputs from "../components/datetimeInputs/DateTimeInputs";
import SimulationTabs from "../components/simulationTabs/SimulationTabs";
import { useNavigate } from 'react-router-dom';
import { simulationService } from "../services/simulationService";
import "./Simulacion.css";

export default function Simulacion() {
  const [tab, setTab] = useState(0);
  const [escenario, setEscenario] = useState("diario");
  const [fecha, setFecha] = useState("2025-03-23");
  const [hora, setHora] = useState("10:30");
  const [selectedFiles, setSelectedFiles] = useState({ bloqueos: "", averias: "", mantenimientos: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        setSelectedFiles((prev) => ({ ...prev, [type]: file.name }));

        const text = await file.text();
        const lines = text.split("\n").map((line) => line.trim());

        let parsedData;
        if (type === "averias") {
          parsedData = lines.map((line) => {
            const [turno, codigo, tipo] = line.split("_");
            return { turno, codigo, tipo };
          });
        } else if (type === "mantenimientos" || type === "bloqueos") {
          parsedData = lines.map((line) => {
            return { raw: line };
          });
        }

        console.log(`Datos procesados (${type}):`, parsedData);
        alert(`Archivo procesado correctamente (${type}). Revisa la consola para más detalles.`);
      }
    };
    input.click();
  };

  const handleNext = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      // Combine fecha and hora into a single datetime string
      const fechaHoraInicio = `${fecha}T${hora}:00`;
      
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

      <SimulationTabs value={tab} onChange={setTab} />

      {tab === 0 && (
        <Paper variant="outlined" className="simulacion-paper">
          <Typography variant="h6" className="section-title">
            Elección de escenario
          </Typography>
          
          <ScenarioSelector value={escenario} onChange={setEscenario} />

          <Box sx={{ mt: 4 }}>
            <DateTimeInputs
              date={fecha}
              time={hora}
              onDateChange={setFecha}
              onTimeChange={setHora}
            />
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <Button variant="contained" color="secondary" className="next-button" onClick={() => setTab(1)}>
              Siguiente
            </Button>
          </Box>
        </Paper>
      )}

      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 4, mt: 2, borderRadius: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Considerar que solo se permiten archivos en formato txt
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Bloqueos
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
              <Button
                variant="contained"
                className="examine-button"
                onClick={() => handleFileUpload("bloqueos")}
              >
                Examinar
              </Button>
              <TextField
                fullWidth
                disabled
                value={selectedFiles.bloqueos || "No se ha seleccionado archivo"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <InfoIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Averías
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
              <Button
                variant="contained"
                className="examine-button"
                onClick={() => handleFileUpload("averias")}
              >
                Examinar
              </Button>
              <TextField
                fullWidth
                disabled
                value={selectedFiles.averias || "No se ha seleccionado archivo"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <InfoIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Mantenimiento
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mt: 1 }}>
              <Button
                variant="contained"
                className="examine-button"
                onClick={() => handleFileUpload("mantenimientos")}
              >
                Examinar
              </Button>
              <TextField
                fullWidth
                disabled
                value={selectedFiles.mantenimientos || "No se ha seleccionado archivo"}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
                        <InfoIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          {message && (
            <Alert 
              severity={message.includes('✅') ? 'success' : 'error'} 
              sx={{ mt: 2 }}
            >
              {message}
            </Alert>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setTab(0)}
              disabled={isLoading}
            >
              Volver
            </Button>

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
      )}
    </Box>
  );
}
