const API_BASE_URL = 'http://localhost:8080/api/solution';

export const fileService = {
  uploadFiles: async (files) => {
    const formData = new FormData();
    
    if (files.pedidos) formData.append('pedidos', files.pedidos);
    if (files.averias) formData.append('averias', files.averias);
    if (files.bloqueos) formData.append('bloqueos', files.bloqueos);
    if (files.planmantenimiento) formData.append('planmantenimiento', files.planmantenimiento);
    
    try {
      const response = await fetch(`${API_BASE_URL}/upload-files`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },
  
  getFilesStatus: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/upload-files-status`);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking files status:', error);
      throw error;
    }
  },
  
  ejecutarSimulacion: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ejecutar-simulacion`);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error executing simulation:', error);
      throw error;
    }
  },
  
  getPorcentajeEjecucion: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/porcentaje-ejecucion`);
      
      if (!response.ok) {
        throw new Error('Failed to get execution percentage');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting execution percentage:', error);
      throw error;
    }
  }
};

export default fileService; 