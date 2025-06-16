package com.plg.planificacionplg.repository;

import com.plg.planificacionplg.clases.Nodo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NodoRepository extends JpaRepository<Nodo, Integer> {
    
    // Buscar nodo por posición exacta
    Optional<Nodo> findByPosXAndPosY(double posX, double posY);
    
    // Verificar si existe un nodo en esa posición
    boolean existsByPosXAndPosY(double posX, double posY);
    
    // Buscar nodos en un rango de coordenadas X
    List<Nodo> findByPosXBetween(double minX, double maxX);
    
    // Buscar nodos en un rango de coordenadas Y
    List<Nodo> findByPosYBetween(double minY, double maxY);
    
    // Buscar nodos en un área rectangular
    @Query("SELECT n FROM Nodo n WHERE n.posX BETWEEN :minX AND :maxX AND n.posY BETWEEN :minY AND :maxY")
    List<Nodo> findByArea(@Param("minX") double minX, @Param("maxX") double maxX, 
                         @Param("minY") double minY, @Param("maxY") double maxY);
    
    // Buscar nodos cercanos a una posición (radio aproximado usando coordenadas rectangulares)
    @Query("SELECT n FROM Nodo n WHERE " +
           "n.posX BETWEEN :centerX - :radius AND :centerX + :radius AND " +
           "n.posY BETWEEN :centerY - :radius AND :centerY + :radius")
    List<Nodo> findNearby(@Param("centerX") double centerX, @Param("centerY") double centerY, 
                         @Param("radius") double radius);
    
    // Buscar nodos cercanos usando distancia euclidiana (más preciso pero más costoso)
    @Query("SELECT n FROM Nodo n WHERE " +
           "SQRT(POWER(n.posX - :centerX, 2) + POWER(n.posY - :centerY, 2)) <= :radius")
    List<Nodo> findNearbyExact(@Param("centerX") double centerX, @Param("centerY") double centerY, 
                              @Param("radius") double radius);
    
    // Buscar nodos ordenados por distancia a un punto (los más cercanos primero)
    @Query("SELECT n FROM Nodo n ORDER BY " +
           "SQRT(POWER(n.posX - :centerX, 2) + POWER(n.posY - :centerY, 2)) ASC")
    List<Nodo> findOrderedByDistanceFrom(@Param("centerX") double centerX, @Param("centerY") double centerY);
    
    // Obtener todos los nodos ordenados por coordenada X
    List<Nodo> findAllByOrderByPosXAsc();
    
    // Obtener todos los nodos ordenados por coordenada Y
    List<Nodo> findAllByOrderByPosYAsc();
    
    // Contar nodos en un área específica
    @Query("SELECT COUNT(n) FROM Nodo n WHERE n.posX BETWEEN :minX AND :maxX AND n.posY BETWEEN :minY AND :maxY")
    long countInArea(@Param("minX") double minX, @Param("maxX") double maxX, 
                    @Param("minY") double minY, @Param("maxY") double maxY);
}
