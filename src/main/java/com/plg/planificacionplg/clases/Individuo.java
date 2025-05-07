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

    public Individuo(int numPedidos, int numCamiones, SistemaPLG sistema, int code) {
        numCamiones += 1;
        numPedidos += 1;
        //if (sistema!=null)inicializarSistemaPLG(code, sistema);
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
            int camion=1+rand.nextInt(numCamiones-1);
            if(sistema.getCamionCausanteReplan()!=null){
                //Averia averiaActual = sistema.getCamionCausanteReplan().getAverias().getLast();
                while(sistema.getCamionCausanteReplan().getId()==(camion-1))camion = 1+rand.nextInt(numCamiones-1);
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

    private void inicializarSistemaPLG(int code, SistemaPLG sistema) {
        List<Camion> flota = new ArrayList<>();
        List<Pedido> pedidos = new ArrayList<>();
        List<Cisterna> cisternas = new ArrayList<>();
        sistemaPLG = new SistemaPLG(sistema);
        sistemaPLG.setCisternas(cisternas);
        sistemaPLG.setPedidos(pedidos);
        sistemaPLG.setFlota(flota);
        List<Pedido>asignacionesAveriadoTipo1=new ArrayList<>();
        if(sistema.getCamionCausanteReplan()!=null){
            if(sistema.getCamionCausanteReplan().getAverias().getLast().getTipo().getId()==1){
                asignacionesAveriadoTipo1 = sistema.getCamionCausanteReplan().getPedidosAsignados();
            }
        }
        for (Camion camion : sistema.getFlota()) {
            Camion c;
            c = new Camion(camion);
            if(code==1){
                c.setPedidosAsignados(new ArrayList<>());
                c.setDestinos(new ArrayList<>());
                c.setCombustibleEmpleado(0);
                c.setDistanciaTotal(0);
                c.setCargaGLPActual(0);
                c.setEstado(EstadoCamion.DISPONIBLE);
                c.setCombustibleActual(c.getTipo().getCapCombustibleMax());
            }else if (code==2){
                if(sistema.getCamionCausanteReplan()!=null) {
                    if (sistema.getCamionCausanteReplan().getAverias().getLast().getTipo().getId() == 1) {
                        c.setPedidosAsignados(asignacionesAveriadoTipo1);
                    }
                }
            }
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
    }

    public void evaluar(int code, SistemaPLG sistema) {
        fitness = 0.0;
        inicializarSistemaPLG(code, sistema);
        List<Camion> flota = sistemaPLG.getFlota();
        List<Pedido> pedidos = sistemaPLG.getPedidos();
        List<Cisterna> cisternas = sistemaPLG.getCisternas();
        for (Map.Entry<Integer, List<Integer>> entry : asignacion.entrySet()) {
            int camionIdx = entry.getKey();
            List<Integer> pedidosAsignados = entry.getValue();
            if (sistemaPLG.getCamionCausanteReplan() != null){
                if (pedidosAsignados.isEmpty() &&
                        sistemaPLG.getCamionCausanteReplan().getId()!=(camionIdx-1)) continue;
            }
            else if (pedidosAsignados.isEmpty()) continue;

            Camion camion = flota.get(camionIdx-1);
            camion.setEstado(EstadoCamion.EN_RUTA);
            for (int pedidoIdx : pedidosAsignados) {
                EntregaPedido entrega = new EntregaPedido();
                entrega.setId(pedidoIdx);
                entrega.setVolumenGLPEntregado(0.0);

                entrega.setPedido(pedidos.get(pedidoIdx-1));
                entrega.setUbicacion(pedidos.get(pedidoIdx-1).getUbicacion());
                camion.getPedidosAsignados().add(pedidos.get(pedidoIdx-1));
                camion.getDestinos().add(entrega);
            }

            Reabastecimiento retorno = new Reabastecimiento();
            retorno.setCisterna(sistemaPLG.getCisternas().get(0));
            retorno.setUbicacion(sistemaPLG.getCisternas().get(0).getUbicacion());
            retorno.setGLPOperacion(0.0);
            camion.getDestinos().add(retorno);

            camion.setCargasGLP(pedidosXcargasGLP.get(camionIdx));
            double GLPInicial=0.0;
            camion.setIndicePedidoActual(0);
            for(int i=0; i < pedidosXcargasGLP.get(camionIdx).get(0); i++){
                GLPInicial += camion.getPedidosAsignados().get(i).getVolumenGLP();
            }
            if(camion.getTipo().getCargaGLPMax()<GLPInicial){
                fitness = 0.0;
                return;
            }
            //camion.setCargaGLPActual(camion.getDestinos().get(1).getPedido().getVolumenGLP());
            if(code==1) {
                Reabastecimiento origen = new Reabastecimiento();
                origen.setCisterna(cisternas.get(0));
                origen.setUbicacion(cisternas.get(0).getUbicacion());
                origen.setFechaHoraSalida(sistema.getFechaHoraInicio()); //primera solucion a evaluar

                cisternas.get(0).registrarRetiroGLP(sistemaPLG.getFechaHoraInicio(),
                        GLPInicial, camion);
                camion.setCargaGLPActual(GLPInicial);
                camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());
                camion.getDestinos().add(0, origen);
                origen.setSaldoGLPCamion(GLPInicial);
                origen.setSaldoCombustibleCamion(camion.getCombustibleActual());
            }
            else if(code==2){
                if(sistema.getFlota().get(camion.getId()-1).getDestinos().get(0)!=null){
                    camion.getDestinos().add(0, new Replanficacion((Replanficacion)sistema.getFlota().get(camion.getId()-1).getDestinos().get(0)));
                    camion.setCargaGLPActual(sistema.getFlota().get(camion.getId()-1).getCargaGLPActual());
                    if(camion.getCargaGLPActual()<GLPInicial){
                        fitness = 0.0;
                        return;
                    }
                    camion.setCombustibleActual(sistema.getFlota().get(camion.getId()-1).getCombustibleActual());
                }
            }


            if (camion.construirRutaHaciaPedido(sistemaPLG) == -1) {
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

    public Individuo clonar(int code) {
        Individuo copia = new Individuo(0, 0, sistemaPLG, code);
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
