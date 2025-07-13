export const fetchFlota = async () => {
  // First try to get data from the real simulation
  let response = await fetch('/api/solution/system'); 
  if (!response.ok) {
    throw new Error('Error al obtener datos de la flota');
  }
  let data = await response.json();
  
  // If the real system has fleet data, use it
  if (data.flota && data.flota.length > 0) {
    return data.flota;
  }
  
  // If no real simulation data, try the initial system
  response = await fetch('/api/solution/initial-system');
  if (!response.ok) {
    throw new Error('Error al obtener datos de la flota inicial');
  }
  data = await response.json();
  return data.flota || [];
};

export const fetchTipoCamiones = async () => {
  // This would typically come from a dedicated endpoint
  // For now, we'll return the known truck types from the backend
  return [
    { id: 1, codigo: 'TA', tara: 2.5, pesoGLPMax: 12.5, cargaGLPMax: 25, capCombustibleMax: 25, velocidadPromedio: 5.0/6.0 },
    { id: 2, codigo: 'TB', tara: 2.0, pesoGLPMax: 7.5, cargaGLPMax: 15, capCombustibleMax: 25, velocidadPromedio: 5.0/6.0 },
    { id: 3, codigo: 'TC', tara: 1.5, pesoGLPMax: 5.0, cargaGLPMax: 10, capCombustibleMax: 25, velocidadPromedio: 5.0/6.0 },
    { id: 4, codigo: 'TD', tara: 1.0, pesoGLPMax: 2.5, cargaGLPMax: 5, capCombustibleMax: 25, velocidadPromedio: 5.0/6.0 }
  ];
};

export const addNuevoCamion = async (camionData) => {
  const response = await fetch('/api/solution/add-truck', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(camionData)
  });
  
  if (!response.ok) {
    throw new Error('Error al agregar nuevo camión');
  }
  
  return await response.json();
}; 