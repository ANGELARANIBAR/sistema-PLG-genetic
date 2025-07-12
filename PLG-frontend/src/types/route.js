// PLG-frontend/src/types/route.js
// Type definitions for the map visualization

export const TruckRoute = {
  truckId: Number,
  plate: String,
  codigo: String,
  fuelConsumed: Number,
  currentFuel: Number,
  currentGLP: Number,
  destinations: Array,
  velocidad: Number
};

export const Destination = {
  arrivalTime: String,
  departureTime: String,
  fuelConsumed: Number,
  orderId: Number,
  orderNumber: String,
  maxDeliveryTime: String,
  route: Array,
  destinationType: String,
  saldoGLPCamion: Number
};

export const Node = {
  x: Number,
  y: Number
};

export const Cisterna = {
  id: Number,
  principal: Boolean,
  ubicacion: Node,
  cargaGLPActual: Number,
  capacidadTotal: Number,
  horaAbastecimento: String,
  operacionesGLPCisterna: Array
};

export const OperacionGLPCisterna = {
  saldoGLP: Number,
  cantSalidaGLP: Number,
  fechaHoraOperacion: String,
  placaCamion: String
};

export const Pedido = {
  id: Number,
  numeroPedido: String,
  volumenGLP: Number,
  ubicacion: Node,
  fechaHoraRegistro: String,
  tiempoMaxEntrega: Number,
  fechaHoraMaxEntrega: String,
  estado: String,
  completado: Boolean,
  consumoCombustibleTotal: Number
};

export const Bloqueo = {
  fechaHoraInicio: String,
  fechaHoraFin: String,
  rutasBloqueadas: Array
};

export const SistemaPLG = {
  flota: Array,
  cisternas: Array,
  pedidos: Array,
  bloqueos: Array,
  distanciaManzana: Number,
  maxXmapa: Number,
  maxYmapa: Number,
  fechaHoraInicio: String,
  averiaStartTime: String
}; 