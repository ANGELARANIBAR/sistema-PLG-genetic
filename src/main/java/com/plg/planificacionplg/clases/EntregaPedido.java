package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
@EqualsAndHashCode(callSuper = true)
@Data
public class EntregaPedido extends Destino{

    private int id;
    private double volumenGLPEntregado; //vol entregado puede ser parcial
    public EntregaPedido() {
        setTiempoOperacion(15);
    }
    public EntregaPedido(EntregaPedido otro) {
        this.id = otro.id;
        this.volumenGLPEntregado = otro.volumenGLPEntregado;
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

    }
    @Override
    public double operacionCargaGLP() {
        return (-1) * getGLPOperacion();
    }
    @Override
    public Destino copiar(){
        Destino destino = this;
        destino.setUbicacion(getPedido().getUbicacion());
        return destino;
    }
    @Override
    public void imprimir(){
        System.out.println("Entrega de pedido en: " + getUbicacion());
        System.out.println("Cantidad de GLP solicitada: " + getPedido().getVolumenGLP());
        System.out.println("Cantidad GLP actual en CAMION: " + getSaldoGLPCamion());
        System.out.println("Cantidad combustible actual en CAMION: " + getSaldoCombustibleCamion());

        if(getRuta().getNodos()!=null)
            System.out.println("Ruta: " + getRuta());
        else System.out.println("No hay ruta.");
    }
}
