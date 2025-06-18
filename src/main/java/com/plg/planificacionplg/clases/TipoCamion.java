package com.plg.planificacionplg.clases;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "tipo_camion")
public class TipoCamion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    private String codigo;
    private double tara, pesoGLPMax, capCombustibleMax, velocidadPromedio, cargaGLPMax;
}
