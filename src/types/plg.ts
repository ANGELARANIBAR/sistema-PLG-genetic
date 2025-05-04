export interface Nodo {
    posX: number;
    posY: number;
}

export interface Cisterna {
    id: number;
    principal: boolean;
    cargaGLPActual: number;
    ubicacion: Nodo;
    horaAbastecimento: string;
}

export interface Pedido {
    id: number;
    numeroPedido: string;
    volumenGLP: number;
    ubicacion: Nodo;
    fechaHoraRegistro: string;
    fechaHoraEntrega: string;
    tiempoMaxEntrega: number;
    fechaHoraMaxEntrega: string;
    estado: 'PENDIENTE' | 'ENTREGADO' | 'CANCELADO';
    completado: boolean;
    camiones: Camion[];
    consumoCombustibleTotal: number;
}

export interface TipoCamion {
    tara: number;
    capCombustibleMax: number;
    velocidadPromedio: number;
    pesoGLPMax: number;
    cargaGLPMax: number;
}

export interface Camion {
    id: number;
    tipo: TipoCamion;
    placa: string;
    combustibleActual: number;
    destinos: Destino[];
}

export interface Destino {
    ubicacion: Nodo;
    fechaHoraLlegada: string;
    fechaHoraSalida: string;
    ruta: Ruta;
}

export interface Ruta {
    nodos: Nodo[];
    distanciaTotal: number;
    tiempoEmpleado: number;
}

export interface SistemaPLG {
    cisternas: Cisterna[];
    flota: Camion[];
    bloqueos: any[];
    maxXmapa: number;
    maxYmapa: number;
    pedidos: Pedido[];
    distanciaManzana: number;
    fechaHoraInicio: string;
}

export interface Individuo {
    sistemaPLG: SistemaPLG;
    fitness: number;
} 