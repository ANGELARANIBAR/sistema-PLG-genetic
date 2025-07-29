package com.plg.planificacionplg.dto;

import java.time.LocalDateTime;

public class AveriaDTO {
    private int id;
    private LocalDateTime fechaHoraInicio;
    private LocalDateTime fechaHoraFin;
    private int idCamion;
    private int turnoOcurrencia;
    private int tipoId;
    private double tiempoInmovilizado;
    private boolean regresaAlmacen;

    // Constructors
    public AveriaDTO() {}

    public AveriaDTO(int id, LocalDateTime fechaHoraInicio, LocalDateTime fechaHoraFin, 
                     int idCamion, int turnoOcurrencia, int tipoId, 
                     double tiempoInmovilizado, boolean regresaAlmacen) {
        this.id = id;
        this.fechaHoraInicio = fechaHoraInicio;
        this.fechaHoraFin = fechaHoraFin;
        this.idCamion = idCamion;
        this.turnoOcurrencia = turnoOcurrencia;
        this.tipoId = tipoId;
        this.tiempoInmovilizado = tiempoInmovilizado;
        this.regresaAlmacen = regresaAlmacen;
    }

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public LocalDateTime getFechaHoraInicio() {
        return fechaHoraInicio;
    }

    public void setFechaHoraInicio(LocalDateTime fechaHoraInicio) {
        this.fechaHoraInicio = fechaHoraInicio;
    }

    public LocalDateTime getFechaHoraFin() {
        return fechaHoraFin;
    }

    public void setFechaHoraFin(LocalDateTime fechaHoraFin) {
        this.fechaHoraFin = fechaHoraFin;
    }

    public int getIdCamion() {
        return idCamion;
    }

    public void setIdCamion(int idCamion) {
        this.idCamion = idCamion;
    }

    public int getTurnoOcurrencia() {
        return turnoOcurrencia;
    }

    public void setTurnoOcurrencia(int turnoOcurrencia) {
        this.turnoOcurrencia = turnoOcurrencia;
    }

    public int getTipoId() {
        return tipoId;
    }

    public void setTipoId(int tipoId) {
        this.tipoId = tipoId;
    }

    public double getTiempoInmovilizado() {
        return tiempoInmovilizado;
    }

    public void setTiempoInmovilizado(double tiempoInmovilizado) {
        this.tiempoInmovilizado = tiempoInmovilizado;
    }

    public boolean isRegresaAlmacen() {
        return regresaAlmacen;
    }

    public void setRegresaAlmacen(boolean regresaAlmacen) {
        this.regresaAlmacen = regresaAlmacen;
    }
} 