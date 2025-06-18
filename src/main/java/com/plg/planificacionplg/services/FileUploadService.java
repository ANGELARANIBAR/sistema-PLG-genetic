package com.plg.planificacionplg.services;

import com.plg.planificacionplg.PlanificacionPlgApplication;
import com.plg.planificacionplg.clases.SistemaPLG;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;

@Service
public class FileUploadService {
    private static final Logger logger = LoggerFactory.getLogger(FileUploadService.class);

    public void processAveriasFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            logger.error("El archivo de averías está vacío");
            throw new Exception("El archivo está vacío");
        }
        
        try {
            String content = new String(file.getBytes());
            validateFileContent(content, "averías");
            
            // Store content in PlanificacionPlgApplication
            PlanificacionPlgApplication.setAveriasContent(content);
            logger.info("Archivo de averías procesado correctamente: {} bytes", file.getSize());
            
            // If we have a solution already, apply the file content immediately
            if (PlanificacionPlgApplication.getMejorSolucion() != null && 
                PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
                PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG().cargarAverias(content);
                logger.info("Averías aplicadas a la solución actual");
            }
        } catch (Exception e) {
            logger.error("Error al procesar el archivo de averías", e);
            throw new Exception("Error al procesar el archivo de averías: " + e.getMessage());
        }
    }
    
    public void processBloqueoFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            logger.error("El archivo de bloqueos está vacío");
            throw new Exception("El archivo está vacío");
        }
        
        try {
            String content = new String(file.getBytes());
            validateFileContent(content, "bloqueos");
            
            // Store content in PlanificacionPlgApplication
            PlanificacionPlgApplication.setBloqueosContent(content);
            logger.info("Archivo de bloqueos procesado correctamente: {} bytes", file.getSize());
            
            // If we have a solution already, apply the file content immediately
            if (PlanificacionPlgApplication.getMejorSolucion() != null && 
                PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
                PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG().cargaBloqueos(content);
                logger.info("Bloqueos aplicados a la solución actual");
            }
        } catch (Exception e) {
            logger.error("Error al procesar el archivo de bloqueos", e);
            throw new Exception("Error al procesar el archivo de bloqueos: " + e.getMessage());
        }
    }
    
    public void processPedidosFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            logger.error("El archivo de pedidos está vacío");
            throw new Exception("El archivo está vacío");
        }
        
        try {
            String content = new String(file.getBytes());
            validateFileContent(content, "pedidos");
            
            // Store content in PlanificacionPlgApplication
            PlanificacionPlgApplication.setPedidosContent(content);
            logger.info("Archivo de pedidos procesado correctamente: {} bytes", file.getSize());
            
            // If we have a solution already, apply the file content immediately
            if (PlanificacionPlgApplication.getMejorSolucion() != null && 
                PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
                PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG().cargarPedidos(content);
                logger.info("Pedidos aplicados a la solución actual");
            }
        } catch (Exception e) {
            logger.error("Error al procesar el archivo de pedidos", e);
            throw new Exception("Error al procesar el archivo de pedidos: " + e.getMessage());
        }
    }
    
    public void processMantenimientoFile(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            logger.error("El archivo de mantenimiento está vacío");
            throw new Exception("El archivo está vacío");
        }
        
        try {
            String content = new String(file.getBytes());
            validateFileContent(content, "mantenimiento");
            
            // Store content in PlanificacionPlgApplication
            PlanificacionPlgApplication.setMantenimientoContent(content);
            logger.info("Archivo de mantenimiento procesado correctamente: {} bytes", file.getSize());
            
            // If we have a solution already, apply the file content immediately
            if (PlanificacionPlgApplication.getMejorSolucion() != null && 
                PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG() != null) {
                PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG().cargarMantenimientos(
                    content, LocalTime.of(8, 0), LocalTime.of(17, 0)
                );
                logger.info("Mantenimiento aplicado a la solución actual");
            }
        } catch (Exception e) {
            logger.error("Error al procesar el archivo de mantenimiento", e);
            throw new Exception("Error al procesar el archivo de mantenimiento: " + e.getMessage());
        }
    }
    
    private void validateFileContent(String content, String fileType) throws Exception {
        if (content == null || content.trim().isEmpty()) {
            logger.error("El contenido del archivo de {} está vacío", fileType);
            throw new Exception("El contenido del archivo está vacío");
        }
        
        // Basic validation for different file types
        switch (fileType) {
            case "averías":
                // Check if it has at least one valid line
                if (!content.contains(",")) {
                    logger.error("El archivo de averías no tiene el formato correcto");
                    throw new Exception("El archivo de averías no tiene el formato correcto. Debe contener datos separados por comas.");
                }
                break;
            case "bloqueos":
                // Check if it has at least one valid line
                if (!content.contains(",")) {
                    logger.error("El archivo de bloqueos no tiene el formato correcto");
                    throw new Exception("El archivo de bloqueos no tiene el formato correcto. Debe contener datos separados por comas.");
                }
                break;
            case "pedidos":
                // Check if it has at least one valid line
                if (!content.contains(",")) {
                    logger.error("El archivo de pedidos no tiene el formato correcto");
                    throw new Exception("El archivo de pedidos no tiene el formato correcto. Debe contener datos separados por comas.");
                }
                break;
            case "mantenimiento":
                // Check if it has at least one valid line
                if (!content.contains(",")) {
                    logger.error("El archivo de mantenimiento no tiene el formato correcto");
                    throw new Exception("El archivo de mantenimiento no tiene el formato correcto. Debe contener datos separados por comas.");
                }
                break;
        }
        
        logger.info("Validación de archivo de {} completada con éxito", fileType);
    }
} 