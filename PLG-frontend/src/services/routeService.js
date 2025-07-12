// Service functions for simulation and route data
// This service now uses the real mapService to connect to the backend

import { mapService } from './mapService';

// Re-export all functions from mapService for backward compatibility
export const fetchStartTime = mapService.fetchStartTime;
export const fetchSystem = mapService.fetchSystem;
export const fetchTruckPosition = mapService.fetchTruckPosition;
export const fetchTruckFuel = mapService.fetchTruckFuel;
export const fetchTruckGLP = mapService.fetchTruckGLP;
export const fetchTruckDestination = mapService.fetchTruckDestination;

export const fetchCisternaGLP = mapService.fetchCisternaGLP;
export const checkReplanning = mapService.checkReplanning;
export const registrarAveria = mapService.registrarAveria;
export const changeOrderState = mapService.changeOrderState;
