const API_BASE_URL = 'http://localhost:8080/api/solution';

export const fileUploadService = {
  // Upload all files at once
  async uploadFiles(averiasFile, bloqueosFile, pedidosFile, planMantenimientoFile, ejecutarSimulacion = false) {
    try {
      console.log('Iniciando carga de archivos:');
      const formData = new FormData();
      
      if (averiasFile) {
        console.log(`- Archivo de averías: ${averiasFile.name} (${averiasFile.size} bytes)`);
        formData.append('averias', averiasFile);
      } else {
        console.log('- No se ha seleccionado archivo de averías');
      }
      
      if (bloqueosFile) {
        console.log(`- Archivo de bloqueos: ${bloqueosFile.name} (${bloqueosFile.size} bytes)`);
        formData.append('bloqueos', bloqueosFile);
      } else {
        console.log('- No se ha seleccionado archivo de bloqueos');
      }
      
      if (pedidosFile) {
        console.log(`- Archivo de pedidos: ${pedidosFile.name} (${pedidosFile.size} bytes)`);
        formData.append('pedidos', pedidosFile);
      } else {
        console.log('- No se ha seleccionado archivo de pedidos');
      }
      
      if (planMantenimientoFile) {
        console.log(`- Archivo de plan de mantenimiento: ${planMantenimientoFile.name} (${planMantenimientoFile.size} bytes)`);
        formData.append('planMantenimiento', planMantenimientoFile);
      } else {
        console.log('- No se ha seleccionado archivo de plan de mantenimiento');
      }
      
      console.log(`- Ejecutar simulación: ${ejecutarSimulacion ? 'Sí' : 'No'}`);
      formData.append('ejecutarSimulacion', ejecutarSimulacion);
      
      console.log('Enviando archivos al servidor...');
      const response = await fetch(`${API_BASE_URL}/upload-files`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error en la respuesta del servidor: ${response.status} ${response.statusText}`);
        console.error(`Detalle del error: ${errorText}`);
        throw new Error(`Error al cargar archivos: ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log(`Respuesta del servidor: ${responseText}`);
      return responseText;
    } catch (error) {
      console.error('Error en la carga de archivos:', error);
      throw error;
    }
  }
}; 