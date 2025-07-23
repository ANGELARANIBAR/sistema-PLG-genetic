package com.plg.planificacionplg;

import com.plg.planificacionplg.clases.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@SpringBootApplication
public class PlanificacionPlgApplication {
    private static final double MAX_DOUBLE = Double.MAX_VALUE;
    @Setter @Getter
    private static Individuo mejorSolucion;
    @Setter @Getter
    private static Boolean sigListo = false;
    @Setter @Getter
    private static Individuo mejorSolucionSiguiente;
    @Setter @Getter
    private static Individuo mejorSolucionAnterior;
    @Setter @Getter
    private static double porcentajeEjecucion;
    @Setter @Getter
    private static LocalDateTime fechaHoraInicio;

    @Setter @Getter
    private static int batchActual;
    @Setter @Getter
    private static double capMaxFlota;
    @Setter @Getter
    private static List<Pedido>listaPedidosTotal;

    @Setter @Getter
    private static int inicioBatchActual;

    @Setter @Getter
    private static boolean batchRefreshNeeded = false;

    @Setter @Getter
    private static boolean waitingForContinueSimulation = true;

    @Setter @Getter
    private static boolean allBatchesProcessed = false;

    @Setter @Getter
    private static List<Integer> flotaXTipoCam = new ArrayList<>(Arrays.asList(2, 3, 4, 10));

    @Setter @Getter
    private static boolean cancelarReplanificacion = false;

    // Rutas base para los archivos de datos
    private static final String BASE_DIR = "src/main/java/com/plg/planificacionplg/test/";
    private static final String PEDIDOS_FILE = BASE_DIR + "pedidos.20250419/";
    private static final String BLOQUEOS_FILE = BASE_DIR + "bloqueos.20250419/";
    private static final String AVERIAS_FILE = BASE_DIR + "averias.txt";
    private static final String MANTENIMIENTO_FILE = BASE_DIR + "planmantenimiento.txt";

    public static void main(String[] args) {
        SpringApplication.run(PlanificacionPlgApplication.class, args);
        estadoInicialSistemaPLG();
//        fechaHoraInicio = LocalDateTime.of(2025, 3, 23, 10, 30);
//        ejecutarAlgoritmo(2);
    }


    private static void estadoInicialSistemaPLG(){
        SistemaPLG sistemaPLG = new SistemaPLG();
        PlanificacionPlgApplication.setMejorSolucionSiguiente(new Individuo());
        mejorSolucionSiguiente.setSistemaPLG(sistemaPLG);
        sistemaPLG.setPedidos(new ArrayList<>());
        sistemaPLG.setBloqueos(new ArrayList<>());

        List<Cisterna> cisternas = new ArrayList<>();
        Cisterna principal = new Cisterna();
        principal.setId(1);
        principal.setPrincipal(true);
        principal.setCargaGLPActual(MAX_DOUBLE);
        principal.setCapacidadTotal(MAX_DOUBLE);
        principal.setUbicacion(new Nodo(12, 8));
        principal.setHoraAbastecimento(LocalTime.now());
        cisternas.add(principal);

        Cisterna cintermedio1 = new Cisterna();
        cintermedio1.setId(2);
        cintermedio1.setPrincipal(false);
        cintermedio1.setCapacidadTotal(160);
        cintermedio1.setCargaGLPActual(cintermedio1.getCapacidadTotal());
        cintermedio1.setUbicacion(new Nodo(42, 42));
        cintermedio1.setHoraAbastecimento(LocalTime.MIN);
        cisternas.add(cintermedio1);

        Cisterna cintermedio2 = new Cisterna();
        cintermedio2.setId(3);
        cintermedio2.setPrincipal(false);
        cintermedio2.setCapacidadTotal(160);
        cintermedio2.setCargaGLPActual(cintermedio1.getCapacidadTotal());
        cintermedio2.setUbicacion(new Nodo(63, 3));
        cintermedio2.setHoraAbastecimento(LocalTime.MIN);
        cisternas.add(cintermedio2);


        // Use fechaHoraInicio from frontend if available, otherwise use current time

        sistemaPLG.setCisternas(cisternas);
        sistemaPLG.setDistanciaManzana(1);
        sistemaPLG.setMaxXmapa(71);
        sistemaPLG.setMaxYmapa(51);
        sistemaPLG.setBloqueos(new ArrayList<>());
        sistemaPLG.setFlota(new ArrayList<>());
        sistemaPLG.setTurnosFin(List.of(
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                LocalTime.MAX
        ));
        double velocidadPromedio = 5.0 / 6.0;

        TipoCamion tipoCamion1 = new TipoCamion();
        tipoCamion1.setId(1);
        tipoCamion1.setTara(2.5);
        tipoCamion1.setCapCombustibleMax(25);
        tipoCamion1.setVelocidadPromedio(velocidadPromedio);//unidad distancia / minuto
        tipoCamion1.setPesoGLPMax(12.5);
        tipoCamion1.setCargaGLPMax(25);
        tipoCamion1.setCodigo("TA");
        TipoCamion tipoCamion2 = new TipoCamion();
        tipoCamion2.setId(2);
        tipoCamion2.setTara(2);
        tipoCamion2.setCapCombustibleMax(25);
        tipoCamion2.setVelocidadPromedio(velocidadPromedio);//unidad distancia / minuto
        tipoCamion2.setPesoGLPMax(7.5);
        tipoCamion2.setCargaGLPMax(15);
        tipoCamion2.setCodigo("TB");
        TipoCamion tipoCamion3 = new TipoCamion();
        tipoCamion3.setId(3);
        tipoCamion3.setTara(1.5);
        tipoCamion3.setCapCombustibleMax(25);
        tipoCamion3.setVelocidadPromedio(velocidadPromedio);//unidad distancia / minuto
        tipoCamion3.setPesoGLPMax(5);
        tipoCamion3.setCargaGLPMax(10);
        tipoCamion3.setCodigo("TC");
        TipoCamion tipoCamion4 = new TipoCamion();
        tipoCamion4.setId(4);
        tipoCamion4.setTara(1);
        tipoCamion4.setCapCombustibleMax(25);
        tipoCamion4.setVelocidadPromedio(velocidadPromedio);//unidad distancia / minuto
        tipoCamion4.setPesoGLPMax(2.5);
        tipoCamion4.setCargaGLPMax(5);
        tipoCamion4.setCodigo("TD");
        int cantCamionesInicial = 0;
        for (int i = 0; i < flotaXTipoCam.get(tipoCamion1.getId()-1); i++) {
            Camion camion = new Camion();   // Cisterna media
            camion.setIdxPorTipo(i+1);
            camion.setId(camion.getIdxPorTipo()+cantCamionesInicial);
            camion.setTipo(tipoCamion1);
            camion.setCodigo(tipoCamion1.getCodigo() + String.format("%02d", camion.getIdxPorTipo()));
            camion.setPlaca("ABC-00" + String.valueOf(camion.getId()));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            //camion.setCargaGLPActual(camion.getTipo().getCargaGLPMax());
            sistemaPLG.getFlota().add(camion);
        }
        cantCamionesInicial = sistemaPLG.getFlota().size();
        for (int i = 0; i < flotaXTipoCam.get(tipoCamion2.getId()-1); i++) {
            Camion camion = new Camion();   // Cisterna media
            camion.setIdxPorTipo(i+1);
            camion.setId(camion.getIdxPorTipo()+cantCamionesInicial);
            camion.setTipo(tipoCamion2);
            camion.setCodigo(tipoCamion2.getCodigo() + String.format("%02d", camion.getIdxPorTipo()));
            camion.setPlaca("ABC-00" + String.valueOf(camion.getId()));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }
        cantCamionesInicial = sistemaPLG.getFlota().size();
        for (int i = 0; i < flotaXTipoCam.get(tipoCamion3.getId()-1); i++) {
            Camion camion = new Camion();   // Cisterna media
            camion.setIdxPorTipo(i+1);
            camion.setId(camion.getIdxPorTipo()+cantCamionesInicial);
            camion.setTipo(tipoCamion3);
            camion.setCodigo(tipoCamion3.getCodigo() + String.format("%02d", camion.getIdxPorTipo()));
            camion.setPlaca("ABC-00" + String.valueOf(camion.getId()));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }
        cantCamionesInicial = sistemaPLG.getFlota().size();
        for (int i = 0; i < flotaXTipoCam.get(tipoCamion4.getId()-1); i++) {
            Camion camion = new Camion();   // Cisterna media
            camion.setIdxPorTipo(i+1);
            camion.setId(camion.getIdxPorTipo()+cantCamionesInicial);
            camion.setTipo(tipoCamion4);
            camion.setCodigo(tipoCamion4.getCodigo() + String.format("%02d", camion.getIdxPorTipo()));
            camion.setPlaca("ABC-00" + String.valueOf(camion.getId()));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }

    }

    public static void ejecutarAlgoritmo(int escenario) {

        SistemaPLG sistemaPLG = PlanificacionPlgApplication.mejorSolucionSiguiente.getSistemaPLG();

        LocalDateTime fechaInicio = (fechaHoraInicio != null) ? fechaHoraInicio : null;
        sistemaPLG.setFechaHoraInicio(fechaInicio);
        listaPedidosTotal = new ArrayList<>();
        if(escenario == 1 || escenario == 3) {
            listaPedidosTotal = sistemaPLG.cargarPedidosDesdeCarpeta(PEDIDOS_FILE, fechaInicio, LocalDateTime.MAX);
        }
        else if(escenario == 2) {
            listaPedidosTotal = sistemaPLG.cargarPedidosDesdeCarpeta(PEDIDOS_FILE, fechaInicio, fechaInicio.plusDays(7));
            System.out.println("Pedidos cantidad: " + sistemaPLG.getPedidos().size());
        }
        sistemaPLG.setPedidosTodos(new ArrayList<>(sistemaPLG.getPedidos()));


        sistemaPLG.cargarBloqueosDesdeCarpeta(BLOQUEOS_FILE);
        sistemaPLG.setCamionesAveriados(new ArrayList<>());
        //System.out.println(sistemaPLG.getBloqueos());

        int tamPoblacion = 30;
        int generaciones = 5;
        double probCruce = 0.10;
        double probMutacion = 0.10;
        double porcentajeElite = 0.1;
        capMaxFlota = 0.0;
        for(Camion c : sistemaPLG.getFlota()) {
            capMaxFlota +=c.getTipo().getCargaGLPMax();
        }
        if(escenario==3){
            generaciones=5;
        }
        inicioBatchActual = 0; // el primer batch siempre empieza en 0

        double cargaActual = 0.0;

        for (int i = 0; i < sistemaPLG.getPedidos().size(); i++) {
            double carga = sistemaPLG.getPedidos().get(i).getVolumenGLP();

            if (cargaActual + carga > capMaxFlota) {
                inicioBatchActual = i; // nuevo batch empieza aquí
                break;
            }
            cargaActual += carga;
        }

        int finBatch1 = (listaPedidosTotal.size() > inicioBatchActual) ? inicioBatchActual : listaPedidosTotal.size();
        List<Pedido> primerBatch = listaPedidosTotal.subList(0, finBatch1);
        sistemaPLG.setPedidos(new ArrayList<>(primerBatch));

        System.out.println("Iniciando Planificación");
        System.out.println("Procesando batch Nro: " + 1);
        System.out.println("Cantidad pedidos: " + sistemaPLG.getPedidos().size());
        Genetico ga = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
        if(escenario==3){
            mejorSolucion = ga.ejecutar(escenario, sistemaPLG);
        }
        else{
            mejorSolucion = ga.ejecutar(1, sistemaPLG);

        }
        // Load maintenance and averias
        mejorSolucion.getSistemaPLG().cargarMantenimientos(
                MANTENIMIENTO_FILE,
                LocalTime.MIN, LocalTime.MAX
        );
        mejorSolucion.getSistemaPLG().cargarAverias(AVERIAS_FILE);
        mejorSolucion.getSistemaPLG().imprimirPlanificacion();
        PlanificacionPlgApplication.setBatchRefreshNeeded(true);//true
        batchActual = 1;
        
        // Process all remaining batches
        procesarTodosLosBatches();

        double min = 0.35;
        double max = 0.75;

        // Procesar averias
        for (Averia a : mejorSolucion.getSistemaPLG().getAverias()) {

            SistemaPLG replanificado = new SistemaPLG(mejorSolucion.getSistemaPLG());
            replanificado.setCisternas(mejorSolucion.getSistemaPLG().getCisternas());
            Camion camion = mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion());
            double random = min + (Math.random() * ((max - min) + Double.MIN_VALUE));
            double tiempoAveria = camion.getDistanciaTotal() * random / camion.getTipo().getVelocidadPromedio();
            LocalDateTime inicioAveria = mejorSolucion.getSistemaPLG().getFechaHoraInicio().plusSeconds((long) tiempoAveria * 60);
            int turnoiniidx = a.getTurnoOcurrencia() - 2, turnoidx = a.getTurnoOcurrencia() - 1;
            LocalTime turnoini;
            if (turnoiniidx < 0) {
                turnoini = LocalTime.MIN;
            } else turnoini = mejorSolucion.getSistemaPLG().getTurnosFin().get(turnoiniidx);
            if (mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().size() < 2) continue;
            Camion cam = mejorSolucion.getSistemaPLG().getCamionEnInstante(a.getIdCamion() + 1, inicioAveria);
            a.setFechaHoraInicio(inicioAveria);
            if (cam != null && cam.getEstado() == EstadoCamion.EN_RETORNO) continue;
            if (false && (turnoini.isBefore(inicioAveria.toLocalTime())
                    && mejorSolucion.getSistemaPLG().getTurnosFin().get(turnoidx).isAfter(inicioAveria.toLocalTime()))) {
                System.out.println("Iniciando RePlanificación Aleatoria");
                // Set replanning flag and averia start time at the start of this specific averia's replanification
                mejorSolucion.getSistemaPLG().setReplanning(true);
                mejorSolucion.getSistemaPLG().setAveriaStartTime(inicioAveria);

                a.determinarFechaFin(mejorSolucion.getSistemaPLG());
                //cam.setEstado(EstadoCamion.AVERIADO);

                try{
                    if(cam!=null && cam.getEstado()==EstadoCamion.EN_RETORNO)return;

                    for(Cisterna cist : mejorSolucion.getSistemaPLG().getCisternas()){
                        OperacionesGLPCisterna op = new OperacionesGLPCisterna();
                        op.setFechaHoraOperacion(a.getFechaHoraInicio().plusMinutes(1));
                        int idxLastOpCis = Collections.binarySearch(
                                cist.getOperacionesGLPCisterna(),
                                op,
                                Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
                        );

                        if (idxLastOpCis < 0) {
                            idxLastOpCis = -idxLastOpCis - 1;
                        }
                        if (idxLastOpCis < cist.getOperacionesGLPCisterna().size()) {
                            cist.getOperacionesGLPCisterna().subList(idxLastOpCis, cist.getOperacionesGLPCisterna().size()).clear();
                        }
                    }
                    replanificado.setCisternas(mejorSolucion.getSistemaPLG().getCisternas());
                    inicioAveria = a.getFechaHoraInicio();
                    if(mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().size()<2)return;

                    mejorSolucion.getSistemaPLG().setReplanning(true);
                    mejorSolucion.getSistemaPLG().setAveriaStartTime(inicioAveria);

                    a.determinarFechaFin(mejorSolucion.getSistemaPLG());

                    // Replanification process
                    mejorSolucion.getSistemaPLG().estadoDePedidosALas(inicioAveria);
                    replanificado.setFechaHoraInicio(inicioAveria);
                    replanificado.setFlota(new ArrayList<>());
                    replanificado.setPedidos(new ArrayList<>(mejorSolucion.getSistemaPLG().getPedidos()));
                    replanificado.setCamionesAveriados(new ArrayList<>());
                    replanificado.getCamionesAveriados().add(cam);
                    replanificado.setCamionCausanteReplan(cam);
                    cam.getAverias().add(a);
                    Replanficacion origenReplan = new Replanficacion();
                    origenReplan.setUbicacion(cam.getUbicacionActual());
                    origenReplan.setFechaHoraLlegada(inicioAveria);
                    origenReplan.setFechaHoraSalida(a.getFechaHoraFin());
                    origenReplan.setGLPOperacion(0.0);
                    if (mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().isEmpty()) {
                        mejorSolucion.getSistemaPLG().setReplanning(false);
                        mejorSolucion.getSistemaPLG().setAveriaStartTime(null);
                        return;
                    }
                    Destino destActuAveriado = mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos()
                            .get(cam.getIdxDestinoEnCurso());
                    origenReplan.setSaldoGLPCamion(cam.calcularGLPActual(inicioAveria));
                    origenReplan.setSaldoCombustibleCamion(cam.getCombustibleActual());
                    origenReplan.setEstadoCamion(EstadoCamion.AVERIADO);
                    if (cam.getEstado() != EstadoCamion.EN_RUTA) {
                        if(destActuAveriado!=null)destActuAveriado.setEstadoCamion(EstadoCamion.AVERIADO);
                        cam.getDestinos().add(destActuAveriado);
                    } else cam.getDestinos().add(origenReplan);


                    for (int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++) {
                        //si el camion no tiene registro de atenciones en la planificaicon
                        if (mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().size() < 3) {
                            //dar origen en cisterna principal
                            Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getFlota().get(i));
                            Reabastecimiento origen = new Reabastecimiento();
                            origen.setCisterna(mejorSolucion.getSistemaPLG().getCisternas().get(0));
                            origen.setUbicacion(mejorSolucion.getSistemaPLG().getCisternas().get(0).getUbicacion());
                            origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                            replanificado.getCisternas().get(0).registrarRetiroGLP(mejorSolucion.getSistemaPLG().getFechaHoraInicio(),
                                    0.0, nuevoCamion);
                            nuevoCamion.setCargaGLPActual(0.0);
                            nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                            nuevoCamion.getDestinos().add(0, origen);
                            origen.setSaldoGLPCamion(0.0);
                            origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                            nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                            //nuevoCamion.getDestinos().add(origen);
                            nuevoCamion.setUbicacionActual(origen.getUbicacion());
                            replanificado.getFlota().add(nuevoCamion);
                            System.out.println("camion que no salio> "+nuevoCamion.getId());
                            System.out.println("camion que no salio> "+nuevoCamion.getUbicacionActual());

                            continue;
                        }
                        if (i == a.getIdCamion()) {
                            replanificado.getFlota().add(cam);
                            continue;

                        }
                        Camion nuevoCamion = mejorSolucion.getSistemaPLG().getCamionEnInstante(i + 1, inicioAveria);
                        nuevoCamion.setCargasGLP(new ArrayList<>());
                        nuevoCamion.setDestinos(new ArrayList<>());
                        Destino destinoActual = nuevoCamion.getDestinoEnCurso();
                        if (destinoActual == null) {
                            //caso de los camiones que terminaron su ruta antes de la averia
                            destinoActual = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getLast().copiar();
                            nuevoCamion.getDestinos().add(destinoActual);
                            if(nuevoCamion.getDestinos().get(0).getFechaHoraSalida().isBefore(replanificado.getFechaHoraInicio())) {
                                // si el camion esta disponible antes del inicio de la averia, entoncs espera a que la averia ocurra
                                nuevoCamion.getDestinos().get(0).setFechaHoraSalida(replanificado.getFechaHoraInicio());
                            }
                            replanificado.getFlota().add(nuevoCamion);
                            System.out.println("camion en reposo> "+nuevoCamion.getId());
                            continue;
                        }

                        if (nuevoCamion.getEstado() != EstadoCamion.EN_RUTA && nuevoCamion.getEstado() != EstadoCamion.EN_RETORNO) {//despachando o recargando
                            nuevoCamion.getDestinos().add(destinoActual); //inicio, no es modificable en la construccion de rutas
                            System.out.println(nuevoCamion.getEstado());
                            System.out.println("camion que no esta en ruta> "+nuevoCamion.getId());
                            System.out.println("camion que no esta en ruta> "+nuevoCamion.getUbicacionActual());
                        } else {
                            origenReplan = new Replanficacion();
                            origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(i).calcularUbicacion(inicioAveria));
                            origenReplan.setFechaHoraLlegada(inicioAveria);
                            origenReplan.setFechaHoraSalida(inicioAveria);
                            origenReplan.setGLPOperacion(0.0);
                            Destino anterior = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinoAnteriorAFechaHora(inicioAveria);
                            if(anterior != null)
                                origenReplan.setSaldoGLPCamion(anterior.getSaldoGLPCamion());
                            else origenReplan.setSaldoGLPCamion(0.0);
                            origenReplan.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                            nuevoCamion.getDestinos().add(origenReplan);
                            System.out.println("camion en ruta> "+nuevoCamion.getId());
                            System.out.println("camion en ruta> "+nuevoCamion.getUbicacionActual());
                        }
                        replanificado.getFlota().add(nuevoCamion);
                    }
                    if(mejorSolucion.getSistemaPLG().getCamionesAveriados().isEmpty())
                        mejorSolucion.getSistemaPLG().getCamionesAveriados().add(cam);//solo para la primera averia
                    for(Camion c : mejorSolucion.getSistemaPLG().getCamionesAveriados()){
                        int idcam = c.getId();
                        Camion camAveriado  = replanificado.getFlota().get(idcam-1);
                        if(camAveriado.getAverias()==null)camAveriado.setAverias(new ArrayList<>());
                        if(cam.getId()!=camAveriado.getId())
                            replanificado.getCamionesAveriados().add(camAveriado);
                        camAveriado.getAverias().add(c.getAverias().getLast());
                        if (camAveriado.getAverias().getLast().getTipo().getId() == 1) {
                            camAveriado.setPedidosAsignados(new ArrayList<>());
                            for (Pedido p : mejorSolucion.getSistemaPLG().getFlota().get(camAveriado.getId()-1).getPedidosAsignados()) {
                                if (p.getEstado() == EstadoPedido.PENDIENTE) {
                                    p.setEstado(EstadoPedido.ASIGNADO);//no pasan a replanificaion
                                    camAveriado.getPedidosAsignados().add(p);
                                }
                            }
                        } else camAveriado.setPedidosAsignados(new ArrayList<>());//caso 2 y 3 donde no atiende sino se va
                    }
                    tamPoblacion = 30;
                    generaciones = 5;
                    probCruce = 0.3;
                    probMutacion = 0.15;
                    porcentajeElite = 0.2;
                    Genetico ga2 = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
                    mejorSolucion = ga2.ejecutar(2, replanificado);
                    mejorSolucion.getSistemaPLG().imprimirPlanificacion();
                    mejorSolucion.getSistemaPLG().setReplanning(false);
                    mejorSolucion.getSistemaPLG().setAveriaStartTime(null);
                } finally {
                    mejorSolucion.getSistemaPLG().setReplanning(false);
                }

            }
        }
    }
    
    public static void procesarTodosLosBatches() {
        try {
            Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
            if (mejorSolucion == null || mejorSolucion.getSistemaPLG() == null) {
                return;
            }
            
            int batchActual = PlanificacionPlgApplication.getBatchActual();
            List<Pedido> listaPedidosTotal = PlanificacionPlgApplication.getListaPedidosTotal();
            
            if (inicioBatchActual == 0 || listaPedidosTotal.size() < inicioBatchActual) {
                return;
            }
            LocalDateTime inicio = mejorSolucion.getSistemaPLG().getFechaHoraInicio();
            // Process all remaining batches
            while (inicioBatchActual < (listaPedidosTotal.size()+1)) {
                //inicio = mejorSolucion.getSistemaPLG().getFechaHoraFinEntregas();
                inicio = inicio.plusHours(2); //horas simuladas procesadas
                int inicioBatch = inicioBatchActual;
                double cargaActual = 0.0;

                for (int i = inicioBatchActual; i < listaPedidosTotal.size(); i++) {
                    double carga = listaPedidosTotal.get(i).getVolumenGLP();

                    if (cargaActual + carga > capMaxFlota*1) {
                        inicioBatchActual = i; // nuevo batch empieza aquí
                        break;
                    }
                    cargaActual += carga;
                }

                int finBatch = (listaPedidosTotal.size() > inicioBatchActual) ? inicioBatchActual : listaPedidosTotal.size();
                System.out.println("Procesando batch Nro: " + (batchActual + 1));
                System.out.println("Fecha fin de entregas: "+ inicio);
                System.out.println("primer max: "+ listaPedidosTotal.get(inicioBatch).getFechaHoraMaxEntrega());
                System.out.println("ultimo max: "+ listaPedidosTotal.get(finBatch-1).getFechaHoraMaxEntrega());
                System.out.println("primer max corregido: "+ listaPedidosTotal.get(inicioBatch).getFechaHoraMaxEntrega());

                if (inicioBatch >= finBatch || inicioBatch >= listaPedidosTotal.size()) {
                    break;
                }

                List<Pedido> batch = listaPedidosTotal.subList(inicioBatch, finBatch);
                ArrayList<Pedido> pedidosNuevos = new ArrayList<>(batch);
                
                // Reasignar IDs para el batch
                List<Pedido>pedidosVencidos = new ArrayList<>();
                for (int j = 0; j < pedidosNuevos.size(); j++) {
                    pedidosNuevos.get(j).setId(j + 1);
//                    if(inicio.plusMinutes(10).isAfter(pedidosNuevos.get(j).getFechaHoraMaxEntrega())){
//                        //destinar a un camion en caliente
//                        System.out.println("!!!!!!!!!!!!!!!!!!!!!!PEDIDO PARA REPROGRAMAR!!!");
//                        System.out.println("max entrega: " + pedidosNuevos.get(j).getFechaHoraMaxEntrega());
//                        //eliminar de prox batch
//                        pedidosVencidos.add(pedidosNuevos.get(j));
//                        pedidosNuevos.get(j).setId(pedidosVencidos.size());
//                        pedidosNuevos.remove(j);
//                        j--;
//                    }
                }

                if(false && !pedidosVencidos.isEmpty()){
                    Thread hiloPedidosVencidos = new Thread(() -> {
                        atenderEnCaliente(pedidosVencidos);
                    });
                    hiloPedidosVencidos.start();
                    //tomar mas pedidos dado que hay pedidos que vencen en este batch
                    int i = inicioBatchActual;
                    for(Pedido p : pedidosVencidos){
                        pedidosNuevos.add(listaPedidosTotal.get(i));
                        listaPedidosTotal.get(i).setId(pedidosNuevos.size());
                        i++;
                    }
                    inicioBatchActual = i;
                }


                System.out.println("Cantidad pedidos: " + pedidosNuevos.size());
                
                // Create a copy of the current solution for the next batch
                Individuo mejorSolucionActual = PlanificacionPlgApplication.getMejorSolucion();
                mejorSolucionSiguiente = new Individuo();
                mejorSolucionSiguiente.setSistemaPLG(new SistemaPLG());
                mejorSolucionSiguiente.getSistemaPLG().deepCopy(mejorSolucionActual.getSistemaPLG());
                
                // Process the batch
                PlanificacionPlgApplication.setBatchActual(batchActual + 1);
                PlanificacionPlgApplication.setCancelarReplanificacion(false);
                final LocalDateTime inicioCopia = inicio;
                Thread hiloReplanificacion = new Thread(() -> {
                    PlanificacionPlgApplication.replanificar(
                            PlanificacionPlgApplication.getMejorSolucionSiguiente(),
                            inicioCopia,
                            pedidosNuevos
                    );
                });
                hiloReplanificacion.start();


                while (PlanificacionPlgApplication.isWaitingForContinueSimulation()) {
                    try {
                        Thread.sleep(100); // Check every 100ms
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
                // El frontend ya pidió la solución anterior. Cancelar replanificación.
                PlanificacionPlgApplication.setCancelarReplanificacion(true);
                // After processing the second batch, pause and wait for continueSimulation API
                PlanificacionPlgApplication.setWaitingForContinueSimulation(true);
                while (!PlanificacionPlgApplication.getSigListo()) {
                    try {
                        Thread.sleep(100); // Check every 100ms
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }

                System.out.println("actualizando system al front");
                PlanificacionPlgApplication.setSigListo(false);
                PlanificacionPlgApplication.setMejorSolucion(mejorSolucionSiguiente);
                PlanificacionPlgApplication.setBatchRefreshNeeded(false);//true);
                mejorSolucion = mejorSolucionSiguiente;
                System.out.println("Continuing with remaining batches...");

                batchActual = PlanificacionPlgApplication.getBatchActual();
            }
            
            // Mark all batches as processed
            PlanificacionPlgApplication.setAllBatchesProcessed(true);
            System.out.println("All batches have been processed successfully.");
        } catch (Exception e) {
            System.err.println("Error processing batches: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public static void replanificar2(Individuo mejorSolucion, LocalDateTime inicioReplan, ArrayList<Pedido>pedidosnuevos){
        SistemaPLG replanificado = mejorSolucion.getSistemaPLG();
        mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        replanificado.setPedidos(pedidosnuevos);

//        mejorSolucion.getSistemaPLG().estadoDePedidosALas(inicioReplan);
//        for(Pedido p : mejorSolucion.getSistemaPLG().getPedidos()){
//            if(p.getEstado()!=EstadoPedido.ENTREGADO){
//                Pedido pedidoCopia = new Pedido(p);
//                if(p.getId()<replanificado.getPedidos().size()){
//                    Pedido reemplazado = replanificado.getPedidos().get(p.getId()-1);
//                    replanificado.getPedidos().remove(p.getId()-1);
//                    replanificado.getPedidos().add(p.getId()-1, pedidoCopia);
//                    replanificado.getPedidos().add(reemplazado);
//                    reemplazado.setId(replanificado.getPedidos().size()+1);
//                }
//                else{
//                    replanificado.getPedidos().add(pedidoCopia); //en caso el batch sea mas pequeno que el anterior
//                    pedidoCopia.setId(replanificado.getPedidos().size()+1);
//                }
//            }
//        }

        for(Cisterna cist : mejorSolucion.getSistemaPLG().getCisternas()){
            OperacionesGLPCisterna op = new OperacionesGLPCisterna();
            op.setFechaHoraOperacion(inicioReplan.plusMinutes(1));
            int idxLastOpCis = Collections.binarySearch(
                    cist.getOperacionesGLPCisterna(),
                    op,
                    Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
            );

            if (idxLastOpCis < 0) {
                idxLastOpCis = -idxLastOpCis - 1;
            }
            if (idxLastOpCis < cist.getOperacionesGLPCisterna().size()) {
                cist.getOperacionesGLPCisterna().subList(idxLastOpCis, cist.getOperacionesGLPCisterna().size()).clear();
            }

        }
        replanificado.setCisternas(mejorSolucion.getSistemaPLG().getCisternas());
        mejorSolucion.getSistemaPLG().setReplanning(false);//mostrar mensaje
        mejorSolucion.getSistemaPLG().setAveriaStartTime(inicioReplan);
        // Replanificacion process
        replanificado.setFlota(new ArrayList<>());
        replanificado.setFechaHoraInicio(inicioReplan);
        replanificado.setCamionCausanteReplan(null);
        try{
            for (int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++) {
                //si el camion no tiene registro de atenciones en la planificaicon
                if (mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().size() < 3) {
                    //dar origen en cisterna principal
                    Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getFlota().get(i));
                    Reabastecimiento origen = new Reabastecimiento();
                    origen.setCisterna(mejorSolucion.getSistemaPLG().getCisternas().get(0));
                    origen.setUbicacion(mejorSolucion.getSistemaPLG().getCisternas().get(0).getUbicacion());
                    origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                    replanificado.getCisternas().get(0).registrarRetiroGLP(mejorSolucion.getSistemaPLG().getFechaHoraInicio(),
                            0.0, nuevoCamion);
                    nuevoCamion.setCargaGLPActual(0.0);
                    nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                    nuevoCamion.getDestinos().add(0, origen);
                    origen.setSaldoGLPCamion(0.0);
                    origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                    //nuevoCamion.getDestinos().add(origen);
                    nuevoCamion.setUbicacionActual(origen.getUbicacion());
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion que no salio> "+nuevoCamion.getId());
                    System.out.println("camion que no salio> "+nuevoCamion.getUbicacionActual());

                    continue;
                }
                Camion nuevoCamion = mejorSolucion.getSistemaPLG().getCamionEnInstante(i + 1, inicioReplan);
                nuevoCamion.setCargasGLP(new ArrayList<>());
                nuevoCamion.setDestinos(new ArrayList<>());
                Destino destinoActual = nuevoCamion.getDestinoEnCurso();
                if (destinoActual == null) {
                    //caso de los camiones que terminaron su ruta antes de la averia
                    destinoActual = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getLast().copiar();
                    nuevoCamion.getDestinos().add(destinoActual);
                    if(nuevoCamion.getDestinos().get(0).getFechaHoraSalida().isBefore(replanificado.getFechaHoraInicio())) {
                        // si el camion esta disponible antes del inicio de la averia, entoncs espera a que la averia ocurra
                        nuevoCamion.getDestinos().get(0).setFechaHoraSalida(replanificado.getFechaHoraInicio());
                    }
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion en reposo> "+nuevoCamion.getId());
                    continue;
                }

                if (nuevoCamion.getEstado() != EstadoCamion.EN_RUTA && nuevoCamion.getEstado() != EstadoCamion.EN_RETORNO) {//despachando o recargando
                    nuevoCamion.getDestinos().add(destinoActual); //inicio, no es modificable en la construccion de rutas
                    System.out.println(nuevoCamion.getEstado());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getId());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getUbicacionActual());
                } else {
                    Destino origenReplan = new Replanficacion();
                    origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(i).calcularUbicacion(inicioReplan));
                    origenReplan.setFechaHoraLlegada(inicioReplan);
                    origenReplan.setFechaHoraSalida(inicioReplan);
                    origenReplan.setGLPOperacion(0.0);
                    Destino anterior = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinoAnteriorAFechaHora(inicioReplan);
                    if(anterior != null)
                        origenReplan.setSaldoGLPCamion(anterior.getSaldoGLPCamion());
                    else origenReplan.setSaldoGLPCamion(0.0);
                    origenReplan.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.getDestinos().add(origenReplan);
                    System.out.println("camion en ruta> "+nuevoCamion.getId());
                    System.out.println("camion en ruta> "+nuevoCamion.getUbicacionActual());
                }
                replanificado.getFlota().add(nuevoCamion);
            }
            int tamPoblacion = 20;
            int generaciones = 5;
            double probCruce = 0.1;
            double probMutacion = 0.1;
            double porcentajeElite = 0.1;
            Genetico ga2 = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
            System.out.println("%%%%%%%%%%%%%%%%%%%%REPLANNING%%%%%%%%%%%%%%%%%%%%");
            mejorSolucion = ga2.ejecutar(2, replanificado);
            mejorSolucion.getSistemaPLG().imprimirPlanificacion();

            mejorSolucion.getSistemaPLG().setReplanning(false);
            mejorSolucion.getSistemaPLG().setAveriaStartTime(null);
            PlanificacionPlgApplication.setMejorSolucionSiguiente(mejorSolucion);
            PlanificacionPlgApplication.setMejorSolucionAnterior(mejorSolucion);
            PlanificacionPlgApplication.setSigListo(true);

        } finally {
            mejorSolucion.getSistemaPLG().setReplanning(false);
        }
    }

    public static void replanificar(Individuo mejorSolucion, LocalDateTime inicioReplan, ArrayList<Pedido>pedidosnuevos){
        SistemaPLG replanificado = mejorSolucion.getSistemaPLG();
        mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        replanificado.setPedidos(pedidosnuevos);

//        mejorSolucion.getSistemaPLG().estadoDePedidosALas(inicioReplan);
//        for(Pedido p : mejorSolucion.getSistemaPLG().getPedidos()){
//            if(p.getEstado()!=EstadoPedido.ENTREGADO){
//                Pedido pedidoCopia = new Pedido(p);
//                if(p.getId()<replanificado.getPedidos().size()){
//                    Pedido reemplazado = replanificado.getPedidos().get(p.getId()-1);
//                    replanificado.getPedidos().remove(p.getId()-1);
//                    replanificado.getPedidos().add(p.getId()-1, pedidoCopia);
//                    replanificado.getPedidos().add(reemplazado);
//                    reemplazado.setId(replanificado.getPedidos().size()+1);
//                }
//                else{
//                    replanificado.getPedidos().add(pedidoCopia); //en caso el batch sea mas pequeno que el anterior
//                    pedidoCopia.setId(replanificado.getPedidos().size()+1);
//                }
//            }
//        }

        for(Cisterna cist : mejorSolucion.getSistemaPLG().getCisternas()){
            OperacionesGLPCisterna op = new OperacionesGLPCisterna();
            op.setFechaHoraOperacion(inicioReplan.plusMinutes(1));
            int idxLastOpCis = Collections.binarySearch(
                    cist.getOperacionesGLPCisterna(),
                    op,
                    Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
            );

            if (idxLastOpCis < 0) {
                idxLastOpCis = -idxLastOpCis - 1;
            }
            if (idxLastOpCis < cist.getOperacionesGLPCisterna().size()) {
                cist.getOperacionesGLPCisterna().subList(idxLastOpCis, cist.getOperacionesGLPCisterna().size()).clear();
            }

        }
        replanificado.setCisternas(mejorSolucion.getSistemaPLG().getCisternas());
        mejorSolucion.getSistemaPLG().setReplanning(false);//mostrar mensaje
        mejorSolucion.getSistemaPLG().setAveriaStartTime(inicioReplan);
        // Replanificacion process
        replanificado.setFlota(new ArrayList<>());
        replanificado.setFechaHoraInicio(inicioReplan);
        replanificado.setCamionCausanteReplan(null);
        try{
            List<Camion>camionesEnRuta = new ArrayList<>();
            for (int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++) {
                //si el camion no tiene registro de atenciones en la planificaicon

                if (mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().size() < 3) {
                    //dar origen en cisterna principal
                    Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getFlota().get(i));
                    Reabastecimiento origen = new Reabastecimiento();
                    origen.setCisterna(mejorSolucion.getSistemaPLG().getCisternas().get(0));
                    origen.setUbicacion(mejorSolucion.getSistemaPLG().getCisternas().get(0).getUbicacion());
                    origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                    replanificado.getCisternas().get(0).registrarRetiroGLP(mejorSolucion.getSistemaPLG().getFechaHoraInicio(),
                            0.0, nuevoCamion);
                    nuevoCamion.setCargaGLPActual(0.0);
                    nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                    nuevoCamion.getDestinos().add(0, origen);
                    origen.setSaldoGLPCamion(0.0);
                    origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                    //nuevoCamion.getDestinos().add(origen);
                    nuevoCamion.setUbicacionActual(origen.getUbicacion());
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion que no salio> "+nuevoCamion.getId());
                    System.out.println("camion que no salio> "+nuevoCamion.getUbicacionActual());

                    continue;
                }
                Camion nuevoCamion = mejorSolucion.getSistemaPLG().getCamionEnInstante(i + 1, inicioReplan);
                nuevoCamion.setCargasGLP(new ArrayList<>());
                nuevoCamion.setDestinos(new ArrayList<>());
                Destino destinoActual = nuevoCamion.getDestinoEnCurso();
                if (destinoActual == null) {
                    //caso de los camiones que terminaron su ruta antes de la averia
                    destinoActual = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getLast().copiar();
                    nuevoCamion.getDestinos().add(destinoActual);
                    if(nuevoCamion.getDestinos().get(0).getFechaHoraSalida().isBefore(replanificado.getFechaHoraInicio())) {
                        // si el camion esta disponible antes del inicio de la averia, entoncs espera a que la averia ocurra
                        nuevoCamion.getDestinos().get(0).setFechaHoraSalida(replanificado.getFechaHoraInicio());
                    }
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion en reposo> "+nuevoCamion.getId());
                    continue;
                }

                if (nuevoCamion.getEstado() != EstadoCamion.EN_RUTA && nuevoCamion.getEstado() != EstadoCamion.EN_RETORNO) {//despachando o recargando
                    nuevoCamion.getDestinos().add(destinoActual); //inicio, no es modificable en la construccion de rutas
                    System.out.println(nuevoCamion.getEstado());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getId());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getUbicacionActual());
                } else {
                    Destino origenReplan = new Replanficacion();
                    origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(i).calcularUbicacion(inicioReplan));
                    origenReplan.setFechaHoraLlegada(inicioReplan);
                    origenReplan.setFechaHoraSalida(inicioReplan);
                    origenReplan.setGLPOperacion(0.0);
                    Destino anterior = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinoAnteriorAFechaHora(inicioReplan);
                    if(anterior != null)
                        origenReplan.setSaldoGLPCamion(anterior.getSaldoGLPCamion());
                    else origenReplan.setSaldoGLPCamion(0.0);
                    origenReplan.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());

                    nuevoCamion.getDestinos().add(mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getLast().copiar());
                    nuevoCamion.getDestinos().getFirst().setFechaHoraLlegada(inicioReplan); //no imoporta

                    camionesEnRuta.add(mejorSolucion.getSistemaPLG().getFlota().get(i));
                    System.out.println("camion en ruta> "+nuevoCamion.getId());
                    System.out.println("camion en ruta> "+nuevoCamion.getUbicacionActual());
                }
                replanificado.getFlota().add(nuevoCamion);
            }
            int tamPoblacion = 20;
            int generaciones = 5;
            double probCruce = 0.1;
            double probMutacion = 0.1;
            double porcentajeElite = 0.1;
            Genetico ga2 = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
            System.out.println("%%%%%%%%%%%%%%%%%%%%REPLANNING%%%%%%%%%%%%%%%%%%%%");
            mejorSolucion = ga2.ejecutar(2, replanificado);
            mejorSolucion.getSistemaPLG().imprimirPlanificacion();
            for(Camion c : camionesEnRuta) {
                mejorSolucion.getSistemaPLG().getFlota().get(c.getId()-1).getDestinos().removeFirst();
                mejorSolucion.getSistemaPLG().getFlota().get(c.getId()-1).getDestinos().addAll(0, c.getDestinos());
            }
            mejorSolucion.getSistemaPLG().setReplanning(false);
            mejorSolucion.getSistemaPLG().setAveriaStartTime(null);
            PlanificacionPlgApplication.setMejorSolucionSiguiente(mejorSolucion);
            PlanificacionPlgApplication.setMejorSolucionAnterior(mejorSolucion);
            PlanificacionPlgApplication.setSigListo(true);

        } finally {
            mejorSolucion.getSistemaPLG().setReplanning(false);
        }
    }
    public static void atenderEnCaliente(List<Pedido>pedidosVencidos){
        if(!pedidosVencidos.isEmpty()){
            try{
                List<Integer>idxFlotaAnterior = new ArrayList<>();
                List<Camion>camionesDisponibles = new ArrayList<>();
                SistemaPLG replanificado = new SistemaPLG(mejorSolucion.getSistemaPLG());
                for(Cisterna cis : replanificado.getCisternas()){
                    cis.setOperacionesGLPCisterna(new ArrayList<>(mejorSolucion.getSistemaPLG().getCisternas().get(cis.getId()-1).getOperacionesGLPCisterna()));
                }

                for (int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++) {
                    //si el camion no tiene registro de atenciones en la planificaicon
                    if(mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getFirst().getEstadoCamion()
                                    ==EstadoCamion.AVERIADO)continue;
                    if (mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().size() < 3) {
                        //dar origen en cisterna principal
                        //Camion nuevoCamion = mejorSolucion.getSistemaPLG().getFlota().get(i);
                        Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getFlota().get(i));
                        idxFlotaAnterior.add(nuevoCamion.getId());//guardar id (verdadero) momentaenamente
                        camionesDisponibles.add(nuevoCamion);
                        nuevoCamion.setId(camionesDisponibles.size());//necesario para replan de camiones disponibles
                        Reabastecimiento origen = new Reabastecimiento();
                        origen.setCisterna(mejorSolucion.getSistemaPLG().getCisternas().get(0));
                        origen.setUbicacion(mejorSolucion.getSistemaPLG().getCisternas().get(0).getUbicacion());
                        origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                        origen.setFechaHoraLlegada(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                        mejorSolucion.getSistemaPLG().getCisternas().get(0).registrarRetiroGLP(mejorSolucion.getSistemaPLG().getFechaHoraInicio(),
                                0.0, nuevoCamion);
                        nuevoCamion.setCargaGLPActual(0.0);
                        nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                        nuevoCamion.setDestinos(new ArrayList<>());
                        nuevoCamion.getDestinos().add(0, origen);
                        origen.setSaldoGLPCamion(0.0);
                        origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                        nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                        nuevoCamion.setUbicacionActual(origen.getUbicacion());
                    }
                    else{
                        Camion camionEnCaliente = mejorSolucion.getSistemaPLG().getFlota().get(i);
                        idxFlotaAnterior.add(camionEnCaliente.getId());
                        Camion nuevoCamion = new Camion(camionEnCaliente);
                        camionesDisponibles.add(nuevoCamion);
                        nuevoCamion.setId(camionesDisponibles.size());
                        Destino penultimoDestino = camionEnCaliente.getDestinos().get(camionEnCaliente.getDestinos().size() - 2);
                        nuevoCamion.setUbicacionActual(penultimoDestino.getUbicacion());
                        nuevoCamion.setCargaGLPActual(0.0);
                        nuevoCamion.setCombustibleActual(penultimoDestino.getSaldoCombustibleCamion());
                        nuevoCamion.getDestinos().add(penultimoDestino.copiar());
                    }

                }
                LocalDateTime fechaFinPlan = null;
                replanificado.setFlota(camionesDisponibles);
                replanificado.setPedidos(pedidosVencidos);

                int tamPoblacion = 5;
                int generaciones = 1;
                double probCruce = 0.1;
                double probMutacion = 0.1;
                double porcentajeElite = 0.1;
                Genetico ga2 = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
                Individuo mejorSolucionTemp = ga2.ejecutar(2, replanificado);
                System.out.println("%%%%%%%%%%%%%%%%%AtenderPedidosEnCaliente%%%%%%%%%%%%%%%%%");
                //mejorSolucionTemp.getSistemaPLG().imprimirPlanificacion();
                for(int j=0; j<pedidosVencidos.size(); j++){
                    Integer idx = mejorSolucion.getSistemaPLG().getPedidos().size()+1;
                    mejorSolucionTemp.getSistemaPLG().getPedidos().get(j).setId(idx);
                    mejorSolucion.getSistemaPLG().getPedidos().add(idx-1, mejorSolucionTemp.getSistemaPLG().getPedidos().get(j));
                }
                for(int j=0; j< camionesDisponibles.size(); j++){
                    Camion c = mejorSolucionTemp.getSistemaPLG().getFlota().get(j);
                    if(c.getDestinos().size()<3)continue;
                    int idCam = idxFlotaAnterior.get(j);
                    int size = mejorSolucion.getSistemaPLG().getFlota().get(idCam-1).getDestinos().size();
                    int idxPenultimo = mejorSolucion.getSistemaPLG().getFlota().get(idCam-1).getDestinos().size()-2;
                    if (size > 2) {
                        mejorSolucion.getSistemaPLG().getFlota().get(idCam-1).getDestinos().subList(size - 2, size).clear();
                    }
                    else idxPenultimo = 0;
                    mejorSolucion.getSistemaPLG().getFlota().get(idCam-1).getDestinos().addAll(idxPenultimo, c.getDestinos());

                    mejorSolucion.getSistemaPLG().getFlota().get(idCam-1).getPedidosAsignados().addAll(c.getPedidosAsignados());
                    mejorSolucion.getAsignacion().put(idCam, mejorSolucionTemp.getAsignacion().get(c.getId()));
                    mejorSolucion.getPedidosXcargasGLP().put(idCam, mejorSolucionTemp.getPedidosXcargasGLP().get(c.getId()));
                    if(fechaFinPlan==null || (fechaFinPlan.isAfter(mejorSolucion.getSistemaPLG().getFechaHoraFinEntregas()))){
                        fechaFinPlan = c.getDestinos().getLast().getFechaHoraSalida();
                        mejorSolucion.getSistemaPLG().setFechaHoraFinEntregas(fechaFinPlan);
                    }
                }

                mejorSolucion.getSistemaPLG().setReplanning(false);
                mejorSolucion.getSistemaPLG().setAveriaStartTime(null);

                //PlanificacionPlgApplication.setMejorSolucion(mejorSolucion);


            } finally {
                mejorSolucion.getSistemaPLG().setReplanning(false);
            }

        }
    }
}