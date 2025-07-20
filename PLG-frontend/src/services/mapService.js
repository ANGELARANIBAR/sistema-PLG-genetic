const API_BASE_URL = 'http://localhost:8080/api/solution';

export const mapService = {
    // Fetch system data
    async fetchSystem() {
        try {
            const response = await fetch(`${API_BASE_URL}/system`);
            if (!response.ok) {
                throw new Error('Failed to fetch system data');
            }
            return await response.json();
        } catch (error) {
            //console.error('Waiting for fetching system data:', error);
            //throw error;
        }
    },

    // Fetch start time
    async fetchStartTime() {
        try {
            const response = await fetch(`${API_BASE_URL}/start-time`);
            if (!response.ok) {
                throw new Error('Failed to fetch start time');
            }
            return await response.json();
        } catch (error) {
            //console.error('Error fetching start time:', error);
            throw error;
        }
    },

    // Fetch truck position at specific time
    async fetchTruckPosition(truckId, time) {
        if (!time) return null;
        
        try {
            const pad = (num) => String(num).padStart(2, '0');
            const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
            
            const response = await fetch(`${API_BASE_URL}/truck-position/${truckId}?time=${formattedTime}`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            //console.error(`Error fetching truck ${truckId} position:`, error);
            return null;
        }
    },

    // Fetch truck fuel at specific time
    async fetchTruckFuel(truckId, time) {
        if (!time) return null;
        
        try {
            const pad = (num) => String(num).padStart(2, '0');
            const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
            
            const response = await fetch(`${API_BASE_URL}/truck-fuel/${truckId}?time=${formattedTime}`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            //console.error(`Error fetching truck ${truckId} fuel:`, error);
            return null;
        }
    },

    // Fetch truck GLP at specific time
    async fetchTruckGLP(truckId, time) {
        if (!time) return null;
        
        try {
            const pad = (num) => String(num).padStart(2, '0');
            const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
            
            const response = await fetch(`${API_BASE_URL}/truck-glp/${truckId}?time=${formattedTime}`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            //console.error(`Error fetching truck ${truckId} GLP:`, error);
            return null;
        }
    },

    // Fetch cisterna GLP at specific time
    async fetchCisternaGLP(cisternaId, time) {
        if (!time) return null;
        
        try {
            const pad = (num) => String(num).padStart(2, '0');
            const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
            
            const response = await fetch(`${API_BASE_URL}/cisterna-GLP/${cisternaId}?time=${formattedTime}`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Error fetching cisterna ${cisternaId} GLP:`, error);
            return null;
        }
    },

    // Fetch truck destination at specific time
    async fetchTruckDestination(truckId, time) {
        if (!time) return null;
        
        try {
            const pad = (num) => String(num).padStart(2, '0');
            const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
            
            const response = await fetch(`${API_BASE_URL}/truck-destination/${truckId}?time=${formattedTime}`);
            if (!response.ok) {
                return null;
            }
            
            const textResponse = await response.text();
            if (!textResponse.trim()) {
                return null;
            }
            
            return JSON.parse(textResponse);
        } catch (error) {
            //console.error(`Error fetching truck ${truckId} destination:`, error);
            return null;
        }
    },

    // Fetch number of trucks en ruta
    async fetchCamionesEnRuta() {
        try {
            const response = await fetch(`${API_BASE_URL}/camiones-en-ruta`);
            if (!response.ok) {
                throw new Error('Failed to fetch camiones en ruta');
            }
            return await response.json();
        } catch (error) {
            //console.error('Error fetching camiones en ruta:', error);
            return 0;
        }
    },


    // Register averia
    async registrarAveria(truckId, tipoAveria, fechaHoraInicioAveria) {
        try {
            const pad = (num) => String(num).padStart(2, '0');
            const formattedTime = `${fechaHoraInicioAveria.getFullYear()}-${pad(fechaHoraInicioAveria.getMonth() + 1)}-${pad(fechaHoraInicioAveria.getDate())}T${pad(fechaHoraInicioAveria.getHours())}:${pad(fechaHoraInicioAveria.getMinutes())}:${pad(fechaHoraInicioAveria.getSeconds())}.${fechaHoraInicioAveria.getMilliseconds()}`;

            const response = await fetch(`${API_BASE_URL}/${truckId}/registrarAveria`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tipoAveria,
                    fechaHoraInicioAveria: formattedTime
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to register averia for truck ${truckId}`);
            }
        } catch (error) {
            console.error('Error registering averia:', error);
            throw error;
        }
    },

    // Check replanning status
    async checkReplanning() {
        try {
            const response = await fetch(`${API_BASE_URL}/is-replanning`);
            return await response.json();
        } catch (error) {
            console.error('Error checking replanning status:', error);
            return false;
        }
    },

    // Change order state
    async changeOrderState(truckId, pedidoId, nuevoEstado) {
        try {
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
        } catch (error) {
            console.error('Error changing order state:', error);
            throw error;
        }
    },

    // Fetch pedido estado at specific time
    async fetchPedidoEstado(pedidoId, time) {
        if (!time) return null;
        try {
            const pad = (num) => String(num).padStart(2, '0');
            const formattedTime = `${time.getFullYear()}-${pad(time.getMonth() + 1)}-${pad(time.getDate())}T${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}.${time.getMilliseconds()}`;
            const response = await fetch(`${API_BASE_URL}/estado-pedido/${pedidoId}?time=${formattedTime}`);
            if (!response.ok) {
                return null;
            }
            return await response.text();
        } catch (error) {
            //console.error(`Error fetching estado for pedido ${pedidoId}:`, error);
            return null;
        }
    },

    // Fetch info about the first logistics collapse (primer colapso)
    async fetchPrimerColapsoInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/primer-colapso-info`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            return null;
        }
    },

    // Fetch planification percentage
    async fetchPlanificationPercentage() {
        try {
            const response = await fetch(`${API_BASE_URL}/porcentaje-ejecucion`);
            if (!response.ok) {
                return null;
            }
            return await response.json();
        } catch (error) {
            return null;
        }
    }
}; 