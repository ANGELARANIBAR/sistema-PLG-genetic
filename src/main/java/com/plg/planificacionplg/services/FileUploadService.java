package com.plg.planificacionplg.services;

import com.plg.planificacionplg.PlanificacionPlgApplication;
import com.plg.planificacionplg.clases.SistemaPLG;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;

@Service
public class FileUploadService {

    public void processAveriasFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("El archivo de averías está vacío");
        }
        
        validateFileFormat(file, ".txt");
        
        String content = new String(file.getBytes());
        // Store content in application
        PlanificacionPlgApplication.setAveriasFileContent(content);
        
        // If system is already initialized, also update it directly
        if (PlanificacionPlgApplication.getMejorSolucion() != null && 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
            SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
            sistema.cargarAverias(content);
        }
    }
    
    public void processBloqueoFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("El archivo de bloqueos está vacío");
        }
        
        validateFileFormat(file, ".txt");
        
        String content = new String(file.getBytes());
        // Store content in application
        PlanificacionPlgApplication.setBloqueosFileContent(content);
        
        // If system is already initialized, also update it directly
        if (PlanificacionPlgApplication.getMejorSolucion() != null && 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
            SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
            sistema.cargaBloqueos(content);
        }
    }
    
    public void processPedidosFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("El archivo de pedidos está vacío");
        }
        
        validateFileFormat(file, ".txt");
        
        String content = new String(file.getBytes());
        // Store content in application
        PlanificacionPlgApplication.setPedidosFileContent(content);
        
        // If system is already initialized, also update it directly
        if (PlanificacionPlgApplication.getMejorSolucion() != null && 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
            SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
            sistema.cargarPedidos(content);
        }
    }
    
    public void processMantenimientoFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("El archivo de mantenimiento está vacío");
        }
        
        validateFileFormat(file, ".txt");
        
        String content = new String(file.getBytes());
        // Store content in application
        PlanificacionPlgApplication.setMantenimientoFileContent(content);
        
        // If system is already initialized, also update it directly
        if (PlanificacionPlgApplication.getMejorSolucion() != null && 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
            SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
            sistema.cargarMantenimientos(content, LocalTime.of(8, 0), LocalTime.of(17, 0));
        }
    }
    
    private void validateFileFormat(MultipartFile file, String expectedExtension) throws Exception {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(expectedExtension)) {
            throw new Exception("El archivo debe tener formato " + expectedExtension);
        }
    }
} 