import { simulationService } from './simulationService';

const API_BASE_URL = 'http://localhost:8080/api/upload';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const fileUploadService = {
    // Upload averias file
    async uploadAverias(file) {
        validateFile(file, ['.txt']);
        return uploadFile(file, 'averias');
    },

    // Upload bloqueos file
    async uploadBloqueos(file) {
        validateFile(file, ['.txt']);
        return uploadFile(file, 'bloqueos');
    },

    // Upload mantenimiento file
    async uploadMantenimiento(file) {
        validateFile(file, ['.txt']);
        return uploadFile(file, 'mantenimiento');
    },

    // Upload pedidos file
    async uploadPedidos(file) {
        validateFile(file, ['.txt']);
        return uploadFile(file, 'pedidos');
    },

    // Execute replanification
    async executeReplanification() {
        return simulationService.executeSimulation();
    }
};

// Validate file type and size
function validateFile(file, allowedExtensions) {
    if (!file) {
        throw new Error('No se ha seleccionado ningún archivo');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`El archivo es demasiado grande. El tamaño máximo permitido es ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check file extension
    const fileName = file.name || '';
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no válido. Los formatos permitidos son: ${allowedExtensions.join(', ')}`);
    }
}

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