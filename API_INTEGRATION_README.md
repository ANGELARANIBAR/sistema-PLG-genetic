# API Integration for fechaHoraInicio

This document describes the new API endpoints that allow the frontend to pass `fechaHoraInicio` to the backend for PLG simulation initialization.

## Backend Changes

### New DTO Class
- **File**: `src/main/java/com/plg/planificacionplg/dto/FechaHoraInicioRequest.java`
- **Purpose**: Handles the request body for fechaHoraInicio initialization

### Modified Files

#### 1. PlanificacionPlgApplication.java
- Added static field `fechaHoraInicio` with getter/setter
- Modified `ejecutarAlgoritmo()` method to use the fechaHoraInicio from frontend instead of `LocalDateTime.now()`

#### 2. SolutionController.java
- Added new endpoint `/api/solution/inicializar-fecha-hora` (POST)
- Added new endpoint `/api/solution/ejecutar-simulacion-con-fecha` (POST)

## API Endpoints

### 1. Initialize fechaHoraInicio
**Endpoint**: `POST /api/solution/inicializar-fecha-hora`

**Request Body**:
```json
{
  "fechaHoraInicio": "2025-03-23T10:30:00"
}
```

**Response**: 
- Success: `200 OK` with message "Fecha y hora inicializada correctamente: 2025-03-23T10:30:00"
- Error: `400 Bad Request` with error message

### 2. Execute Simulation with fechaHoraInicio
**Endpoint**: `POST /api/solution/ejecutar-simulacion-con-fecha`

**Request Body**:
```json
{
  "fechaHoraInicio": "2025-03-23T10:30:00"
}
```

**Response**: 
- Success: `202 Accepted` (simulation started asynchronously)
- Error: `400 Bad Request` if fechaHoraInicio is null

## Frontend Changes

### New Service
- **File**: `PLG-frontend/src/services/simulationService.js`
- **Purpose**: Provides methods to interact with the new API endpoints

### Modified Components
- **File**: `PLG-frontend/src/pages/Simulacion.jsx`
- **Changes**: Integrated with new API to send fechaHoraInicio to backend

### New Component (Optional)
- **File**: `PLG-frontend/src/components/SimulationControl.jsx`
- **Purpose**: Standalone component for testing the API integration

## Usage Examples

### Frontend JavaScript
```javascript
import { simulationService } from './services/simulationService';

// Initialize fechaHoraInicio
await simulationService.initializeFechaHora('2025-03-23T10:30:00');

// Execute simulation with fechaHoraInicio
await simulationService.executeSimulationWithFecha('2025-03-23T10:30:00');
```

### cURL Examples
```bash
# Initialize fechaHoraInicio
curl -X POST http://localhost:8080/api/solution/inicializar-fecha-hora \
  -H "Content-Type: application/json" \
  -d '{"fechaHoraInicio": "2025-03-23T10:30:00"}'

# Execute simulation with fechaHoraInicio
curl -X POST http://localhost:8080/api/solution/ejecutar-simulacion-con-fecha \
  -H "Content-Type: application/json" \
  -d '{"fechaHoraInicio": "2025-03-23T10:30:00"}'
```

## Integration Flow

1. **Frontend**: User selects date and time in the simulation interface
2. **Frontend**: Combines date and time into ISO format string
3. **Frontend**: Calls `/api/solution/inicializar-fecha-hora` to set the fechaHoraInicio
4. **Frontend**: Calls `/api/solution/ejecutar-simulacion-con-fecha` to start simulation
5. **Backend**: Uses the provided fechaHoraInicio instead of current time
6. **Backend**: Executes the PLG algorithm with the specified start time

## Benefits

- **Flexibility**: Allows testing simulations with different start times
- **Reproducibility**: Enables running simulations with consistent start conditions
- **User Control**: Gives users control over when the simulation should start
- **Backward Compatibility**: Existing functionality still works with current time as fallback

## Testing

1. Start the backend Spring Boot application
2. Start the frontend React application
3. Navigate to the simulation page
4. Select a date and time
5. Click "Iniciar simulación"
6. Verify that the simulation uses the selected fechaHoraInicio

## Error Handling

- If fechaHoraInicio is null or invalid, the API returns appropriate error messages
- If the backend is not available, the frontend shows error messages
- The system falls back to current time if fechaHoraInicio is not provided 