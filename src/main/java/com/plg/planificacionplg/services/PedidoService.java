package com.plg.planificacionplg.services;

import com.plg.planificacionplg.clases.EstadoPedido;
import com.plg.planificacionplg.clases.Nodo;
import com.plg.planificacionplg.clases.Pedido;
import com.plg.planificacionplg.dto.NodeDTO;
import com.plg.planificacionplg.dto.PedidoDTO;
import com.plg.planificacionplg.dto.PedidoRequest;
import com.plg.planificacionplg.repository.PedidoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;

    public PedidoService(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    public Pedido guardar(Pedido pedido) {
        if (pedido.getFechaHoraRegistro() == null) {
            pedido.setFechaHoraRegistro(LocalDateTime.now());
        }
        return pedidoRepository.save(pedido);
    }

    public List<Pedido> guardarMasivo(List<Pedido> pedidos) {
        return pedidoRepository.saveAll(pedidos);
    }

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    public Optional<Pedido> buscarPorId(Integer id) {
        return pedidoRepository.findById(id);
    }

    public Optional<Pedido> buscarPorNumeroPedido(String numeroPedido) {
        return pedidoRepository.findByNumeroPedido(numeroPedido);
    }

    public List<Pedido> listarPorEstado(EstadoPedido estado) {
        return pedidoRepository.findByEstado(estado);
    }

    public List<Pedido> listarPorCompletado(boolean completado) {
        return pedidoRepository.findByCompletado(completado);
    }

    public List<Pedido> listarPorCliente(int idCliente) {
        return pedidoRepository.findByIdClienteAndEstado(idCliente, null);
    }

    public List<Pedido> listarPorRangoFechas(LocalDateTime inicio, LocalDateTime fin) {
        return pedidoRepository.findByFechaHoraRegistroBetween(inicio, fin);
    }

    public List<Pedido> listarPedidosPendientes() {
        return pedidoRepository.findPedidosPendientes(LocalDateTime.now());
    }

    public List<Pedido> listarPedidosAtrasados() {
        return pedidoRepository.findPedidosAtrasados(LocalDateTime.now());
    }

    public List<Pedido> listarPorVolumenMinimo(double volumenMinimo) {
        return pedidoRepository.findByVolumenGLPGreaterThanEqual(volumenMinimo);
    }

    public List<Pedido> listarConEntregaParcial() {
        return pedidoRepository.findPedidosConEntregaParcial();
    }

    public List<Pedido> listarPorUbicacion(double latMin, double latMax, double lonMin, double lonMax) {
        return pedidoRepository.findPedidosByUbicacion(latMin, latMax, lonMin, lonMax);
    }

    public Double obtenerVolumenTotalPorCliente(int idCliente) {
        Double volumen = pedidoRepository.getVolumenTotalByCliente(idCliente);
        return volumen != null ? volumen : 0.0;
    }

    public Double obtenerVolumenEntregadoPorCliente(int idCliente) {
        Double volumen = pedidoRepository.getVolumenEntregadoByCliente(idCliente);
        return volumen != null ? volumen : 0.0;
    }

    public long contarPorEstado(EstadoPedido estado) {
        return pedidoRepository.countByEstado(estado);
    }

    public boolean existePorNumeroPedido(String numeroPedido) {
        return pedidoRepository.existsByNumeroPedido(numeroPedido);
    }

    public List<Pedido> listarOrdenadosPorFechaRegistro() {
        return pedidoRepository.findAllByOrderByFechaHoraRegistroDesc();
    }

    public List<Pedido> listarOrdenadosPorFechaEntrega() {
        return pedidoRepository.findAllByOrderByFechaHoraMaxEntregaAsc();
    }

    public Pedido actualizarEstado(Integer id, EstadoPedido nuevoEstado) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            pedido.setEstado(nuevoEstado);
            
            // Si el estado cambia a entregado, marcar como completado
            if (nuevoEstado == EstadoPedido.ENTREGADO) {
                pedido.setCompletado(true);
                pedido.setFechaHoraEntrega(LocalDateTime.now());
            }
            
            return pedidoRepository.save(pedido);
        }
        
        return null;
    }

    public Pedido completarPedido(Integer id) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(id);
        
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            pedido.setCompletado(true);
            pedido.setFechaHoraEntrega(LocalDateTime.now());
            pedido.setEstado(EstadoPedido.ENTREGADO);
            
            return pedidoRepository.save(pedido);
        }
        
        return null;
    }

    public void eliminar(Integer id) {
        pedidoRepository.deleteById(id);
    }

    public boolean existe(Integer id) {
        return pedidoRepository.existsById(id);
    }    public List<PedidoDTO> listarTodosDTO() {
        return pedidoRepository.findAll().stream()
                .map(p -> {
                    PedidoDTO dto = new PedidoDTO();
                    dto.setId(p.getId());
                    dto.setNumeroPedido(p.getNumeroPedido());
                    dto.setVolumenGLP(p.getVolumenGLP());
                    dto.setFechaHoraRegistro(p.getFechaHoraRegistro());
                    dto.setFechaHoraMaxEntrega(p.getFechaHoraMaxEntrega());
                    dto.setTiempoMaxEntrega(p.getTiempoMaxEntrega());
                    dto.setEstado(p.getEstado() != null ? p.getEstado().toString() : "");
                    dto.setCompletado(p.isCompletado());
                    dto.setConsumoCombustibleTotal(p.getConsumoCombustibleTotal());
                    
                    // Convertir ubicación a NodeDTO
                    if (p.getUbicacion() != null) {
                        dto.setUbicacion(new com.plg.planificacionplg.dto.NodeDTO(
                            p.getUbicacion().getPosX(), 
                            p.getUbicacion().getPosY()
                        ));
                    }
                    
                    return dto;
                })
                .toList();
    }    public Pedido construirDesdeRequest(PedidoRequest request, NodoService nodoService) {
        Nodo ubicacion = nodoService.crearOBuscar(request.getCoordenadaX(), request.getCoordenadaY());

        Pedido pedido = new Pedido();
        pedido.setIdCliente(request.getIdCliente());
        pedido.setNumeroPedido(request.getNumeroPedido());
        pedido.setVolumenGLP(request.getVolumen());
        pedido.setUbicacion(ubicacion);
        pedido.setFechaHoraRegistro(request.getFechaRegistro() != null ? request.getFechaRegistro() : LocalDateTime.now());
        pedido.setTiempoMaxEntrega(request.getTiempoMaxEntrega());
        
        // Calcular fecha máxima de entrega basada en el tiempo máximo
        if (request.getTiempoMaxEntrega() > 0) {
            pedido.setFechaHoraMaxEntrega(
                pedido.getFechaHoraRegistro().plusMinutes((long)(request.getTiempoMaxEntrega() * 60))
            );
        }
        
        pedido.setEstado(EstadoPedido.PENDIENTE);
        pedido.setCompletado(false);
        pedido.setVolumenGLPEntregado(0.0);
        pedido.setConsumoCombustibleTotal(0.0);

        return pedido;
    }
}
