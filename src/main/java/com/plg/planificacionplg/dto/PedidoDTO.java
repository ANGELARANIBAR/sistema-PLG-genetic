package com.plg.planificacionplg.dto;

import java.time.LocalDateTime;

public class PedidoDTO {
    private int id;
    private String numeroPedido;
    private double volumenGLP;
    private NodeDTO ubicacion;
    private LocalDateTime fechaHoraRegistro;
    private double tiempoMaxEntrega;
    private LocalDateTime fechaHoraMaxEntrega;
    private String estado;
    private boolean completado;
    private double consumoCombustibleTotal;

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNumeroPedido() {
        return numeroPedido;
    }

    public void setNumeroPedido(String numeroPedido) {
        this.numeroPedido = numeroPedido;
    }

    public double getVolumenGLP() {
        return volumenGLP;
    }

    public void setVolumenGLP(double volumenGLP) {
        this.volumenGLP = volumenGLP;
    }

    public NodeDTO getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(NodeDTO ubicacion) {
        this.ubicacion = ubicacion;
    }

    public LocalDateTime getFechaHoraRegistro() {
        return fechaHoraRegistro;
    }

    public void setFechaHoraRegistro(LocalDateTime fechaHoraRegistro) {
        this.fechaHoraRegistro = fechaHoraRegistro;
    }

    public double getTiempoMaxEntrega() {
        return tiempoMaxEntrega;
    }

    public void setTiempoMaxEntrega(double tiempoMaxEntrega) {
        this.tiempoMaxEntrega = tiempoMaxEntrega;
    }

    public LocalDateTime getFechaHoraMaxEntrega() {
        return fechaHoraMaxEntrega;
    }

    public void setFechaHoraMaxEntrega(LocalDateTime fechaHoraMaxEntrega) {
        this.fechaHoraMaxEntrega = fechaHoraMaxEntrega;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public boolean isCompletado() {
        return completado;
    }

    public void setCompletado(boolean completado) {
        this.completado = completado;
    }

    public double getConsumoCombustibleTotal() {
        return consumoCombustibleTotal;
    }

    public void setConsumoCombustibleTotal(double consumoCombustibleTotal) {
        this.consumoCombustibleTotal = consumoCombustibleTotal;
    }
} 