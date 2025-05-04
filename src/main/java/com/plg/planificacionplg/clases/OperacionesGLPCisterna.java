package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OperacionesGLPCisterna {
    private double saldoGLP;
    private double cantSalidaGLP;
    private LocalDateTime fechaHoraOperacion;
    private Camion camion;
    private Cisterna cisterna;

}
