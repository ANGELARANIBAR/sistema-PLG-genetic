package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public abstract class Destino {
    private int idDestino, numeroOrden;
    private Nodo ubicacion;
    private Pedido pedido;
    private double GLPOperacion;
    private LocalDateTime fechaHoraSalida, fechaHoraLlegada;
    private double tiempoOperacion;
    private double saldoGLPCamion;
    private double saldoCombustibleCamion;
    private Ruta ruta;
    private EstadoCamion estadoCamion;
    public abstract double operacionCargaGLP();
    public Destino(){
        ruta = new Ruta();
    }
    public abstract Destino copiar();

    public void setPedido(Pedido pedido){
        this.pedido = pedido;
        if(pedido != null){
            GLPOperacion = pedido.getVolumenGLP();
        }
    }
    public abstract void imprimir();
}
