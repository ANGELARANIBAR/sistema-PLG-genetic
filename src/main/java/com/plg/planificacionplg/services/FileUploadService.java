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
        System.out.println("Procesando archivo de averías: " + file.getOriginalFilename() + ", tamaño: " + content.length() + " bytes");
        
        // Store content in application
        PlanificacionPlgApplication.setAveriasFileContent(content);
        System.out.println("Contenido de averías almacenado correctamente en la aplicación");
        
        // If system is already initialized, also update it directly
        if (PlanificacionPlgApplication.getMejorSolucion() != null && 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
            SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
            sistema.cargarAverias(content);
            System.out.println("Averías cargadas directamente en el sistema existente");
        }
    }
    
    public void processBloqueoFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("El archivo de bloqueos está vacío");
        }
        
        validateFileFormat(file, ".txt");
        
        String content = new String(file.getBytes());
        System.out.println("Procesando archivo de bloqueos: " + file.getOriginalFilename() + ", tamaño: " + content.length() + " bytes");
        
        // Store content in application
        PlanificacionPlgApplication.setBloqueosFileContent(content);
        System.out.println("Contenido de bloqueos almacenado correctamente en la aplicación");
        
        // If system is already initialized, also update it directly
        if (PlanificacionPlgApplication.getMejorSolucion() != null && 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
            SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
            sistema.cargaBloqueos(content);
            System.out.println("Bloqueos cargados directamente en el sistema existente");
        }
    }
    
    public void processPedidosFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("El archivo de pedidos está vacío");
        }
        
        validateFileFormat(file, ".txt");
        
        String content = new String(file.getBytes());
        System.out.println("Procesando archivo de pedidos: " + file.getOriginalFilename() + ", tamaño: " + content.length() + " bytes");
        
        // Store content in application
        PlanificacionPlgApplication.setPedidosFileContent(content);
        System.out.println("Contenido de pedidos almacenado correctamente en la aplicación");
        
        // If system is already initialized, also update it directly
        if (PlanificacionPlgApplication.getMejorSolucion() != null && 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
            SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
            sistema.cargarPedidos(content);
            System.out.println("Pedidos cargados directamente en el sistema existente");
        }
    }
    
    public void processMantenimientoFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new Exception("El archivo de mantenimiento está vacío");
        }
        
        validateFileFormat(file, ".txt");
        
        String content = new String(file.getBytes());
        System.out.println("Procesando archivo de mantenimiento: " + file.getOriginalFilename() + ", tamaño: " + content.length() + " bytes");
        
        // Store content in application
        PlanificacionPlgApplication.setMantenimientoFileContent(content);
        System.out.println("Contenido de mantenimiento almacenado correctamente en la aplicación");
        
        // If system is already initialized, also update it directly
        if (PlanificacionPlgApplication.getMejorSolucion() != null && 
            PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
            SistemaPLG sistema = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG();
            sistema.cargarMantenimientos(content, LocalTime.of(8, 0), LocalTime.of(17, 0));
            System.out.println("Mantenimiento cargado directamente en el sistema existente");
        }
    }
    
    private void validateFileFormat(MultipartFile file, String expectedExtension) throws Exception {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(expectedExtension)) {
            throw new Exception("El archivo debe tener formato " + expectedExtension);
        }
        System.out.println("Archivo validado correctamente: " + originalFilename);
    }
} 