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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Error initializing fechaHoraInicio:', error);
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
            if (response.status === 202)
                return null; // o "accepted", "en proceso", etc.
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
            
        } catch (error) {
            console.error('Error executing simulation with fechaHoraInicio:', error);
            throw error;
        }
    },

    // Execute simulation without fechaHoraInicio (existing method)
    async executeSimulation() {
        try {
            const response = await fetch(`${API_BASE_URL}/ejecutar-simulacion`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error executing simulation:', error);
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

    // Get simulation percentage
    async getSimulationPercentage(simulationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/porcentajeSimulacion/${simulationId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting simulation percentage:', error);
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
    },
    
    // Check simulation status (combines percentage and replanning)
    async checkSimulationStatus(simulationId = 1) {
        try {
            const [percentage, isReplanning] = await Promise.all([
                this.getSimulationPercentage(simulationId),
                this.isReplanning()
            ]);
            
            return {
                percentage,
                isReplanning,
                isComplete: percentage >= 100
            };
        } catch (error) {
            console.error('Error checking simulation status:', error);
            return {
                percentage: 0,
                isReplanning: false,
                isComplete: false,
                error: error.message
            };
        }
    }
}; 