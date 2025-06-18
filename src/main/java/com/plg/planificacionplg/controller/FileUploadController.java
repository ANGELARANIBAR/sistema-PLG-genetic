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
            response.put("message", "Archivo de averías cargado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/bloqueos")
    public ResponseEntity<?> uploadBloqueos(@RequestParam("file") MultipartFile file) {
        try {
            fileUploadService.processBloqueoFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de bloqueos cargado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/pedidos")
    public ResponseEntity<?> uploadPedidos(@RequestParam("file") MultipartFile file) {
        try {
            fileUploadService.processPedidosFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de pedidos cargado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/mantenimiento")
    public ResponseEntity<?> uploadMantenimiento(@RequestParam("file") MultipartFile file) {
        try {
            fileUploadService.processMantenimientoFile(file);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Archivo de mantenimiento cargado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
} 