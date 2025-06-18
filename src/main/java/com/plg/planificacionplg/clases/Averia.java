package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@Entity
@Table(name = "averia", indexes = {
    @Index(name = "idx_averia_camion", columnList = "camion_id"),
    @Index(name = "idx_averia_fecha", columnList = "fecha_hora_inicio")
})
public class Averia {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @Column(name = "fecha_hora_inicio", nullable = false)
    private LocalDateTime fechaHoraInicio;
    
    @Column(name = "fecha_hora_fin")
    private LocalDateTime fechaHoraFin;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoAveria tipo;
      @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camion_id", nullable = false)
    private Camion camion;
    
    // Campo auxiliar para mantener compatibilidad con código existente
    @Transient
    private int idCamion;
    
    @Column(name = "tiempo_inoperativo", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double tiempoInoperativo;
    
    @Column(name = "turno_ocurrencia")
    private int turnoOcurrencia;
    public void determinarFechaFin(SistemaPLG sistemaPLG){
        // no se considera el tiempo inmobilizado en el calculo de la fecha de disponibilidad
        if(tipo.getId()==1){
            fechaHoraFin = fechaHoraInicio.plusMinutes((long)tipo.getTiempoInmovilizado()*60);
        }
        else{
            int turno = 0;
            for( int i = 0; i<sistemaPLG.getTurnosFin().size(); i++){
                LocalTime turnoFin = sistemaPLG.getTurnosFin().get(i);
                if(fechaHoraInicio.toLocalTime().isBefore(turnoFin)){
                    turno = i+1;break;
                }
            }
            if(turno == 0)return;
            int turnoInicio = turno - 2;
            if(turnoInicio < 0){turnoInicio = 0;}//para el caso del turno 1

            if(tipo.getId()==2){
                int diasExtraDisponible = turno + 2;
                if(diasExtraDisponible > sistemaPLG.getTurnosFin().size()){
                    diasExtraDisponible -= sistemaPLG.getTurnosFin().size();
                }
                fechaHoraFin = fechaHoraInicio.toLocalDate().plusDays(diasExtraDisponible)
                        .atTime(sistemaPLG.getTurnosFin().get(turnoInicio));
            }
            else{//tipo 3
                fechaHoraFin = fechaHoraInicio.toLocalDate().plusDays(3)
                        .atTime(sistemaPLG.getTurnosFin().get(turnoInicio));

            }        }
    }
    
    // Métodos personalizados para mantener compatibilidad
    public int getIdCamion() {
        if (camion != null) {
            return camion.getId();
        }
        return idCamion;
    }
    
    public void setIdCamion(int idCamion) {
        this.idCamion = idCamion;
        // Note: La relación camion se debe establecer por separado si es necesario
    }
}
