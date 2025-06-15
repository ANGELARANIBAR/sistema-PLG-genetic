package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.*;

@Data
public class Individuo {
    private static int nIndividuo = 0;
    private Map<Integer, List<Integer>> asignacion; // camión -> lista ordenada de pedidos
    private Map<Integer, List<Integer>> pedidosXcargasGLP; // camión -> buscar carga de GLP deacuerdo a atencion de pedidos

    private double fitness;
    private SistemaPLG sistemaPLG;

    public Individuo(int numPedidos, int numCamiones, SistemaPLG sistema, int code) {
        numCamiones += 1;
        numPedidos += 1;
        asignacion = new HashMap<>();
        pedidosXcargasGLP = new HashMap<>();
        for (int i = 1; i < numCamiones; i++) {
            asignacion.put(i, new ArrayList<>());
        }
        // Asignar pedidos aleatoriamente a camiones (no necesariamente todos los camiones activos)
        List<Integer> pedidos = new ArrayList<>();
        for (int i = 1; i < numPedidos; i++){
            if(sistema.getPedidos().get(i-1).getEstado()==EstadoPedido.PENDIENTE) pedidos.add(sistema.getPedidos().get(i-1).getId());
        }
        Collections.shuffle(pedidos);
        if(nIndividuo<5){
            asignarEquitativamente(numCamiones, pedidos, sistema);

        }
        else{
            Random rand = new Random();
            for (int pedido : pedidos) {
                int camion=1+rand.nextInt(numCamiones-1);
                while((sistema.getCamionCausanteReplan()!=null && sistema.getCamionCausanteReplan().getId()==(camion)) ||
                        (sistema.getFlota().get(camion-1).getTipo().getCargaGLPMax()<sistema.getPedidos().get(pedido-1).getVolumenGLP()) ||
                        esCamionAveriadoTipo(sistema, camion, 0)){
                    camion = 1+rand.nextInt(numCamiones-1);
                }
                asignacion.get(camion).add(pedido);
            }
        }

        if(sistema.getCamionCausanteReplan()!=null && numCamiones>1){
            if(code == 2){
                for(Camion c : sistema.getCamionesAveriados()){
                    if(c.getAverias()
                            .getLast().getTipo().getId()==1 ){
                        for(Pedido ped : c.getPedidosAsignados()){
                            if(ped.getEstado()==EstadoPedido.ASIGNADO){
                                asignacion.get(c.getId()).add(ped.getId());
                            }
                        }
                    }
                    else{
                        //directo a inicio
                    }
                }
            }
            /*
            if(sistema.getCamionCausanteReplan().getAverias()
                    .getLast().getTipo().getId()==1 ){
                for(Pedido ped : sistema.getCamionCausanteReplan().getPedidosAsignados()){
                    if(ped.getEstado()==EstadoPedido.ASIGNADO){
                        asignacion.get(sistema.getCamionCausanteReplan().getId()).add(ped.getId());
                    }
                }
            }
            else{
                //directo a inicio
            }
            */
        }
        for (int i = 1; i < numCamiones; i++) {
            int ini=0;
            List<Integer> cargasGLP = new ArrayList<>();
            Random randCargaGLP = new Random();
            int cantPedRestantes = asignacion.get(i).size(), acc = 0;
            while(cantPedRestantes > 0){
                int cantPedObjetivos = 1+randCargaGLP.nextInt(cantPedRestantes); //minimo 1
                if(cargasGLP.isEmpty())ini=0;
                else ini = cargasGLP.size()-1;
                while(!sistema.puedeCargar(i-1, asignacion, ini, cantPedObjetivos)){
                    cantPedObjetivos = 1+randCargaGLP.nextInt(cantPedRestantes); //minimo 1
                }
                acc += cantPedObjetivos;
                cargasGLP.add(acc);
                cantPedRestantes -= cantPedObjetivos;
            }
            pedidosXcargasGLP.put(i, cargasGLP);
        }
        nIndividuo++;
    }

    private Boolean esCamionAveriadoTipo(SistemaPLG sistema, int idxCamion, int tipoAveria){
        for(Camion c : sistema.getCamionesAveriados()){
            if((c.getId()==idxCamion && c.getAverias().getLast().getTipo().getId()==tipoAveria) ||
                    (c.getId()==idxCamion && 0==tipoAveria)
            ){
                return true;
            }
        }
        return false;
    }

    private void inicializarSistemaPLG(int code, SistemaPLG sistema) {
        List<Camion> flota = new ArrayList<>();
        List<Pedido> pedidos = new ArrayList<>();
        List<Cisterna> cisternas = new ArrayList<>();
        sistemaPLG = new SistemaPLG(sistema);

        sistemaPLG.setCisternas(cisternas);
        sistemaPLG.setPedidos(pedidos);
        sistemaPLG.setFlota(flota);
        sistemaPLG.setCamionesAveriados(new ArrayList<>());
        for (Camion camion : sistema.getFlota()) {
            Camion c;
            c = new Camion(camion);
            c.setPedidosAsignados(new ArrayList<>());
            c.setDestinos(new ArrayList<>());
            c.setCombustibleEmpleado(0);
            c.setDistanciaTotal(0);
            c.setCargaGLPActual(0);
            if(code==1) c.setEstado(EstadoCamion.DISPONIBLE);
            c.setCombustibleActual(c.getTipo().getCapCombustibleMax());

            flota.add(c);
        }
        if(code == 2){
            if(sistema.getCamionesAveriados()!=null)
                for(Camion c : sistema.getCamionesAveriados()){
                    sistemaPLG.getCamionesAveriados().add(flota.get(c.getId()-1));
                    //if(!sistema.getFechaHoraInicio().isAfter(c.getDestinos().getFirst().getFechaHoraSalida())){
                    //}
                }
            /*if (sistema.getCamionCausanteReplan()!=null){
                sistemaPLG.setCamionCausanteReplan(flota.get(sistema.getCamionCausanteReplan().getId()-1));
                sistemaPLG.getCamionesAveriados().add(sistemaPLG.getCamionCausanteReplan());
            }*/

        }
        for(Pedido pedido: sistema.getPedidos()){
            Pedido p = new Pedido(pedido);
            pedidos.add(p);
            p.setEstado(pedido.getEstado());
            p.setFechaHoraEntrega(null);
            p.setCamiones(new ArrayList<>());
            p.setCompletado(false);
            p.setConsumoCombustibleTotal(0.0);
            p.setVolumenGLPEntregado(0.0);//solo util cuando completado es false y el pedido es entregado parcialmente
        }
        for(Cisterna cisterna: sistema.getCisternas()){
            Cisterna cis = new Cisterna(cisterna);
            cis.setCargaGLPActual(cis.getCargaGLPActual());
            if(cisterna.getOperacionesGLPCisterna()!=null)
                cis.setOperacionesGLPCisterna(new ArrayList<>(cisterna.getOperacionesGLPCisterna()));
            cisternas.add(cis);
        }
    }
    private void setEstadoInicialAveriado(Camion camion, SistemaPLG sistema){
        List<Pedido> pedidos = sistemaPLG.getPedidos();
        List<Cisterna> cisternas = sistemaPLG.getCisternas();
        camion.setEstado(EstadoCamion.EN_RUTA);
        for (int pedidoIdx : asignacion.get(camion.getId())) {
            EntregaPedido entrega = new EntregaPedido();
            entrega.setId(pedidoIdx);
            entrega.setVolumenGLPEntregado(0.0);
            entrega.setPedido(pedidos.get(pedidoIdx - 1));
            entrega.setUbicacion(pedidos.get(pedidoIdx - 1).getUbicacion());
            camion.getPedidosAsignados().add(pedidos.get(pedidoIdx - 1));
            camion.getDestinos().add(entrega);
        }

        Reabastecimiento retorno = new Reabastecimiento();
        retorno.setCisterna(cisternas.get(0));
        retorno.setUbicacion(cisternas.get(0).getUbicacion());
        retorno.setGLPOperacion(0.0);
        camion.getDestinos().add(retorno); // para los camiones averiados inclusive

        camion.setCargasGLP(pedidosXcargasGLP.get(camion.getId()));
        List<Destino> destinos = sistema.getFlota().get(camion.getId() - 1).getDestinos();
        double GLPInicial = 0.0;

        camion.setIndicePedidoActual(0); // se pudo recargar GLP en el origen
        if (!pedidosXcargasGLP.get(camion.getId()).isEmpty()) {
            for (int i = 0; i < pedidosXcargasGLP.get(camion.getId()).get(0); i++) {
                GLPInicial += camion.getPedidosAsignados().get(i).getVolumenGLP();
            }
            if (camion.getTipo().getCargaGLPMax() < GLPInicial) {
                fitness = 0.0;
                return;
            }
            //GLPInicial -= camion.getCargaGLPActual();
        }
        if (destinos != null) {
            if (camion.getTipo().getCargaGLPMax() < GLPInicial) {
                fitness = 0.0;
                return;
            }
            camion.getDestinos().add(0, destinos.get(0).copiar());
            camion.setCargaGLPActual(sistema.getFlota().get(camion.getId() - 1).getCargaGLPActual());
            camion.setCombustibleActual(sistema.getFlota().get(camion.getId() - 1).getCombustibleActual());
            camion.setIndicePedidoActual(0);
            if (GLPInicial < camion.getCargaGLPActual() || Math.abs(GLPInicial - camion.getCargaGLPActual()) < 0.001) { // no es necesario recarga GLP
                camion.setIndicePedidoActual(1); // se pudo recargar GLP en el origen
            } else if (destinos.get(0) instanceof Reabastecimiento && GLPInicial > 0.0) {
                Cisterna cis = ((Reabastecimiento) destinos.get(0)).getCisterna();
                if (cisternas.get(cis.getId()-1).puedeRetirarGLP(sistemaPLG.getFechaHoraInicio(), GLPInicial)) {
                    cisternas.get(cis.getId()-1).registrarRetiroGLP(sistemaPLG.getFechaHoraInicio(),
                            GLPInicial - camion.getCargaGLPActual(), camion);
                    camion.setCargaGLPActual(GLPInicial);
                    camion.setIndicePedidoActual(1); // se pudo recargar GLP en el origen
                    camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());
                }
            } else {
                camion.setCombustibleActual(sistema.getFlota().get(camion.getId() - 1).getCombustibleActual());
            }
        } else {
            System.out.println("No hay destinos");
        }
        camion.getDestinos().getFirst().setSaldoGLPCamion(camion.getCargaGLPActual());
        camion.getDestinos().getFirst().setSaldoCombustibleCamion(camion.getCombustibleActual());
    }
    public void evaluar(int code, SistemaPLG sistema) {
        fitness = 0.0;
        inicializarSistemaPLG(code, sistema);
        List<Camion> flota = sistemaPLG.getFlota();
        List<Pedido> pedidos = sistemaPLG.getPedidos();
        List<Cisterna> cisternas = sistemaPLG.getCisternas();
        //if(sistemaPLG.getCamionCausanteReplan()!=null && sistemaPLG.getCamionCausanteReplan().getAverias().getLast().getTipo().getId()==1) {
            //setEstadoInicialAveriado(sistemaPLG.getCamionCausanteReplan(), sistema);
        //}
        for(Camion camAveriado : sistemaPLG.getCamionesAveriados()){
            if(camAveriado.getAverias().getLast().getTipo().getId()==1)
                setEstadoInicialAveriado(camAveriado, sistema);
        }
        int entregasTardias = 0;
        for (Map.Entry<Integer, List<Integer>> entry : asignacion.entrySet()) {
            int camionIdx = entry.getKey();
            List<Integer> pedidosAsignados = entry.getValue();

            //if (pedidosAsignados.isEmpty()) continue;

            Camion camion = flota.get(camionIdx - 1);
            if((sistemaPLG.getCamionCausanteReplan()!=null && sistema.getCamionCausanteReplan().getId()==camionIdx
                    && sistemaPLG.getCamionCausanteReplan().getAverias().getLast().getTipo().getId()==1) || esCamionAveriadoTipo(sistemaPLG, camionIdx, 1)){
                continue;
            }

            camion.setEstado(EstadoCamion.EN_RUTA);
            for (int pedidoIdx : pedidosAsignados) {
                EntregaPedido entrega = new EntregaPedido();
                entrega.setId(pedidoIdx);
                entrega.setVolumenGLPEntregado(0.0);
                entrega.setPedido(pedidos.get(pedidoIdx - 1));
                entrega.setUbicacion(pedidos.get(pedidoIdx - 1).getUbicacion());
                camion.getPedidosAsignados().add(pedidos.get(pedidoIdx - 1));
                camion.getDestinos().add(entrega);
            }

            Reabastecimiento retorno = new Reabastecimiento();
            retorno.setCisterna(cisternas.get(0));
            retorno.setUbicacion(cisternas.get(0).getUbicacion());
            retorno.setGLPOperacion(0.0);
            camion.getDestinos().add(retorno); // para los camiones averiados inclusive

            camion.setCargasGLP(pedidosXcargasGLP.get(camionIdx));
            double GLPInicial = 0.0;
            if (pedidosXcargasGLP.get(camionIdx).isEmpty() != pedidosAsignados.isEmpty()) {
                continue;
            }
            camion.setIndicePedidoActual(0); // se pudo recargar GLP en el origen
            if (!pedidosXcargasGLP.get(camionIdx).isEmpty()) {
                for (int i = 0; i < pedidosXcargasGLP.get(camionIdx).get(0); i++) {
                    GLPInicial += camion.getPedidosAsignados().get(i).getVolumenGLP();
                }
                if (camion.getTipo().getCargaGLPMax() < GLPInicial) {
                    fitness = 0.0;
                    return;
                }
                //GLPInicial -= camion.getCargaGLPActual();
            }

            if (code == 1) {
                Reabastecimiento origen = new Reabastecimiento();
                origen.setCisterna(cisternas.get(0));
                origen.setUbicacion(cisternas.get(0).getUbicacion());
                origen.setFechaHoraSalida(sistema.getFechaHoraInicio()); //primera solucion a evaluar
                if(cisternas.get(0).puedeRetirarGLP(sistemaPLG.getFechaHoraInicio(), GLPInicial) && GLPInicial > 0.0){
                    camion.setIndicePedidoActual(1); // se pudo recargar GLP en el origen
                    cisternas.get(0).registrarRetiroGLP(sistemaPLG.getFechaHoraInicio(),
                            GLPInicial, camion);
                    camion.setCargaGLPActual(GLPInicial);
                    origen.setSaldoGLPCamion(GLPInicial);
                    camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());
                }
                camion.getDestinos().add(0, origen);
                origen.setSaldoCombustibleCamion(camion.getCombustibleActual());
            } else if (code == 2) {
                List<Destino> destinos = sistema.getFlota().get(camion.getId() - 1).getDestinos();
                if (destinos != null) {
                    if (camion.getTipo().getCargaGLPMax() < GLPInicial) {
                        fitness = 0.0;
                        return;
                    }
                    camion.getDestinos().add(0, destinos.get(0).copiar());
                    camion.setCargaGLPActual(sistema.getFlota().get(camion.getId() - 1).getCargaGLPActual());
                    camion.setCombustibleActual(sistema.getFlota().get(camion.getId() - 1).getCombustibleActual());
                    camion.setIndicePedidoActual(0);
                    if(GLPInicial < camion.getCargaGLPActual() || Math.abs(GLPInicial - camion.getCargaGLPActual()) < 0.001){ // no es necesario recarga GLP
                        camion.setIndicePedidoActual(1); // se pudo recargar GLP en el origen
                    }else if(destinos.get(0) instanceof Reabastecimiento && GLPInicial > 0.0){
                        if(((Reabastecimiento)destinos.get(0)).getCisterna().puedeRetirarGLP(sistemaPLG.getFechaHoraInicio(), GLPInicial)){
                            ((Reabastecimiento)destinos.get(0)).getCisterna().registrarRetiroGLP(sistemaPLG.getFechaHoraInicio(),
                                    GLPInicial - camion.getCargaGLPActual(), camion);
                            camion.setCargaGLPActual(GLPInicial);
                            camion.setIndicePedidoActual(1); // se pudo recargar GLP en el origen
                            camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());
                        }
                    }
                    else{
                        camion.setCombustibleActual(sistema.getFlota().get(camion.getId() - 1).getCombustibleActual());
                    }
                } else {
                    System.out.println("No hay destinos");
                }
                camion.getDestinos().getFirst().setSaldoGLPCamion(camion.getCargaGLPActual());
                camion.getDestinos().getFirst().setSaldoCombustibleCamion(camion.getCombustibleActual());
            }
            entregasTardias = 0;

            if(considerarMantenimiento(camion)==-1) return;

            int resultado = camion.construirRutaHaciaPedido(sistemaPLG);

            if (pedidosXcargasGLP.get(camionIdx).isEmpty() && pedidosAsignados.isEmpty() && (resultado == -3 || resultado == -5)) {
                //cuando camion sin nada asignado da errores en planificación
                continue;
            }
            if (resultado != 0) {
                fitness = 0.0;
                //System.out.println("Problema: " + resultado);
                return;
            }

        }
        //if(sistemaPLG.getCamionCausanteReplan()!=null && sistemaPLG.getCamionCausanteReplan().getAverias().getLast().getTipo().getId()==1){
        for(Camion camion : sistemaPLG.getCamionesAveriados()){
            //Camion camion = sistemaPLG.getCamionCausanteReplan();
            List<Destino> destinos = sistema.getFlota().get(camion.getId() - 1).getDestinos();
            if(camion.getCargaGLPActual()<sistema.getFlota().get(camion.getId()-1).getCargaGLPActual()){
                camion.setIndicePedidoActual(0); // se hizo trasvase y recargar GLP en el origen
            }
            if (destinos != null) {
                double GLPInicial = 0.0;

                camion.setIndicePedidoActual(0); // se pudo recargar GLP en el origen
                if (!pedidosXcargasGLP.get(camion.getId()).isEmpty()) {
                    for (int i = 0; i < pedidosXcargasGLP.get(camion.getId()).get(0); i++) {
                        GLPInicial += camion.getPedidosAsignados().get(i).getVolumenGLP();
                    }
                    if (camion.getTipo().getCargaGLPMax() < GLPInicial) {
                        fitness = 0.0;
                        return;
                    }
                    //GLPInicial -= camion.getCargaGLPActual();
                }
                if(GLPInicial < camion.getCargaGLPActual() || Math.abs(GLPInicial - camion.getCargaGLPActual()) < 0.001) { // no es necesario recarga GLP
                    camion.setIndicePedidoActual(1); // se pudo recargar GLP en el origen
                }
                else if (destinos.get(0) instanceof Reabastecimiento && GLPInicial > 0.0) {
                    if (((Reabastecimiento) destinos.get(0)).getCisterna().puedeRetirarGLP(sistemaPLG.getFechaHoraInicio(), GLPInicial)) {
                        ((Reabastecimiento) destinos.get(0)).getCisterna().registrarRetiroGLP(sistemaPLG.getFechaHoraInicio(),
                                GLPInicial - camion.getCargaGLPActual(), camion);
                        camion.setCargaGLPActual(GLPInicial);
                        camion.setIndicePedidoActual(1); // se pudo recargar GLP en el origen
                        camion.setCombustibleActual(camion.getTipo().getCapCombustibleMax());
                    }
                } else {
                    camion.setCombustibleActual(sistema.getFlota().get(camion.getId() - 1).getCombustibleActual());
                }
            } else {
                System.out.println("No hay destinos");
            }
            camion.getDestinos().getFirst().setSaldoGLPCamion(camion.getCargaGLPActual());
            camion.getDestinos().getFirst().setSaldoCombustibleCamion(camion.getCombustibleActual());
            int resultado = camion.construirRutaHaciaPedido(sistemaPLG);
            if (pedidosXcargasGLP.get(camion.getId()).isEmpty() && asignacion
                    .get(camion.getId()).isEmpty() && (resultado == -3 || resultado == -5)) {
                //cuando camion sin nada asignado da errores en planificación

            }
            else{
                if (resultado != 0) {
                    fitness = 0.0;
                    //System.out.println("Problema av: " + resultado);
                    return;
                }
            }

        }

        double totalDistancia = 0;
        double totalCombustible = 0;
        double totalTiempo = 0;

        for (Camion c : flota) {
            if (!c.getDestinos().isEmpty()) {
                totalDistancia += c.getDistanciaTotal();
                totalCombustible += c.getCombustibleEmpleado();
                totalTiempo += c.getDistanciaTotal() / c.getTipo().getVelocidadPromedio();
            }
        }

        //fitness = totalDistancia / (totalCombustible + 1e-5); // evitar división por cero
        //fitness = 10000 / (totalCombustible + 1e-5); // evitar división por cero
        fitness = 1.0 / (0.4 * totalCombustible + 0.1 * totalTiempo + entregasTardias * 500 + 1e-5);

    }

    public Individuo clonar(int code) {
        Individuo copia = new Individuo(0, 0, this.sistemaPLG, code);
        Map<Integer, List<Integer>> nuevaAsignacion = new HashMap<>();
        for (Map.Entry<Integer, List<Integer>> entry : asignacion.entrySet()) {
            nuevaAsignacion.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        Map<Integer, List<Integer>> nuevacargaGLP = new HashMap<>();
        for (Map.Entry<Integer, List<Integer>> entry : pedidosXcargasGLP.entrySet()) {
            nuevacargaGLP.put(entry.getKey(), new ArrayList<>(entry.getValue()));
        }
        copia.setAsignacion(nuevaAsignacion);
        copia.setPedidosXcargasGLP(nuevacargaGLP);
        copia.fitness = this.fitness;
        copia.sistemaPLG = this.sistemaPLG;

        return copia;
    }

    public void imprimirAsignacion() {
        for (Map.Entry<Integer, List<Integer>> entry : asignacion.entrySet()) {
            if (!entry.getValue().isEmpty()) {
                System.out.println("Camión " + entry.getKey() + ": " + entry.getValue());
            }
        }
    }

    public void asignarEquitativamente(int numCamiones, List<Integer> pedidos, SistemaPLG sistema) {
        // Aleatorizar camiones y pedidos
        List<Camion> camionesOrdenados = new ArrayList<>(sistema.getFlota());
        Collections.shuffle(camionesOrdenados);

        List<Integer> pedidosOrdenados = new ArrayList<>(pedidos);
        Collections.shuffle(pedidosOrdenados);

        Map<Integer, Double> capacidadRestante = new HashMap<>();

        // Inicializar asignación y capacidades
        for (Camion camion : camionesOrdenados) {
            int id = camion.getId();
            asignacion.put(id, new ArrayList<>());
            capacidadRestante.put(id, camion.getTipo().getCargaGLPMax());
        }

        for (int pedidoId : pedidosOrdenados) {
            if (sistema.getPedidos().get(pedidoId - 1).getEstado() != EstadoPedido.PENDIENTE) continue;
            double volumen = sistema.getPedidos().get(pedidoId - 1).getVolumenGLP();

            // Verificar si existe al menos un camión capaz de transportar el pedido
            boolean pedidoInvalido = true;
            for (Camion camion : camionesOrdenados) {
                if (camion.getTipo().getCargaGLPMax() >= volumen) {
                    pedidoInvalido = false;
                    break;
                }
            }
            if (pedidoInvalido) {
                System.out.println("⚠️ Pedido " + pedidoId + " es demasiado grande para cualquier camión. Se omite.");
                continue; // No se puede asignar este pedido
            }

            // Intentar asignar al azar considerando capacidad disponible
            List<Camion> copiaCamiones = new ArrayList<>(camionesOrdenados);
            Collections.shuffle(copiaCamiones);

            boolean asignado = false;
            for (Camion camion : copiaCamiones) {
                int idCamion = camion.getId();

                if ((sistema.getCamionCausanteReplan() != null &&
                        sistema.getCamionCausanteReplan().getId() == idCamion) ||
                        esCamionAveriadoTipo(sistema, idCamion, 0)) continue;

                if (capacidadRestante.get(idCamion) >= volumen) {
                    asignacion.get(idCamion).add(pedidoId);
                    capacidadRestante.put(idCamion, capacidadRestante.get(idCamion) - volumen);
                    asignado = true;
                    break;
                }
            }

            // Si no fue posible por capacidad restante, forzar en uno que sí tenga capacidad total suficiente
            if (!asignado) {
                for (Camion camion : camionesOrdenados) {
                    int idCamion = camion.getId();
                    double capacidadTotal = camion.getTipo().getCargaGLPMax();

                    if (volumen <= capacidadTotal) {
                        asignacion.get(idCamion).add(pedidoId);
                        capacidadRestante.put(idCamion, capacidadRestante.get(idCamion) - volumen);
                        break;
                    }
                }
            }
        }
    }




    private int considerarMantenimiento(Camion camion){
        // mantenimiento antes de planificacion
        if(camion.getMantenimientos()!=null){
            LocalDateTime fechasalida = camion.getDestinos().get(0).getFechaHoraSalida();
            // implementar Map instead of List
            for(Mantenimiento m : camion.getMantenimientos()){
                if(m.getFechaHoraInicio().isBefore(fechasalida) &&
                        m.getFechaHoraFin().isAfter(fechasalida)){
                    List<Pedido>pedidosCam = camion.getPedidosAsignados();

                    // descartar si la hora de entrega esta antes de hora entrega sale
                    if (!pedidosCam.isEmpty()) {
                        Pedido pedidoMinimo = pedidosCam.stream()
                                .min(Comparator.comparing(Pedido::getFechaHoraMaxEntrega))
                                .get();
                        if(pedidoMinimo.getFechaHoraMaxEntrega().isBefore(m.getFechaHoraFin())){
                            //no se cumplio con un pedido
                            fitness = 0.0;
                            return -1;
                        }
                    }
                }
            }
        }
        return 1;
    }

}
