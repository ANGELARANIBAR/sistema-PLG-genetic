package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.*;

@Data
public class Particula {
    private List<Integer> asignacionCamiones; // pedido -> índice de camión asignado
    private List<Integer> velocidad; // dirección de cambio en cada pedido
    private List<Camion> camiones;
    private double fitness;

    public Particula(int numPedidos, int numCamiones) {
        Random random = new Random();
        asignacionCamiones = new ArrayList<>();
        velocidad = new ArrayList<>();
        for (int i = 0; i < numPedidos; i++) {
            asignacionCamiones.add(random.nextInt(numCamiones)); // asignación inicial aleatoria
            velocidad.add(0);
        }
    }

    public void evaluar(SistemaPLG sistema) {
        double tiempoOperacion = 0;
        double combustibleTotal = 0;
        boolean solucionValida = true;

        List<Camion> flota = sistema.getFlota();
        List<Pedido> pedidos = sistema.getPedidos();
        // Limpiar destinos
        Reabastecimiento inicioEnCisterPrincipal = new Reabastecimiento();
        inicioEnCisterPrincipal.setCisterna(sistema.getCisternas().get(0));
        for (Camion camion : flota) {
            camion.setDestinos(new ArrayList<>());
            camion.setCombustibleEmpleado(0);
            camion.setDistanciaTotal(0);
        }

        // Asignar pedidos a camiones

        for (int i = 0; i < pedidos.size(); i++) {
            int indexCamion = asignacionCamiones.get(i);
            Pedido pedido = pedidos.get(i);

            EntregaPedido entrega = new EntregaPedido();
            entrega.setPedido(pedido);
            flota.get(indexCamion).getDestinos().add(entrega.copiar());
        }

        // Evaluar rutas
        for (Camion camion : flota) {
            if (!camion.getDestinos().isEmpty()) {
                camion.setCargaGLPActual(camion.getDestinos().get(0).getPedido().getVolumenGLP());//el camion parte con el GLP que le piden para el primer pedido
                Destino puntoPartida = inicioEnCisterPrincipal.copiar();
                puntoPartida.setFechaHoraSalida(LocalDateTime.now());
                camion.getDestinos().add(0, puntoPartida);
                int resultado = camion.construirRutaHaciaPedido(sistema);

                /*System.out.println("CAMION:" + resultado);
                for(Destino destino : camion.getDestinos()) {
                    System.out.println(destino.getRuta());
                }*/


                if (resultado == -1) {
                    solucionValida = false;
                    break;
                }
                camiones = new ArrayList<>(flota);
                tiempoOperacion += camion.getDistanciaTotal();
                combustibleTotal += camion.getCombustibleEmpleado();
            }
        }

        if (!solucionValida) {
            fitness = 0;
        } else {
            fitness = tiempoOperacion / (combustibleTotal + 1e-5); // evitar división por cero
        }
    }

    public void actualizarVelocidad(Particula mejorGlobal, Particula mejorLocal, double c1, double c2, double w) {
        Random random = new Random();
        for (int i = 0; i < velocidad.size(); i++) {
            int r1 = random.nextInt(2);
            int r2 = random.nextInt(2);

            int nuevaVelocidad = (int) (w * velocidad.get(i) +
                    c1 * r1 * (mejorLocal.getAsignacionCamiones().get(i) - asignacionCamiones.get(i)) +
                    c2 * r2 * (mejorGlobal.getAsignacionCamiones().get(i) - asignacionCamiones.get(i)));

            velocidad.set(i, Math.max(-1, Math.min(1, nuevaVelocidad))); // limitar la velocidad
        }
    }

    public void actualizarPosicion(int numCamiones) {
        for (int i = 0; i < asignacionCamiones.size(); i++) {
            int nuevaAsignacion = asignacionCamiones.get(i) + velocidad.get(i);
            if (nuevaAsignacion < 0) nuevaAsignacion = 0;
            if (nuevaAsignacion >= numCamiones) nuevaAsignacion = numCamiones - 1;
            asignacionCamiones.set(i, nuevaAsignacion);
        }
    }
}
