package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.AbstractMap;
import java.util.List;

@Data
public class Bloqueo {
    private int id;
    private LocalDateTime fechaHoraInicio, fechaHoraFin;
    private List<Nodo> rutasBloqueadas;
}
