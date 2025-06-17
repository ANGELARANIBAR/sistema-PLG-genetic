package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Entity
@Table(name = "bloqueo", indexes = {
    @Index(name = "idx_bloqueo_fecha_inicio", columnList = "fecha_hora_inicio"),
    @Index(name = "idx_bloqueo_fecha_fin", columnList = "fecha_hora_fin"),
    @Index(name = "idx_bloqueo_activo", columnList = "fecha_hora_inicio, fecha_hora_fin")
})
public class Bloqueo {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;
    
    @Column(name = "fecha_hora_fin", nullable = false)
    private LocalDateTime fechaHoraFin;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "bloqueo_rutas",
        joinColumns = @JoinColumn(name = "bloqueo_id"),
        inverseJoinColumns = @JoinColumn(name = "nodo_id")
    )
    private List<Nodo> rutasBloqueadas;
    
    @Column(name = "descripcion", length = 500)
    private String descripcion;
    
    @Column(name = "activo", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private boolean activo;
    
    public Bloqueo() {
        rutasBloqueadas = new ArrayList<>();
        activo = true;
    }
    
    // Método de utilidad para verificar si el bloqueo está activo en una fecha específica
    public boolean estaActivoEn(LocalDateTime fecha) {
        return activo && 
               !fecha.isBefore(fechaHoraInicio) && 
               !fecha.isAfter(fechaHoraFin);
    }
    
    // Método para verificar si una ruta está bloqueada
    public boolean bloqueaRuta(List<Nodo> ruta) {
        if (!activo || ruta == null || ruta.isEmpty()) {
            return false;
        }
        
        // Verifica si algún nodo de la ruta está en las rutas bloqueadas
        return ruta.stream().anyMatch(nodo -> rutasBloqueadas.contains(nodo));
    }
}
