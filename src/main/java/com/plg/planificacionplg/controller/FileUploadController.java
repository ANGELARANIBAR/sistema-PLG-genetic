package com.plg.planificacionplg.controller;

import com.plg.planificacionplg.services.FileUploadService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = "*")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping("/averias")
    public ResponseEntity<?> uploadAverias(@RequestParam("file") MultipartFile file) {
        try {
            fileUploadService.processAveriasFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de averías cargado exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Error al cargar el archivo de averías: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/bloqueos")
    public ResponseEntity<?> uploadBloqueos(@RequestParam("file") MultipartFile file) {
        try {
            fileUploadService.processBloqueoFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de bloqueos cargado exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Error al cargar el archivo de bloqueos: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/pedidos")
    public ResponseEntity<?> uploadPedidos(@RequestParam("file") MultipartFile file) {
        try {
            fileUploadService.processPedidosFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de pedidos cargado exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Error al cargar el archivo de pedidos: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/mantenimiento")
    public ResponseEntity<?> uploadMantenimiento(@RequestParam("file") MultipartFile file) {
        try {
            fileUploadService.processMantenimientoFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de mantenimiento cargado exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", "Error al cargar el archivo de mantenimiento: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
} 