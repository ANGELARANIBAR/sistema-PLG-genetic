package com.plg.planificacionplg.controller;

import com.plg.planificacionplg.clases.EstadoPedido;
import com.plg.planificacionplg.clases.Pedido;
import com.plg.planificacionplg.dto.PedidoDTO;
import com.plg.planificacionplg.dto.PedidoRequest;
import com.plg.planificacionplg.services.NodoService;
import com.plg.planificacionplg.services.PedidoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class PedidoController {

    private final PedidoService pedidoService;
    private final NodoService nodoService;

    public PedidoController(PedidoService pedidoService, NodoService nodoService) {
        this.pedidoService = pedidoService;
        this.nodoService = nodoService;
    }

    // POST: insertar un nuevo pedido
    @PostMapping
    public ResponseEntity<Pedido> insertar(@RequestBody Pedido pedido) {
        Pedido guardado = pedidoService.guardar(pedido);
        return ResponseEntity.ok(guardado);
    }

    @PostMapping("/registrar")
    public ResponseEntity<?> registrarPedido(@RequestBody PedidoRequest request) {
        Pedido pedido = pedidoService.construirDesdeRequest(request, nodoService);
        Pedido guardado = pedidoService.guardar(pedido);
        return ResponseEntity.ok(guardado);
    }

    @PostMapping("/registrar-masivo")
    public ResponseEntity<?> registrarPedidosMasivos(@RequestBody List<PedidoRequest> pedidos) {
        List<Pedido> pedidosAGuardar = pedidos.stream()
                .map(r -> pedidoService.construirDesdeRequest(r, nodoService))
                .toList();

        pedidoService.guardarMasivo(pedidosAGuardar);
        return ResponseEntity.ok("Pedidos registrados correctamente.");
    }

    // GET: listar todos los pedidos
    @GetMapping("/listarTodos")
    public ResponseEntity<List<PedidoDTO>> listarTodos() {
        return ResponseEntity.ok(pedidoService.listarTodosDTO());
    }

    // GET: listar por estado
    @GetMapping("/estado")
    public ResponseEntity<List<Pedido>> listarPorEstado(@RequestParam EstadoPedido estado) {
        return ResponseEntity.ok(pedidoService.listarPorEstado(estado));
    }

    // GET: listar por si están completados
    @GetMapping("/completado")
    public ResponseEntity<List<Pedido>> listarPorCompletado(@RequestParam boolean completado) {
        return ResponseEntity.ok(pedidoService.listarPorCompletado(completado));
    }

    // GET: listar por volumen mínimo
    @GetMapping("/volumen-minimo")
    public ResponseEntity<List<Pedido>> listarPorVolumenMinimo(@RequestParam double volumen) {
        return ResponseEntity.ok(pedidoService.listarPorVolumenMinimo(volumen));
    }

    // GET: listar por rango de fechas
    @GetMapping("/rango")
    public ResponseEntity<List<Pedido>> listarPorRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        return ResponseEntity.ok(pedidoService.listarPorRangoFechas(inicio, fin));
    }

    // GET: obtener pedido por ID
    @GetMapping("/{id}")
    public ResponseEntity<Pedido> obtenerPorId(@PathVariable Integer id) {
        return pedidoService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET: obtener pedido por número
    @GetMapping("/numero/{numeroPedido}")
    public ResponseEntity<Pedido> obtenerPorNumeroPedido(@PathVariable String numeroPedido) {
        return pedidoService.buscarPorNumeroPedido(numeroPedido)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // GET: listar pedidos pendientes
    @GetMapping("/pendientes")
    public ResponseEntity<List<Pedido>> listarPendientes() {
        return ResponseEntity.ok(pedidoService.listarPedidosPendientes());
    }

    // GET: listar pedidos atrasados
    @GetMapping("/atrasados")
    public ResponseEntity<List<Pedido>> listarAtrasados() {
        return ResponseEntity.ok(pedidoService.listarPedidosAtrasados());
    }

    // GET: listar pedidos con entrega parcial
    @GetMapping("/entrega-parcial")
    public ResponseEntity<List<Pedido>> listarConEntregaParcial() {
        return ResponseEntity.ok(pedidoService.listarConEntregaParcial());
    }

    // GET: obtener volumen total por cliente
    @GetMapping("/cliente/{idCliente}/volumen-total")
    public ResponseEntity<Double> obtenerVolumenTotalPorCliente(@PathVariable int idCliente) {
        return ResponseEntity.ok(pedidoService.obtenerVolumenTotalPorCliente(idCliente));
    }

    // GET: obtener volumen entregado por cliente
    @GetMapping("/cliente/{idCliente}/volumen-entregado")
    public ResponseEntity<Double> obtenerVolumenEntregadoPorCliente(@PathVariable int idCliente) {
        return ResponseEntity.ok(pedidoService.obtenerVolumenEntregadoPorCliente(idCliente));
    }

    // GET: contar pedidos por estado
    @GetMapping("/contar/estado")
    public ResponseEntity<Long> contarPorEstado(@RequestParam EstadoPedido estado) {
        return ResponseEntity.ok(pedidoService.contarPorEstado(estado));
    }

    // PUT: actualizar pedido completo
    @PutMapping("/{id}")
    public ResponseEntity<Pedido> actualizar(@PathVariable Integer id, @RequestBody Pedido pedido) {
        if (pedidoService.existe(id)) {
            pedido.setId(id);
            Pedido actualizado = pedidoService.guardar(pedido);
            return ResponseEntity.ok(actualizado);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: actualizar estado
    @PatchMapping("/{id}/estado")
    public ResponseEntity<Pedido> actualizarEstado(@PathVariable Integer id, @RequestBody EstadoPedido nuevoEstado) {
        Pedido actualizado = pedidoService.actualizarEstado(id, nuevoEstado);
        if (actualizado != null) {
            return ResponseEntity.ok(actualizado);
        }
        return ResponseEntity.notFound().build();
    }

    // PATCH: completar pedido
    @PatchMapping("/{id}/completar")
    public ResponseEntity<Pedido> completarPedido(@PathVariable Integer id) {
        Pedido completado = pedidoService.completarPedido(id);
        if (completado != null) {
            return ResponseEntity.ok(completado);
        }
        return ResponseEntity.notFound().build();
    }

    // DELETE: eliminar pedido
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        if (pedidoService.existe(id)) {
            pedidoService.eliminar(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
