package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
@Data
public class Mantenimiento {
    private int id;
    private LocalDateTime fechaHoraInicio, fechaHoraFin;
    private String tipo, descripcion;
}

