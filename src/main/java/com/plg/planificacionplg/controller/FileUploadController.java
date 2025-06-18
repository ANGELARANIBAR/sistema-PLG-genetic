package com.plg.planificacionplg.controller;

import com.plg.planificacionplg.services.FileUploadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class FileUploadController {
    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);

    private final FileUploadService fileUploadService;

    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping("/averias")
    public ResponseEntity<?> uploadAverias(@RequestParam("file") MultipartFile file) {
        try {
            logger.info("Recibiendo archivo de averías: {}", file.getOriginalFilename());
            fileUploadService.processAveriasFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de averías cargado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error al procesar archivo de averías", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/bloqueos")
    public ResponseEntity<?> uploadBloqueos(@RequestParam("file") MultipartFile file) {
        try {
            logger.info("Recibiendo archivo de bloqueos: {}", file.getOriginalFilename());
            fileUploadService.processBloqueoFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de bloqueos cargado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error al procesar archivo de bloqueos", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/pedidos")
    public ResponseEntity<?> uploadPedidos(@RequestParam("file") MultipartFile file) {
        try {
            logger.info("Recibiendo archivo de pedidos: {}", file.getOriginalFilename());
            fileUploadService.processPedidosFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de pedidos cargado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error al procesar archivo de pedidos", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @PostMapping("/mantenimiento")
    public ResponseEntity<?> uploadMantenimiento(@RequestParam("file") MultipartFile file) {
        try {
            logger.info("Recibiendo archivo de mantenimiento: {}", file.getOriginalFilename());
            fileUploadService.processMantenimientoFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de mantenimiento cargado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error al procesar archivo de mantenimiento", e);
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
} 