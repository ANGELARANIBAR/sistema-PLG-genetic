export const fetchPedidos = async () => {
  const response = await fetch('/api/pedidos'); 
  if (!response.ok) {
    throw new Error('Error al obtener pedidos');
  }
  return await response.json(); 
};