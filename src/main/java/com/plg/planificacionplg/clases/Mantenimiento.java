package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "mantenimiento", indexes = {
    @Index(name = "idx_mantenimiento_camion", columnList = "camion_id"),
    @Index(name = "idx_mantenimiento_fecha", columnList = "fecha_hora_inicio")
})
public class Mantenimiento {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;
    
    @Column(name = "fecha_hora_fin")
    private LocalDateTime fechaHoraFin;
    
    @Column(name = "descripcion", length = 500)
    private String descripcion;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoMantenimiento tipo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camion_id", nullable = false)
    private Camion camion;
    
    public enum TipoMantenimiento{
        PREVENTIVO, POST_SALIDA, CORRECTIVO
    }
}

