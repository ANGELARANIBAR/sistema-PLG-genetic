const API_BASE_URL = 'http://localhost:8080/api/solution';

export const fileUploadService = {
  // Upload all files at once
  async uploadFiles(averiasFile, bloqueosFile, pedidosFile, planMantenimientoFile, ejecutarSimulacion = false) {
    try {
      const formData = new FormData();
      
      if (averiasFile) {
        formData.append('averias', averiasFile);
      }
      
      if (bloqueosFile) {
        formData.append('bloqueos', bloqueosFile);
      }
      
      if (pedidosFile) {
        formData.append('pedidos', pedidosFile);
      }
      
      if (planMantenimientoFile) {
        formData.append('planMantenimiento', planMantenimientoFile);
      }
      
      formData.append('ejecutarSimulacion', ejecutarSimulacion);
      
      const response = await fetch(`${API_BASE_URL}/upload-files`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al cargar archivos: ${errorText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  }
}; 