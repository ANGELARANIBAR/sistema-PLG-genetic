package com.plg.planificacionplg.dto;

import java.time.LocalTime;
import java.util.List;

public class CisternaDTO {
    private boolean principal;
    private double cargaGLPActual;
    private double capacidadTotal;
    private NodeDTO ubicacion;
    private LocalTime horaAbastecimento;
    private List<OperacionesGLPCisternaDTO> operacionesGLPCisterna;

    // Getters and Setters
    public boolean isPrincipal() {
        return principal;
    }

    public void setPrincipal(boolean principal) {
        this.principal = principal;
    }

    public double getCargaGLPActual() {
        return cargaGLPActual;
    }

    public void setCargaGLPActual(double cargaGLPActual) {
        this.cargaGLPActual = cargaGLPActual;
    }

    public double getCapacidadTotal() {
        return capacidadTotal;
    }

    public void setCapacidadTotal(double capacidadTotal) {
        this.capacidadTotal = capacidadTotal;
    }

    public NodeDTO getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(NodeDTO ubicacion) {
        this.ubicacion = ubicacion;
    }

    public LocalTime getHoraAbastecimento() {
        return horaAbastecimento;
    }

    public void setHoraAbastecimento(LocalTime horaAbastecimento) {
        this.horaAbastecimento = horaAbastecimento;
    }

    public List<OperacionesGLPCisternaDTO> getOperacionesGLPCisterna() {
        return operacionesGLPCisterna;
    }

    public void setOperacionesGLPCisterna(List<OperacionesGLPCisternaDTO> operacionesGLPCisterna) {
        this.operacionesGLPCisterna = operacionesGLPCisterna;
    }
} 