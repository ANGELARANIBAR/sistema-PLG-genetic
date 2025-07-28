package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Data
public class Individuo {
    private static int nIndividuo = 0;
    private Map<Integer, Map<Integer, Double>> asignacion; // camión -> { pedido -> volumenAsignado }
    private Map<Integer, List<Integer>> pedidosXcargasGLP; // camión -> buscar carga de GLP deacuerdo a atencion de pedidos

    private double fitness;
    private SistemaPLG sistemaPLG;
    public Individuo(){}

    public Individuo(int numPedidos, int numCamiones, SistemaPLG sistema, int code) {
        numCamiones += 1;
        numPedidos += 1;
        asignacion = new HashMap<>();
        pedidosXcargasGLP = new HashMap<>();
        for (int i = 1; i < numCamiones; i++) {
            asignacion.put(i, new HashMap<>());
        }
        // Asignar pedidos aleatoriamente a camiones (no necesariamente todos los camiones activos)
        List<Integer> pedidos = new ArrayList<>();
        for (int i = 1; i < numPedidos; i++){
            if(sistema.getPedidos().get(i-1).getEstado()==EstadoPedido.PENDIENTE) pedidos.add(sistema.getPedidos().get(i-1).getId());
        }
        //Collections.shuffle(pedidos);
        int nIntentos=0;
        Boolean sePuedoAsociarPedido = false;
        if(nIndividuo<15){
            asignarEquitativamente(numCamiones, pedidos, sistema);
        }
        else{
            Random rand = new Random(System.nanoTime() + nIndividuo * 997);

            for (int pedido : pedidos) {
                int camion=1+rand.nextInt(numCamiones-1);
                nIntentos=0;
                sePuedoAsociarPedido = true;
                while((sistema.getCamionCausanteReplan()!=null && sistema.getCamionCausanteReplan().getId()==(camion)) ||
                        (sistema.getFlota().get(camion-1).getTipo().getCargaGLPMax()<sistema.getPedidos().get(pedido-1).getVolumenGLP()) ||
                        esCamionAveriadoTipo(sistema, camion, 0)){
                    nIntentos++;
                    if(pedidos.size()*2<nIntentos){
                        sePuedoAsociarPedido = false;
                        break;
                    }
                    camion = 1+rand.nextInt(numCamiones-1);
                }
                if(sePuedoAsociarPedido){
                    asignacion
                    .computeIfAbsent(camion, k -> new LinkedHashMap<>())
                    .put(pedido, sistema.getPedidos().get(pedido - 1).getVolumenGLP());
                }
            }
        }

        if(sistema.getCamionCausanteReplan()!=null && numCamiones>1){
            if(code == 2){
                for(Camion c : sistema.getCamionesAveriados()){
                    if(c.getAverias()
                            .getLast().getTipo().getId()==1 ){
                        for(Pedido ped : c.getPedidosAsignados()){
                            if(ped.getEstado()==EstadoPedido.ASIGNADO){
                                asignacion
                                .computeIfAbsent(c.getId(), k -> new LinkedHashMap<>())
                                .merge(ped.getId(), ped.getVolumenGLP(), Double::sum);
                            }
                        }
                    }
                    else{
                        //directo a inicio
                    }
                }
            }
        }
        for (int i = 1; i < numCamiones; i++) {
            int ini=0;
            List<Integer> cargasGLP = new ArrayList<>();
            Random randCargaGLP = new Random(System.nanoTime() + nIndividuo * 9973);
            List<Integer> pedIds = new ArrayList<>(asignacion.get(i).keySet());
            int cantPedRestantes = pedIds.size(), acc = 0;
            while(cantPedRestantes > 0){
                nIntentos = 0;
                int cantPedObjetivos = 1+randCargaGLP.nextInt(cantPedRestantes); //minimo 1
                if(cargasGLP.isEmpty())ini=0;
                else ini = cargasGLP.size()-1;
                while(!sistema.puedeCargar(i-1, asignacion, ini, acc+cantPedObjetivos)){
                    nIntentos++;
                    if(nIntentos>cantPedRestantes*2){
                        cantPedObjetivos = 1;
                        break;
                    }
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

    private static Boolean esCamionAveriadoTipo(SistemaPLG sistema, int idxCamion, int tipoAveria){
        for(Camion c : sistema.getCamionesAveriados()){
            if((c.getId()==idxCamion && c.getAverias().getLast().getTipo().getId()==tipoAveria) ||
                    (c.getId()==idxCamion && 0==tipoAveria)
            ){
                return true;
            }
        }
        return false;
    }

    public void inicializarSistemaPLG(int code, SistemaPLG sistema) {
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
            if(code==1||code==3) c.setEstado(EstadoCamion.DISPONIBLE);
            c.setCombustibleActual(c.getTipo().getCapCombustibleMax());

            flota.add(c);
        }
        if(code == 2){
            if(sistema.getCamionCausanteReplan() != null){
                sistemaPLG.setCamionCausanteReplan(flota.get(sistema.getCamionCausanteReplan().getId()-1));
                sistemaPLG.getCamionCausanteReplan().setEstado(EstadoCamion.AVERIADO);
            }
            if(sistema.getCamionesAveriados()!=null)
                for(Camion c : sistema.getCamionesAveriados()){
                    sistemaPLG.getCamionesAveriados().add(flota.get(c.getId()-1));
                    if(flota.get(c.getId()-1).getAverias() == null)flota.get(c.getId()-1).setAverias(new ArrayList<>());
                    flota.get(c.getId()-1).getAverias().add(c.getAverias().getLast());
                    flota.get(c.getId()-1).setEstado(EstadoCamion.AVERIADO);
                }
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
            cis.setOperacionesGLPCisterna(new ArrayList<>());
            if(cisterna.getOperacionesGLPCisterna()!=null){
                List<OperacionesGLPCisterna>temp = new ArrayList<>(cisterna.getOperacionesGLPCisterna());
                for(OperacionesGLPCisterna op : temp){
                    OperacionesGLPCisterna nuevo = new OperacionesGLPCisterna(op);
                    cis.getOperacionesGLPCisterna().add(nuevo);
                    nuevo.setCisterna(cis);
                }
            }
            cisternas.add(cis);
        }
    }
    private void setEstadoInicialAveriado(Camion camion, SistemaPLG sistema){
        List<Pedido> pedidos = sistemaPLG.getPedidos();
        List<Cisterna> cisternas = sistemaPLG.getCisternas();
        camion.setEstado(EstadoCamion.EN_RUTA);
        Map<Integer, Double> pedMap = asignacion.get(camion.getId());
        List<Integer> idsOrdenados  = new ArrayList<>(pedMap.keySet()); // LinkedHashMap mantiene orden de inserción

        for (int pedidoId : idsOrdenados) {
            EntregaPedido ent = new EntregaPedido();
            ent.setId(pedidoId);
            ent.setVolumenGLPEntregado(0.0);          // aún no se entrega
            ent.setPedido(pedidos.get(pedidoId - 1));
            ent.setUbicacion(pedidos.get(pedidoId - 1).getUbicacion());

            camion.getPedidosAsignados().add(pedidos.get(pedidoId - 1));
            camion.getDestinos().add(ent);
        }

        Reabastecimiento retorno = new Reabastecimiento();
        retorno.setCisterna(cisternas.get(0));
        retorno.setUbicacion(cisternas.get(0).getUbicacion());
        retorno.setGLPOperacion(0.0);
        camion.getDestinos().add(retorno); // para los camiones averiados inclusive

        /* Calcular GLP inicial ***usando el volumen ASIGNADO***       */
        camion.setCargasGLP(pedidosXcargasGLP.get(camion.getId()));       // cortes
        double GLPInicial = 0.0;
        List<Integer> cortes = pedidosXcargasGLP.get(camion.getId());

        if (!cortes.isEmpty()) {
            int limite = cortes.get(0);                // nº pedidos del primer viaje
            for (int i = 0; i < limite && i < idsOrdenados.size(); i++) {
                int idPed = idsOrdenados.get(i);
                GLPInicial += pedMap.get(idPed);       // SOLO el volumen asignado
            }
            if (camion.getTipo().getCargaGLPMax() < GLPInicial) {
                fitness = 0.0;
                return;
            }
        }

        List<Destino> destinos = sistema.getFlota().get(camion.getId() - 1).getDestinos();

        camion.setIndicePedidoActual(0); // se pudo recargar GLP en el origen
        
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
        for(Camion camAveriado : sistemaPLG.getCamionesAveriados()){
            if(camAveriado.getAverias().getLast().getTipo().getId()==1)
                setEstadoInicialAveriado(camAveriado, sistema);
        }
        int entregasTardias = 0;
        for (Map.Entry<Integer, Map<Integer,Double>> entry : asignacion.entrySet()) {
            int camionIdx = entry.getKey();
            Map<Integer, Double> pedidosAsignados = entry.getValue();
            if (pedidosAsignados.isEmpty()) continue;

            Camion camion = flota.get(camionIdx - 1);
            if((sistemaPLG.getCamionCausanteReplan()!=null && sistema.getCamionCausanteReplan().getId()==camionIdx
                    && sistemaPLG.getCamionCausanteReplan().getAverias().getLast().getTipo().getId()==1) || esCamionAveriadoTipo(sistemaPLG, camionIdx, 1)){
                continue;
            }

            camion.setEstado(EstadoCamion.EN_RUTA);

            List<Integer> idPedidosOrden = new ArrayList<>(pedidosAsignados.keySet());
            for (int pedidoIdx : idPedidosOrden) {
                double volumenAsignado = pedidosAsignados.get(pedidoIdx);
                EntregaPedido entrega = new EntregaPedido();
                entrega.setId(pedidoIdx);
                entrega.setVolumenGLPEntregado(volumenAsignado); // aún no se entrega
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
                GLPInicial = camion.getTipo().getCargaGLPMax();
                if (camion.getTipo().getCargaGLPMax() < GLPInicial) {
                    fitness = 0.0;  return;
                }
            }

            if (code == 1 || code == 3) {
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

            int resultado = camion.construirRutaHaciaPedido(code, sistemaPLG);
            if (pedidosXcargasGLP.get(camionIdx).isEmpty() && pedidosAsignados.isEmpty() && (resultado == -3 || resultado == -5)) {
                //cuando camion sin nada asignado da errores en planificación
                continue;
            }
            if (resultado != 0) {
                fitness = 0.0;
                //System.out.println("Problema: " + resultado);
                return;
            }
            if(sistemaPLG.getFechaHoraFinEntregas()==null || ( !camion.getDestinos().isEmpty() &&
                    camion.getDestinos().getLast().getFechaHoraLlegada() != null &&
                    sistemaPLG.getFechaHoraFinEntregas().isBefore(camion.getDestinos().getLast().getFechaHoraLlegada())))
                sistemaPLG.setFechaHoraFinEntregas(camion.getDestinos().getLast().getFechaHoraLlegada());

        }
        //if(sistemaPLG.getCamionCausanteReplan()!=null && sistemaPLG.getCamionCausanteReplan().getAverias().getLast().getTipo().getId()==1){
//        if(sistema.getCamionCausanteReplan()!=null){
//            System.out.println("Ub replan 0 " + sistemaPLG.getCamionCausanteReplan().getDestinos().get(0).getRuta());
//            System.out.println("Ub replan 1 " + sistemaPLG.getCamionCausanteReplan().getDestinos().get(1).getRuta());
//        }
        for(Camion camion : sistemaPLG.getCamionesAveriados()){

            if(camion.getAverias().getLast().getTipo().getId()!=1)continue;//solo 1 tiene pedidos programados
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
            int resultado = camion.construirRutaHaciaPedido(code, sistemaPLG);

            if (pedidosXcargasGLP.get(camion.getId()).isEmpty() && asignacion
                    .get(camion.getId()).isEmpty() && ((resultado == -3 && camion.getId()!=sistema.getCamionCausanteReplan().getId())|| resultado == -5)) {
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
        int camionesActivos = 0;
        for (Camion c : flota) {
            if(c.getDestinos().size()<3){
                c.setEstado(EstadoCamion.DISPONIBLE);
            }
            else if(c.getEstado()!=EstadoCamion.AVERIADO){
                c.setEstado(EstadoCamion.EN_RUTA);
            }
            if(!c.getPedidosAsignados().isEmpty())camionesActivos++;
            if (!c.getDestinos().isEmpty()) {
                totalDistancia += c.getDistanciaTotal();
                totalCombustible += c.getCombustibleEmpleado();
                totalTiempo += c.getDistanciaTotal() / c.getTipo().getVelocidadPromedio();
            }
        }

        //fitness = totalDistancia / (totalCombustible + 1e-5); // evitar división por cero
        //fitness = 10000 / (totalCombustible + 1e-5); // evitar división por cero
        double k=1.0;
        if(code==3 && sistemaPLG.getFechaHoraPrimerColapso()!=null){
            //funcion sigmoide
            k = 1.0 / (1.0 + Math.exp(-sistemaPLG.getFechaHoraPrimerColapso().toInstant(ZoneOffset.UTC).toEpochMilli()));
        }
        double wCamiones = 10.0; // peso ajustable
        double factorCamiones = 1.0 + wCamiones * (camionesActivos / (double) flota.size());

        fitness = factorCamiones * k / (0.4 * totalCombustible + 0.1 * totalTiempo + entregasTardias * 500 + 1e-5);
    }

    public Individuo clonar(int code) {
        Individuo copia = new Individuo(0, 0, this.sistemaPLG, code);
        Map<Integer, Map<Integer, Double>> nuevaAsignacion = new HashMap<>();
        for (Map.Entry<Integer, Map<Integer, Double>> entry : asignacion.entrySet()) {
            nuevaAsignacion.put(entry.getKey(), new HashMap<>(entry.getValue()));
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
        for (Map.Entry<Integer, Map<Integer, Double>> entry : asignacion.entrySet()) {
            if (!entry.getValue().isEmpty()) {
                System.out.println("Camión " + entry.getKey() + ": " + entry.getValue());
            }
        }
    }

    public void asignarEquitativamente(int numCamiones, List<Integer> pedidos, SistemaPLG sistema) {
        // Aleatorizar camiones y pedidos
        List<Camion> camionesOrdenados = new ArrayList<>(sistema.getFlota());
        Collections.shuffle(camionesOrdenados);

        pedidos.forEach(id -> {
            Pedido p = sistema.getPedidos().get(id - 1);
            if (Double.isNaN(p.getCostoAlgoritmoPedido())) {
                sistema.calcularCostoPedido(p);
            }
        });

        List<Pedido> pedidosOrdenados = pedidos.stream()
            .map(id -> sistema.getPedidos().get(id - 1))
            .filter(p -> p.getEstado() == EstadoPedido.PENDIENTE)
            .sorted(Comparator
                .comparingDouble((Pedido p) ->
                    Double.isNaN(p.getCostoAlgoritmoPedido()) ? Double.MAX_VALUE : p.getCostoAlgoritmoPedido())     // evita null
                .thenComparing(p -> {
                    LocalDateTime f = p.getFechaHoraMaxEntrega();
                    return f != null ? f : LocalDateTime.MAX;                  // evita null
                }))
            .toList();

        Map<Integer, Double> capacidadRestante = new HashMap<>();

        // Inicializar asignación y capacidades
        for (Camion camion : camionesOrdenados) {
            int id = camion.getId();
            asignacion.put(id, new HashMap<>());
            capacidadRestante.put(id, camion.getCargaGLPActual());
        }

        /* === 2. FASE *SEMILLA*: cada camión recibe 1 pedido ================= */
        Iterator<Pedido> iter = pedidosOrdenados.iterator();
        for (Camion c : camionesOrdenados) {
            if (esInutil(c, sistema)) continue;
            if (!iter.hasNext()) break;                   // más camiones que pedidos (raro)
            Pedido p = iter.next();
            double asignar = Math.min(p.getVolumenGLP(),   // lo que quepa
                                    Math.max(capacidadRestante.get(c.getId()), 0.0));

            if (asignar < 1e-6) {                        
                capacidadRestante.put(c.getId(), c.getTipo().getCargaGLPMax());
                asignar = Math.min(p.getVolumenGLP(), capacidadRestante.get(c.getId()));
            }

            insertar(asignacion, c.getId(), p.getId(), asignar);
            capacidadRestante.put(c.getId(), capacidadRestante.get(c.getId()) - asignar);

            p.setVolumenGLP(p.getVolumenGLP() - asignar); // queda pendiente (puede ser 0)
        }

        /* === 3. Resto de pedidos (incluyendo pendientes de la semilla) ===== */
        for (Pedido p : pedidosOrdenados) {
            double[] rest = { p.getVolumenGLP() };
            if (rest[0] <= 1e-6) continue;

            /* 3A. huecos actuales (balance) */
            camionesOrdenados.stream()
                .sorted(Comparator.comparing(
                        (Camion c) -> capacidadRestante.getOrDefault(c.getId(), 0.0)
                    ).reversed())
                .forEach(c -> {
                    if (rest[0] <= 1e-6) return;
                    if (esInutil(c, sistema))   return;

                    double cupo  = capacidadRestante.getOrDefault(c.getId(), 0.0);
                    double carga = Math.min(cupo, rest[0]);
                    if (carga <= 1e-6) return;

                    insertar(asignacion, c.getId(), p.getId(), carga);
                    capacidadRestante.put(c.getId(), cupo - carga);
                    rest[0] -= carga;
                });

            /* 3B. viajes extra */
            int idx = 0;
            while (rest[0] > 1e-6 && idx < camionesOrdenados.size() * 3) {
                Camion c = camionesOrdenados.get(idx % camionesOrdenados.size());
                idx++;
                if (esInutil(c, sistema)) continue;

                capacidadRestante.put(c.getId(), c.getTipo().getCargaGLPMax());           // recarga
                double carga = Math.min(capacidadRestante.get(c.getId()), rest[0]);
                insertar(asignacion, c.getId(), p.getId(), carga);
                capacidadRestante.put(c.getId(), capacidadRestante.get(c.getId()) - carga);
                rest[0] -= carga;
            }
            if (rest[0] > 1e-6) System.err.printf("⚠ Pedido %d sin asignar %.2f m³%n",
                                            p.getId(), rest[0]);
        }
    }

    /* ===== helpers ======================================================= */
    private static boolean esInutil(Camion c, SistemaPLG sis) {
        return (sis.getCamionCausanteReplan() != null &&
                sis.getCamionCausanteReplan().getId() == c.getId()) ||
                esCamionAveriadoTipo(sis, c.getId(), 0);
    }

    private static void insertar(Map<Integer, Map<Integer, Double>> m,
                                int idCam, int idPed, double vol) {
        m.get(idCam).merge(idPed, vol, Double::sum);
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
