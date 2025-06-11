package com.plg.planificacionplg.clases;

import ch.qos.logback.classic.net.SyslogAppender;
import lombok.Data;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Data
public class Camion {
    private int id;
    private int idxPorTipo;
    private String codigo, placa;
    private TipoCamion tipo;
    private double combustibleActual, cargaGLPActual, pesoTotal, combustibleEmpleado, distanciaTotal;
    private EstadoCamion estado;
    private List<Pedido> pedidosAsignados;
    private List<Destino> destinos;
    private Nodo ubicacionActual;
    private int idxDestinoEnCurso;
    private List<Mantenimiento> mantenimientos;
    private List<Averia> averias;
    private List<Integer> cargasGLP;
    private Integer indicePedidoActual;
    private Destino destinoEnCurso;

    public Camion() {
        averias = new ArrayList<>();
        destinos = new ArrayList<>();
        pedidosAsignados = new ArrayList<>();
    }

    public Camion(Camion otro) {
        this.id = otro.id;
        this.codigo = otro.codigo;
        this.placa = otro.placa;
        this.tipo = otro.tipo;
        this.combustibleActual = otro.combustibleActual;
        this.cargaGLPActual = otro.cargaGLPActual;
        this.pesoTotal = otro.pesoTotal;
        this.combustibleEmpleado = otro.combustibleEmpleado;
        this.distanciaTotal = otro.distanciaTotal;
        this.estado = otro.estado;
        this.pedidosAsignados = new ArrayList<>();
        this.destinos = new ArrayList<>();
        this.ubicacionActual = otro.ubicacionActual;
        this.idxDestinoEnCurso = otro.idxDestinoEnCurso;
        this.mantenimientos = otro.mantenimientos;
        this.averias = otro.averias;
        this.cargasGLP = otro.cargasGLP;
        if(otro.destinoEnCurso != null)
            this.destinoEnCurso = otro.destinoEnCurso.copiar();

    }

    public double calcularCombustibleActual(LocalDateTime fechahora) {
        int distanciaManzana = 1;
        if(destinos.isEmpty())return getCombustibleActual();
        Destino anterior = destinos.get(0);
        if(anterior.getFechaHoraSalida()==null || destinos.getLast().getFechaHoraLlegada()==null)return anterior.getSaldoCombustibleCamion();//camion no salio
        if(fechahora.isBefore(anterior.getFechaHoraSalida()))return anterior.getSaldoCombustibleCamion();;
        if(anterior.getFechaHoraSalida().equals(fechahora)) {return anterior.getSaldoCombustibleCamion();}
        for(int i=1; i<destinos.size(); i++) {
            Destino destino = destinos.get(i);
            if(destino.getFechaHoraLlegada().isAfter(fechahora)) {
                //calcular con ruta
                double tiempoEnRuta = Duration.between(anterior.getFechaHoraSalida(), fechahora).toSeconds();
                return anterior.getSaldoCombustibleCamion()-(int)(Math.abs(tiempoEnRuta/60.0)*tipo.getVelocidadPromedio())*distanciaManzana*calcularPesoTotal()/180.0;
            }
            else{
                if(destino.getFechaHoraSalida().isAfter(fechahora) ||
                        destino.getFechaHoraLlegada().isEqual(fechahora)){
                    return destino.getSaldoCombustibleCamion();
                }
            }
            anterior = destino;
        }
        return destinos.getLast().getSaldoCombustibleCamion();
    }

    public double calcularGLPActual(LocalDateTime fechahora) {
        if(destinos.isEmpty())return getCargaGLPActual();
        Destino anterior = destinos.get(0);
        if(anterior.getFechaHoraSalida()==null || destinos.getLast().getFechaHoraLlegada()==null)return getCargaGLPActual();//camion no salio

        if(anterior instanceof Replanficacion &&
                fechahora.isBefore(anterior.getFechaHoraSalida())) {
            if((((Replanficacion) anterior).getOperaciones()!=null)){
                List<OperacionesGLPCisterna> operaciones = ((Replanficacion) anterior).getOperaciones();
                //operaciones.sort(Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion));
                for(OperacionesGLPCisterna op : operaciones){
                    if(fechahora.isBefore(op.getFechaHoraOperacion())){
                        return op.getSaldoGLP() + op.getCantSalidaGLP();
                    }
                    if((fechahora.isEqual(op.getFechaHoraOperacion()))){
                        return op.getSaldoGLP();
                    }
                }
            }
            return anterior.getSaldoGLPCamion();
        }
        if(fechahora.isBefore(anterior.getFechaHoraSalida()))return anterior.getSaldoCombustibleCamion();
        if(anterior.getFechaHoraSalida().isEqual(fechahora)) return anterior.getSaldoCombustibleCamion();
        for(int i=1; i<destinos.size(); i++) {
            Destino destino = destinos.get(i);
            if(destino.getFechaHoraLlegada().isAfter(fechahora)) {
                //calcular con ruta
                //double tiempoEnRuta = Duration.between(anterior.getFechaHoraSalida(), fechahora).toSeconds();
                return anterior.getSaldoGLPCamion();
            }
            else{
                if(destino.getFechaHoraSalida().isAfter(fechahora) ||
                        destino.getFechaHoraLlegada().isEqual(fechahora)){
                    return destino.getSaldoGLPCamion();
                }
            }
            anterior = destino;
        }
        return getCargaGLPActual();
    }
    public Destino getDestinoAnteriorAFechaHora(LocalDateTime fechahora) {
        if(destinos.isEmpty())return null;
        Destino anterior = destinos.get(0);
        if(anterior.getFechaHoraSalida()==null
                || destinos.getLast().getFechaHoraLlegada()==null)
            return anterior;//camion no salio
        if(fechahora.isBefore(anterior.getFechaHoraSalida()))return anterior;
        if(anterior.getFechaHoraSalida().equals(fechahora)) {return anterior;}
        for(int i=1; i<destinos.size(); i++) {
            Destino destino = destinos.get(i);
            if(destino.getFechaHoraLlegada().isAfter(fechahora)) {
                //calcular con ruta
                //double tiempoEnRuta = Duration.between(anterior.getFechaHoraSalida(), fechahora).toSeconds();
                return anterior;
            }
            else{
                if(destino.getFechaHoraSalida().isAfter(fechahora) ||
                        destino.getFechaHoraLlegada().isEqual(fechahora)){
                    return destino;
                }
            }
            anterior = destino;
        }
        return destinos.getLast();
    }


    public Nodo calcularUbicacion(LocalDateTime fechahora) {

        if(destinos.isEmpty())return new Nodo(0, 0);
        Destino anterior = destinos.get(0);
        if(anterior.getFechaHoraSalida()==null || destinos.getLast().getFechaHoraLlegada()==null)return new Nodo(0, 0);
        if(fechahora.isBefore(anterior.getFechaHoraSalida()))return anterior.getUbicacion();
        if(anterior.getFechaHoraSalida().equals(fechahora)) {return anterior.getUbicacion();}
        ubicacionActual = anterior.getUbicacion();
        for(int i=1; i<destinos.size(); i++) {
            Destino destino = destinos.get(i);
            if(destino.getFechaHoraLlegada().isAfter(fechahora)) {
                //calcular con ruta
                long tiempoEnRuta = Duration.between(anterior.getFechaHoraSalida(), fechahora).toMinutes();
                //System.out.println(tiempoEnRuta);
                ubicacionActual = destino.getRuta().getNodos().get((int)(Math.abs(tiempoEnRuta)*tipo.getVelocidadPromedio()));
                return ubicacionActual;
            }
            else{
                if(destino.getFechaHoraSalida().isAfter(fechahora) ||
                        destino.getFechaHoraLlegada().isEqual(fechahora)){
                    return destino.getUbicacion();
                }
            }
            anterior = destino;
        }
        ubicacionActual = destinos.getLast().getUbicacion();
        return ubicacionActual;
    }


    public double calcularPesoTotal() {
        pesoTotal = (tipo.getPesoGLPMax() / tipo.getCargaGLPMax()) * cargaGLPActual + tipo.getTara();
        return pesoTotal;
    }


    public double calcularDistanciaMaxima() {
        return combustibleActual * 180 / calcularPesoTotal();
    }

    public int construirRutaHaciaPedido(SistemaPLG sistemaPLG) {
        Destino destinoInicial = destinos.get(0);
        int pedidosCant = destinos.size();
        int cantNodosInicial=pedidosCant, index = 0;
        if(pedidosCant == 2) {
            if (destinos.getFirst().getUbicacion().sonIguales(destinos.getLast().getUbicacion())) {
                return -5;
            }
            if(insertarNodosIntermediosCargaCombustible(destinos.getFirst(), destinos.getLast(), sistemaPLG)==-1)return -4;
        }
        else for (int i = 1; i < pedidosCant; i++) {
            index=index+destinos.size()-cantNodosInicial+1;
            cantNodosInicial=destinos.size();
            Destino destinoFinal = destinos.get(index);
            destinoFinal.setRuta(new Ruta());
            if(destinoFinal instanceof EntregaPedido){
                destinoFinal.setGLPOperacion(destinoFinal.getPedido().getVolumenGLP());
                destinoFinal.setUbicacion(destinoFinal.getPedido().getUbicacion());
            }

            int resultadoNodosIntermedios = insertarNodosIntermediosCargaGLP(destinoInicial, destinoFinal, sistemaPLG);
            if (resultadoNodosIntermedios == 1) {//caso en que no necesitas GLP, y puede que necesitss gasolina
                if(insertarNodosIntermediosCargaCombustible(destinoInicial, destinoFinal, sistemaPLG)==-1)return -4;
            } else if (resultadoNodosIntermedios == -1) {
                //System.out.println(pedidosCant-2+"?? 1: "+destinoInicial.getUbicacion()+" 2: "+destinoFinal.getUbicacion());
                return -3; // no se puede llegar a pedidoDestino solucion No Valida
            }

            if(destinoFinal instanceof EntregaPedido &&
                    destinoFinal.getFechaHoraLlegada()
                            .isAfter(destinoFinal.getPedido().getFechaHoraMaxEntrega())){
                return -1;
            }
            if(destinoFinal.getRuta().getNodos()==null)return -2;

            destinoInicial = destinoFinal;
        }
        destinos.getLast().setFechaHoraSalida(destinos.getLast().getFechaHoraLlegada().plusMinutes(15));
        destinos.getLast().setEstadoCamion(EstadoCamion.EN_MANTENIMIENTO);
        return 0; // se puede completar la ruta
    }

    //verificando si existe una cisterna que te de el GLP qeu quieres
    private int insertarNodosIntermediosCargaGLP(Destino start, Destino end, SistemaPLG sistemaPLG) {
        if (start.getUbicacion().sonIguales(end.getUbicacion())) {
            return -1;
        }
        if (end instanceof EntregaPedido && end.getGLPOperacion() > cargaGLPActual && Math.abs(end.getGLPOperacion() - cargaGLPActual) > 0.001) {
            int mejorCisterna = -1;
            double mejorDistancia = Double.MAX_VALUE;
            double faltanteGLP = end.getGLPOperacion() - cargaGLPActual;
            Destino mejorEnd=null, elegido=null;
            faltanteGLP = -cargaGLPActual;
            if(indicePedidoActual == 0){
                for(int j=0; j<cargasGLP.get(0); j++){
                    faltanteGLP += getPedidosAsignados().get(j).getVolumenGLP();
                }
            }
            else{
                for(int j=cargasGLP.get(indicePedidoActual-1); j<cargasGLP.get(indicePedidoActual); j++){
                    faltanteGLP += getPedidosAsignados().get(j).getVolumenGLP();
                }
            }
            indicePedidoActual++;

            if(tipo.getCargaGLPMax()<faltanteGLP){return -1;}
            double combustibleEmpleadoMejorDist = 0.0;
            List<List<Destino>> canditatos = new ArrayList<>();
            List<Camion> camionesPrueba = new ArrayList<>();
            for (int i = 0; i < sistemaPLG.getCisternas().size(); i++) {
                Cisterna cisterna = sistemaPLG.getCisternas().get(i);
                Reabastecimiento reabastecimiento = new Reabastecimiento();
                reabastecimiento.setCisterna(cisterna);
                reabastecimiento.setUbicacion(cisterna.getUbicacion());
                reabastecimiento.setGLPOperacion(faltanteGLP);
                // si no se puede retirarGLP de la cisterna
                canditatos.add(new ArrayList<>());//start a cisterna
                canditatos.add(new ArrayList<>());//cisterna a end
                camionesPrueba.add(new Camion(this));
                camionesPrueba.get(i).setDistanciaTotal(0.0);
                int resultadoNodosIntermedios;
                resultadoNodosIntermedios = buscarDestinosIntermediosCargaCombustible(canditatos.get(i * 2), start, reabastecimiento, sistemaPLG, camionesPrueba.get(i));//start a cisterna
                if (resultadoNodosIntermedios == -1) continue;
                if (!cisterna.puedeRetirarGLP(start.getFechaHoraSalida()
                        .plusMinutes((long) (camionesPrueba.get(i).distanciaTotal / tipo.getVelocidadPromedio())), faltanteGLP))
                    continue;
                resultadoNodosIntermedios = buscarDestinosIntermediosCargaCombustible(canditatos.get(i * 2 + 1), reabastecimiento, end, sistemaPLG, camionesPrueba.get(i));//cisterna a end

                if (resultadoNodosIntermedios == -1) continue;
                if (mejorDistancia > camionesPrueba.get(i).distanciaTotal) {
                    mejorDistancia = camionesPrueba.get(i).distanciaTotal;
                    mejorCisterna = i;
                    combustibleEmpleadoMejorDist = camionesPrueba.get(i).combustibleEmpleado;
                    if(end instanceof Reabastecimiento){
                        mejorEnd = new Reabastecimiento((Reabastecimiento)end);
                    }
                    else if (end instanceof EntregaPedido){
                        mejorEnd = new EntregaPedido((EntregaPedido)end);
                    }else{
                        mejorEnd = new Trasvase((Trasvase)end);
                    }
                    elegido = reabastecimiento;
                }
            }

            int idxCamTPrueba = 0, idxCamPrueba;
            for(int j=0; j<sistemaPLG.getCamionesAveriados().size(); j++){
                Trasvase trasvase = new Trasvase();
                int resultadoNodosIntermedios;
                Camion camionAveriado = sistemaPLG.getCamionesAveriados().get(j);
                if(faltanteGLP>camionAveriado.getCargaGLPActual() || !(camionAveriado.getDestinos().getFirst() instanceof Replanficacion)){continue;}
                idxCamPrueba = idxCamTPrueba+mejorCisterna+1;
                idxCamTPrueba++;
                trasvase.setCamionTrasvase(camionAveriado);
                trasvase.setUbicacion(camionAveriado.getUbicacionActual());
                trasvase.setGLPOperacion(faltanteGLP);
                canditatos.add(idxCamPrueba*2, new ArrayList<>());//start a trasvase
                canditatos.add(idxCamPrueba*2+1, new ArrayList<>());//trasvase a end
                camionesPrueba.add(idxCamPrueba, new Camion(this));
                camionesPrueba.get(idxCamPrueba).setDistanciaTotal(0.0);
                resultadoNodosIntermedios = buscarDestinosIntermediosCargaCombustible(
                        canditatos.get(idxCamPrueba * 2), start, trasvase, sistemaPLG, camionesPrueba.get(idxCamPrueba));//start a cisterna
                if (resultadoNodosIntermedios == -1) continue;
                trasvase.setFechaHoraTrasvase(start.getFechaHoraSalida()
                        .plusMinutes((long) (camionesPrueba.get(idxCamPrueba).distanciaTotal / tipo.getVelocidadPromedio())));
                if(!camionAveriado.disponibleParaTrasvase(trasvase.getFechaHoraTrasvase(), faltanteGLP))continue;
                resultadoNodosIntermedios = buscarDestinosIntermediosCargaCombustible(
                        canditatos.get(idxCamPrueba * 2 + 1), trasvase, end, sistemaPLG, camionesPrueba.get(idxCamPrueba));//cisterna a end

                if (resultadoNodosIntermedios == -1) continue;
                if (mejorDistancia > camionesPrueba.get(idxCamPrueba).distanciaTotal) {
                    mejorDistancia = camionesPrueba.get(idxCamPrueba).distanciaTotal;
                    mejorCisterna = idxCamPrueba;
                    combustibleEmpleadoMejorDist = camionesPrueba.get(idxCamPrueba).combustibleEmpleado;
                    if(end instanceof Reabastecimiento){
                        mejorEnd = new Reabastecimiento((Reabastecimiento)end);
                    }
                    else if (end instanceof EntregaPedido){
                        mejorEnd = new EntregaPedido((EntregaPedido)end);
                    }else{
                        mejorEnd = new Trasvase((Trasvase)end);
                    }
                    elegido = trasvase;
                }

            }
            if (mejorCisterna == -1) return -1; // no hay cisterna que abastesca solucion
            end.setFechaHoraLlegada(start.getFechaHoraSalida().plusMinutes((long) (mejorDistancia / tipo.getVelocidadPromedio())));
            end.setFechaHoraSalida(end.getFechaHoraLlegada().plusMinutes((long)end.getTiempoOperacion()));
            //combustibleEmpleado += camionesPrueba.get(mejorCisterna).combustibleEmpleado;
            int indexEnd = destinos.indexOf(end);
            if (indexEnd == -1) {
                indexEnd = 0;
            }
            destinos.addAll(indexEnd, canditatos.get(mejorCisterna * 2));
            indexEnd = destinos.indexOf(end);
            destinos.remove(indexEnd);
            destinos.addAll(indexEnd, canditatos.get(mejorCisterna * 2 + 1));
            indexEnd = destinos.indexOf(end);
            destinos.remove(indexEnd);
            destinos.add(indexEnd, mejorEnd);
            distanciaTotal += mejorDistancia;
            combustibleEmpleado += combustibleEmpleadoMejorDist;
            combustibleActual = canditatos.get(mejorCisterna * 2 + 1).get(canditatos.get(mejorCisterna * 2 + 1).size()-1).getSaldoCombustibleCamion();
            cargaGLPActual = camionesPrueba.get(mejorCisterna).getCargaGLPActual(); // gastado
            if(elegido instanceof Reabastecimiento){
                sistemaPLG.getCisternas().get(mejorCisterna).registrarRetiroGLP(elegido.getFechaHoraLlegada(),
                        faltanteGLP, this);
                elegido.setEstadoCamion(EstadoCamion.EN_RECARGA_GLP);
            }else{
                Camion camEnSistema = sistemaPLG.getFlota().get(((Trasvase)elegido).getCamionTrasvase().getId()-1);
                //encontrar el destino y actualzar le saldo GLP en destino
                Destino anterior = camEnSistema.getDestinoAnteriorAFechaHora(((Trasvase) elegido).getFechaHoraTrasvase());
                if(anterior==null)return 1;
                camEnSistema.setCargaGLPActual(camEnSistema.getDestinos().getFirst().getSaldoGLPCamion() - faltanteGLP);
                anterior.setSaldoGLPCamion(camEnSistema.getCargaGLPActual());
                elegido.setEstadoCamion(EstadoCamion.EN_RECARGA_GLP);
                if(camEnSistema.getDestinos().getFirst() instanceof Replanficacion){
                    OperacionesGLPCisterna op = new OperacionesGLPCisterna();
                    op.setCantSalidaGLP(elegido.operacionCargaGLP());
                    op.setFechaHoraOperacion(((Trasvase) elegido).getFechaHoraTrasvase());
                    op.setCamion(this);
                    op.setSaldoGLP(camEnSistema.getCargaGLPActual());
                    if(((Replanficacion) camEnSistema.getDestinos().getFirst()).getOperaciones()==null){
                        ((Replanficacion) camEnSistema.getDestinos().getFirst()).setOperaciones(new ArrayList<>());
                    }
                    ((Replanficacion) camEnSistema.getDestinos().getFirst()).getOperaciones().add(op);
                }
            }
            end.setSaldoGLPCamion(cargaGLPActual);
            end.setSaldoCombustibleCamion(combustibleActual);

            return 0; //ok si hay una cisterna en la capacidad de suministrar el faltante
        } else{
            return 1;
        }
    }

    private Boolean disponibleParaTrasvase(LocalDateTime fechaHora, double cantidadSolicitada){
        if(averias==null)return false;
        for(Averia a : averias){
            if(a.getFechaHoraFin()==null)continue;
            if(a.getFechaHoraInicio().isBefore(fechaHora) && a.getFechaHoraInicio()
                    .plusHours((long)a.getTipo().getTiempoInmovilizado()).isAfter(fechaHora) && cantidadSolicitada<=cargaGLPActual){
                return true;
            }
        }
        return false;
    }

    private int insertarNodosIntermediosCargaCombustible(Destino start, Destino end, SistemaPLG sistemaPLG) { //reformular
        //que no se repita el nodo Reabastecimiento entre dos pedidos
        //distancia manhatan que te deja mas cerca del otro pedido, no repetir nodo cisterna entre dos pedidos

        if (start.getUbicacion().sonIguales(end.getUbicacion())) {
            return -1;
        }
        end.getRuta().aStar(start.getUbicacion(), end.getUbicacion(), sistemaPLG, tipo.getVelocidadPromedio(), start.getFechaHoraSalida());
        //decidir si va a Cistenna intermedia, a trasvase, directamene a entregar el pedido
        if(end.getRuta().getNodos()==null)return -1;
        double distMax = calcularDistanciaMaxima();
        if (distMax < end.getRuta().getDistanciaTotal()) {

            Map<Integer, Double>valuacionesManhattanCisternas = new HashMap<>();
            Map<Integer, Integer>cisternasVisitadas = new HashMap<>();
            if(start instanceof Reabastecimiento){
                cisternasVisitadas.put(((Reabastecimiento) start).getCisterna().getId(), 0);
            }
            int indexEnd = 0;
            while ( !destinos.isEmpty() && destinos.get(indexEnd)!=null && destinos.get(indexEnd) instanceof Reabastecimiento) {
                cisternasVisitadas.put(((Reabastecimiento) destinos.get(indexEnd++)).getCisterna().getId(), 0);
            }
            for(int i = 0; i < sistemaPLG.getCisternas().size(); i++) {
                Cisterna cis = sistemaPLG.getCisternas().get(i);
                if(!cisternasVisitadas.containsKey(cis.getId())) {
                    valuacionesManhattanCisternas.put(i, start.getUbicacion().distanciaManhattan(cis.getUbicacion())+
                            end.getUbicacion().distanciaManhattan(cis.getUbicacion()));
                }
            }
            if(valuacionesManhattanCisternas.isEmpty())return -1;
            List<Map.Entry<Integer, Double>> cisternasOrdenadas = new ArrayList<>(valuacionesManhattanCisternas.entrySet());
            cisternasOrdenadas.sort(Map.Entry.comparingByValue());

            // Recorrer solo las claves ordenadas por el valor
            for (Map.Entry<Integer, Double> entry : cisternasOrdenadas) {
                Integer idCisterna = entry.getKey();
                Reabastecimiento mejorReabastecimiento = new Reabastecimiento();
                mejorReabastecimiento.setCisterna(sistemaPLG.getCisternas().get(idCisterna));
                mejorReabastecimiento.setUbicacion(sistemaPLG.getCisternas().get(idCisterna).getUbicacion());
                mejorReabastecimiento.getRuta().aStar(start.getUbicacion(), mejorReabastecimiento.getUbicacion(), sistemaPLG, tipo.getVelocidadPromedio(), start.getFechaHoraSalida());
                if(mejorReabastecimiento.getRuta().getNodos()!=null){
                    double combustibleEmpleadoRuta = mejorReabastecimiento.getRuta().getDistanciaTotal() * getPesoTotal() / 180;
                    mejorReabastecimiento.getRuta().setConsumoCombustible(combustibleEmpleadoRuta);
                    combustibleEmpleado += combustibleEmpleadoRuta;
                    //cargaGLPActual = tipo.getCargaGLPMax();
                    mejorReabastecimiento.setFechaHoraLlegada(start.getFechaHoraSalida()
                            .plusMinutes((long) (mejorReabastecimiento.getRuta().getDistanciaTotal() / tipo.getVelocidadPromedio())));
                    mejorReabastecimiento.setFechaHoraSalida(mejorReabastecimiento.getFechaHoraLlegada());// no se demora en recargar combustible
                    indexEnd = destinos.indexOf(end);
                    if (indexEnd == -1) {
                        indexEnd = 0;
                    }
                    cargaGLPActual += mejorReabastecimiento.operacionCargaGLP();
                    mejorReabastecimiento.setSaldoGLPCamion(cargaGLPActual);
                    mejorReabastecimiento.setSaldoCombustibleCamion(combustibleActual);
                    mejorReabastecimiento.setEstadoCamion(EstadoCamion.EN_RECARGA_COMBUSTIBLE);
                    destinos.add(indexEnd, mejorReabastecimiento);
                    combustibleActual = tipo.getCapCombustibleMax(); //llenar combusitible
                    mejorReabastecimiento.setSaldoCombustibleCamion(combustibleActual);
                    distanciaTotal += mejorReabastecimiento.getRuta().getDistanciaTotal();
                    return insertarNodosIntermediosCargaCombustible(mejorReabastecimiento, end, sistemaPLG);
                }
            }
            return -1;
        } else {
            double combustibleEmpleadoRuta = end.getRuta().getDistanciaTotal() * getPesoTotal() / 180;
            combustibleEmpleado += combustibleEmpleadoRuta;
            combustibleActual -= combustibleEmpleadoRuta;
            distanciaTotal += end.getRuta().getDistanciaTotal();
            cargaGLPActual += end.operacionCargaGLP();
            end.setSaldoGLPCamion(cargaGLPActual);
            end.setSaldoCombustibleCamion(combustibleActual);
            if(end instanceof Reabastecimiento)combustibleActual = tipo.getCapCombustibleMax();
            end.getRuta().setConsumoCombustible(combustibleEmpleadoRuta);
            end.setFechaHoraLlegada(start.getFechaHoraSalida().plusMinutes((long)(end.getRuta().getDistanciaTotal()/tipo.getVelocidadPromedio())));
            end.setFechaHoraSalida(end.getFechaHoraLlegada().plusMinutes((long)end.getTiempoOperacion()));
        }
        return 1;
    }

    private int buscarDestinosIntermediosCargaCombustible(List<Destino> destinos, Destino start,
                                                           Destino end, SistemaPLG sistemaPLG,
                                                            Camion camion){
        if(start.getUbicacion().sonIguales(end.getUbicacion())){return -1;}
        end.getRuta().aStar(start.getUbicacion(), end.getUbicacion(), sistemaPLG, camion.tipo.getVelocidadPromedio(), start.getFechaHoraSalida());
        if(end.getRuta().getNodos()==null)return -1;

        //decidir si va a Cistenna intermedia, a trasvase, directamene a entregar el pedido
        if(camion.calcularDistanciaMaxima() < end.getRuta().getDistanciaTotal()){
            Map<Integer, Double>valuacionesManhattanCisternas = new HashMap<>();
            //buscar una cisterna
            Map<Integer, Integer>cisternasVisitadas = new HashMap<>();
            if(start instanceof Reabastecimiento){
                cisternasVisitadas.put(((Reabastecimiento) start).getCisterna().getId(), 0);
            }
            int indexEnd = 0;
            while ( indexEnd < destinos.size() && !destinos.isEmpty() && destinos.get(indexEnd)!=null && destinos.get(indexEnd) instanceof Reabastecimiento) {
                cisternasVisitadas.put(((Reabastecimiento) destinos.get(indexEnd++)).getCisterna().getId(), 0);
            }
            for(int i = 0; i < sistemaPLG.getCisternas().size(); i++) {
                Cisterna cis = sistemaPLG.getCisternas().get(i);
                if(!cisternasVisitadas.containsKey(cis.getId())) {
                    valuacionesManhattanCisternas.put(i, start.getUbicacion().distanciaManhattan(cis.getUbicacion())+
                            end.getUbicacion().distanciaManhattan(cis.getUbicacion()));
                }
            }
            if(valuacionesManhattanCisternas.isEmpty())return -1;
            List<Map.Entry<Integer, Double>> cisternasOrdenadas = new ArrayList<>(valuacionesManhattanCisternas.entrySet());
            cisternasOrdenadas.sort(Map.Entry.comparingByValue());

            // Recorrer solo las claves ordenadas por el valor
            for (Map.Entry<Integer, Double> entry : cisternasOrdenadas) {
                Integer idCisterna = entry.getKey();
                Reabastecimiento mejorReabastecimiento = new Reabastecimiento();
                mejorReabastecimiento.setCisterna(sistemaPLG.getCisternas().get(idCisterna));
                mejorReabastecimiento.setUbicacion(sistemaPLG.getCisternas().get(idCisterna).getUbicacion());
                mejorReabastecimiento.getRuta().aStar(start.getUbicacion(), mejorReabastecimiento.getUbicacion(), sistemaPLG, tipo.getVelocidadPromedio(), start.getFechaHoraSalida());
                if(mejorReabastecimiento.getRuta().getNodos()!=null){
                    double combustibleEmpleadoRuta = camion.getPesoTotal()*mejorReabastecimiento.getRuta().getDistanciaTotal()/180;
                    mejorReabastecimiento.getRuta().setConsumoCombustible(combustibleEmpleadoRuta);
                    if(camion.combustibleActual<combustibleEmpleadoRuta){return -1;}
                    //saldoCombustible -= combustibleEmpleadoRuta;
                    camion.combustibleActual = camion.tipo.getCapCombustibleMax(); //llenar combusitible
                    camion.combustibleEmpleado += combustibleEmpleadoRuta;
                    camion.distanciaTotal+=mejorReabastecimiento.getRuta().getDistanciaTotal();
                    mejorReabastecimiento.setFechaHoraLlegada(start.getFechaHoraSalida()
                            .plusMinutes((long)(mejorReabastecimiento.getRuta().getDistanciaTotal()/camion.tipo.getVelocidadPromedio())));
                    mejorReabastecimiento.setFechaHoraSalida(mejorReabastecimiento.getFechaHoraLlegada()); //se va al toque
                    camion.cargaGLPActual += mejorReabastecimiento.operacionCargaGLP();
                    mejorReabastecimiento.setSaldoGLPCamion(camion.getCargaGLPActual());
                    mejorReabastecimiento.setSaldoCombustibleCamion(camion.getCombustibleActual());
                    mejorReabastecimiento.setEstadoCamion(EstadoCamion.EN_RECARGA_COMBUSTIBLE);
                    destinos.add(mejorReabastecimiento);
                    return buscarDestinosIntermediosCargaCombustible(destinos, mejorReabastecimiento, end, sistemaPLG, camion);
                }
            }
        }
        else{
            double combustibleEmpleadoRuta = camion.getPesoTotal()*end.getRuta().getDistanciaTotal()/180;
            if(end instanceof Reabastecimiento)camion.combustibleActual = camion.tipo.getCapCombustibleMax();
            else camion.combustibleActual -= combustibleEmpleadoRuta;
            camion.combustibleEmpleado += combustibleEmpleadoRuta;
            end.getRuta().setConsumoCombustible(combustibleEmpleadoRuta);
            end.setFechaHoraLlegada(start.getFechaHoraSalida().plusMinutes((long)end.getRuta().getTiempoEmpleado()));
            // anadir tiempo de operacion
            end.setFechaHoraSalida(end.getFechaHoraLlegada().plusMinutes((long)end.getTiempoOperacion()));
            camion.distanciaTotal+=end.getRuta().getDistanciaTotal();
            camion.cargaGLPActual += end.operacionCargaGLP();
            end.setSaldoGLPCamion(camion.getCargaGLPActual());
            end.setSaldoCombustibleCamion(camion.combustibleActual);
            end.setEstadoCamion(EstadoCamion.EN_RECARGA_COMBUSTIBLE);
            destinos.add(end);
            return 1;
        }
        return 1;
    }

}
