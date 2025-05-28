package com.plg.planificacionplg.clases;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class Pedido{
    private int id;
    private int idCliente;
    private String numeroPedido;
    private double volumenGLP;
    private double volumenGLPEntregado;
    private Nodo ubicacion;
    private LocalDateTime fechaHoraRegistro, fechaHoraEntrega, fechaHoraMaxEntrega;
    private double tiempoMaxEntrega;
    private EstadoPedido estado;
    private boolean completado;
    private List <Camion> camiones;
    private double consumoCombustibleTotal;

    public Pedido(){
        camiones = new ArrayList<>();
    }
    public Pedido(Pedido otro){
        this.id = otro.getId();
        this.idCliente = otro.getIdCliente();
        this.numeroPedido = otro.getNumeroPedido();
        this.volumenGLP = otro.getVolumenGLP();
        this.volumenGLPEntregado = otro.getVolumenGLPEntregado();
        this.ubicacion = otro.getUbicacion();
        this.fechaHoraRegistro = otro.getFechaHoraRegistro();
        this.fechaHoraEntrega = otro.getFechaHoraEntrega();
        this.fechaHoraMaxEntrega = otro.getFechaHoraMaxEntrega();
        this.tiempoMaxEntrega = otro.getTiempoMaxEntrega();
        this.estado = otro.getEstado();
        this.completado = otro.isCompletado();
        this.camiones = otro.getCamiones();
        this.consumoCombustibleTotal = otro.getConsumoCombustibleTotal();
    }
}
