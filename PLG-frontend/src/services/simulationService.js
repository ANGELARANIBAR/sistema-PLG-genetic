const API_BASE_URL = 'http://localhost:8080/api/solution';
const UPLOAD_API_URL = 'http://localhost:8080/api/upload';

export const simulationService = {
    // Upload pedidos file
    async uploadPedidosFile(file) {
        return uploadFile(file, 'pedidos');
    },

    // Upload bloqueos file
    async uploadBloqueosFile(file) {
        return uploadFile(file, 'bloqueos');
    },

    // Upload averias file
    async uploadAveriasFile(file) {
        return uploadFile(file, 'averias');
    },

    // Upload mantenimiento file
    async uploadMantenimientoFile(file) {
        return uploadFile(file, 'mantenimiento');
    },

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
    }
};

// Helper function to upload files
async function uploadFile(file, fileType) {
    if (!file) {
        throw new Error('No file selected');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${UPLOAD_API_URL}/${fileType}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al cargar el archivo: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error uploading ${fileType} file:`, error);
        throw error;
    }
} 