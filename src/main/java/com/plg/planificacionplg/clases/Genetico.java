package com.plg.planificacionplg.clases;

import lombok.Getter;

import java.util.*;

public class Genetico {
    private final int tamPoblacion;
    private final int generaciones;
    private final double probCruce;
    private final double probMutacion;
    private final double porcentajeElite;
    @Getter
    private List<Double> resultados;

    public Genetico(int tamPoblacion, int generaciones, double probCruce, double probMutacion, double porcentajeElite) {
        this.tamPoblacion = tamPoblacion;
        this.generaciones = generaciones;
        this.probCruce = probCruce;
        this.probMutacion = probMutacion;
        this.porcentajeElite = porcentajeElite;
        resultados = new ArrayList<>();
    }

    public Individuo ejecutar(int code, SistemaPLG sistema) {
        int numPedidos = sistema.getPedidos().size();
        int numCamiones = sistema.getFlota().size();

        List<Individuo> poblacion = new ArrayList<>();
        Random rand = new Random();

        // Inicializar población
        for (int i = 0; i < tamPoblacion; i++) {
            Individuo ind = new Individuo(numPedidos, numCamiones, sistema, code);
            ind.evaluar(code, sistema);
            System.out.println(ind.getAsignacion());
            System.out.println(ind.getPedidosXcargasGLP());
            System.out.println("***************************************************************************************");
            poblacion.add(ind);
        }

        Individuo mejorSolucion = Collections.max(poblacion, Comparator.comparingDouble(Individuo::getFitness)).clonar(code);

        for (int gen = 0; gen < generaciones; gen++) {
            List<Individuo> nuevaGeneracion = new ArrayList<>();

            // Elitismo
            int numElite = (int) (tamPoblacion * porcentajeElite);
            poblacion.sort(Comparator.comparingDouble(Individuo::getFitness).reversed());
            for (int i = 0; i < numElite; i++) {
                nuevaGeneracion.add(poblacion.get(i).clonar(code));
            }

            // Cruce y mutación
            while (nuevaGeneracion.size() < tamPoblacion) { //si no hay pedidos validos se queda
                Individuo padre1 = seleccionarTorneo(poblacion);
                Individuo padre2 = seleccionarTorneo(poblacion);

                Individuo hijo = (rand.nextDouble() < probCruce)
                        ? cruzar(padre1, padre2, numCamiones, code)
                        : padre1.clonar(code);

                if (rand.nextDouble() < probMutacion) {
                    mutar(hijo, numCamiones);
                }
                //System.out.println(hijo.getAsignacion());
                hijo.evaluar(code, sistema);
                if (hijo.getFitness() > 0) {
                    nuevaGeneracion.add(hijo);
                }
            }

            poblacion = nuevaGeneracion;

            Individuo mejorGen = Collections.max(poblacion, Comparator.comparingDouble(Individuo::getFitness));
            if (mejorGen.getFitness() > mejorSolucion.getFitness()) {
                mejorSolucion = mejorGen.clonar(code);
            }

            System.out.println("Gen " + gen + " - Fitness: " + mejorSolucion.getFitness());
            resultados.add(mejorSolucion.getFitness());
        }

        return mejorSolucion;
    }

    private Individuo seleccionarTorneo(List<Individuo> poblacion) {
        Random rand = new Random();
        int k = 5;
        List<Individuo> torneo = new ArrayList<>();
        for (int i = 0; i < k; i++) {
            torneo.add(poblacion.get(rand.nextInt(poblacion.size())));
        }
        return Collections.max(torneo, Comparator.comparingDouble(Individuo::getFitness));
    }

    private Individuo cruzar(Individuo padre1, Individuo padre2, int numCamiones, int code) {
        numCamiones+=1;
        Random rand = new Random();
        Map<Integer, List<Integer>> asignacionHijo = new HashMap<>();

        Set<Integer> asignados = new HashSet<>();
        for (int i = 1; i < numCamiones; i++) {
            List<Integer> pedidos1 = padre1.getAsignacion().getOrDefault(i, new ArrayList<>());
            List<Integer> pedidos2 = padre2.getAsignacion().getOrDefault(i, new ArrayList<>());

            List<Integer> hijoPedidos = new ArrayList<>();
            for (Integer pedido : pedidos1) {
                if (!asignados.contains(pedido) && rand.nextBoolean()) {
                    hijoPedidos.add(pedido);
                    asignados.add(pedido);
                }
            }
            for (Integer pedido : pedidos2) {
                if (!asignados.contains(pedido)) {
                    hijoPedidos.add(pedido);
                    asignados.add(pedido);
                }
            }

            asignacionHijo.put(i, hijoPedidos);
        }

        // Reparar pedidos faltantes
        List<Integer> todosPedidos = new ArrayList<>();
        for (List<Integer> pedidos : padre1.getAsignacion().values()) {
            todosPedidos.addAll(pedidos);
        }
        for (List<Integer> pedidos : padre2.getAsignacion().values()) {
            todosPedidos.addAll(pedidos);
        }


        for (Integer faltante : todosPedidos) {
            if (!asignados.contains(faltante)) {
                int randomCamion=0;
                while (randomCamion==0)randomCamion = rand.nextInt(numCamiones);
                asignacionHijo.computeIfAbsent(randomCamion, k -> new ArrayList<>()).add(faltante);
            }
        }

        // Generar cargasGLP para el hijo
        Map<Integer, List<Integer>> cargasGLP = new HashMap<>();
        for (int i = 1; i < numCamiones; i++) {
            List<Integer> cargas = new ArrayList<>();
            Random randCarga = new Random();
            int cantPedRestantes = asignacionHijo.getOrDefault(i, new ArrayList<>()).size();
            int acc = 0;

            while (cantPedRestantes > 0) {
                int cantPedObjetivos = 1 + randCarga.nextInt(cantPedRestantes);
                acc += cantPedObjetivos;
                cargas.add(acc);
                cantPedRestantes -= cantPedObjetivos;
            }

            cargasGLP.put(i, cargas);
        }

        Individuo hijo = new Individuo(0, 0, padre1.getSistemaPLG(), code);
        hijo.setAsignacion(asignacionHijo);
        hijo.setPedidosXcargasGLP(cargasGLP);
        return hijo;
    }

    private void mutar(Individuo ind, int numCamiones) {
        numCamiones+=1;
        Random rand = new Random();
        Map<Integer, List<Integer>> asignacion = ind.getAsignacion();

        // Seleccionar pedido aleatorio
        List<Integer> todosPedidos = new ArrayList<>();
        for (List<Integer> pedidos : asignacion.values()) todosPedidos.addAll(pedidos);
        if (todosPedidos.isEmpty()) return;

        int pedido = todosPedidos.get(1+rand.nextInt(todosPedidos.size()-1));

        // Remover de su camión actual
        for (List<Integer> pedidos : asignacion.values()) {
            pedidos.remove((Integer) pedido);
        }

        // Reasignar aleatoriamente
        int nuevoCamion = 1 + rand.nextInt(numCamiones-1);
        asignacion.computeIfAbsent(nuevoCamion, k -> new ArrayList<>()).add(pedido);

        // Regenerar cargasGLP después de la mutación
        Map<Integer, List<Integer>> nuevasCargasGLP = new HashMap<>();
        for (int i = 1; i < numCamiones; i++) {
            List<Integer> cargas = new ArrayList<>();
            Random randCarga = new Random();
            int cantPedRestantes = asignacion.getOrDefault(i, new ArrayList<>()).size();
            int acc = 0;

            while (cantPedRestantes > 0) {
                int cantPedObjetivos = 1 + randCarga.nextInt(cantPedRestantes);
                acc += cantPedObjetivos;
                cargas.add(acc);
                cantPedRestantes -= cantPedObjetivos;
            }

            nuevasCargasGLP.put(i, cargas);
        }

        ind.setPedidosXcargasGLP(nuevasCargasGLP);
    }
}
