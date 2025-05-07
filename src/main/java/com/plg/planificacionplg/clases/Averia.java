package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class Averia {
    private int id;
    private LocalDateTime fechaHoraInicio, fechaHoraFin;
    private TipoAveria tipo;
    private double tiempoInoperativo;
    private int turnoOcurrencia;
    public void determinarFechaFin(SistemaPLG sistemaPLG){
        // no se considera el tiempo inmobilizado en el calculo de la fecha de disponibilidad
        if(tipo.getId()==1){
            fechaHoraFin = fechaHoraInicio.plusMinutes((long)tipo.getTiempoInmovilizado());
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

            }

        }
    }
}
