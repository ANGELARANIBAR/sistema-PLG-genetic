package com.plg.planificacionplg.services;

import com.plg.planificacionplg.clases.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class PlanificadorService {

    private Individuo mejorSolucion;
    private static final double MAX_DOUBLE = Double.MAX_VALUE;

    public Individuo getMejorSolucion() {
        return mejorSolucion;
    }
    public void ejecutarPlanificacion() {
        Cisterna principal = new Cisterna();
        principal.setPrincipal(true);
        principal.setCargaGLPActual(MAX_DOUBLE);
        principal.setCapacidadTotal(MAX_DOUBLE);
        principal.setUbicacion(new Nodo(0,0));
        principal.setHoraAbastecimento(LocalTime.now());

        Cisterna cintermedio1 = new Cisterna();
        cintermedio1.setPrincipal(false);
        cintermedio1.setCapacidadTotal(40);
        cintermedio1.setCargaGLPActual(cintermedio1.getCapacidadTotal());
        cintermedio1.setUbicacion(new Nodo(11,11));
        cintermedio1.setHoraAbastecimento(LocalTime.now().plusMinutes(1));
        List<Cisterna> cisternas = new ArrayList<>();
        cisternas.add(principal);
        cisternas.add(cintermedio1);
        Cisterna cintermedio2 = new Cisterna();
        cintermedio2.setPrincipal(false);
        cintermedio2.setCapacidadTotal(40);
        cintermedio2.setCargaGLPActual(cintermedio1.getCapacidadTotal());
        cintermedio2.setUbicacion(new Nodo(14,14));
        cintermedio2.setHoraAbastecimento(LocalTime.now().plusMinutes(86));
        cisternas.add(cintermedio2);

        // Crear el primer pedido
        Pedido pedido1 = new Pedido();
        pedido1.setId(1);
        pedido1.setNumeroPedido("PED-001");
        pedido1.setVolumenGLP(10.5);
        pedido1.setUbicacion(new Nodo(20, 20)); // Suponiendo que Nodo tiene un constructor
        pedido1.setFechaHoraRegistro(LocalDateTime.now());
        pedido1.setTiempoMaxEntrega(4*60);
        pedido1.setFechaHoraMaxEntrega(LocalDateTime.now().plusMinutes((long) pedido1.getTiempoMaxEntrega()));
        pedido1.setEstado(EstadoPedido.PENDIENTE);
        pedido1.setCompletado(false);
        pedido1.setCamiones(new ArrayList<>());
        pedido1.setConsumoCombustibleTotal(0);

        // Crear el segundo pedido
        Pedido pedido2 = new Pedido();
        pedido2.setId(2);
        pedido2.setNumeroPedido("PED-002");
        pedido2.setVolumenGLP(19);
        pedido2.setUbicacion(new Nodo(10, 10)); // Suponiendo que Nodo tiene un constructor
        pedido2.setFechaHoraRegistro(LocalDateTime.now());
        pedido2.setTiempoMaxEntrega(80*60);
        pedido2.setFechaHoraMaxEntrega(LocalDateTime.now().plusMinutes((long)pedido2.getTiempoMaxEntrega()));
        pedido2.setEstado(EstadoPedido.PENDIENTE); // Suponiendo que EstadoPedido es un enum
        pedido2.setCompletado(false);
        pedido2.setCamiones(new ArrayList<>());
        pedido2.setConsumoCombustibleTotal(0);

        List<Pedido> pedidos = new ArrayList<>();
        pedidos.add(pedido1);
        pedidos.add(pedido2);
        for(int i=3; i<10; i++){
            Pedido pedido = new Pedido();
            pedido.setId(i);
            pedido.setNumeroPedido("PED-00"+i);
            pedido.setVolumenGLP(14+i);
            pedido.setUbicacion(new Nodo(5+i*2, 30-i*2)); // Suponiendo que Nodo tiene un constructor
            pedido.setFechaHoraRegistro(LocalDateTime.now());
            pedido.setTiempoMaxEntrega(60*3-i*10);
            pedido.setFechaHoraMaxEntrega(LocalDateTime.now().plusMinutes((long)pedido.getTiempoMaxEntrega()));
            pedido.setEstado(EstadoPedido.PENDIENTE);
            pedido.setCompletado(false);
            pedido.setCamiones(new ArrayList<>());
            pedido.setConsumoCombustibleTotal(0);
            pedidos.add(pedido);
        }

        SistemaPLG sistemaPLG = new SistemaPLG();
        sistemaPLG.setPedidos(pedidos);
        sistemaPLG.setCisternas(cisternas);
        sistemaPLG.setDistanciaManzana(1);
        sistemaPLG.setMaxXmapa(50);
        sistemaPLG.setMaxYmapa(50);
        sistemaPLG.setBloqueos(new ArrayList<>());
        sistemaPLG.setFlota(new ArrayList<>());
        sistemaPLG.setFechaHoraInicio(LocalDateTime.now());

        TipoCamion tipoCamion1 = new TipoCamion();
        tipoCamion1.setTara(20);
        tipoCamion1.setCapCombustibleMax(100);
        tipoCamion1.setVelocidadPromedio(10);//unidad distancia / minuto
        tipoCamion1.setPesoGLPMax(500);
        tipoCamion1.setCargaGLPMax(50);
        TipoCamion tipoCamion2 = new TipoCamion();
        tipoCamion2.setTara(20);
        tipoCamion2.setCapCombustibleMax(100);
        tipoCamion2.setVelocidadPromedio(20);//unidad distancia / minuto
        tipoCamion2.setPesoGLPMax(800);
        tipoCamion2.setCargaGLPMax(75);


        for(int i=1; i<4; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setTipo(tipoCamion1);
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            //camion.setCargaGLPActual(camion.getTipo().getCargaGLPMax());
            sistemaPLG.getFlota().add(camion);
        }
        for(int i=4; i<4; i++){
            Camion camion = new Camion();   // Cisterna media
            camion.setId(i);
            camion.setTipo(tipoCamion2);
            camion.setPlaca("ABC-00"+String.valueOf(i));
            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());//estan con combustible al max
            sistemaPLG.getFlota().add(camion);
        }

        Nodo bloqueado1 = new Nodo(1, 3);
        Nodo bloqueado2 = new Nodo(1, 5);
        Nodo bloqueado3 = new Nodo(1, 48);

        Bloqueo bloqueo = new Bloqueo();
        bloqueo.setFechaHoraInicio(LocalDateTime.now().minusMinutes(10));
        bloqueo.setFechaHoraFin(LocalDateTime.now().plusMinutes(100000000));
        bloqueo.setRutasBloqueadas(Arrays.asList(bloqueado1, bloqueado2, bloqueado3));

        sistemaPLG.setBloqueos(Arrays.asList(bloqueo));

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

        Averia averia = new Averia();


        int tamPoblacion = 200;
        int generaciones = 30;
        double probCruce = 0.3;
        double probMutacion = 0.5;
        double porcentajeElite = 0.3;

        Genetico ga = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
        mejorSolucion = ga.ejecutar(sistemaPLG);





    }

}

