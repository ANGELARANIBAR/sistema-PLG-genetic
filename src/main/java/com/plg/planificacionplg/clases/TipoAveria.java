package com.plg.planificacionplg.clases;

import lombok.Data;
import jakarta.persistence.*;

@Data

@Entity
@Table(name = "tipo_averia")
public class TipoAveria {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String codigo, descripcion;
    private double tiempoInmovilizado;
    private Boolean regresaAlmacen;
}
