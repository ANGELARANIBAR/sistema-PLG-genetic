// src/services/routeService.ts
import { TruckRoute, Node, Destination } from '../types/route';
import { SistemaPLG } from '../types/route';

const API_BASE_URL = 'http://localhost:8080/api';

export const changeOrderState = async (truckId: number, pedidoId: number, nuevoEstado: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${truckId}/${pedidoId}/change-state`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(nuevoEstado)
  });

  if (!response.ok) {
    throw new Error(`Failed to update order state for Truck ${truckId}, Pedido ${pedidoId}`);
  }
};


export const fetchRoutes = async (): Promise<TruckRoute[]> => {
  const response = await fetch(`${API_BASE_URL}/solution/routes`);
  if (!response.ok) {
    throw new Error('Failed to fetch routes');
  }
  return response.json();
};

export const fetchSystem = async (): Promise<SistemaPLG> => {
  const response = await fetch(`${API_BASE_URL}/solution/system`);
  if (!response.ok) {
    throw new Error('Failed to fetch system data');
  }
  return response.json();
};

export const fetchStartTime = async (): Promise<Date> => {
  const response = await fetch(`${API_BASE_URL}/solution/start-time`);
  if (!response.ok) {
    throw new Error('Failed to fetch routes');
  }
  return response.json();
};

export const fetchTruckPosition = async (truckId: number, time: Date | null): Promise<Node | null> => {
  if (!time) return null;
  const pad = (num: number) => String(num).padStart(2, '0');
  const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
  const response = await fetch(`${API_BASE_URL}/solution/truck-position/${truckId}?time=${formattedTime}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
};

export const fetchTruckFuel = async (truckId: number, time: Date | null): Promise<number | null> => {
  if (!time) return null;
  const pad = (num: number) => String(num).padStart(2, '0');
  const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
  const response = await fetch(`${API_BASE_URL}/solution/truck-fuel/${truckId}?time=${formattedTime}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
};

export const fetchTruckGLP = async (truckId: number, time: Date | null): Promise<number | null> => {
  if (!time) return null;
  const pad = (num: number) => String(num).padStart(2, '0');
  const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
  const response = await fetch(`${API_BASE_URL}/solution/truck-glp/${truckId}?time=${formattedTime}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
};

export const registrarAveria = async (
  truckId: number,
  tipoAveria: number,
  fechaHoraInicioAveria: Date
): Promise<void> => {
  const pad = (num: number) => String(num).padStart(2, '0');

  const formattedTime = `${fechaHoraInicioAveria.getFullYear()}-${pad(fechaHoraInicioAveria.getMonth() + 1)}-${pad(fechaHoraInicioAveria.getDate())}T${pad(fechaHoraInicioAveria.getHours())}:${pad(fechaHoraInicioAveria.getMinutes())}:${pad(fechaHoraInicioAveria.getSeconds())}.${fechaHoraInicioAveria.getMilliseconds()}`;

  console.log("Fecha enviada:", formattedTime); // 🔍 Verificar antes de enviar

  const response = await fetch(`${API_BASE_URL}/solution/${truckId}/registrarAveria`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipoAveria,
      fechaHoraInicioAveria: formattedTime // 🔹 Usamos la fecha correctamente formateada
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to register averia for truck ${truckId}`);
  }
};

export const checkReplanning = async (): Promise<boolean> => {
  const response = await fetch(`${API_BASE_URL}/solution/is-replanning`);
  return response.json();
};

export const fetchTruckDestination = async (truckId: number, time: Date | null): Promise<Destination | null> => {
  if (!time) return null;

  const pad = (num: number) => String(num).padStart(2, '0');
  const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;

  try {
    const response = await fetch(`${API_BASE_URL}/solution/truck-destination/${truckId}?time=${formattedTime}`);

    if (!response.ok || !response) {
      console.error("Error en la respuesta del servidor:", response.status, response.statusText);
      return null;
    }

    // Obtiene el texto de la respuesta antes de intentar convertirlo a JSON
    const textResponse = await response.text();
    
    if (!textResponse.trim()) {
      //console.error("La respuesta del servidor está vacía.");
      return null;
    }

    return JSON.parse(textResponse);
  } catch (error) {
    console.error("Error al parsear JSON:", error);
    return null;
  }
};


export const fetchTruckState = async (truckId: number, time: Date | null): Promise<string | null> => {
  if (!time) return null;
  const pad = (num: number) => String(num).padStart(2, '0');
  const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
  const response = await fetch(`${API_BASE_URL}/solution/truck-state/${truckId}?time=${formattedTime}`);
  if (!response.ok) {
    return null;
  }
  return response.text();
};

