package com.plg.planificacionplg.clases;

import com.plg.planificacionplg.PlanificacionPlgApplication;
import lombok.Getter;
import lombok.Setter;

import java.util.*;

public class Genetico {
    private final int tamPoblacion;
    private final int generaciones;
    private final double probCruce;
    private final double probMutacion;
    private final double porcentajeElite;
    private int numIndividuosExploratorios = 15;
    @Getter @Setter private Individuo primerSolucionValida = null;
    @Getter @Setter private List<Double> resultados;

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
        numIndividuosExploratorios = (int)(tamPoblacion*0.1);
        // Inicializar población aleatora controlada
//        System.out.println("Inicio replan");

        for (int i = 0; i < tamPoblacion; i++) {
//            System.out.println("ind " + (i+1));
//            System.out.println("ped " + (numPedidos+1));
//            System.out.println("cam " + (numCamiones+1));
//            System.out.println("sis " + (sistema.getPedidos().size()+1));

            Individuo ind = new Individuo(numPedidos, numCamiones, sistema, code);

//            System.out.println(ind.getAsignacion());
//            System.out.println(ind.getPedidosXcargasGLP());
//            System.out.println("***************************************************************************************");

            ind.evaluar(code, sistema);
            poblacion.add(ind);
        }

        Individuo perfecto = null;
        while(perfecto==null){
            Individuo nuevo = new Individuo(numPedidos, numCamiones, sistema, code);
            nuevo.evaluar(code, sistema);
            if (nuevo.getFitness() > 0) {
                perfecto = nuevo;
            }
        }
        poblacion.add(perfecto);
        primerSolucionValida = perfecto;
        System.out.println("Al menos una solucion hallada");

        Individuo mejorSolucion = Collections.max(poblacion, Comparator.comparingDouble(Individuo::getFitness)).clonar(code);
        for (int gen = 0; gen < generaciones; gen++) {
            PlanificacionPlgApplication.setPorcentajeEjecucion(100.0 * (gen + 1) / generaciones);
            if (PlanificacionPlgApplication.isCancelarReplanificacion()) {
                System.out.println("Replanificación cancelada.");
                return perfecto; // salir anticipadamente
            }
            List<Individuo> nuevaGeneracion = new ArrayList<>();

            // Elitismo
            int numElite = (int) (tamPoblacion * porcentajeElite);
            poblacion.sort(Comparator.comparingDouble(Individuo::getFitness).reversed());
            for (int i = 0; i < numElite; i++) {
                if(poblacion.size()>i && poblacion.get(i).getFitness() > 0.0) { //outboudn
                    nuevaGeneracion.add(poblacion.get(i).clonar(code));
                }
            }


            int iter = 0;
            int maxIntentosGlobal = 20; // máximo de intentos permitidos por generación
            int intentosGlobales = 0;
            if(sistema.getCamionCausanteReplan()!=null)maxIntentosGlobal=0;
            while ((intentosGlobales < maxIntentosGlobal
            || nuevaGeneracion.isEmpty())) { //si no hay pedidos validos se queda
                if (iter > tamPoblacion*0.8) {
                    int generados = 0;
                    int intentos = 0;
                    int maxIntentos = 10; // evita bucles infinitos

                    while (generados < numIndividuosExploratorios && intentos < maxIntentos && nuevaGeneracion.size() < tamPoblacion) {
                        Individuo nuevo = new Individuo(numPedidos, numCamiones, sistema, code);
                        nuevo.evaluar(code, sistema);
                        if (nuevo.getFitness() > 0) {
                            nuevaGeneracion.add(nuevo); // ++ exploratorio
//                            System.out.println("fitness: "+nuevo.getFitness());
                            generados++;
                        }
                        intentos++;
                        intentosGlobales++;
                    }

//                    System.out.println("exploratorio fin");
                    iter = 0; // reiniciar el contador de intentos fallidos
                }

                // Cruce y mutación
                Individuo padre1 = seleccionarTorneo(poblacion);
                Individuo padre2 = seleccionarTorneo(poblacion);

                Individuo hijo = (rand.nextDouble() < probCruce)
                        ? cruzar(padre1, padre2, numCamiones, code)
                        : padre1.clonar(code);

                if (rand.nextDouble() < probMutacion) {
                    mutar(hijo, numCamiones);
                }

                hijo.evaluar(code, sistema);
                if (hijo.getFitness() > 0) {
                    nuevaGeneracion.add(hijo);
                }
                iter = iter+1;
                intentosGlobales++;
            }

            poblacion = nuevaGeneracion;

            Individuo mejorGen = Collections.max(poblacion, Comparator.comparingDouble(Individuo::getFitness));
            if (mejorGen.getFitness() > mejorSolucion.getFitness()) {
                mejorSolucion = mejorGen.clonar(code);
            }

            System.out.println("Gen " + (gen + 1)  + " - Fitness: " + mejorSolucion.getFitness());
            primerSolucionValida = mejorSolucion;
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
        Camion camAveriado = padre1.getSistemaPLG().getCamionCausanteReplan();
        for (int i = 1; i < numCamiones; i++) {
            if(camAveriado!=null && camAveriado.getId()==i)continue;
            List<Integer> pedidos1 = padre1.getAsignacion().getOrDefault(i, new ArrayList<>());
            List<Integer> pedidos2 = padre2.getAsignacion().getOrDefault(i, new ArrayList<>());

            List<Integer> hijoPedidos = new ArrayList<>();
            for (Integer pedido : pedidos1) {
                if (!asignados.contains(pedido) && rand.nextBoolean()
                        && padre1.getSistemaPLG().getPedidos().get(pedido-1).getEstado()==EstadoPedido.PENDIENTE) {
                    hijoPedidos.add(pedido);
                    asignados.add(pedido);
                }
            }
            for (Integer pedido : pedidos2) {
                if (!asignados.contains(pedido)
                        && padre1.getSistemaPLG().getPedidos().get(pedido-1).getEstado()==EstadoPedido.PENDIENTE) {
                    hijoPedidos.add(pedido);
                    asignados.add(pedido);
                }
            }

            asignacionHijo.put(i, hijoPedidos);
        }
        if(camAveriado!=null){
            List<Integer>pedidosCamAveriado = new ArrayList<>();
            for(Pedido p : camAveriado.getPedidosAsignados())
                if(p.getEstado()==EstadoPedido.ASIGNADO)pedidosCamAveriado.add(p.getId());
            asignacionHijo.put(camAveriado.getId(), pedidosCamAveriado);
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
            if (!asignados.contains(faltante)
                    && padre1.getSistemaPLG().getPedidos().get(faltante-1).getEstado()==EstadoPedido.PENDIENTE) {
                int randomCamion = 1 + rand.nextInt(numCamiones-1);
                while(camAveriado!=null && camAveriado.getId()==randomCamion)randomCamion = 1 + rand.nextInt(numCamiones-1);
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
        hijo.setSistemaPLG(padre1.getSistemaPLG());
        /*
        System.out.println(hijo.getAsignacion());
        System.out.println(hijo.getPedidosXcargasGLP());
        System.out.println("***************************************************************************************");
        */
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

        int pedido = todosPedidos.get(rand.nextInt(todosPedidos.size()));
        while(ind.getSistemaPLG().getPedidos().get(pedido-1).getEstado()!=EstadoPedido.PENDIENTE){
            pedido = todosPedidos.get(rand.nextInt(todosPedidos.size()));
        }
        // Remover de su camión actual
        for (List<Integer> pedidos : asignacion.values()) {
            pedidos.remove((Integer) pedido);
        }
        Camion camAveriado = ind.getSistemaPLG().getCamionCausanteReplan();
        // Reasignar aleatoriamente
        int nuevoCamion = 1 + rand.nextInt(numCamiones-1);
        while(camAveriado != null && nuevoCamion==camAveriado.getId()){
            nuevoCamion = 1 + rand.nextInt(numCamiones-1);
        }
        asignacion.computeIfAbsent(nuevoCamion, k -> new ArrayList<>()).add(pedido);

        if(camAveriado!=null){
            List<Integer>pedidosCamAveriado = new ArrayList<>();
            for(Pedido p : camAveriado.getPedidosAsignados())
                if(p.getEstado()==EstadoPedido.ASIGNADO)pedidosCamAveriado.add(p.getId());
            asignacion.put(camAveriado.getId(), pedidosCamAveriado);
        }

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
