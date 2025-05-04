package com.plg.planificacionplg.dto;

import java.time.LocalDateTime;

public class OperacionesGLPCisternaDTO {
    private double saldoGLP;
    private double cantSalidaGLP;
    private LocalDateTime fechaHoraOperacion;
    private String placaCamion;

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