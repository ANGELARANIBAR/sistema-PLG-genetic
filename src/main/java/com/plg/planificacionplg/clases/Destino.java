package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "destino")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "tipo_destino", discriminatorType = DiscriminatorType.STRING)
public abstract class Destino {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int idDestino;
    
    @Column(name = "numero_orden")
    private int numeroOrden;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubicacion_id")
    private Nodo ubicacion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;
    
    @Column(name = "glp_operacion", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double GLPOperacion;
    
    @Column(name = "fecha_hora_salida")
    private LocalDateTime fechaHoraSalida;
    
    @Column(name = "fecha_hora_llegada")
    private LocalDateTime fechaHoraLlegada;
    
    @Column(name = "tiempo_operacion", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double tiempoOperacion;
    
    @Column(name = "saldo_glp_camion", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double saldoGLPCamion;
    
    @Column(name = "saldo_combustible_camion", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double saldoCombustibleCamion;
    
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "ruta_id")
    private Ruta ruta;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_camion")
    private EstadoCamion estadoCamion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camion_id")
    private Camion camion;
    
    public abstract double operacionCargaGLP();    public Destino(){
        ruta = new Ruta();
        GLPOperacion = 0.0;
        tiempoOperacion = 0.0;
        saldoGLPCamion = 0.0;
        saldoCombustibleCamion = 0.0;
    }
    
    public abstract Destino copiar();

    public void setPedido(Pedido pedido){
        this.pedido = pedido;
        if(pedido != null){
            GLPOperacion = pedido.getVolumenGLP();
        }
    }
}
    public abstract void imprimir();
}
