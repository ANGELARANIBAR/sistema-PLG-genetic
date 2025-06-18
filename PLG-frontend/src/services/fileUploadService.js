import axios from 'axios';
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
        const response = await axios.post(`${API_BASE_URL}/${fileType}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error uploading ${fileType} file:`, error);
        throw error;
    }
} 