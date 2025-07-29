package com.plg.planificacionplg.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

public class PedidoRequest {
    private int idCliente;
    private String numeroPedido;
    private double volumen;
    private double coordenadaX;
    private double coordenadaY;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime fechaRegistro;
    private double tiempoMaxEntrega; // en horas

    // Constructores
    public PedidoRequest() {}

    public PedidoRequest(int idCliente, String numeroPedido, double volumen, 
                        double coordenadaX, double coordenadaY, 
                        LocalDateTime fechaRegistro, double tiempoMaxEntrega) {
        this.idCliente = idCliente;
        this.numeroPedido = numeroPedido;
        this.volumen = volumen;
        this.coordenadaX = coordenadaX;
        this.coordenadaY = coordenadaY;
        this.fechaRegistro = fechaRegistro;
        this.tiempoMaxEntrega = tiempoMaxEntrega;
    }

    // Getters y Setters
    public int getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(int idCliente) {
        this.idCliente = idCliente;
    }

    public String getNumeroPedido() {
        return numeroPedido;
    }

    public void setNumeroPedido(String numeroPedido) {
        this.numeroPedido = numeroPedido;
    }

    public double getVolumen() {
        return volumen;
    }

    public void setVolumen(double volumen) {
        this.volumen = volumen;
    }

    public double getCoordenadaX() {
        return coordenadaX;
    }

    public void setCoordenadaX(double coordenadaX) {
        this.coordenadaX = coordenadaX;
    }

    public double getCoordenadaY() {
        return coordenadaY;
    }

    public void setCoordenadaY(double coordenadaY) {
        this.coordenadaY = coordenadaY;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public double getTiempoMaxEntrega() {
        return tiempoMaxEntrega;
    }

    public void setTiempoMaxEntrega(double tiempoMaxEntrega) {
        this.tiempoMaxEntrega = tiempoMaxEntrega;
    }
}
