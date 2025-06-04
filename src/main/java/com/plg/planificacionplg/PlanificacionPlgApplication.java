package com.plg.planificacionplg;

import com.plg.planificacionplg.clases.*;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@SpringBootApplication
public class PlanificacionPlgApplication {
    private static final double MAX_DOUBLE = Double.MAX_VALUE;
    private static Individuo mejorSolucion;

    public static Individuo getMejorSolucion() {
        return mejorSolucion;
    }

    public static void setMejorSolucion(Individuo nuevo) {
        mejorSolucion = nuevo;
    }

    public static void main(String[] args) {
        SpringApplication.run(PlanificacionPlgApplication.class, args);

        List<Cisterna> cisternas = new ArrayList<>();
        Cisterna principal = new Cisterna();
        principal.setPrincipal(true);
        principal.setCargaGLPActual(MAX_DOUBLE);
        principal.setCapacidadTotal(MAX_DOUBLE);
        principal.setUbicacion(new Nodo(12,8));
        principal.setHoraAbastecimento(LocalTime.now());
        cisternas.add(principal);

        Cisterna cintermedio1 = new Cisterna();
        cintermedio1.setPrincipal(false);
        cintermedio1.setCapacidadTotal(160);
        cintermedio1.setCargaGLPActual(cintermedio1.getCapacidadTotal());
        cintermedio1.setUbicacion(new Nodo(42,42));
        cintermedio1.setHoraAbastecimento(LocalTime.MIN);
        cisternas.add(cintermedio1);

        Cisterna cintermedio2 = new Cisterna();
        cintermedio2.setPrincipal(false);
        cintermedio2.setCapacidadTotal(160);
        cintermedio2.setCargaGLPActual(cintermedio1.getCapacidadTotal());
        cintermedio2.setUbicacion(new Nodo(63,3));
        cintermedio2.setHoraAbastecimento(LocalTime.MIN);
        cisternas.add(cintermedio2);

        SistemaPLG sistemaPLG = new SistemaPLG();
        sistemaPLG.setFechaHoraInicio(LocalDateTime.now());
        sistemaPLG.cargarPedidos("src/main/java/com/plg/planificacionplg/test/pedidos.txt");
        sistemaPLG.setPedidosTodos(new ArrayList<>(sistemaPLG.getPedidos()));
        sistemaPLG.setCisternas(cisternas);
        sistemaPLG.setDistanciaManzana(1);
        sistemaPLG.setMaxXmapa(70);
        sistemaPLG.setMaxYmapa(50);
        sistemaPLG.setBloqueos(new ArrayList<>());
        sistemaPLG.setFlota(new ArrayList<>());
        sistemaPLG.setTurnosFin(List.of(
                LocalTime.of(8, 0),
                LocalTime.of(16, 0),
                LocalTime.MAX
        ));
        double velocidadPromedio = 5.0/6.0;
        TipoCamion tipoCamion1 = new TipoCamion();
        tipoCamion1.setTara(2.5);
        tipoCamion1.setCapCombustibleMax(25);
        tipoCamion1.setVelocidadPromedio(velocidadPromedio);//unidad distancia / minuto
        tipoCamion1.setPesoGLPMax(12.5);
        tipoCamion1.setCargaGLPMax(25);
        tipoCamion1.setCodigo("TA");
        TipoCamion tipoCamion2 = new TipoCamion();
        tipoCamion2.setTara(2);
        tipoCamion2.setCapCombustibleMax(25);
        tipoCamion2.setVelocidadPromedio(velocidadPromedio);//unidad distancia / minuto
        tipoCamion2.setPesoGLPMax(7.5);
        tipoCamion2.setCargaGLPMax(15);
        tipoCamion2.setCodigo("TB");
        TipoCamion tipoCamion3 = new TipoCamion();
        tipoCamion3.setTara(1.5);
        tipoCamion3.setCapCombustibleMax(25);
        tipoCamion3.setVelocidadPromedio(velocidadPromedio);//unidad distancia / minuto
        tipoCamion3.setPesoGLPMax(5);
        tipoCamion3.setCargaGLPMax(10);
        tipoCamion3.setCodigo("TC");
        TipoCamion tipoCamion4 = new TipoCamion();
        tipoCamion4.setTara(1);
        tipoCamion4.setCapCombustibleMax(25);
        tipoCamion4.setVelocidadPromedio(velocidadPromedio);//unidad distancia / minuto
        tipoCamion4.setPesoGLPMax(2.5);
        tipoCamion4.setCargaGLPMax(5);
        tipoCamion4.setCodigo("TD");
        int cantCamionesInicial=0;
        for(int i=1; i<3; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setIdxPorTipo(i);
            camion.setTipo(tipoCamion1);
            camion.setCodigo(tipoCamion1.getCodigo()+String.format("%02d", i));
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            //camion.setCargaGLPActual(camion.getTipo().getCargaGLPMax());
            sistemaPLG.getFlota().add(camion);
        }
        cantCamionesInicial = sistemaPLG.getFlota().size();
        for(int i=3; i<7; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setIdxPorTipo(i-cantCamionesInicial);
            camion.setTipo(tipoCamion2);
            camion.setCodigo(tipoCamion2.getCodigo()+String.format("%02d", camion.getIdxPorTipo()));
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }
        cantCamionesInicial = sistemaPLG.getFlota().size();
        for(int i=7; i<11; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setIdxPorTipo(i-cantCamionesInicial);
            camion.setTipo(tipoCamion3);
            camion.setCodigo(tipoCamion3.getCodigo()+String.format("%02d", camion.getIdxPorTipo()));
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }
        cantCamionesInicial = sistemaPLG.getFlota().size();
        for(int i=11; i<21; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setIdxPorTipo(i-cantCamionesInicial);
            camion.setTipo(tipoCamion4);
            camion.setCodigo(tipoCamion4.getCodigo()+String.format("%02d", camion.getIdxPorTipo()));
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }

        Nodo bloqueado1 = new Nodo(1, 15);
        Nodo bloqueado2 = new Nodo(14, 15);
        Nodo bloqueado3 = new Nodo(14, 4);

        Bloqueo bloqueo = new Bloqueo();
        bloqueo.setFechaHoraInicio(LocalDateTime.now().minusMinutes(10));
        bloqueo.setFechaHoraFin(LocalDateTime.now().plusMinutes(100));
        bloqueo.setRutasBloqueadas(Arrays.asList(bloqueado1, bloqueado2, bloqueado3));

        sistemaPLG.setBloqueos(Arrays.asList(bloqueo));
        //sistemaPLG.setBloqueos(new ArrayList<>());
        sistemaPLG.setCamionesAveriados(new ArrayList<>());


        int tamPoblacion = 30;
        int generaciones = 10;
        double probCruce = 0.5;
        double probMutacion = 0.65;
        double porcentajeElite = 0.2;

        // Initial planification
        Genetico ga = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
        mejorSolucion = ga.ejecutar(1, sistemaPLG);
        mejorSolucion.getSistemaPLG().imprimirPlanificacion();


        // Load maintenance and averias
        mejorSolucion.getSistemaPLG().cargarMantenimientos(
                "src/main/java/com/plg/planificacionplg/test/planmantenimiento.txt",
                LocalTime.MIN, LocalTime.MAX
        );
        mejorSolucion.getSistemaPLG().cargarAverias("src/main/java/com/plg/planificacionplg/test/averias.txt");

        double min = 0.35;
        double max = 0.75;

        // Procesar averias
        for(Averia a : mejorSolucion.getSistemaPLG().getAverias()) {
            SistemaPLG replanificado = new SistemaPLG(mejorSolucion.getSistemaPLG());
            replanificado.setCisternas(mejorSolucion.getSistemaPLG().getCisternas());
            Camion c = mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion());
            double random = min + (Math.random() * ((max - min) + Double.MIN_VALUE));
            double tiempoAveria = c.getDistanciaTotal()*random/c.getTipo().getVelocidadPromedio();
            LocalDateTime inicioAveria = mejorSolucion.getSistemaPLG().getFechaHoraInicio().plusSeconds((long)tiempoAveria*60);
            int turnoiniidx = a.getTurnoOcurrencia() - 2, turnoidx = a.getTurnoOcurrencia()-1;
            LocalTime turnoini;
            if(turnoiniidx < 0){turnoini = LocalTime.MIN;}
            else turnoini = mejorSolucion.getSistemaPLG().getTurnosFin().get(turnoiniidx);
            if(mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().size()<2)continue;
            Camion cam = mejorSolucion.getSistemaPLG().getCamionEnInstante(a.getIdCamion()+1, inicioAveria);
            if(cam!=null && cam.getEstado()==EstadoCamion.EN_RETORNO)continue;
            if(false && (turnoini.isBefore(inicioAveria.toLocalTime())
                    && mejorSolucion.getSistemaPLG().getTurnosFin().get(turnoidx).isAfter(inicioAveria.toLocalTime()))) {
                // Set replanning flag and averia start time at the start of this specific averia's replanification
                mejorSolucion.getSistemaPLG().setReplanning(true);
                mejorSolucion.getSistemaPLG().setAveriaStartTime(inicioAveria);
                
                a.setFechaHoraInicio(inicioAveria);
                a.determinarFechaFin(mejorSolucion.getSistemaPLG());
                cam.setEstado(EstadoCamion.AVERIADO);
                
                // Replanification process
                mejorSolucion.getSistemaPLG().estadoDePedidosALas(inicioAveria);
                replanificado.setFlota(new ArrayList<>());
                replanificado.setPedidos(new ArrayList<>(mejorSolucion.getSistemaPLG().getPedidos()));
                replanificado.getCamionesAveriados().add(cam);
                replanificado.setFechaHoraInicio(inicioAveria);
                replanificado.setCamionCausanteReplan(cam);
                cam.setUbicacionActual(cam.calcularUbicacion(inicioAveria));
                cam.getAverias().add(a);
                Replanficacion origenReplan = new Replanficacion();
                origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).calcularUbicacion(inicioAveria));
                origenReplan.setFechaHoraLlegada(inicioAveria);
                origenReplan.setFechaHoraSalida(inicioAveria);
                origenReplan.setGLPOperacion(0.0);
                if(mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().isEmpty()) {
                    // Clear replanning flag if we need to skip this replanification
                    mejorSolucion.getSistemaPLG().setReplanning(false);
                    mejorSolucion.getSistemaPLG().setAveriaStartTime(null);
                    continue;
                }
                Destino destActuAveriado = mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos()
                        .get(cam.getIdxDestinoEnCurso());
                origenReplan.setSaldoGLPCamion(destActuAveriado.getSaldoGLPCamion());
                origenReplan.setSaldoCombustibleCamion(cam.getCombustibleActual());
                if(destActuAveriado.getEstadoCamion()!=EstadoCamion.EN_RUTA){
                    cam.getDestinos().add(destActuAveriado);
                }else cam.getDestinos().add(origenReplan);
                if(a.getTipo().getId()==1){
                    cam.setPedidosAsignados(new ArrayList<>());
                    for(Pedido p : mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getPedidosAsignados()){
                        if(p.getEstado()==EstadoPedido.PENDIENTE){
                            p.setEstado(EstadoPedido.ASIGNADO);//no pasan a replanificaion
                            cam.getPedidosAsignados().add(p);
                        }
                    }
                }
                else cam.setPedidosAsignados(new ArrayList<>());//caso 2 y 3 donde no atiende sino se va

                for(int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++){
                    //si el camion no tiene registro de atenciones en la planificaicon
                    if(mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().size()<2){
                        //dar origen en cisterna principal
                        Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getFlota().get(i));
                        Reabastecimiento origen = new Reabastecimiento();
                        origen.setCisterna(cisternas.get(0));
                        origen.setUbicacion(cisternas.get(0).getUbicacion());
                        origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                        replanificado.getCisternas().get(0).registrarRetiroGLP(sistemaPLG.getFechaHoraInicio(),
                                0.0, nuevoCamion);
                        nuevoCamion.setCargaGLPActual(0.0);
                        nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                        nuevoCamion.getDestinos().add(0, origen);
                        origen.setSaldoGLPCamion(0.0);
                        origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                        nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                        nuevoCamion.getDestinos().add(origen);
                        replanificado.getFlota().add(nuevoCamion);
                        continue;
                    }
                    if(i==a.getIdCamion()){
                        replanificado.getFlota().add(cam);
                        continue;

                    }
                    Camion nuevoCamion = mejorSolucion.getSistemaPLG().getCamionEnInstante(i+1, inicioAveria);
                    nuevoCamion.setCargasGLP(new ArrayList<>());
                    nuevoCamion.setDestinos(new ArrayList<>());
                    Destino destinoActual = nuevoCamion.getDestinoEnCurso();
                    if(destinoActual==null){
                        //System.out.println();
                        //caso de los camiones que terminaron su ruta antes de la averia
                        destinoActual = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getLast().copiar();
                    }

                    if(destinoActual.getEstadoCamion()!=EstadoCamion.EN_RUTA){//despachando o recargando
                        nuevoCamion.getDestinos().add(destinoActual); //inicio, no es modificable en la construccion de rutas
                    }else{
                        origenReplan = new Replanficacion();
                        origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(i).calcularUbicacion(inicioAveria));
                        origenReplan.setFechaHoraLlegada(inicioAveria);
                        origenReplan.setFechaHoraSalida(inicioAveria);
                        origenReplan.setGLPOperacion(0.0);
                        origenReplan.setSaldoGLPCamion(destinoActual.getSaldoGLPCamion());
                        origenReplan.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                        nuevoCamion.getDestinos().add(origenReplan);
                    }
                    replanificado.getFlota().add(nuevoCamion);
                }
                Genetico ga2 = new Genetico(tamPoblacion*2, generaciones, probCruce, 0.9, porcentajeElite);
                mejorSolucion = ga2.ejecutar(2, replanificado);
                mejorSolucion.getSistemaPLG().imprimirPlanificacion();
                mejorSolucion.getSistemaPLG().setReplanning(false);
                mejorSolucion.getSistemaPLG().setAveriaStartTime(null);
            }
        }

    }
}