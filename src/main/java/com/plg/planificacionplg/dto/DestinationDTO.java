package com.plg.planificacionplg.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DestinationDTO {
    private LocalDateTime arrivalTime;
    private LocalDateTime departureTime;
    private double fuelConsumed;
    private Integer orderId;
    private String orderNumber;
    private LocalDateTime maxDeliveryTime;
    private List<NodeDTO> route;
    private String destinationType; // "REABASTECIMIENTO", "TRASVASE", "ENTREGA_PEDIDO"
    private double saldoGLPCamion;

    // Getters and Setters
    public LocalDateTime getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(LocalDateTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public LocalDateTime getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(LocalDateTime departureTime) {
        this.departureTime = departureTime;
    }

    public double getFuelConsumed() {
        return fuelConsumed;
    }

    public void setFuelConsumed(double fuelConsumed) {
        this.fuelConsumed = fuelConsumed;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public LocalDateTime getMaxDeliveryTime() {
        return maxDeliveryTime;
    }

    public void setMaxDeliveryTime(LocalDateTime maxDeliveryTime) {
        this.maxDeliveryTime = maxDeliveryTime;
    }

    public List<NodeDTO> getRoute() {
        return route;
    }

    public void setRoute(List<NodeDTO> route) {
        this.route = route;
    }

    public String getDestinationType() {
        return destinationType;
    }

    public void setDestinationType(String destinationType) {
        this.destinationType = destinationType;
    }

    public double getSaldoGLPCamion() {
        return saldoGLPCamion;
    }

    public void setSaldoGLPCamion(double saldoGLPCamion) {
        this.saldoGLPCamion = saldoGLPCamion;
    }
} 