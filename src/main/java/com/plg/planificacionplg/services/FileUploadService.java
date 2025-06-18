package com.plg.planificacionplg.services;

import com.plg.planificacionplg.PlanificacionPlgApplication;
import com.plg.planificacionplg.clases.SistemaPLG;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;

@Service
public class FileUploadService {

    public void processAveriasFile(MultipartFile file) throws Exception {
        if (PlanificacionPlgApplication.getMejorSolucion() == null || 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() == null) {
            throw new Exception("El sistema no ha sido inicializado. Por favor ejecute una simulación primero.");
        }
        
        SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
        String content = new String(file.getBytes());
        sistema.cargarAverias(content);
    }
    
    public void processBloqueoFile(MultipartFile file) throws Exception {
        if (PlanificacionPlgApplication.getMejorSolucion() == null || 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() == null) {
            throw new Exception("El sistema no ha sido inicializado. Por favor ejecute una simulación primero.");
        }
        
        SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
        String content = new String(file.getBytes());
        sistema.cargaBloqueos(content);
    }
    
    public void processPedidosFile(MultipartFile file) throws Exception {
        if (PlanificacionPlgApplication.getMejorSolucion() == null || 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() == null) {
            throw new Exception("El sistema no ha sido inicializado. Por favor ejecute una simulación primero.");
        }
        
        SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
        String content = new String(file.getBytes());
        sistema.cargarPedidos(content);
    }
    
    public void processMantenimientoFile(MultipartFile file) throws Exception {
        if (PlanificacionPlgApplication.getMejorSolucion() == null || 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() == null) {
            throw new Exception("El sistema no ha sido inicializado. Por favor ejecute una simulación primero.");
        }
        
        SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
        String content = new String(file.getBytes());
        // Assuming standard business hours 8:00 - 17:00
        sistema.cargarMantenimientos(content, LocalTime.of(8, 0), LocalTime.of(17, 0));
    }
} 