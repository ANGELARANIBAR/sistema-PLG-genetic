package com.plg.planificacionplg.dto;

import lombok.Data;

@Data
public class TipoCamionDTO {
    private int id;
    private String codigo;
    private double tara;
    private double pesoGLPMax;
    private double capCombustibleMax;
    private double velocidadPromedio;
    private double cargaGLPMax;
}
