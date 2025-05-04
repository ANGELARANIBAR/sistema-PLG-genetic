package com.plg.planificacionplg.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TruckRouteDTO {
    private int truckId;
    private String plate;
    private double fuelConsumed;
    private double currentFuel;
    private double currentGLP;
    private List<DestinationDTO> destinations;

    // Getters and Setters
    public int getTruckId() {
        return truckId;
    }

    public void setTruckId(int truckId) {
        this.truckId = truckId;
    }

    public String getPlate() {
        return plate;
    }

    public void setPlate(String plate) {
        this.plate = plate;
    }

    public double getFuelConsumed() {
        return fuelConsumed;
    }

    public void setFuelConsumed(double fuelConsumed) {
        this.fuelConsumed = fuelConsumed;
    }

    public double getCurrentFuel() {
        return currentFuel;
    }

    public void setCurrentFuel(double currentFuel) {
        this.currentFuel = currentFuel;
    }

    public double getCurrentGLP() {
        return currentGLP;
    }

    public void setCurrentGLP(double currentGLP) {
        this.currentGLP = currentGLP;
    }

    public List<DestinationDTO> getDestinations() {
        return destinations;
    }

    public void setDestinations(List<DestinationDTO> destinations) {
        this.destinations = destinations;
    }
} 