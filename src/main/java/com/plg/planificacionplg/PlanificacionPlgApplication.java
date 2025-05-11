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
                LocalTime.MAX // Representa 23:59:59.999999999
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
        tipoCamion2.setCodigo("TD");

        for(int i=1; i<3; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setTipo(tipoCamion1);
            camion.setCodigo(tipoCamion1.getCodigo()+String.format("%02d", i));
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            //camion.setCargaGLPActual(camion.getTipo().getCargaGLPMax());
            sistemaPLG.getFlota().add(camion);
        }
        for(int i=3; i<7; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setTipo(tipoCamion2);
            camion.setCodigo(tipoCamion2.getCodigo()+String.format("%02d", i-sistemaPLG.getFlota().size()));
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }
        for(int i=7; i<11; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setTipo(tipoCamion3);
            camion.setCodigo(tipoCamion3.getCodigo()+String.format("%02d", i-sistemaPLG.getFlota().size()));
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setEstado(EstadoCamion.DISPONIBLE);
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }
        for(int i=11; i<21; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setTipo(tipoCamion4);
            camion.setCodigo(tipoCamion4.getCodigo()+String.format("%02d", i-sistemaPLG.getFlota().size()));
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

        //sistemaPLG.setBloqueos(Arrays.asList(bloqueo));
        sistemaPLG.setBloqueos(new ArrayList<>());
        sistemaPLG.setCamionesAveriados(new ArrayList<>());


        int tamPoblacion = 50;
        int generaciones = 10;
        double probCruce = 0.3;
        double probMutacion = 0.8;
        double porcentajeElite = 0.3;

        Genetico ga = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
        mejorSolucion = ga.ejecutar(1, sistemaPLG);

        for(Camion camion : mejorSolucion.getSistemaPLG().getFlota()){

            System.out.println("******************Camion: " + camion.getId() + " Placa: " +camion.getPlaca());
            System.out.println("Distancia total recorrida: " + camion.getDistanciaTotal());
            System.out.println("Cantidad de gasolina empleada TOTAL CAMION: " + camion.getCombustibleEmpleado());
            System.out.println("Cantidad de gasolina FINAL: " + camion.getCombustibleActual());
            System.out.println("Cantidad de GLP FINAL: " + camion.getCargaGLPActual());
            for(Destino destino : camion.getDestinos()){
                destino.imprimir();

                System.out.println("Cantidad de gasolina empleada en ruta: " + destino.getRuta().getConsumoCombustible());
                System.out.println("Llegada: " + destino.getFechaHoraLlegada());
                System.out.println("Salida: " + destino.getFechaHoraSalida());
                if(destino instanceof EntregaPedido)
                    System.out.println("Entregas hasta las : " + destino.getPedido().getFechaHoraMaxEntrega());
                //if(destino.getRuta().getNodos() == null)System.out.println("Nodo inicial del camión");
                //else System.out.println("Ruta: " + destino.getRuta().getNodos());
                System.out.println("-------------------------------------------------------------------------");

            }
        }

        System.out.println("----------------------------Cisternas----------------------------");
        for (Cisterna c : mejorSolucion.getSistemaPLG().getCisternas()){
            if(c.getOperacionesGLPCisterna()==null)continue;
            System.out.println("************************Cisterna en" + c.getUbicacion());
            System.out.println("Hora de Abastecimiento" + c.getHoraAbastecimento());
            System.out.println("SALDO FINAL DE GLP " + c.getCargaGLPActual());
            for(OperacionesGLPCisterna op : c.getOperacionesGLPCisterna()){
                System.out.println("fecha Operacion:"+op.getFechaHoraOperacion());
                System.out.println("GLP Saldo"+op.getSaldoGLP());
                System.out.println("GLP sacado"+op.getCantSalidaGLP());
                System.out.println("Camion ID:"+op.getCamion().getId());
                System.out.println("----------------------------------");
            }
        }

        /*mejorSolucion.getSistemaPLG().cargarMantenimientos(
                "./test/planmantenimimento.txt",
                LocalTime.MIN, LocalTime.MAX
        );


        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == 2)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return;
        }

        AveriaRequest request = new AveriaRequest();
        request.setFechaHoraInicioAveria(mejorSolucion.getSistemaPLG().getFechaHoraInicio().plusMinutes(40));
        request.setTipoAveria(2);


        mejorSolucion.getSistemaPLG().estadoDePedidosALas(request.getFechaHoraInicioAveria());

        TipoAveria tipoAveria1 = new TipoAveria();
        tipoAveria1.setId(1);
        tipoAveria1.setTiempoInmovilizado(2);
        tipoAveria1.setRegresaAlmacen(false);
        TipoAveria tipoAveria2 = new TipoAveria();
        tipoAveria2.setId(2);
        tipoAveria2.setTiempoInmovilizado(2);
        tipoAveria2.setRegresaAlmacen(true);
        TipoAveria tipoAveria3 = new TipoAveria();
        tipoAveria3.setId(3);
        tipoAveria3.setTiempoInmovilizado(4);
        tipoAveria3.setRegresaAlmacen(true);
        List<TipoAveria> tipos = new ArrayList<>();
        tipos.add(tipoAveria1);
        tipos.add(tipoAveria2);
        tipos.add(tipoAveria3);
        Averia averia = new Averia();
        averia.setTipo(tipos.get(request.getTipoAveria()-1));
        averia.setFechaHoraInicio(request.getFechaHoraInicioAveria());
        averia.determinarFechaFin(mejorSolucion.getSistemaPLG());
        averia.setTurnoOcurrencia(2);

        for(Pedido ped : camion.getPedidosAsignados()){
            if(ped.getEstado()==EstadoPedido.PENDIENTE){
                ped.setEstado(EstadoPedido.ASIGNADO);
            }
        }


        List<Pedido>afectados=new ArrayList<>();
        for(Pedido p : mejorSolucion.getSistemaPLG().getPedidos()){
            if(p.getEstado()==EstadoPedido.PENDIENTE)afectados.add(p);
        }
        SistemaPLG replanificado = new SistemaPLG(mejorSolucion.getSistemaPLG());
        replanificado.setFlota(new ArrayList<>());
        replanificado.setPedidos(afectados);
        replanificado.getCamionesAveriados().add(camion);
        for(int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++){
            Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getCamionEnInstante(i+1, request.getFechaHoraInicioAveria()));
            nuevoCamion.setCargasGLP(new ArrayList<>());
            nuevoCamion.setDestinos(new ArrayList<>());
            if(mejorSolucion.getSistemaPLG().getFlota().get(nuevoCamion.getId()-1).getPedidosAsignados()!=null){
                Replanficacion origenReplan = new Replanficacion();
                origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(i).calcularUbicacion(request.getFechaHoraInicioAveria()));
                if(nuevoCamion.getId()==camion.getId()) { // no considera averias de camiones que estan sin pedidos asignados
                    origenReplan.setFechaHoraSalida(averia.getFechaHoraFin());
                    nuevoCamion.setEstado(EstadoCamion.AVERIADO);
                    nuevoCamion.getAverias().add(averia);
                    replanificado.setCamionCausanteReplan(nuevoCamion);
                    if(averia.getTipo().getId()==1){ // para el tipo 1 y 2
                        nuevoCamion.setEstado(EstadoCamion.EN_RETORNO);
                        for(Pedido ped : camion.getPedidosAsignados()){
                            if(ped.getEstado()==EstadoPedido.PENDIENTE){
                                ped.setEstado(EstadoPedido.ASIGNADO);
                                nuevoCamion.getPedidosAsignados().add(ped);
                            }
                        }
                    }
                }
                else origenReplan.setFechaHoraSalida(request.getFechaHoraInicioAveria());
                origenReplan.setGLPOperacion(0.0);
                origenReplan.setSaldoGLPCamion(mejorSolucion.getSistemaPLG().calcularGLPActual(nuevoCamion.getId(), averia.getFechaHoraInicio()));
                origenReplan.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                nuevoCamion.getDestinos().add(origenReplan);
            }
            replanificado.getFlota().add(nuevoCamion);
        }

        Genetico ga2 = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
        mejorSolucion = ga2.ejecutar(2, replanificado);

        for(Camion camion1 : mejorSolucion.getSistemaPLG().getFlota()){

            System.out.println("******************Camion: " + camion1.getId() + " Placa: " +camion1.getPlaca());
            System.out.println("Cantidad de gasolina empleada TOTAL CAMION: " + camion1.getCombustibleEmpleado());
            System.out.println("Cantidad de gasolina FINAL: " + camion1.getCombustibleActual());
            System.out.println("Cantidad de GLP FINAL: " + camion1.getCargaGLPActual());
            for(Destino destino : camion1.getDestinos()){
                destino.imprimir();

                System.out.println("Cantidad de gasolina empleada en ruta: " + destino.getRuta().getConsumoCombustible());
                System.out.println("Llegada: " + destino.getFechaHoraLlegada());
                System.out.println("Salida: " + destino.getFechaHoraSalida());
                if(destino instanceof EntregaPedido)
                    System.out.println("Entregas hasta las : " + destino.getPedido().getFechaHoraMaxEntrega());
                //if(destino.getRuta().getNodos() == null)System.out.println("Nodo inicial del camión");
                //else System.out.println("Ruta: " + destino.getRuta().getNodos());
                System.out.println("-------------------------------------------------------------------------");

            }
        }

        System.out.println("----------------------------Cisternas----------------------------");
        for (Cisterna c : mejorSolucion.getSistemaPLG().getCisternas()){
            if(c.getOperacionesGLPCisterna()==null)continue;
            System.out.println("************************Cisterna en" + c.getUbicacion());
            System.out.println("SALDO FINAL DE GLP" + c.getCargaGLPActual());
            for(OperacionesGLPCisterna op : c.getOperacionesGLPCisterna()){
                System.out.println("fecha Operacion:"+op.getFechaHoraOperacion());
                System.out.println("GLP Saldo"+op.getSaldoGLP());
                System.out.println("Camion ID:"+op.getCamion().getId());
                System.out.println("----------------------------------");
            }
        }*/
    }
}