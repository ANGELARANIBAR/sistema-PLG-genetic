package com.plg.planificacionplg.controller;

import com.plg.planificacionplg.PlanificacionPlgApplication;
import com.plg.planificacionplg.clases.*;
import com.plg.planificacionplg.dto.*;
import org.springframework.cglib.core.Local;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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

    @PostMapping("/{truckId}/registrarAveria")
    public void registrarAveria(
            @PathVariable int truckId,
            @RequestBody Map<Integer, Integer> destinoActuales,
            @RequestBody int tipoAveria,
            @RequestBody LocalDateTime fechaHoraInicioAveria) { // 🔹 Se recibe el nuevo estado en el cuerpo de la petición
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

        if (destinoActuales.get(truckId) < 0 || destinoActuales.get(truckId) >= camion.getDestinos().size()) {
            return; // indice está fuera del rango
        }
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
        Averia averia = new Averia();
        averia.setTipo(tipos.get(tipoAveria-1));
        averia.setFechaHoraInicio(fechaHoraInicioAveria);
        averia.determinarFechaFin(mejorSolucion.getSistemaPLG());
        camion.getAverias().add(averia);
        mejorSolucion.getSistemaPLG().getCamionesAveriados().add(camion);
        List<Pedido>afectados=new ArrayList<>();
        for(Pedido p : mejorSolucion.getSistemaPLG().getPedidos()){
            if(p.getEstado()==EstadoPedido.PENDIENTE)afectados.add(p);
        }

        //Destino destinoSeleccionado = camion.getDestinos().get(destinoActual);



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
        pedido.setEstado(EstadoPedido.valueOf(nuevoEstado)); // 🔹 Actualiza el estado del pedido
    }

    @GetMapping("/start-time")
    public LocalDateTime getStartTime() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        return mejorSolucion != null ? mejorSolucion.getSistemaPLG().getFechaHoraInicio() : null;
    }

    private TruckRouteDTO convertToTruckRouteDTO(Camion camion) {
        TruckRouteDTO dto = new TruckRouteDTO();
        dto.setTruckId(camion.getId());
        dto.setPlate(camion.getPlaca());
        dto.setFuelConsumed(camion.getCombustibleEmpleado());
        dto.setCurrentFuel(camion.getCombustibleActual());
        dto.setCurrentGLP(camion.getCargaGLPActual());

        List<DestinationDTO> destinations = new ArrayList<>();
        for (Destino destino : camion.getDestinos()) {
            DestinationDTO destDto = new DestinationDTO();
            destDto.setArrivalTime(destino.getFechaHoraLlegada());
            destDto.setDepartureTime(destino.getFechaHoraSalida());
            destDto.setFuelConsumed(destino.getRuta().getConsumoCombustible());
            destDto.setSaldoGLPCamion(destino.getSaldoGLPCamion());

            if (destino instanceof EntregaPedido) {
                destDto.setDestinationType("ENTREGA_PEDIDO");
                destDto.setOrderId(destino.getPedido().getId());
                destDto.setOrderNumber(destino.getPedido().getNumeroPedido());
                destDto.setMaxDeliveryTime(destino.getPedido().getFechaHoraMaxEntrega());
            } else if (destino instanceof Reabastecimiento) {
                destDto.setDestinationType("REABASTECIMIENTO");
            } else if (destino instanceof Trasvase) {
                destDto.setDestinationType("TRASVASE");
            }
            
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