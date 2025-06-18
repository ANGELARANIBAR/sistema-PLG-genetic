package com.plg.planificacionplg.repository;

import com.plg.planificacionplg.clases.Pedido;
import com.plg.planificacionplg.clases.EstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
    
    // Buscar por número de pedido
    Optional<Pedido> findByNumeroPedido(String numeroPedido);
    
    // Buscar por estado
    List<Pedido> findByEstado(EstadoPedido estado);
    
    // Buscar pedidos completados o no completados
    List<Pedido> findByCompletado(boolean completado);
    
    // Buscar pedidos por rango de fechas de registro
    List<Pedido> findByFechaHoraRegistroBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Buscar pedidos por fecha máxima de entrega
    List<Pedido> findByFechaHoraMaxEntregaBefore(LocalDateTime fecha);
    
    // Buscar pedidos por volumen mínimo
    List<Pedido> findByVolumenGLPGreaterThanEqual(double volumenMinimo);
    
    // Buscar pedidos por estado y completado
    List<Pedido> findByEstadoAndCompletado(EstadoPedido estado, boolean completado);
    
    // Buscar pedidos por cliente y estado
    List<Pedido> findByIdClienteAndEstado(int idCliente, EstadoPedido estado);
    
    // Buscar pedidos pendientes (no completados y con fecha máxima de entrega futura)
    @Query("SELECT p FROM Pedido p WHERE p.completado = false AND p.fechaHoraMaxEntrega > :fechaActual")
    List<Pedido> findPedidosPendientes(@Param("fechaActual") LocalDateTime fechaActual);
    
    // Buscar pedidos atrasados (no completados y con fecha máxima de entrega pasada)
    @Query("SELECT p FROM Pedido p WHERE p.completado = false AND p.fechaHoraMaxEntrega < :fechaActual")
    List<Pedido> findPedidosAtrasados(@Param("fechaActual") LocalDateTime fechaActual);
    
    // Obtener volumen total de GLP por cliente
    @Query("SELECT SUM(p.volumenGLP) FROM Pedido p WHERE p.idCliente = :idCliente")
    Double getVolumenTotalByCliente(@Param("idCliente") int idCliente);
    
    // Obtener volumen total entregado por cliente
    @Query("SELECT SUM(p.volumenGLPEntregado) FROM Pedido p WHERE p.idCliente = :idCliente AND p.completado = true")
    Double getVolumenEntregadoByCliente(@Param("idCliente") int idCliente);
    
    // Buscar pedidos con volumen parcialmente entregado
    @Query("SELECT p FROM Pedido p WHERE p.volumenGLPEntregado > 0 AND p.volumenGLPEntregado < p.volumenGLP")
    List<Pedido> findPedidosConEntregaParcial();
    
    // Buscar pedidos por ubicación (coordenadas aproximadas)
    @Query("SELECT p FROM Pedido p WHERE p.ubicacion.posX BETWEEN :latMin AND :latMax AND p.ubicacion.posY BETWEEN :lonMin AND :lonMax")
    List<Pedido> findPedidosByUbicacion(@Param("latMin") double latMin, @Param("latMax") double latMax, 
                                       @Param("lonMin") double lonMin, @Param("lonMax") double lonMax);
    
    // Contar pedidos por estado
    long countByEstado(EstadoPedido estado);
    
    // Verificar si existe un pedido con el número dado
    boolean existsByNumeroPedido(String numeroPedido);
    
    // Buscar pedidos ordenados por fecha de registro (más recientes primero)
    List<Pedido> findAllByOrderByFechaHoraRegistroDesc();
    
    // Buscar pedidos ordenados por fecha máxima de entrega (más próximos primero)
    List<Pedido> findAllByOrderByFechaHoraMaxEntregaAsc();
}