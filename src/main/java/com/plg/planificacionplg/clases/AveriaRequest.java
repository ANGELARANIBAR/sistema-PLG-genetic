package com.plg.planificacionplg.clases;

import java.time.LocalDateTime;
import java.util.Map;

public class AveriaRequest {
    private int tipoAveria;
    private LocalDateTime fechaHoraInicioAveria;

    public int getTipoAveria() {
        return tipoAveria;
    }

    public void setTipoAveria(int tipoAveria) {
        this.tipoAveria = tipoAveria;
    }

    public LocalDateTime getFechaHoraInicioAveria() {
        return fechaHoraInicioAveria;
    }

    public void setFechaHoraInicioAveria(LocalDateTime fechaHoraInicioAveria) {
        this.fechaHoraInicioAveria = fechaHoraInicioAveria;
    }
}
