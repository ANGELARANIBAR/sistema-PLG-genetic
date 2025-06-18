import { simulationService } from './simulationService';

const API_BASE_URL = 'http://localhost:8080/api/upload';

export const fileUploadService = {
    // Upload averias file
    async uploadAverias(file) {
        validateFile(file, ['txt']);
        await validateFileContent(file, 'averias');
        return uploadFile(file, 'averias');
    },

    // Upload bloqueos file
    async uploadBloqueos(file) {
        validateFile(file, ['txt']);
        await validateFileContent(file, 'bloqueos');
        return uploadFile(file, 'bloqueos');
    },

    // Upload mantenimiento file
    async uploadMantenimiento(file) {
        validateFile(file, ['txt']);
        await validateFileContent(file, 'mantenimiento');
        return uploadFile(file, 'mantenimiento');
    },

    // Upload pedidos file
    async uploadPedidos(file) {
        validateFile(file, ['txt']);
        await validateFileContent(file, 'pedidos');
        return uploadFile(file, 'pedidos');
    },

    // Execute replanification
    async executeReplanification() {
        return simulationService.executeSimulation();
    },
    
    // Check if files have been uploaded
    getUploadedStatus() {
        try {
            const status = localStorage.getItem('uploadedFilesStatus');
            return status ? JSON.parse(status) : {
                averias: false,
                bloqueos: false,
                mantenimiento: false,
                pedidos: false
            };
        } catch (e) {
            console.error('Error getting uploaded status:', e);
            return {
                averias: false,
                bloqueos: false,
                mantenimiento: false,
                pedidos: false
            };
        }
    }
};

// Helper function to upload file
async function uploadFile(file, endpoint) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error al cargar el archivo ${file.name}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error uploading ${endpoint} file:`, error);
        throw error;
    }
}

// Validate file type and size
function validateFile(file, allowedExtensions) {
    // Check if file exists
    if (!file) {
        throw new Error('No se ha seleccionado ningún archivo');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        throw new Error(`El archivo es demasiado grande. El tamaño máximo permitido es 5MB`);
    }
    
    // Check if file is empty
    if (file.size === 0) {
        throw new Error('El archivo está vacío');
    }

    // Check file extension
    const fileName = file.name || '';
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no permitido. Solo se permiten archivos: ${allowedExtensions.join(', ')}`);
    }
    
    return true;
}

// Validate file content based on file type
async function validateFileContent(file, fileType) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            
            // Check if file has content
            if (!content || content.trim() === '') {
                reject(new Error('El archivo está vacío'));
                return;
            }
            
            // Get non-comment lines
            const lines = content.split('\n')
                .filter(line => line.trim() !== '' && !line.trim().startsWith('#'));
                
            if (lines.length === 0) {
                reject(new Error('El archivo no contiene datos válidos, solo comentarios o líneas vacías'));
                return;
            }
            
            // Check if at least one line has comma-separated values
            const hasValidFormat = lines.some(line => line.includes(','));
            
            if (!hasValidFormat) {
                reject(new Error('El formato del archivo no es válido. Debe contener al menos una línea con valores separados por comas.'));
                return;
            }
            
            // Specific validations for each file type
            try {
                switch (fileType) {
                    case 'averias':
                        validateAveriasContent(lines);
                        break;
                    case 'bloqueos':
                        validateBloqueosContent(lines);
                        break;
                    case 'mantenimiento':
                        validateMantenimientoContent(lines);
                        break;
                    case 'pedidos':
                        validatePedidosContent(lines);
                        break;
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsText(file);
    });
}

// Validate averias file content
function validateAveriasContent(lines) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('#')) continue;
        
        const parts = line.split(',');
        if (parts.length < 3) {
            throw new Error(`Línea ${i+1}: Formato incorrecto. Se esperan al menos 3 valores (ID_CAMION,TURNO_OCURRENCIA,TIPO_AVERIA)`);
        }
        
        const idCamion = parseInt(parts[0].trim());
        const turnoOcurrencia = parseInt(parts[1].trim());
        const tipoAveria = parseInt(parts[2].trim());
        
        if (isNaN(idCamion)) {
            throw new Error(`Línea ${i+1}: ID_CAMION debe ser un número`);
        }
        
        if (isNaN(turnoOcurrencia)) {
            throw new Error(`Línea ${i+1}: TURNO_OCURRENCIA debe ser un número`);
        }
        
        if (isNaN(tipoAveria)) {
            throw new Error(`Línea ${i+1}: TIPO_AVERIA debe ser un número`);
        }
    }
}

// Validate bloqueos file content
function validateBloqueosContent(lines) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('#')) continue;
        
        const parts = line.split(',');
        if (parts.length < 4) {
            throw new Error(`Línea ${i+1}: Formato incorrecto. Se esperan al menos 4 valores (X_INICIO,Y_INICIO,X_FIN,Y_FIN)`);
        }
        
        const xInicio = parseInt(parts[0].trim());
        const yInicio = parseInt(parts[1].trim());
        const xFin = parseInt(parts[2].trim());
        const yFin = parseInt(parts[3].trim());
        
        if (isNaN(xInicio) || isNaN(yInicio) || isNaN(xFin) || isNaN(yFin)) {
            throw new Error(`Línea ${i+1}: Las coordenadas deben ser números`);
        }
    }
}

// Validate mantenimiento file content
function validateMantenimientoContent(lines) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('#')) continue;
        
        const parts = line.split(',');
        if (parts.length < 3) {
            throw new Error(`Línea ${i+1}: Formato incorrecto. Se esperan al menos 3 valores (CODIGO_CAMION,FECHA,DESCRIPCION)`);
        }
        
        const codigoCamion = parts[0].trim();
        const fecha = parts[1].trim();
        
        if (codigoCamion === '') {
            throw new Error(`Línea ${i+1}: CODIGO_CAMION no puede estar vacío`);
        }
        
        if (fecha === '') {
            throw new Error(`Línea ${i+1}: FECHA no puede estar vacía`);
        }
    }
}

// Validate pedidos file content
function validatePedidosContent(lines) {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '' || line.startsWith('#')) continue;
        
        const parts = line.split(',');
        if (parts.length < 8) {
            throw new Error(`Línea ${i+1}: Formato incorrecto. Se esperan al menos 8 valores (ID,X,Y,CANTIDAD_GLP,FECHA_ENTREGA,VENTANA_HORARIA_INICIO,VENTANA_HORARIA_FIN,PRIORIDAD)`);
        }
        
        const id = parseInt(parts[0].trim());
        const x = parseInt(parts[1].trim());
        const y = parseInt(parts[2].trim());
        const cantidadGLP = parseFloat(parts[3].trim());
        const prioridad = parseInt(parts[7].trim());
        
        if (isNaN(id)) {
            throw new Error(`Línea ${i+1}: ID debe ser un número`);
        }
        
        if (isNaN(x) || isNaN(y)) {
            throw new Error(`Línea ${i+1}: Las coordenadas X e Y deben ser números`);
        }
        
        if (isNaN(cantidadGLP) || cantidadGLP <= 0) {
            throw new Error(`Línea ${i+1}: CANTIDAD_GLP debe ser un número positivo`);
        }
        
        if (isNaN(prioridad) || prioridad < 1 || prioridad > 3) {
            throw new Error(`Línea ${i+1}: PRIORIDAD debe ser un número entre 1 y 3`);
        }
    }
} 