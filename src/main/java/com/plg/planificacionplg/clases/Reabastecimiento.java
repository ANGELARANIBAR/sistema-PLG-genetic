package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
@EqualsAndHashCode(callSuper = true)
@Data
public class Reabastecimiento extends Destino {
    private int id;
    private Cisterna cisterna;
    private double cargaAbastecida;
    private LocalDateTime fechaHoraAbastecimiento;
    public Reabastecimiento() {
        setTiempoOperacion(0.0);
    }
    public Reabastecimiento(Reabastecimiento otro) {
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
        this.id = otro.getId();
        this.cisterna = otro.getCisterna();
        this.cargaAbastecida = otro.getCargaAbastecida();
        this.fechaHoraAbastecimiento = otro.getFechaHoraAbastecimiento();
    }
    @Override
    public double operacionCargaGLP() {
        return getGLPOperacion();
    }

    @Override
    public Destino copiar(){
        Reabastecimiento destino = new Reabastecimiento();
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
        destino.setCargaAbastecida(this.getCargaAbastecida());
        destino.setFechaHoraAbastecimiento(this.getFechaHoraAbastecimiento());
        destino.setCisterna(this.getCisterna());
        destino.setUbicacion(this.getCisterna().getUbicacion());
        return destino;
    }
    @Override
    public void imprimir(){
        System.out.println("Reabastecimiento en : " + getUbicacion());
        System.out.println("Cantidad de GLP : " + getGLPOperacion());
        System.out.println("Cantidad GLP actual en CAMION: " + getSaldoGLPCamion());
        System.out.println("Cantidad combustible actual en CAMION: " + getSaldoCombustibleCamion());
        if(getRuta().getNodos()!=null)
            System.out.println("Ruta: " + getRuta());
        else System.out.println("No hay ruta.");
    }
}
