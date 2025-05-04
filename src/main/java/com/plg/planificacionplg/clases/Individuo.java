package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.*;

@Data
public class Individuo {
    private Map<Integer, List<Integer>> asignacion; // camión -> lista ordenada de pedidos
    private Map<Integer, List<Integer>> pedidosXcargasGLP; // camión -> buscar carga de GLP deacuerdo a atencion de pedidos

    private double fitness;
    private SistemaPLG sistemaPLG;

    public Individuo(int numPedidos, int numCamiones) {
        numCamiones += 1;
        numPedidos += 1;
        asignacion = new HashMap<>();
        pedidosXcargasGLP = new HashMap<>();
        for (int i = 1; i < numCamiones; i++) {
            asignacion.put(i, new ArrayList<>());
        }

        // Asignar pedidos aleatoriamente a camiones (no necesariamente todos los camiones activos)
        List<Integer> pedidos = new ArrayList<>();

        for (int i = 1; i < numPedidos; i++) pedidos.add(i);
        Collections.shuffle(pedidos);

        Random rand = new Random();
        for (int pedido : pedidos) {
            int camion = 0;
            while(camion == 0){
                camion = rand.nextInt(numCamiones);
            }
            asignacion.get(camion).add(pedido);
        }
        for (int i = 1; i < numCamiones; i++) {
            List<Integer> cargasGLP = new ArrayList<>();
            Random randCargaGLP = new Random();
            int cantPedRestantes = asignacion.get(i).size(), acc = 0;
            while(cantPedRestantes > 0){
                int cantPedObjetivos = 1+randCargaGLP.nextInt(cantPedRestantes); //minimo 1
                acc += cantPedObjetivos;
                cargasGLP.add(acc);
                cantPedRestantes -= cantPedObjetivos;
            }
            pedidosXcargasGLP.put(i, cargasGLP);
        }

    }

    public void evaluar(SistemaPLG sistema) {
        fitness = 0.0;
        // Reiniciar estado de camiones
        List<Camion> flota = new ArrayList<>();
        List<Pedido> pedidos = new ArrayList<>();
        List<Cisterna> cisternas = new ArrayList<>();
        SistemaPLG sistemaCopia = new SistemaPLG(sistema);
        sistemaPLG = sistemaCopia; //solucion de cada Individuo
        sistemaCopia.setCisternas(cisternas);
        sistemaCopia.setPedidos(pedidos);
        sistemaCopia.setFlota(flota);
        for (Camion camion : sistema.getFlota()) {
            Camion c = new Camion(camion);
            c.setDestinos(new ArrayList<>());
            c.setCombustibleEmpleado(0);
            c.setDistanciaTotal(0);
            c.setCargaGLPActual(0);
            c.setCombustibleActual(c.getTipo().getCapCombustibleMax());
            flota.add(c);
        }
        for(Pedido pedido: sistema.getPedidos()){
            Pedido p = new Pedido(pedido);
            pedidos.add(p);
            p.setEstado(EstadoPedido.PENDIENTE);
            p.setFechaHoraEntrega(null);
            p.setCamiones(new ArrayList<>());
            p.setCompletado(false);
            p.setConsumoCombustibleTotal(0.0);
            p.setVolumenGLPEntregado(0.0);//solo util cuando completado es false y el pedido es entregado parcialmente
        }
        for(Cisterna cisterna: sistema.getCisternas()){
            Cisterna cis = new Cisterna(cisterna);
            cis.setCargaGLPActual(cis.getCapacidadTotal());
            cis.setOperacionesGLPCisterna(new ArrayList<>());
            cisternas.add(cis);
        }
        for (Map.Entry<Integer, List<Integer>> entry : asignacion.entrySet()) {
            int camionIdx = entry.getKey();
            List<Integer> pedidosAsignados = entry.getValue();

            Reabastecimiento origen = new Reabastecimiento();
            origen.setCisterna(cisternas.get(0));
            origen.setUbicacion(cisternas.get(0).getUbicacion());
            origen.setFechaHoraSalida(sistema.getFechaHoraInicio()); //primera solucion a evaluar
            if (pedidosAsignados.isEmpty()) continue;

            Camion camion = flota.get(camionIdx-1);
            for (int pedidoIdx : pedidosAsignados) {
                EntregaPedido entrega = new EntregaPedido();
                entrega.setId(pedidoIdx);
                entrega.setVolumenGLPEntregado(0.0);

                entrega.setPedido(pedidos.get(pedidoIdx-1));
                entrega.setUbicacion(pedidos.get(pedidoIdx-1).getUbicacion());
                camion.getPedidosAsignados().add(pedidos.get(pedidoIdx-1));
                camion.getDestinos().add(entrega);
            }


            camion.setCargasGLP(pedidosXcargasGLP.get(camionIdx));
            double GLPInicial=0.0;
            camion.setIndicePedidoActual(0);
            for(int i=0; i < pedidosXcargasGLP.get(camionIdx).get(0); i++){
                GLPInicial += camion.getPedidosAsignados().get(i).getVolumenGLP();
            }
            cisternas.get(0).registrarRetiroGLP(sistemaCopia.getFechaHoraInicio(),
                    GLPInicial, camion);
            if(camion.getTipo().getCargaGLPMax()<GLPInicial)return;
            //camion.setCargaGLPActual(camion.getDestinos().get(1).getPedido().getVolumenGLP());
            camion.setCargaGLPActual(GLPInicial);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());
            origen.setSaldoGLPCamion(GLPInicial);
            origen.setSaldoCombustibleCamion(camion.getCombustibleActual());
            camion.getDestinos().add(0, origen);

            if (camion.construirRutaHaciaPedido(sistemaCopia) == -1) {
                fitness = 0.0;
                return;
            }
        }

        // Evaluar desempeño (ej: eficiencia: distancia/combustible)
        double totalDistancia = 0;
        double totalCombustible = 0;

        for (Camion c : flota) {
            if (!c.getDestinos().isEmpty()) {
                totalDistancia += c.getDistanciaTotal();
                totalCombustible += c.getCombustibleEmpleado();
            }
        }

        //fitness = totalDistancia / (totalCombustible + 1e-5); // evitar división por cero
        fitness = 10000 / (totalCombustible + 1e-5); // evitar división por cero

    }

    public Individuo clonar() {
        Individuo copia = new Individuo(0, 0);
        Map<Integer, List<Integer>> nuevaAsignacion = new HashMap<>();
        for (Map.Entry<Integer, List<Integer>> entry : asignacion.entrySet()) {
            nuevaAsignacion.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        Map<Integer, List<Integer>> nuevacargaGLP = new HashMap<>();
        for (Map.Entry<Integer, List<Integer>> entry : pedidosXcargasGLP.entrySet()) {
            nuevacargaGLP.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        copia.setAsignacion(nuevaAsignacion);
        copia.setPedidosXcargasGLP(nuevacargaGLP);
        copia.fitness = this.fitness;
        copia.sistemaPLG = this.sistemaPLG;

        return copia;
    }

    public void imprimirAsignacion() {
        for (Map.Entry<Integer, List<Integer>> entry : asignacion.entrySet()) {
            if (!entry.getValue().isEmpty()) {
                System.out.println("Camión " + entry.getKey() + ": " + entry.getValue());
            }
        }
    }
}
