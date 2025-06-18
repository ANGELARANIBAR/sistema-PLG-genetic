const API_BASE_URL = 'http://localhost:8080/api/solution';

export const simulationService = {
    // Initialize fechaHoraInicio
    async initializeFechaHora(fechaHoraInicio) {
        try {
            const response = await fetch(`${API_BASE_URL}/inicializar-fecha-hora`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fechaHoraInicio: fechaHoraInicio
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Error initializing fechaHoraInicio:', error);
            throw error;
        }
    },

    // Execute simulation
    async executeSimulation() {
        try {
            const response = await fetch(`${API_BASE_URL}/ejecutar-simulacion`, {
                method: 'POST'
            });
            
            if (response.status === 202) {
                return { message: "Simulación iniciada correctamente" };
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing simulation:', error);
            throw error;
        }
    },

    // Execute simulation with fechaHoraInicio
    async executeSimulationWithFecha(fechaHoraInicio) {
        try {
            const response = await fetch(`${API_BASE_URL}/ejecutar-simulacion-con-fecha`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fechaHoraInicio: fechaHoraInicio
                })
            });
            
            if (response.status === 202) {
                return { message: "Simulación iniciada correctamente" };
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing simulation with fechaHoraInicio:', error);
            throw error;
        }
    },

    // Get start time
    async getStartTime() {
        try {
            const response = await fetch(`${API_BASE_URL}/start-time`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting start time:', error);
            throw error;
        }
    },

    // Get simulation progress
    async getSimulationProgress(simulationId = 1) {
        try {
            const response = await fetch(`${API_BASE_URL}/porcentajeSimulacion/${simulationId}`);
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error getting simulation progress:', error);
            throw error;
        }
    },

    // Check if replanning is active
    async isReplanning() {
        try {
            const response = await fetch(`${API_BASE_URL}/is-replanning`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error checking replanning status:', error);
            throw error;
        }
    }
}; 