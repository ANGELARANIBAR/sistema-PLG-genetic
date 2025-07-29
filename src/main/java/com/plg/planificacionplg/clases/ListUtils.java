package com.plg.planificacionplg.clases;

import java.util.List;

/**
 * Utilidades para manejar métodos de List que no están disponibles en versiones anteriores de Java
 */
public class ListUtils {
    
    /**
     * Obtiene el primer elemento de una lista
     */
    public static <T> T getFirst(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(0);
    }
    
    /**
     * Obtiene el último elemento de una lista
     */
    public static <T> T getLast(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.get(list.size() - 1);
    }
    
    /**
     * Remueve y retorna el último elemento de una lista
     */
    public static <T> T removeLast(List<T> list) {
        if (list == null || list.isEmpty()) {
            return null;
        }
        return list.remove(list.size() - 1);
    }
} 