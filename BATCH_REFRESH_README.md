# Batch Refresh Feature

This feature automatically refreshes the frontend page when the backend processes a new batch in the simulation.

## How it works

### Backend (Java/Spring Boot)

1. **Flag Management**: Added `batchRefreshNeeded` static field in `PlanificacionPlgApplication.java`
2. **Trigger Point**: When `batchActual != 1` in the `procesarSiguienteBatch()` method, the flag is set to `true`
3. **API Endpoint**: New endpoint `/api/solution/batch-refresh-status` in `SolutionController.java` that:
   - Returns the current batch status
   - Resets the flag after sending the response
   - Includes logging for debugging

### Frontend (React)

1. **Service Method**: Added `getBatchRefreshStatus()` method in `simulationService.js`
2. **Custom Hook**: Created `useBatchRefreshMonitor.js` hook that:
   - Polls the API every 2 seconds
   - Automatically refreshes the page when `needsRefresh` is `true`
   - Includes error handling and logging
3. **Component Integration**: 
   - `BatchRefreshMonitor` component uses the hook globally
   - `Simulador` page also uses the hook for targeted monitoring
4. **App Integration**: The monitor is included in the main `App.jsx`

## Usage

The feature works automatically once implemented. When the backend processes a new batch (when `batchActual != 1`), the frontend will automatically refresh the page to show the updated simulation state.

## Debugging

- Backend logs: Check console for "Batch refresh needed set to true" and "Batch refresh status check" messages
- Frontend logs: Check browser console for "Batch refresh check" messages
- The refresh happens with a 1-second delay to ensure backend processing is complete

## Files Modified

### Backend
- `src/main/java/com/plg/planificacionplg/PlanificacionPlgApplication.java`
- `src/main/java/com/plg/planificacionplg/controller/SolutionController.java`

### Frontend
- `PLG-frontend/src/services/simulationService.js`
- `PLG-frontend/src/hooks/useBatchRefreshMonitor.js`
- `PLG-frontend/src/components/BatchRefreshMonitor.jsx`
- `PLG-frontend/src/App.jsx`
- `PLG-frontend/src/pages/Simulador.jsx` 