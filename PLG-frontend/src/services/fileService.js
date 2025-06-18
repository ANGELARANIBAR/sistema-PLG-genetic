import axios from 'axios';

const API_URL = 'http://localhost:8080/api/solution';

const fileService = {
  uploadFiles: async (files) => {
    const formData = new FormData();
    
    if (files.pedidos) formData.append('pedidos', files.pedidos);
    if (files.averias) formData.append('averias', files.averias);
    if (files.bloqueos) formData.append('bloqueos', files.bloqueos);
    if (files.planmantenimiento) formData.append('planmantenimiento', files.planmantenimiento);
    
    try {
      const response = await axios.post(`${API_URL}/upload-files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },
  
  getFilesStatus: async () => {
    try {
      const response = await axios.get(`${API_URL}/upload-files-status`);
      return response.data;
    } catch (error) {
      console.error('Error checking files status:', error);
      throw error;
    }
  },
  
  ejecutarSimulacion: async () => {
    try {
      const response = await axios.get(`${API_URL}/ejecutar-simulacion`);
      return response.data;
    } catch (error) {
      console.error('Error executing simulation:', error);
      throw error;
    }
  }
};

export default fileService; 