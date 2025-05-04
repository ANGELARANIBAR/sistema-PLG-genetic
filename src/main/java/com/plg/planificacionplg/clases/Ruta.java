package com.plg.planificacionplg.clases;


import java.time.LocalDateTime;
import java.util.*;

import lombok.Data;
@Data
public class Ruta {
    private int id;
    private double tiempoEmpleado, consumoCombustible, distanciaTotal;
    private List<Nodo> nodos;
    public Ruta(){nodos=null;}
    public Ruta(Ruta otro){
        this.id = otro.id;
        this.tiempoEmpleado = otro.tiempoEmpleado;
        this.consumoCombustible = otro.consumoCombustible;
        this.distanciaTotal = otro.distanciaTotal;
        this.nodos = new ArrayList<>();
        for(Nodo nodo: otro.nodos){
            nodos.add(nodo);
        }
    }

    public static double heuristica(Nodo a, Nodo b) {
        return Math.abs(a.getPosX() - b.getPosX()) + Math.abs(a.getPosY() - b.getPosY()); // Manhattan
    }

    public List<Nodo> aStar(Nodo origen, Nodo destino, SistemaPLG sistemaPLG, double velocidadCamion) {
        Map<Nodo, Double> gScore = new HashMap<>();
        Map<Nodo, Double> fScore = new HashMap<>();
        Map<Nodo, Nodo> cameFrom = new HashMap<>();

        Comparator<Nodo> comparator = Comparator.comparingDouble(fScore::get);
        PriorityQueue<Nodo> abiertos = new PriorityQueue<>(comparator);

        gScore.put(origen, 0.0);
        fScore.put(origen, heuristica(origen, destino));
        abiertos.add(origen);

        while (!abiertos.isEmpty()) {
            Nodo actual = abiertos.poll();
            if (actual.equals(destino)) {
                this.distanciaTotal = gScore.get(destino);
                nodos = reconstruirCamino(cameFrom, actual);
                tiempoEmpleado = this.distanciaTotal / velocidadCamion;
                return nodos;
            }

            for (Nodo vecino : obtenerVecinos(actual, sistemaPLG.getDistanciaManzana(),
                    sistemaPLG.getMaxXmapa(), sistemaPLG.getMaxYmapa())) {
                double tentativeG = gScore.get(actual) + 1;
                double tiempoLlegada = tentativeG / velocidadCamion;
                // Ahora pasamos el tiempo estimado de llegada
                if (estaBloqueado(vecino, sistemaPLG, (long)tiempoLlegada)) continue;

                if (tentativeG < gScore.getOrDefault(vecino, Double.MAX_VALUE)) {
                    cameFrom.put(vecino, actual);
                    gScore.put(vecino, tentativeG);
                    fScore.put(vecino, tentativeG + heuristica(vecino, destino));
                    if (!abiertos.contains(vecino)) {
                        abiertos.add(vecino);
                    }
                }
            }
        }

        return null;
    }


    private List<Nodo> obtenerVecinos(Nodo actual, double d, double maxX, double maxY) {
        List<Nodo> vecinos = new ArrayList<>();
        double[][] movimientos = {
                {d, 0}, {-d, 0}, {0, d}, {0, -d}
        };

        for (double[] mov : movimientos) {
            double nx = actual.getPosX() + mov[0];
            double ny = actual.getPosY() + mov[1];
            if (nx >= 0 && ny >= 0 && nx < maxX && ny < maxY) {
                vecinos.add(new Nodo(nx, ny));
            }
        }
        return vecinos;
    }

    // Simulación de bloqueo entre nodos (puedes cambiar según tus datos)
    private boolean estaBloqueado(Nodo a, SistemaPLG sistemaPLG, long tiempoLlegada) {
        for (Bloqueo bloqueo : sistemaPLG.getBloqueos()) {


            if (bloqueo.getFechaHoraInicio().isBefore(LocalDateTime.now().plusMinutes(tiempoLlegada)) &&
                    bloqueo.getFechaHoraFin().isAfter(LocalDateTime.now().plusMinutes(tiempoLlegada))) {

                //System.out.println("Bloqueo está activo ahora.");

                if (bloqueo.getRutasBloqueadas().size() >= 2) {
                    Nodo nodo1 = bloqueo.getRutasBloqueadas().get(0);

                    for (int i = 1; i < bloqueo.getRutasBloqueadas().size(); i += 1) {
                        Nodo nodo2 = bloqueo.getRutasBloqueadas().get(i);
                        //System.out.println("Procesando: " + nodo1 + " y " + nodo2);

                        if (a.estaEntre(nodo1, nodo2)) return true;
                        nodo1 = nodo2;
                    }
                }
            } else {
                //System.out.println("Bloqueo está fuera de tiempo.");
            }
        }
        return false;
    }


    private List<Nodo> reconstruirCamino(Map<Nodo, Nodo> cameFrom, Nodo actual) {
        List<Nodo> camino = new ArrayList<>();
        camino.add(actual);
        while (cameFrom.containsKey(actual)) {
            actual = cameFrom.get(actual);
            camino.add(0, actual);
        }
        return camino;
    }


        public static void main(String[] args) {
            // Crear nodos de origen y destino
            Nodo origen = new Nodo(2, 2);
            Nodo destino = new Nodo(2, 2);

            // Crear sistema con dimensiones y distancia entre manzanas
            SistemaPLG sistemaPLG = new SistemaPLG();
            sistemaPLG.setDistanciaManzana(1);
            sistemaPLG.setMaxXmapa(5);
            sistemaPLG.setMaxYmapa(5);

            // Crear un bloqueo en el camino entre (1,0) y (1,1)
            Nodo bloqueado1 = new Nodo(1, 0);
            Nodo bloqueado2 = new Nodo(1, 1);
            Nodo bloqueado3 = new Nodo(1, 3);

            Bloqueo bloqueo = new Bloqueo();
            bloqueo.setFechaHoraInicio(LocalDateTime.now().minusMinutes(10));
            bloqueo.setFechaHoraFin(LocalDateTime.now().plusMinutes(10));
            bloqueo.setRutasBloqueadas(Arrays.asList(bloqueado1, bloqueado2, bloqueado3));

            //sistemaPLG.setBloqueos(Arrays.asList(bloqueo));
            sistemaPLG.setBloqueos(new ArrayList<>());

            // Ejecutar A*
            Ruta ruta = new Ruta();
            //System.out.println("Calculando ruta evitando nodos bloqueados...");

            var resultado = ruta.aStar(origen, destino, sistemaPLG, 2);// con 0.05 u/min, el bloqueo ya no esta activo

            if (resultado != null) {
                System.out.println("Ruta encontrada:" + ruta.getDistanciaTotal() + " tiempo empleado: " + ruta.getTiempoEmpleado());
                for (Nodo nodo : resultado) {
                    System.out.println(nodo);
                }
            } else {
                //System.out.println("No se encontró una ruta.");
            }
        }


}