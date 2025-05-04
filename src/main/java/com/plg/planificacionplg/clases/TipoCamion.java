package com.plg.planificacionplg.clases;

import lombok.Data;

@Data
public class TipoCamion {
    private int idTipoCamion;
    private String tipo;
    private double tara, pesoGLPMax, capCombustibleMax, velocidadPromedio, cargaGLPMax;
}
