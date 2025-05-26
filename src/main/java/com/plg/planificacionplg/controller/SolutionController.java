package com.plg.planificacionplg.controller;

import com.plg.planificacionplg.PlanificacionPlgApplication;
import com.plg.planificacionplg.clases.*;
import com.plg.planificacionplg.dto.*;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.cglib.core.Local;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/solution")
public class SolutionController {

    @GetMapping("/routes")
    public List<TruckRouteDTO> getRoutes() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        
        if (mejorSolucion == null) {
            return new ArrayList<>();
        }

        return mejorSolucion.getSistemaPLG().getFlota().stream()
                .map(this::convertToTruckRouteDTO)
                .collect(Collectors.toList());
    }

    @GetMapping("/system")
    public SistemaPLGDTO getSystem() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        
        if (mejorSolucion == null) {
            return null;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        SistemaPLGDTO dto = new SistemaPLGDTO();
        
        dto.setFlota(sistema.getFlota().stream()
                .map(this::convertToTruckRouteDTO)
                .collect(Collectors.toList()));
        
        dto.setCisternas(sistema.getCisternas().stream()
                .map(this::convertToCisternaDTO)
                .collect(Collectors.toList()));
        
        dto.setPedidos(sistema.getPedidos().stream()
                .map(this::convertToPedidoDTO)
                .collect(Collectors.toList()));

        dto.setBloqueos(sistema.getBloqueos().stream()
                .map(this::convertToBloqueoDTO)
                .collect(Collectors.toList()));
        
        dto.setDistanciaManzana(sistema.getDistanciaManzana());
        dto.setMaxXmapa(sistema.getMaxXmapa());
        dto.setMaxYmapa(sistema.getMaxYmapa());
        dto.setFechaHoraInicio(sistema.getFechaHoraInicio());
        dto.setAveriaStartTime(sistema.getAveriaStartTime());
        return dto;
    }

    @GetMapping("/truck-position/{truckId}")
    public NodeDTO getTruckPosition(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {
        
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return null;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == truckId)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return null;
        }

        Nodo currentPosition = camion.calcularUbicacion(time);
        return new NodeDTO(currentPosition.getPosX(), currentPosition.getPosY());
    }
    @GetMapping("/truck-fuel/{truckId}")
    public double getTruckFuel(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {

        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return 0.0;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == truckId)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return 0.0;
        }

        double currentFuel = camion.calcularCombustibleActual(time);
        return currentFuel;
    }

    @GetMapping("/truck-glp/{truckId}")
    public double getTruckGLP(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {

        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return 0.0;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == truckId)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return 0.0;
        }

        double currentGLP = sistema.calcularGLPActual(truckId, time);
        return currentGLP;
    }

    @PostMapping("/{truckId}/registrarAveria")
    public void registrarAveria(
            @PathVariable int truckId,
            @RequestBody AveriaRequest request) {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        sistema.setReplanning(true);

        try {
            TipoAveria tipoAveria1 = new TipoAveria();
            tipoAveria1.setId(1);
            tipoAveria1.setTiempoInmovilizado(2);
            tipoAveria1.setRegresaAlmacen(false);
            TipoAveria tipoAveria2 = new TipoAveria();
            tipoAveria2.setId(2);
            tipoAveria2.setTiempoInmovilizado(2);
            tipoAveria2.setRegresaAlmacen(true);
            TipoAveria tipoAveria3 = new TipoAveria();
            tipoAveria3.setId(3);
            tipoAveria3.setTiempoInmovilizado(4);
            tipoAveria3.setRegresaAlmacen(true);
            List<TipoAveria> tipos = new ArrayList<>();
            tipos.add(tipoAveria1);
            tipos.add(tipoAveria2);
            tipos.add(tipoAveria3);

            Averia a = new Averia();
            a.setIdCamion(truckId-1);
            a.setFechaHoraInicio(request.getFechaHoraInicioAveria());
            a.setTipo(tipos.get(request.getTipoAveria()-1));

            a.setTurnoOcurrencia(2);//no importa
            SistemaPLG replanificado = new SistemaPLG(mejorSolucion.getSistemaPLG());
            replanificado.setCisternas(mejorSolucion.getSistemaPLG().getCisternas());
            LocalDateTime inicioAveria = a.getFechaHoraInicio();
            if(mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().size()<2)return;
            Camion cam = mejorSolucion.getSistemaPLG().getCamionEnInstante(a.getIdCamion()+1, inicioAveria);
            if(cam!=null && cam.getEstado()==EstadoCamion.EN_RETORNO)return;

            mejorSolucion.getSistemaPLG().setReplanning(true);
            mejorSolucion.getSistemaPLG().setAveriaStartTime(inicioAveria);

            a.determinarFechaFin(mejorSolucion.getSistemaPLG());
            //cam.setEstado(EstadoCamion.AVERIADO);

            // Replanification process
            mejorSolucion.getSistemaPLG().estadoDePedidosALas(inicioAveria);
            replanificado.setFlota(new ArrayList<>());
            replanificado.setPedidos(new ArrayList<>(mejorSolucion.getSistemaPLG().getPedidos()));
            replanificado.getCamionesAveriados().add(cam);
            replanificado.setFechaHoraInicio(inicioAveria);
            replanificado.setCamionCausanteReplan(cam);
            cam.getAverias().add(a);
            Replanficacion origenReplan = new Replanficacion();
            origenReplan.setUbicacion(cam.getUbicacionActual());
            origenReplan.setFechaHoraLlegada(inicioAveria);
            origenReplan.setFechaHoraSalida(a.getFechaHoraFin());
            origenReplan.setGLPOperacion(0.0);
            if (mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().isEmpty()) {
                mejorSolucion.getSistemaPLG().setReplanning(false);
                mejorSolucion.getSistemaPLG().setAveriaStartTime(null);
                return;
            }
            Destino destActuAveriado = mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos()
                    .get(cam.getIdxDestinoEnCurso());

            origenReplan.setSaldoGLPCamion(destActuAveriado.getSaldoGLPCamion());
            origenReplan.setSaldoCombustibleCamion(cam.getCombustibleActual());
            if (cam.getEstado() != EstadoCamion.EN_RUTA) {
                cam.getDestinos().add(destActuAveriado);
            } else cam.getDestinos().add(origenReplan);
            if (a.getTipo().getId() == 1) {
                cam.setPedidosAsignados(new ArrayList<>());
                for (Pedido p : mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getPedidosAsignados()) {
                    if (p.getEstado() == EstadoPedido.PENDIENTE) {
                        p.setEstado(EstadoPedido.ASIGNADO);//no pasan a replanificaion
                        cam.getPedidosAsignados().add(p);
                    }
                }
            } else cam.setPedidosAsignados(new ArrayList<>());//caso 2 y 3 donde no atiende sino se va

            for (int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++) {
                //si el camion no tiene registro de atenciones en la planificaicon
                if (mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().size() < 2) {
                    //dar origen en cisterna principal
                    Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getFlota().get(i));
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
                    nuevoCamion.getDestinos().add(origen);
                    nuevoCamion.setUbicacionActual(origen.getUbicacion());
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion que no salio> "+nuevoCamion.getId());
                    System.out.println("camion que no salio> "+nuevoCamion.getUbicacionActual());

                    continue;
                }
                if (i == a.getIdCamion()) {
                    replanificado.getFlota().add(cam);
                    continue;

                }
                Camion nuevoCamion = mejorSolucion.getSistemaPLG().getCamionEnInstante(i + 1, inicioAveria);
                nuevoCamion.setCargasGLP(new ArrayList<>());
                nuevoCamion.setDestinos(new ArrayList<>());
                Destino destinoActual = nuevoCamion.getDestinoEnCurso();
                if (destinoActual == null) {
                    //caso de los camiones que terminaron su ruta antes de la averia
                    destinoActual = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getLast().copiar();
                    nuevoCamion.getDestinos().add(destinoActual);
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion en reposo> "+nuevoCamion.getId());
                    continue;
                }

                if (nuevoCamion.getEstado() != EstadoCamion.EN_RUTA && nuevoCamion.getEstado() != EstadoCamion.EN_RETORNO) {//despachando o recargando
                    nuevoCamion.getDestinos().add(destinoActual); //inicio, no es modificable en la construccion de rutas
                    System.out.println(nuevoCamion.getEstado());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getId());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getUbicacionActual());
                } else {
                    origenReplan = new Replanficacion();
                    origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(i).calcularUbicacion(inicioAveria));
                    origenReplan.setFechaHoraLlegada(inicioAveria);
                    origenReplan.setFechaHoraSalida(inicioAveria);
                    origenReplan.setGLPOperacion(0.0);
                    origenReplan.setSaldoGLPCamion(destinoActual.getSaldoGLPCamion());
                    origenReplan.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.getDestinos().add(origenReplan);
                    System.out.println("camion en ruta> "+nuevoCamion.getId());
                    System.out.println("camion en ruta> "+nuevoCamion.getUbicacionActual());
                }
                replanificado.getFlota().add(nuevoCamion);
            }
            int tamPoblacion = 50;
            int generaciones = 10;
            double probCruce = 0.6;
            double probMutacion = 0.7;
            double porcentajeElite = 0.4;
            replanificado.imprimirPlanificacion();
            Genetico ga2 = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
            mejorSolucion = ga2.ejecutar(2, replanificado);
            mejorSolucion.getSistemaPLG().imprimirPlanificacion();

            mejorSolucion.getSistemaPLG().setReplanning(false);
            mejorSolucion.getSistemaPLG().setAveriaStartTime(null);

            PlanificacionPlgApplication.setMejorSolucion(mejorSolucion);


    } finally {
            sistema.setReplanning(false);
        }
    }
    @PostMapping("/{truckId}/{pedidoId}/change-state")
    public void cambiarEstadoPedido(
            @PathVariable int truckId,
            @PathVariable int pedidoId,
            @RequestBody String nuevoEstado) { // 🔹 Se recibe el nuevo estado en el cuerpo de la petición

        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == truckId)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return;
        }

        Destino entregaPedido = (camion.getDestinos().stream())
                .filter(d ->  d instanceof EntregaPedido && ((EntregaPedido)d).getId() != 0 && ((EntregaPedido)d).getId() == pedidoId)
                .findFirst()
                .orElse(null);
        Pedido pedido = null;
        if(entregaPedido != null)pedido = entregaPedido.getPedido();
        if (pedido == null) {
            return;
        }
        System.out.println(nuevoEstado);
        //pedido.setEstado(EstadoPedido.valueOf(nuevoEstado)); // 🔹 Actualiza el estado del pedido
    }

    @GetMapping("/start-time")
    public LocalDateTime getStartTime() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        return mejorSolucion != null ? mejorSolucion.getSistemaPLG().getFechaHoraInicio() : null;
    }

    @GetMapping("/is-replanning")
    public boolean isReplanning() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        return mejorSolucion != null && mejorSolucion.getSistemaPLG().isReplanning();
    }

    @GetMapping("/truck-destination/{truckId}")
    public DestinationDTO getTruckDestination(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {
        
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return null;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getCamionEnInstante(truckId, time);
        
        if (camion == null || camion.getDestinoEnCurso() == null) {
            return null;
        }

        return convertToDestinationDTO(camion.getDestinoEnCurso());
    }

    @GetMapping("/truck-state/{truckId}")
    public String getTruckState(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {
        Camion camion = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG()
                .getCamionEnInstante(truckId, time);
        return camion.getEstado().toString();
    }

    private DestinationDTO convertToDestinationDTO(Destino destino) {
        DestinationDTO dto = new DestinationDTO();
        dto.setArrivalTime(destino.getFechaHoraLlegada());
        dto.setDepartureTime(destino.getFechaHoraSalida());
        dto.setFuelConsumed(destino.getRuta().getConsumoCombustible());
        dto.setSaldoGLPCamion(destino.getSaldoGLPCamion());

        if (destino instanceof EntregaPedido) {
            dto.setDestinationType("ENTREGA PEDIDO");
            dto.setOrderId(destino.getPedido().getId());
            dto.setOrderNumber(destino.getPedido().getNumeroPedido());
            dto.setMaxDeliveryTime(destino.getPedido().getFechaHoraMaxEntrega());
        } else if (destino instanceof Reabastecimiento) {
            dto.setDestinationType("REABASTECIMIENTO");
        } else if (destino instanceof Trasvase) {
            dto.setDestinationType("TRASVASE");
        } else if (destino instanceof Replanficacion) {
            dto.setDestinationType("REPLANIFICACION");
        }
        
        if (destino.getEstadoCamion() != null) {
            dto.setDestinationType(destino.getEstadoCamion().toString());
        }
        
        if (destino.getRuta() != null && destino.getRuta().getNodos() != null) {
            dto.setRoute(destino.getRuta().getNodos().stream()
                    .map(node -> new NodeDTO(node.getPosX(), node.getPosY()))
                    .collect(Collectors.toList()));
        }
        
        return dto;
    }

    private TruckRouteDTO convertToTruckRouteDTO(Camion camion) {
        TruckRouteDTO dto = new TruckRouteDTO();
        dto.setTruckId(camion.getId());
        dto.setPlate(camion.getPlaca());
        dto.setFuelConsumed(camion.getCombustibleEmpleado());
        dto.setCurrentFuel(camion.getCombustibleActual());
        dto.setCurrentGLP(camion.getCargaGLPActual());
        dto.setCodigo(camion.getCodigo());

        List<DestinationDTO> destinations = new ArrayList<>();
        for (Destino destino : camion.getDestinos()) {
            DestinationDTO destDto = new DestinationDTO();
            destDto.setArrivalTime(destino.getFechaHoraLlegada());
            destDto.setDepartureTime(destino.getFechaHoraSalida());
            destDto.setFuelConsumed(destino.getRuta().getConsumoCombustible());
            destDto.setSaldoGLPCamion(destino.getSaldoGLPCamion());

            if (destino instanceof EntregaPedido) {
                destDto.setDestinationType("ENTREGA PEDIDO");
                destDto.setOrderId(destino.getPedido().getId());
                destDto.setOrderNumber(destino.getPedido().getNumeroPedido());
                destDto.setMaxDeliveryTime(destino.getPedido().getFechaHoraMaxEntrega());
            } else if (destino instanceof Reabastecimiento) {
                destDto.setDestinationType("REABASTECIMIENTO");
            } else if (destino instanceof Trasvase) {
                destDto.setDestinationType("TRASVASE");
            }
            else if (destino instanceof Replanficacion) {
                destDto.setDestinationType("REPLANIFICACION");
            }
            if(destino.getEstadoCamion()!=null)
                destDto.setDestinationType(destino.getEstadoCamion().toString());
            if (destino.getRuta() != null && destino.getRuta().getNodos() != null) {
                destDto.setRoute(destino.getRuta().getNodos().stream()
                        .map(node -> new NodeDTO(node.getPosX(), node.getPosY()))
                        .collect(Collectors.toList()));
            }
            
            destinations.add(destDto);
        }
        
        dto.setDestinations(destinations);
        return dto;
    }

    private CisternaDTO convertToCisternaDTO(Cisterna cisterna) {
        CisternaDTO dto = new CisternaDTO();
        dto.setPrincipal(cisterna.isPrincipal());
        dto.setCargaGLPActual(cisterna.getCargaGLPActual());
        dto.setCapacidadTotal(cisterna.getCapacidadTotal());
        dto.setUbicacion(new NodeDTO(cisterna.getUbicacion().getPosX(), cisterna.getUbicacion().getPosY()));
        dto.setHoraAbastecimento(cisterna.getHoraAbastecimento());
        return dto;
    }

    private PedidoDTO convertToPedidoDTO(Pedido pedido) {
        PedidoDTO dto = new PedidoDTO();
        dto.setId(pedido.getId());
        dto.setNumeroPedido(pedido.getNumeroPedido());
        dto.setVolumenGLP(pedido.getVolumenGLP());
        dto.setUbicacion(new NodeDTO(pedido.getUbicacion().getPosX(), pedido.getUbicacion().getPosY()));
        dto.setFechaHoraRegistro(pedido.getFechaHoraRegistro());
        dto.setTiempoMaxEntrega(pedido.getTiempoMaxEntrega());
        dto.setFechaHoraMaxEntrega(pedido.getFechaHoraMaxEntrega());
        dto.setEstado(pedido.getEstado().toString());
        dto.setCompletado(pedido.isCompletado());
        dto.setConsumoCombustibleTotal(pedido.getConsumoCombustibleTotal());
        return dto;
    }

    private BloqueoDTO convertToBloqueoDTO(Bloqueo bloqueo) {
        BloqueoDTO dto = new BloqueoDTO();
        dto.setFechaHoraInicio(bloqueo.getFechaHoraInicio());
        dto.setFechaHoraFin(bloqueo.getFechaHoraFin());
        dto.setRutasBloqueadas(bloqueo.getRutasBloqueadas().stream()
                .map(node -> new NodeDTO(node.getPosX(), node.getPosY()))
                .collect(Collectors.toList()));
        return dto;
    }
} 