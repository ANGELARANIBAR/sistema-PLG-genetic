export interface TruckRoute {
  truckId: number;
  plate: string;
  codigo: string;
  fuelConsumed: number;
  currentFuel: number;
  currentGLP: number;
  destinations: Destination[];
}

export interface Destination {
  arrivalTime: string | null;
  departureTime: string | null;
  fuelConsumed: number;
  orderId: number | null;
  orderNumber: string | null;
  maxDeliveryTime: string | null;
  route: Node[] | null;
  destinationType: string;
  saldoGLPCamion: number;
}

export interface Node {
  x: number;
  y: number;
}

export interface Cisterna {
  id: number;
  principal: boolean;
  ubicacion: Node;
  cargaGLPActual: number;
  capacidadTotal: number;
  horaAbastecimento: string;
  operacionesGLPCisterna: OperacionGLPCisterna[];
}

export interface OperacionGLPCisterna {
  saldoGLP: number;
  cantSalidaGLP: number;
  fechaHoraOperacion: string;
  placaCamion: string;
}

export interface Pedido {
  id: number;
  numeroPedido: string;
  volumenGLP: number;
  ubicacion: Node;
  fechaHoraRegistro: string;
  tiempoMaxEntrega: number;
  fechaHoraMaxEntrega: string;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'REASIGNADO';
  completado: boolean;
  consumoCombustibleTotal: number;
}

export interface Bloqueo {
  fechaHoraInicio: string;
  fechaHoraFin: string;
  rutasBloqueadas: Node[];
}

export interface SistemaPLG {
  flota: TruckRoute[];
  cisternas: Cisterna[];
  pedidos: Pedido[];
  bloqueos: Bloqueo[];
  distanciaManzana: number;
  maxXmapa: number;
  maxYmapa: number;
  fechaHoraInicio: string;
  averiaStartTime?: string | null;
}
