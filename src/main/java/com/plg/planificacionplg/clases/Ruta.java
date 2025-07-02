package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.*;

@Data
@Entity
@Table(name = "ruta")
public class Ruta {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @Column(name = "tiempo_empleado", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double tiempoEmpleado;
    
    @Column(name = "consumo_combustible", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double consumoCombustible;
    
    @Column(name = "distancia_total", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double distanciaTotal;
    
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "ruta_nodos",
        joinColumns = @JoinColumn(name = "ruta_id"),
        inverseJoinColumns = @JoinColumn(name = "nodo_id")    
        )
    @OrderColumn(name = "orden")
    private List<Nodo> nodos;    
    
    public Ruta(){
        nodos = new ArrayList<>();
        tiempoEmpleado = 0.0;
        consumoCombustible = 0.0;
        distanciaTotal = 0.0;
    }
    
    public Ruta(Ruta otro){
        this.id = otro.id;
        this.tiempoEmpleado = otro.tiempoEmpleado;
        this.consumoCombustible = otro.consumoCombustible;
        this.distanciaTotal = otro.distanciaTotal;
        this.nodos = new ArrayList<>();
        if(otro.nodos != null) {
            for(Nodo nodo: otro.nodos){
                nodos.add(nodo);
            }
        }
    }

    public static double heuristica(Nodo a, Nodo b) {
        return Math.abs(a.getPosX() - b.getPosX()) + Math.abs(a.getPosY() - b.getPosY()); // Manhattan
    }

    public List<Nodo> aStar(Nodo origen, Nodo destino, SistemaPLG sistemaPLG, double velocidadCamion, LocalDateTime fechaSalida) {
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
            if (actual.sonIguales(destino)) {
                this.distanciaTotal = gScore.get(destino);
//                double tiempoLlegada = (gScore.get(actual))/ velocidadCamion;
//                if (estaBloqueado(actual, fechaSalida, sistemaPLG, tiempoLlegada)) return null; //ruta invalida
                nodos = reconstruirCamino(cameFrom, actual);
                tiempoEmpleado = this.distanciaTotal / velocidadCamion;
                return nodos;
            }

            for (Nodo vecino : obtenerVecinos(actual, sistemaPLG.getDistanciaManzana(),
                    sistemaPLG.getMaxXmapa(), sistemaPLG.getMaxYmapa())) {
                double tentativeG = gScore.get(actual) + sistemaPLG.getDistanciaManzana();
                double tiempoLlegada = tentativeG / velocidadCamion;
                //if (estaTramoBloqueado(actual, vecino, sistemaPLG, tiempoLlegada)) continue;

                if (!vecino.sonIguales(destino) && estaBloqueado(vecino, fechaSalida, sistemaPLG, tiempoLlegada)) continue;
                vecino.setLlegada(sistemaPLG.getFechaHoraInicio().plusSeconds((long)tiempoLlegada*60));
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
    private boolean estaBloqueado(Nodo a, LocalDateTime fechaHoraSalida, SistemaPLG sistemaPLG, double tiempoLlegada) {
        LocalDateTime llegada = fechaHoraSalida.plusSeconds((long)(tiempoLlegada * 60));
        for (Bloqueo bloqueo : sistemaPLG.getBloqueos()) {
            //System.out.println("Para llegar a "+a+" en tiempo d "+tiempoLlegada);
            if (bloqueo.getFechaHoraInicio().isBefore(llegada) &&
                    bloqueo.getFechaHoraFin().isAfter(llegada)) {

                if (bloqueo.getRutasBloqueadas().size() >= 2) {
                    Nodo nodo1 = bloqueo.getRutasBloqueadas().get(0);

                    for (int i = 1; i < bloqueo.getRutasBloqueadas().size(); i += 1) {
                        Nodo nodo2 = bloqueo.getRutasBloqueadas().get(i);

                        if (a.estaEntre(nodo1, nodo2)){

                            //System.out.println("Esta bloqueado entre: " + nodo1 + " y " + nodo2 + " a las " + llegada);
                            return true;
                        }
                        nodo1 = nodo2;
                    }
                }
            } else {
                if(bloqueo.getFechaHoraInicio().isAfter(llegada)) {
                    return false;
                }
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

    private boolean estaTramoBloqueado(Nodo origen, Nodo destino, SistemaPLG sistemaPLG, double tiempoLlegada) {
        LocalDateTime llegada = sistemaPLG.getFechaHoraInicio().plusSeconds((long)(tiempoLlegada * 60));

        for (Bloqueo bloqueo : sistemaPLG.getBloqueos()) {
            if (bloqueo.getFechaHoraInicio().isBefore(llegada) &&
                    bloqueo.getFechaHoraFin().isAfter(llegada)) {
                List<Nodo> bloqueados = bloqueo.getRutasBloqueadas();
                for (int i = 0; i < bloqueados.size() - 1; i++) {
                    Nodo a = bloqueados.get(i);
                    Nodo b = bloqueados.get(i + 1);

                    if ((origen.estaEntre(a, b) && destino.estaEntre(a, b)) ||
                            (origen.equals(a) && destino.equals(b)) ||
                            (origen.equals(b) && destino.equals(a))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }



    public static void main(String[] args) {
            // Crear nodos de origen y destino
            Nodo origen = new Nodo(0, 0);
            Nodo destino = new Nodo(2, 1);

            // Crear sistema con dimensiones y distancia entre manzanas
            SistemaPLG sistemaPLG = new SistemaPLG();
            sistemaPLG.setFechaHoraInicio(LocalDateTime.now());
            sistemaPLG.setDistanciaManzana(1);
            sistemaPLG.setMaxXmapa(20);
            sistemaPLG.setMaxYmapa(20);

            // Crear un bloqueo en el camino entre (1,0) y (1,1)
            Nodo bloqueado1 = new Nodo(2, 0);
            Nodo bloqueado2 = new Nodo(2, 1);
            Nodo bloqueado3 = new Nodo(1, 1);

            Bloqueo bloqueo = new Bloqueo();
            bloqueo.setFechaHoraInicio(LocalDateTime.now().minusMinutes(10));
            bloqueo.setFechaHoraFin(LocalDateTime.now().plusMinutes(8));
            bloqueo.setRutasBloqueadas(Arrays.asList(bloqueado1, bloqueado2, bloqueado3));

            sistemaPLG.setBloqueos(Arrays.asList(bloqueo));
            //sistemaPLG.setBloqueos(new ArrayList<>());

            // Ejecutar A*
            Ruta ruta = new Ruta();
            //System.out.println("Calculando ruta evitando nodos bloqueados...");

            var resultado = ruta.aStar(origen, destino, sistemaPLG, 1, sistemaPLG.getFechaHoraInicio());// con 0.05 u/min, el bloqueo ya no esta activo

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