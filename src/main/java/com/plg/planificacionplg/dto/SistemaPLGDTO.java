package com.plg.planificacionplg.dto;

import java.time.LocalDateTime;
import java.util.List;

public class SistemaPLGDTO {
    private List<TruckRouteDTO> flota;
    private List<CisternaDTO> cisternas;
    private List<PedidoDTO> pedidos;
    private List<BloqueoDTO> bloqueos;
    private double distanciaManzana;
    private double maxXmapa;
    private double maxYmapa;
    private LocalDateTime fechaHoraInicio;

    // Getters and Setters
    public List<TruckRouteDTO> getFlota() {
        return flota;
    }

    public void setFlota(List<TruckRouteDTO> flota) {
        this.flota = flota;
    }

    public List<CisternaDTO> getCisternas() {
        return cisternas;
    }

    public void setCisternas(List<CisternaDTO> cisternas) {
        this.cisternas = cisternas;
    }

    public List<PedidoDTO> getPedidos() {
        return pedidos;
    }

    public void setPedidos(List<PedidoDTO> pedidos) {
        this.pedidos = pedidos;
    }

    public List<BloqueoDTO> getBloqueos() {
        return bloqueos;
    }

    public void setBloqueos(List<BloqueoDTO> bloqueos) {
        this.bloqueos = bloqueos;
    }

    public double getDistanciaManzana() {
        return distanciaManzana;
    }

    public void setDistanciaManzana(double distanciaManzana) {
        this.distanciaManzana = distanciaManzana;
    }

    public double getMaxXmapa() {
        return maxXmapa;
    }

    public void setMaxXmapa(double maxXmapa) {
        this.maxXmapa = maxXmapa;
    }

    public double getMaxYmapa() {
        return maxYmapa;
    }

    public void setMaxYmapa(double maxYmapa) {
        this.maxYmapa = maxYmapa;
    }

    public LocalDateTime getFechaHoraInicio() {
        return fechaHoraInicio;
    }

    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) {
        this.fechaHoraInicio = fechaHoraInicio;
    }
} 