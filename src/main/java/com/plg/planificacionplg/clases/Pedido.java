package com.plg.planificacionplg.clases;

import com.plg.planificacionplg.dto.PedidoDTO;
import lombok.*;

import jakarta.persistence.*;
import jakarta.annotation.PostConstruct;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "pedido")
public class Pedido{
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @Column(name = "id_cliente", nullable = false)
    private int idCliente;
    
    @Column(name = "numero_pedido", unique = true, length = 50)
    private String numeroPedido;
    
    @Column(name = "volumen_glp", nullable = false)
    private double volumenGLP;
    
    @Column(name = "volumen_glp_entregado", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double volumenGLPEntregado;
    
    @ManyToOne(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "ubicacion_id", referencedColumnName = "id")
    private Nodo ubicacion;
    
    @Column(name = "fecha_hora_registro", nullable = false)
    private LocalDateTime fechaHoraRegistro;
    
    @Column(name = "fecha_hora_entrega")
    private LocalDateTime fechaHoraEntrega;
    
    @Column(name = "fecha_hora_max_entrega")
    private LocalDateTime fechaHoraMaxEntrega;
    
    @Column(name = "tiempo_max_entrega", nullable = false)
    private double tiempoMaxEntrega;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoPedido estado;
    
    @Column(name = "completado", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean completado;

    @Getter
    @Setter
    private double costoAlgoritmoPedido;

    @ManyToMany(fetch = FetchType.LAZY, cascade = CascadeType.PERSIST)
    @JoinTable(
        name = "pedido_camiones",
        joinColumns = @JoinColumn(name = "pedido_id"),
        inverseJoinColumns = @JoinColumn(name = "camion_id")
    )
    private List<Camion> camiones;
    
    @Column(name = "consumo_combustible_total", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double consumoCombustibleTotal;    
    
    public Pedido(){
        camiones = new ArrayList<>();
        volumenGLPEntregado = 0.0;
        consumoCombustibleTotal = 0.0;
        completado = false;
    }
    
    public Pedido(Pedido otro){
        this.id = otro.getId();
        this.idCliente = otro.getIdCliente();
        this.numeroPedido = otro.getNumeroPedido();
        this.volumenGLP = otro.getVolumenGLP();
        this.volumenGLPEntregado = otro.getVolumenGLPEntregado();
        this.ubicacion = otro.getUbicacion();
        this.fechaHoraRegistro = otro.getFechaHoraRegistro();
        this.fechaHoraEntrega = otro.getFechaHoraEntrega();
        this.fechaHoraMaxEntrega = otro.getFechaHoraMaxEntrega();
        this.tiempoMaxEntrega = otro.getTiempoMaxEntrega();
        this.estado = otro.getEstado();
        this.completado = otro.isCompletado();
        this.camiones = new ArrayList<>(otro.getCamiones());
        this.consumoCombustibleTotal = otro.getConsumoCombustibleTotal();
    }
    
    @PostConstruct
    private void init() {
        if (camiones == null) {
            camiones = new ArrayList<>();
        }
        if (volumenGLPEntregado == 0.0) {
            volumenGLPEntregado = 0.0;
        }
        if (consumoCombustibleTotal == 0.0) {
            consumoCombustibleTotal = 0.0;
        }
        if (!completado) {
            completado = false;
        }
    }

    public Pedido(PedidoDTO dto) {
        this.id = dto.getId();
        this.idCliente = dto.getIdCliente();
        this.numeroPedido = dto.getNumeroPedido();
        this.volumenGLP = dto.getVolumenGLP();
        this.volumenGLPEntregado = 0.0; // asumido: aún no entregado
        this.ubicacion = new Nodo(dto.getUbicacion().getX(), dto.getUbicacion().getY()); // necesitas constructor Nodo(NodeDTO)
        this.fechaHoraRegistro = dto.getFechaHoraRegistro();
        this.fechaHoraEntrega = null; // asumido: aún no entregado
        this.fechaHoraMaxEntrega = dto.getFechaHoraMaxEntrega();
        this.tiempoMaxEntrega = dto.getTiempoMaxEntrega();
        this.estado = EstadoPedido.valueOf(dto.getEstado());
        this.completado = dto.isCompletado();
        this.camiones = new ArrayList<>(); // asumido: aún no asignado
        this.consumoCombustibleTotal = dto.getConsumoCombustibleTotal();
    }

}
