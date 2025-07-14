package com.plg.planificacionplg.dto;

import com.plg.planificacionplg.clases.OperacionesGLPCisterna;

import java.time.LocalDateTime;

public class OperacionesGLPCisternaDTO {
    private double saldoGLP;
    private double cantSalidaGLP;
    private LocalDateTime fechaHoraOperacion;
    private String placaCamion;
    private int camionId;
    private int id;
    public OperacionesGLPCisternaDTO(OperacionesGLPCisterna op) {
        this.id = op.getId();
        this.saldoGLP = op.getSaldoGLP();
        this.cantSalidaGLP = op.getCantSalidaGLP();
        this.fechaHoraOperacion = op.getFechaHoraOperacion();
        this.camionId = op.getCamion().getId();
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public int getCamionId() {
        return camionId;
    }

    public void setCamionId(int camionId) {
        this.camionId = camionId;
    }

    public double getSaldoGLP() {
        return saldoGLP;
    }

    public void setSaldoGLP(double saldoGLP) {
        this.saldoGLP = saldoGLP;
    }

    public double getCantSalidaGLP() {
        return cantSalidaGLP;
    }

    public void setCantSalidaGLP(double cantSalidaGLP) {
        this.cantSalidaGLP = cantSalidaGLP;
    }

    public LocalDateTime getFechaHoraOperacion() {
        return fechaHoraOperacion;
    }

    public void setFechaHoraOperacion(LocalDateTime fechaHoraOperacion) {
        this.fechaHoraOperacion = fechaHoraOperacion;
    }

    public String getPlacaCamion() {
        return placaCamion;
    }

    public void setPlacaCamion(String placaCamion) {
        this.placaCamion = placaCamion;
    }
} 