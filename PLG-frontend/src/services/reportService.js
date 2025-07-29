const API_BASE_URL = '/api/solution';

export const reportService = {
  // Get simulation statistics for the report
  async getSimulationReport() {
    try {
      const system = await this.getSystemData();
      const simulationStats = await this.getSimulationStats();
      
      if (!system) {
        throw new Error('No system data available');
      }

      // Calculate report data from system
      const totalPedidos = system.pedidos?.length || 0;
      const pedidosCompletados = system.pedidos?.filter(p => p.completado)?.length || 0;
      const volumenTotal = system.pedidos?.reduce((sum, p) => sum + (p.volumenGLP || 0), 0) || 0;
      const volumenEntregado = system.pedidos?.filter(p => p.completado)
        ?.reduce((sum, p) => sum + (p.volumenGLP || 0), 0) || 0;
      
      const totalCamiones = system.flota?.length || 0;
      const camionesEnRuta = await this.getCamionesEnRuta();
      const camionesDisponibles = totalCamiones - camionesEnRuta;
      
      // Calculate total fuel consumption from all trucks
      let consumoCombustible = 0;
      if (system.flota) {
        for (const truck of system.flota) {
          // Estimate fuel consumption based on route and operations
          consumoCombustible += truck.consumoCombustible || 0;
        }
      }

      return {
        pedidosCompletados,
        totalPedidos,
        volumenEntregado,
        volumenTotal,
        totalCamiones,
        camionesEnRuta,
        camionesDisponibles,
        consumoCombustible,
        fechaInicio: system.fechaHoraInicio,
        fechaFin: await this.getFechaFinSimulation(),
        duracionTotal: this.calculateDuration(system.fechaHoraInicio),
        sistemaOperativo: true
      };
      
    } catch (error) {
      console.error('Error getting simulation report:', error);
      throw error;
    }
  },

  // Get system data from backend
  async getSystemData() {
    try {
      const response = await fetch(`${API_BASE_URL}/system`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching system data:', error);
      throw error;
    }
  },

  // Get general simulation statistics
  async getSimulationStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/simulation-stats`);
      if (!response.ok) {
        // If endpoint doesn't exist, return default values
        return {};
      }
      return await response.json();
    } catch (error) {
      console.warn('Simulation stats endpoint not available:', error);
      return {};
    }
  },

  // Get number of trucks currently on route
  async getCamionesEnRuta() {
    try {
      const response = await fetch(`${API_BASE_URL}/camiones-en-ruta`);
      if (!response.ok) {
        return 0;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching camiones en ruta:', error);
      return 0;
    }
  },

  // Get final simulation time
  async getFechaFinSimulation() {
    try {
      const response = await fetch(`${API_BASE_URL}/fecha-hora-fin-entregas`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data ? new Date(data) : null;
    } catch (error) {
      console.error('Error fetching fecha fin simulation:', error);
      return null;
    }
  },

  // Calculate duration between start and now
  calculateDuration(fechaInicio) {
    if (!fechaInicio) return 'N/A';
    
    const inicio = new Date(fechaInicio);
    const ahora = new Date();
    const diffMs = ahora - inicio;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  },

  // Check if simulation is completed (for daily scenario)
  async isSimulationCompleted() {
    try {
      // Check if all pedidos are completed or if simulation has reached end time
      const system = await this.getSystemData();
      if (!system || !system.pedidos) return false;
      
      const totalPedidos = system.pedidos.length;
      const completedPedidos = system.pedidos.filter(p => p.completado).length;
      
      // Consider simulation completed if all pedidos are done or if we're in daily mode
      // and enough time has passed
      return completedPedidos === totalPedidos;
    } catch (error) {
      console.error('Error checking simulation completion:', error);
      return false;
    }
  },

  // Get pedidos statistics
  async getPedidosStats() {
    try {
      const response = await fetch('/api/pedidos/listarTodos');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const pedidos = await response.json();
      
      const totalPedidos = pedidos.length;
      const completados = pedidos.filter(p => p.completado).length;
      const pendientes = totalPedidos - completados;
      const volumenTotal = pedidos.reduce((sum, p) => sum + (p.volumenGLP || 0), 0);
      const volumenEntregado = pedidos.filter(p => p.completado)
        .reduce((sum, p) => sum + (p.volumenGLP || 0), 0);
      
      return {
        totalPedidos,
        completados,
        pendientes,
        volumenTotal,
        volumenEntregado
      };
    } catch (error) {
      console.error('Error fetching pedidos stats:', error);
      return {
        totalPedidos: 0,
        completados: 0,
        pendientes: 0,
        volumenTotal: 0,
        volumenEntregado: 0
      };
    }
  }
}; 