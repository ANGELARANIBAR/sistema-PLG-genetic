package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class Trasvase extends Destino{
    private int id;
    private Camion camionTrasvase;

    public Trasvase() {
        setTiempoOperacion(0.0);
    }
    public Trasvase(Trasvase otro) {
        this.setPedido(otro.getPedido());
        this.setUbicacion(otro.getUbicacion());
        this.setTiempoOperacion(otro.getTiempoOperacion());
        this.setFechaHoraLlegada(otro.getFechaHoraLlegada());
        this.setFechaHoraSalida(otro.getFechaHoraSalida());
        this.setGLPOperacion(otro.getGLPOperacion());
        this.setSaldoCombustibleCamion(otro.getSaldoCombustibleCamion());
        this.setSaldoGLPCamion(otro.getSaldoGLPCamion());
        this.setNumeroOrden(otro.getNumeroOrden());
        this.setIdDestino(otro.getIdDestino());
        this.setRuta(new Ruta(otro.getRuta()));
        this.setEstadoCamion(otro.getEstadoCamion());
        this.id = otro.id;
        this.camionTrasvase = otro.camionTrasvase;
    }
    @Override
    public double operacionCargaGLP(){
        return getGLPOperacion();
    }
    @Override
    public Destino copiar(){
        Destino destino = this;
        destino.setUbicacion(camionTrasvase.getUbicacionActual());
        return destino;
    }
    @Override
    public void imprimir(){
        System.out.println("Trasvase en : " + getUbicacion());
        System.out.println("Cantidad de GLP trasvasada : " + getGLPOperacion());
        System.out.println("Cantidad GLP actual en CAMION: " + getSaldoGLPCamion());
        System.out.println("Cantidad combustible actual en CAMION: " + getSaldoCombustibleCamion());
        if(getRuta().getNodos()!=null)
            System.out.println("Ruta: " + getRuta());
        else System.out.println("No hay ruta.");
    }
}
