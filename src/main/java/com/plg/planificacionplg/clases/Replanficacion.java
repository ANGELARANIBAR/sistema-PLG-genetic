package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class Replanficacion extends Destino{
    private int id;

    public Replanficacion() {

    }
    @Override
    public double operacionCargaGLP(){
        return getGLPOperacion();
    }
    @Override
    public Destino copiar(){
        Destino destino = this;
        return destino;
    }
    @Override
    public void imprimir(){
        System.out.println("Replanificación en : " + getUbicacion());
        System.out.println("Cantidad de GLP trasvasada : " + getGLPOperacion());
        System.out.println("Cantidad GLP actual en CAMION: " + getSaldoGLPCamion());
        System.out.println("Cantidad combustible actual en CAMION: " + getSaldoCombustibleCamion());
        if(getRuta().getNodos()!=null)
            System.out.println("Ruta: " + getRuta());
        else System.out.println("No hay ruta.");
    }
}
