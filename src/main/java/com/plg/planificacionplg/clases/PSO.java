package com.plg.planificacionplg.clases;

import lombok.Data;

import java.util.*;
@Data
public class PSO {
    private final int numParticulas;
    private final int iteraciones;
    private final double c1 = 1.5;
    private final double c2 = 1.5;
    private final double w = 0.7;

    public Particula ejecutar(SistemaPLG sistema) {
        int numPedidos = sistema.getPedidos().size();
        int numCamiones = sistema.getFlota().size();
        sistema.getPedidos().sort(Comparator.comparing(Pedido::getFechaHoraMaxEntrega));
        List<Particula> particulas = new ArrayList<>();
        Particula mejorGlobal = null;

        // Inicializar partículas
        for (int i = 0; i < numParticulas; i++) {
            Particula particula = new Particula(numPedidos, numCamiones);
            particula.evaluar(sistema);
            particulas.add(particula);
            if (mejorGlobal == null || particula.getFitness() > mejorGlobal.getFitness()) {
                mejorGlobal = copiarParticula(particula);

            }
        }

        for (int iter = 0; iter < iteraciones; iter++) {
            for (Particula particula : particulas) {
                Particula mejorLocal = copiarParticula(particula);

                particula.actualizarVelocidad(mejorGlobal, mejorLocal, c1, c2, w);
                particula.actualizarPosicion(numCamiones);
                particula.evaluar(sistema);

                if (particula.getFitness() > mejorLocal.getFitness()) {
                    mejorLocal = copiarParticula(particula);
                    /*System.out.println("***********************************************SOLUCION***************************************");
                    for(Camion c : particula.getCamiones()){
                        for(Destino d : c.getDestinos()){
                            System.out.println("ID Camion: "+c.getId());
                            d.imprimir();
                        }
                    }*/
                }

                if (particula.getFitness() > mejorGlobal.getFitness()) {
                    mejorGlobal = copiarParticula(particula);

                }
                //System.out.println(particula.getAsignacionCamiones());
            }
            System.out.println("Iteración " + iter + ", mejor fitness: " + mejorGlobal.getFitness());
        }

        return mejorGlobal;
    }

    private Particula copiarParticula(Particula original) {
        Particula copia = new Particula(original.getAsignacionCamiones().size(), 1);
        copia.setAsignacionCamiones(new ArrayList<>(original.getAsignacionCamiones()));
        copia.setVelocidad(new ArrayList<>(original.getVelocidad()));
        if(original.getCamiones()==null){
            original.setCamiones(new ArrayList<>());
            System.out.println("NO HAY Camiones de la particula: ");
        }
        copia.setCamiones(new ArrayList<>(original.getCamiones()));
        copia.setFitness(original.getFitness());
        return copia;
    }

    public PSO(int numParticulas, int iteraciones) {
        this.numParticulas = numParticulas;
        this.iteraciones = iteraciones;
    }
}
