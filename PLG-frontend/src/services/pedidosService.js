const API_BASE_URL = 'http://localhost:8080/api/pedidos';

export const pedidosService = {
    // Fetch all pedidos
    async fetchPedidos() {
      try {
        const response = await fetch(API_BASE_URL); 
        if (!response.ok) {
          throw new Error('Error al obtener pedidos');
        }
        return await response.json(); 
      } catch (error) {
        console.error('Error fetching pedidos:', error);
        throw error;
      }
    },

    // Fetch all pedidos with fresh data (no cache)
    async fetchPedidosFresh() {
      try {
        const response = await fetch(`${API_BASE_URL}/listarTodos?t=${Date.now()}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }); 
        if (!response.ok) {
          throw new Error('Error al obtener pedidos frescos');
        }
        return await response.json(); 
      } catch (error) {
        console.error('Error fetching fresh pedidos:', error);
        throw error;
      }
    },
    // Create a new pedido
    async createPedido(pedido) {
        try {
            const response = await fetch(`${API_BASE_URL}/registrar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pedido),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating pedido:', error);
            throw error;
        }
    },
    // Create multiple pedidos
    async createMultiplePedidos(pedidos) {
        try {
            const response = await fetch(`${API_BASE_URL}/registrar-masivo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pedidos),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            console.error('Error creating multiple pedidos:', error);
            throw error;
        }
    }
}; 