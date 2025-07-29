package com.plg.planificacionplg.monitor;

import com.plg.planificacionplg.PlanificacionPlgApplication;
import com.plg.planificacionplg.clases.*;
import com.plg.planificacionplg.dto.PedidoDTO;
import com.plg.planificacionplg.services.PedidoService;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

public class PedidoMonitor {

    private final PedidoService pedidoService;
    private Set<Integer> idsPedidosPrevios = new HashSet<>();
    private ScheduledExecutorService executor;

    public PedidoMonitor(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    public void iniciar() {
        List<PedidoDTO> listaInicial = pedidoService.listarTodosDTO();
        listaInicial.forEach(p -> idsPedidosPrevios.add(p.getId()));

        executor = Executors.newSingleThreadScheduledExecutor();
        executor.scheduleAtFixedRate(this::verificarNuevosPedidos, 0, 1, TimeUnit.MINUTES);
    }

    public void detener() {
        if (executor != null && !executor.isShutdown()) {
            executor.shutdown();
        }
    }

    private void verificarNuevosPedidos() {
        List<PedidoDTO> listaActual = pedidoService.listarTodosDTO();

        Set<Integer> idsActuales = listaActual.stream()
                .map(PedidoDTO::getId)
                .collect(Collectors.toSet());

        Set<Integer> nuevos = new HashSet<>(idsActuales);
        nuevos.removeAll(idsPedidosPrevios);

        if (!nuevos.isEmpty()) {
            List<Pedido> pedidosNuevos = listaActual.stream()
                    .filter(p -> nuevos.contains(p.getId()))
                    .map(Pedido::new) // usa el constructor Pedido(PedidoDTO)
                    .toList();


            System.out.println("📦 Nuevos pedidos detectados: " + nuevos);
            idsPedidosPrevios = idsActuales;
            //replanificar
            Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
            SistemaPLG replanificado = new SistemaPLG();
            replanificado.deepCopy(mejorSolucion.getSistemaPLG());
            //recibir tiempo simulado o si no es simulado el itempo real
            LocalDateTime inicioReplan = LocalDateTime.now().plusSeconds(2);
            List<Pedido>pedidosPendientes = new ArrayList<>();List<Integer>idxPedPendientes = new ArrayList<>();
            List<Pedido>pedidosEnCurso = new ArrayList<>();
            List<Camion>camionesReplan = new ArrayList<>();
            replanificado.setFechaHoraInicio(inicioReplan);
            boolean primerPedidoEncontrado, considerarPrimerPedido;
            //pedidos que dentro de 2 minutos no estaran completados o en proceso, osea en ruta hacia esos pedidos en la sol actual
            for(Camion c : mejorSolucion.getSistemaPLG().getFlota()){
                Destino anterior = null;
                Camion nuevoCamion = new Camion(c);
                nuevoCamion.setDestinos(new ArrayList<>());
                primerPedidoEncontrado = true;
                considerarPrimerPedido = true;
                if(c.getDestinos().size()<3){
                    Reabastecimiento origen = new Reabastecimiento();
                    origen.setCisterna(mejorSolucion.getSistemaPLG().getCisternas().get(0));
                    origen.setUbicacion(mejorSolucion.getSistemaPLG().getCisternas().get(0).getUbicacion());
                    origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                    replanificado.getCisternas().get(0).registrarRetiroGLP(mejorSolucion.getSistemaPLG().getFechaHoraInicio(),
                            0.0, nuevoCamion);
                    nuevoCamion.setCargaGLPActual(0.0);
                    nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                    nuevoCamion.getDestinos().add(0, origen);
                    origen.setSaldoGLPCamion(0.0);
                    origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                    camionesReplan.add(nuevoCamion);
                }
                else for(Destino d : c.getDestinos()){
                    if(d.getFechaHoraSalida()!=null && !d.getFechaHoraSalida().isBefore(inicioReplan)){
                        if(primerPedidoEncontrado){
                            if(d.getFechaHoraLlegada() == null){
                                Reabastecimiento origen = new Reabastecimiento();
                                origen.setCisterna(mejorSolucion.getSistemaPLG().getCisternas().get(0));
                                origen.setUbicacion(mejorSolucion.getSistemaPLG().getCisternas().get(0).getUbicacion());
                                origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                                replanificado.getCisternas().get(0).registrarRetiroGLP(mejorSolucion.getSistemaPLG().getFechaHoraInicio(),
                                        0.0, nuevoCamion);
                                nuevoCamion.setCargaGLPActual(0.0);
                                nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                                nuevoCamion.getDestinos().add(0, origen);
                                origen.setSaldoGLPCamion(0.0);
                                origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                                nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                            }
                            else{
                                if(d.getFechaHoraLlegada().isAfter(inicioReplan)){
                                    //replanificacion
                                    Replanficacion origenReplan = new Replanficacion();
                                    origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(c.getId()-1).calcularUbicacion(inicioReplan));
                                    origenReplan.setFechaHoraLlegada(inicioReplan);
                                    origenReplan.setFechaHoraSalida(inicioReplan);
                                    origenReplan.setGLPOperacion(0.0);
                                    if(anterior==null) {
                                        origenReplan.setSaldoGLPCamion(0.0);
                                        nuevoCamion.setCargaGLPActual(0.0);
                                    }
                                    else{
                                        origenReplan.setSaldoGLPCamion(anterior.getSaldoGLPCamion());
                                        nuevoCamion.setCargaGLPActual(anterior.getSaldoGLPCamion());
                                    }
                                    origenReplan.setSaldoCombustibleCamion(d.getSaldoCombustibleCamion());
                                    nuevoCamion.getDestinos().add(origenReplan);
                                }
                                else{
                                    //en el destino actual
                                    if(d instanceof EntregaPedido){
                                        pedidosEnCurso.add(d.getPedido());
                                        considerarPrimerPedido = false;
                                    }
                                    nuevoCamion.getDestinos().add(d.copiar());
                                    nuevoCamion.setCargaGLPActual(d.getSaldoGLPCamion());
                                    nuevoCamion.setCombustibleActual(d.getSaldoCombustibleCamion());
                                }
                            }
                            camionesReplan.add(nuevoCamion);
                            primerPedidoEncontrado = false;
                        }
                        if(d instanceof EntregaPedido && considerarPrimerPedido){
                            idxPedPendientes.add(d.getPedido().getId());
                            Pedido pendiente = new Pedido(d.getPedido());
                            pedidosPendientes.add(pendiente);
                            pendiente.setId(pedidosPendientes.size());
                        }
                    }
                    anterior = d;
                }
            }
            replanificado.setFlota(camionesReplan);
            replanificado.setPedidos(pedidosPendientes);

            for (Pedido n : pedidosNuevos){
                replanificado.getPedidos().add(n);
                n.setId(replanificado.getPedidos().size());
            }

            int tamPoblacion = 10;
            int generaciones = 5;
            double probCruce = 0.3;
            double probMutacion = 0.15;
            double porcentajeElite = 0.2;
            //replanificado.imprimirPlanificacion();
            System.out.println("$$$$$$$$$$$$$$$$$INICIANDO REPLAN OP DIARIUA$$$$$$$$$$$$$$$$$$");
            Genetico ga = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
            mejorSolucion = ga.ejecutar(2, replanificado);
            mejorSolucion.getSistemaPLG().imprimirPlanificacion();
            for(Pedido p : pedidosEnCurso){
                mejorSolucion.getSistemaPLG().getPedidos().add(p);
                p.setId(mejorSolucion.getSistemaPLG().getPedidos().size());

            }

            PlanificacionPlgApplication.setMejorSolucion(mejorSolucion);

        } else {
            System.out.println("Sin nuevos pedidos.");
        }
    }
}
