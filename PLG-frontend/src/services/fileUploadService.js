import { simulationService } from './simulationService';

const API_BASE_URL = 'http://localhost:8080/api/upload';

export const fileUploadService = {
    // Upload averias file
    async uploadAverias(file) {
        return uploadFile(file, 'averias');
    },

    // Upload bloqueos file
    async uploadBloqueos(file) {
        return uploadFile(file, 'bloqueos');
    },

    // Upload mantenimiento file
    async uploadMantenimiento(file) {
        return uploadFile(file, 'mantenimiento');
    },

    // Upload pedidos file
    async uploadPedidos(file) {
        return uploadFile(file, 'pedidos');
    },

    // Execute replanification
    async executeReplanification() {
        return simulationService.executeSimulation();
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
        const response = await fetch(`${API_BASE_URL}/${fileType}`, {
            method: 'POST',
            body: formData
            // No need to specify Content-Type header with FormData, 
            // browser sets it automatically with the correct boundary
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error uploading ${fileType} file:`, error);
        throw error;
    }
} 