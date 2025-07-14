package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "operacion_glp_cisterna", indexes = {
    @Index(name = "idx_operacion_fecha", columnList = "fecha_hora_operacion"),
    @Index(name = "idx_operacion_camion", columnList = "camion_id"),
    @Index(name = "idx_operacion_cisterna", columnList = "cisterna_id")
})
public class OperacionesGLPCisterna {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @Column(name = "saldo_glp", nullable = false)
    private double saldoGLP;
    
    @Column(name = "cant_salida_glp", nullable = false)
    private double cantSalidaGLP;
    
    @Column(name = "fecha_hora_operacion", nullable = false)
    private LocalDateTime fechaHoraOperacion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camion_id", nullable = false)
    private Camion camion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cisterna_id", nullable = false)
    private Cisterna cisterna;

    public OperacionesGLPCisterna (OperacionesGLPCisterna otro){
        this.id = otro.getId();
        this.saldoGLP = otro.getSaldoGLP();
        this.cantSalidaGLP = otro.getCantSalidaGLP();
        this.fechaHoraOperacion = otro.getFechaHoraOperacion();
        this.camion = otro.getCamion();
        this.cisterna = otro.getCisterna();
    }
}
