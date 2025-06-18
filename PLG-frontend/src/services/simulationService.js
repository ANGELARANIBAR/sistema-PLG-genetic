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

    // Upload files (pedidos, averias, bloqueos, planmantenimiento)
    async uploadFiles(files) {
        try {
            const formData = new FormData();
            
            // Add files to FormData if they exist
            if (files.pedidos) formData.append('pedidos', files.pedidos);
            if (files.averias) formData.append('averias', files.averias);
            if (files.bloqueos) formData.append('bloqueos', files.bloqueos);
            if (files.planmantenimiento) formData.append('planmantenimiento', files.planmantenimiento);
            
            const response = await fetch(`${API_BASE_URL}/upload-files`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error uploading files:', error);
            throw error;
        }
    },
    
    // Check files status
    async getFilesStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/upload-files-status`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error checking files status:', error);
            throw error;
        }
    }
}; 