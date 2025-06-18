# Map Visualization Integration for PLG-Frontend

This document describes the integration of the map visualization functionality from `simulador-glp` into the `PLG-frontend` project.

## Overview

The map visualization has been successfully integrated into the PLG-frontend, providing real-time visualization of:
- **Trucks**: Moving vehicles with fuel and GLP levels
- **Cisternas**: Storage facilities (principal and secondary)
- **Pedidos**: Delivery orders with locations
- **Routes**: Current truck routes with color coding
- **Blocked Routes**: Active road blocks with pulsing animation
- **Replanning Status**: Real-time replanning notifications

## New Components Created

### 1. MapVisualization Component
**File**: `PLG-frontend/src/components/MapVisualization.jsx`

**Features**:
- Real-time truck position tracking
- Interactive map with clickable elements
- Context menu for truck averia registration
- Sidebar with detailed information
- Grid overlay for better navigation
- Route visualization with color coding
- Blocked route animation
- Replanning status overlay

### 2. Map Service
**File**: `PLG-frontend/src/services/mapService.js`

**API Endpoints Used**:
- `GET /api/solution/system` - Fetch system data
- `GET /api/solution/start-time` - Get simulation start time
- `GET /api/solution/truck-position/{truckId}` - Get truck position
- `GET /api/solution/truck-fuel/{truckId}` - Get truck fuel level
- `GET /api/solution/truck-glp/{truckId}` - Get truck GLP level
- `GET /api/solution/cisterna-GLP/{cisternaId}` - Get cisterna GLP level
- `GET /api/solution/truck-destination/{truckId}` - Get truck destination
- `GET /api/solution/truck-state/{truckId}` - Get truck state
- `POST /api/solution/{truckId}/registrarAveria` - Register truck averia
- `GET /api/solution/is-replanning` - Check replanning status

### 3. Route Types
**File**: `PLG-frontend/src/types/route.js`

**Data Structures**:
- `TruckRoute` - Truck information
- `Destination` - Route destination details
- `Node` - Coordinate points
- `Cisterna` - Storage facility data
- `Pedido` - Order information
- `Bloqueo` - Road block data
- `SistemaPLG` - Complete system state

### 4. Map Styles
**File**: `PLG-frontend/src/styles/MapStyles.css`

**Styling Features**:
- Responsive map container
- Interactive markers for trucks, cisternas, and pedidos
- Color-coded elements (blue trucks, red/green cisternas, purple pedidos)
- Pulsing animation for blocked routes
- Context menu styling
- Sidebar information panel
- Replanning overlay

## Integration Points

### 1. Updated Simulador Page
**File**: `PLG-frontend/src/pages/Simulador.jsx`

**Changes**:
- Now uses the new `MapVisualization` component
- Integrated with `mapService` for real backend data
- Maintains existing simulation controls
- Real-time updates from backend

### 2. Updated Route Service
**File**: `PLG-frontend/src/services/routeService.js`

**Changes**:
- Now re-exports functions from `mapService`
- Maintains backward compatibility
- Removes mock data in favor of real API calls

## Key Features

### Interactive Map Elements

#### Trucks (Blue Circles)
- **Click**: Select truck to view details in sidebar
- **Right-click**: Open context menu to register averia
- **Tooltip**: Shows fuel, GLP, and current destination
- **Movement**: Real-time position updates

#### Cisternas (Red/Green Circles)
- **Red**: Principal cisterna
- **Green**: Secondary cisternas
- **Click**: View detailed information
- **Tooltip**: Shows GLP levels and operations

#### Pedidos (Purple Circles)
- **Click**: View order details
- **Tooltip**: Shows order number and GLP volume
- **Status**: Visual indication of completion

### Real-time Features

#### Route Visualization
- Color-coded routes for each truck
- Dashed lines showing current paths
- Updates as trucks move

#### Blocked Routes
- Red pulsing lines for active blocks
- Time-based activation
- Visual warning system

#### Replanning Status
- Overlay notification during replanning
- Real-time status updates
- Automatic pause during replanning

### Information Panel

#### Truck Information
- Code and plate number
- Current fuel and GLP levels
- Truck state
- Averia registration buttons

#### Cisterna Information
- Type (Principal/Secundaria)
- Current and total GLP capacity
- Supply time
- Recent operations

#### Pedido Information
- Order number and GLP volume
- Registration and delivery times
- Current status
- Location coordinates

## Usage Instructions

### 1. Starting the Simulation
1. Navigate to the simulation page
2. Select date and time
3. Click "Iniciar simulación"
4. Wait for backend processing
5. Navigate to the visualizer

### 2. Using the Map
1. **View Elements**: All trucks, cisternas, and pedidos are visible on the map
2. **Select Items**: Click on any element to view details in the sidebar
3. **Register Averia**: Right-click on a truck to open the context menu
4. **Monitor Progress**: Watch real-time updates as the simulation progresses

### 3. Simulation Controls
- **Play/Pause**: Control simulation speed
- **Speed Control**: Adjust playback speed (1x, 2x, 5x)
- **Time Display**: Current simulation time shown in sidebar

## Technical Implementation

### State Management
The component uses React hooks for state management:
- `useState` for local component state
- `useEffect` for side effects and API calls
- `useCallback` for optimized function references

### API Integration
- Real-time data fetching from backend
- Error handling for failed requests
- Automatic retry mechanisms
- Periodic updates for live data

### Performance Optimization
- Efficient re-rendering with proper dependencies
- Debounced API calls
- Optimized SVG rendering
- Memory management for large datasets

## Benefits

1. **Real-time Visualization**: Live updates from the backend
2. **Interactive Interface**: Click and right-click functionality
3. **Comprehensive Information**: Detailed data in sidebar
4. **Visual Feedback**: Color coding and animations
5. **Error Handling**: Robust error management
6. **Performance**: Optimized for smooth operation
7. **Integration**: Seamless integration with existing frontend

## Future Enhancements

1. **Zoom and Pan**: Add map navigation controls
2. **Filtering**: Filter by truck type, status, or location
3. **Historical Data**: View past simulation states
4. **Export**: Export map data and screenshots
5. **Customization**: User-configurable map settings
6. **Mobile Support**: Responsive design for mobile devices

## Troubleshooting

### Common Issues

1. **Map Not Loading**
   - Check backend connection
   - Verify API endpoints are accessible
   - Check browser console for errors

2. **No Data Displayed**
   - Ensure simulation has been started
   - Check if backend has processed the simulation
   - Verify API responses

3. **Performance Issues**
   - Reduce update frequency
   - Check for memory leaks
   - Optimize API calls

### Debug Information
- All API calls are logged to console
- Error messages provide detailed information
- Network tab shows request/response data 