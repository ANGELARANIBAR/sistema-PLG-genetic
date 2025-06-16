package com.plg.planificacionplg.services;

import com.plg.planificacionplg.clases.Nodo;
import com.plg.planificacionplg.repository.NodoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NodoService {

    private final NodoRepository nodoRepository;

    public NodoService(NodoRepository nodoRepository) {
        this.nodoRepository = nodoRepository;
    }

    public Optional<Nodo> buscarPorPosicion(double posX, double posY) {
        return nodoRepository.findByPosXAndPosY(posX, posY);
    }

    public Nodo guardar(Nodo nodo) {
        return nodoRepository.save(nodo);
    }

    public Optional<Nodo> buscarPorId(int id) {
        return nodoRepository.findById(id);
    }

    public List<Nodo> listarTodos() {
        return nodoRepository.findAll();
    }

    public void eliminar(int id) {
        nodoRepository.deleteById(id);
    }

    public boolean existe(int id) {
        return nodoRepository.existsById(id);
    }

    public boolean existePorPosicion(double posX, double posY) {
        return nodoRepository.existsByPosXAndPosY(posX, posY);
    }

    public List<Nodo> buscarCercanos(double posX, double posY, double radio) {
        return nodoRepository.findNearby(posX, posY, radio);
    }

    public List<Nodo> buscarCercanosExacto(double posX, double posY, double radio) {
        return nodoRepository.findNearbyExact(posX, posY, radio);
    }

    public List<Nodo> buscarEnArea(double minX, double maxX, double minY, double maxY) {
        return nodoRepository.findByArea(minX, maxX, minY, maxY);
    }

    public List<Nodo> buscarPorRangoX(double minX, double maxX) {
        return nodoRepository.findByPosXBetween(minX, maxX);
    }

    public List<Nodo> buscarPorRangoY(double minY, double maxY) {
        return nodoRepository.findByPosYBetween(minY, maxY);
    }

    public List<Nodo> listarOrdenadosPorDistancia(double centerX, double centerY) {
        return nodoRepository.findOrderedByDistanceFrom(centerX, centerY);
    }

    public List<Nodo> listarOrdenadosPorX() {
        return nodoRepository.findAllByOrderByPosXAsc();
    }

    public List<Nodo> listarOrdenadosPorY() {
        return nodoRepository.findAllByOrderByPosYAsc();
    }

    public long contarEnArea(double minX, double maxX, double minY, double maxY) {
        return nodoRepository.countInArea(minX, maxX, minY, maxY);
    }

    // Método auxiliar para crear o buscar un nodo existente
    public Nodo crearOBuscar(double posX, double posY) {
        return buscarPorPosicion(posX, posY)
                .orElseGet(() -> guardar(new Nodo(posX, posY)));
    }
}
