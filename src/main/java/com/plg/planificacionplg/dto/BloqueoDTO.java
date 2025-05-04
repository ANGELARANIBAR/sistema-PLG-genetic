package com.plg.planificacionplg.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BloqueoDTO {
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private List<NodeDTO> rutasBloqueadas;

    public LocalDateTime getFechaHoraInicio() {
        return fechaHoraInicio;
    }

    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) {
        this.fechaHoraInicio = fechaHoraInicio;
    }

    public LocalDateTime getFechaHoraFin() {
        return fechaHoraFin;
    }

    public void setFechaHoraFin(LocalDateTime fechaHoraFin) {
        this.fechaHoraFin = fechaHoraFin;
    }

    public List<NodeDTO> getRutasBloqueadas() {
        return rutasBloqueadas;
    }

    public void setRutasBloqueadas(List<NodeDTO> rutasBloqueadas) {
        this.rutasBloqueadas = rutasBloqueadas;
    }
} 