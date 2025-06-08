package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true)
@Data
public class Trasvase extends Destino{
    private int id;
    private Camion camionTrasvase;
    private LocalDateTime FechaHoraTrasvase;

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
        this.setFechaHoraTrasvase(otro.getFechaHoraTrasvase());
        this.id = otro.id;
        this.camionTrasvase = otro.camionTrasvase;
    }
    @Override
    public double operacionCargaGLP(){
        return getGLPOperacion();
    }
    @Override
    public Destino copiar(){
        Trasvase destino = new Trasvase();
        destino.setIdDestino(this.getIdDestino());
        destino.setNumeroOrden(this.getNumeroOrden());
        destino.setUbicacion(this.getUbicacion());
        destino.setPedido(this.getPedido());
        destino.setGLPOperacion(this.getGLPOperacion());
        destino.setFechaHoraLlegada(this.getFechaHoraLlegada());
        destino.setFechaHoraSalida(this.getFechaHoraSalida());
        destino.setTiempoOperacion(this.getTiempoOperacion());
        destino.setSaldoGLPCamion(this.getSaldoGLPCamion());
        destino.setSaldoCombustibleCamion(this.getSaldoCombustibleCamion());
        destino.setEstadoCamion(this.getEstadoCamion());
        destino.setRuta(this.getRuta());
        destino.setId(this.getId());
        destino.setCamionTrasvase(this.getCamionTrasvase());
        if(camionTrasvase!=null)
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
