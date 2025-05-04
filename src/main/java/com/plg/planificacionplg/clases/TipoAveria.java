package com.plg.planificacionplg.clases;

import lombok.Data;

@Data
public class TipoAveria {
    private int id;
    private String codigo, descripcion;
    private double tiempoInmovilizado;
    private Boolean regresaAlmacen;
}
