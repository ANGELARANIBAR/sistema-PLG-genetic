package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@DiscriminatorValue("ENTREGA_PEDIDO")
public class EntregaPedido extends Destino{

    @Transient
    private int id;

    @Column(name = "volumen_glp_entregado", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double volumenGLPEntregado; //vol entregado puede ser parcial
    
    public EntregaPedido() {
        super();
        setTiempoOperacion(15);
        volumenGLPEntregado = 0.0;
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
        EntregaPedido destino = new EntregaPedido();
        destino.setIdDestino(this.getIdDestino());
        destino.setNumeroOrden(this.getNumeroOrden());
        destino.setPedido(this.getPedido());
        if (getPedido()!=null)
            destino.setUbicacion(getPedido().getUbicacion());
        destino.setGLPOperacion(this.getGLPOperacion());
        destino.setFechaHoraLlegada(this.getFechaHoraLlegada());
        destino.setFechaHoraSalida(this.getFechaHoraSalida());
        destino.setTiempoOperacion(this.getTiempoOperacion());
        destino.setSaldoGLPCamion(this.getSaldoGLPCamion());
        destino.setSaldoCombustibleCamion(this.getSaldoCombustibleCamion());
        destino.setEstadoCamion(this.getEstadoCamion());
        destino.setRuta(this.getRuta());
        destino.setId(this.getId());
        destino.setVolumenGLPEntregado(this.volumenGLPEntregado);
        return destino;
    }
    @Override
    public void imprimir(){
        System.out.println("Entrega de pedido en: " + getUbicacion());
        System.out.println("ID de pedido: " + getPedido().getId());
        System.out.println("Cantidad de GLP solicitada: " + getPedido().getVolumenGLP());
        System.out.println("Cantidad GLP actual en CAMION: " + getSaldoGLPCamion());
        System.out.println("Cantidad combustible actual en CAMION: " + getSaldoCombustibleCamion());

        if(getRuta().getNodos()!=null)
            System.out.println("Ruta: " + getRuta());
        else System.out.println("No hay ruta.");
    }
}
