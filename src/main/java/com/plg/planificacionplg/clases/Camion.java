package com.plg.planificacionplg.clases;

import ch.qos.logback.classic.net.SyslogAppender;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Data
@Entity
@Table(name = "camion", indexes = {
    @Index(name = "idx_camion_placa", columnList = "placa"),
    @Index(name = "idx_camion_codigo", columnList = "codigo")
})
public class Camion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @Column(name = "idx_por_tipo")
    private int idxPorTipo;
    
    @Column(name = "codigo", unique = true, length = 20)
    private String codigo;
    
    @Column(name = "placa", unique = true, length = 10)
    private String placa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_camion_id", nullable = false)
    private TipoCamion tipo;
    
    @Column(name = "combustible_actual", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double combustibleActual;
    
    @Column(name = "carga_glp_actual", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double cargaGLPActual;
    
    @Column(name = "peso_total", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double pesoTotal;
    
    @Column(name = "combustible_empleado", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double combustibleEmpleado;
    
    @Column(name = "distancia_total", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double distanciaTotal;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoCamion estado;
    
    @ManyToMany(mappedBy = "camiones", fetch = FetchType.LAZY)
    private List<Pedido> pedidosAsignados;
    
    @OneToMany(mappedBy = "camion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Destino> destinos;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubicacion_actual_id")
    private Nodo ubicacionActual;
    
    @Column(name = "idx_destino_en_curso")
    private int idxDestinoEnCurso;
    
    @OneToMany(mappedBy = "camion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Mantenimiento> mantenimientos;
    
    @OneToMany(mappedBy = "camion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Averia> averias;
    
    @ElementCollection
    @CollectionTable(name = "camion_cargas_glp", joinColumns = @JoinColumn(name = "camion_id"))
    @Column(name = "carga")
    private List<Integer> cargasGLP;
    
    @Column(name = "indice_pedido_actual")
    private Integer indicePedidoActual;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destino_en_curso_id")
    private Destino destinoEnCurso;
    
    public Camion() {
        averias = new ArrayList<>();
        destinos = new ArrayList<>();
        pedidosAsignados = new ArrayList<>();
        cargasGLP = new ArrayList<>();
        mantenimientos = new ArrayList<>();
        combustibleActual = 0.0;
        cargaGLPActual = 0.0;
        pesoTotal = 0.0;
        combustibleEmpleado = 0.0;
        distanciaTotal = 0.0;
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
                //calcular con ruta usando segundos para mayor precisión
                double tiempoEnRutaSegundos = Duration.between(anterior.getFechaHoraSalida(), fechahora).toSeconds();
                double velocidadNodosPorSegundo = tipo.getVelocidadPromedio() / 60.0; // Convertir de nodos/minuto a nodos/segundo
                double distanciaRecorrida = tiempoEnRutaSegundos * velocidadNodosPorSegundo * distanciaManzana;
                return anterior.getSaldoCombustibleCamion() - (distanciaRecorrida * calcularPesoTotal() / 180.0);
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

        if(destinos.isEmpty())return new Nodo(12, 8);
        Destino anterior = destinos.get(0);
        if(anterior.getFechaHoraSalida()==null || destinos.getLast().getFechaHoraLlegada()==null)return new Nodo(12, 8);
        if(fechahora.isBefore(anterior.getFechaHoraSalida()))return anterior.getUbicacion();
        if(anterior.getFechaHoraSalida().equals(fechahora)) {return anterior.getUbicacion();}
        ubicacionActual = anterior.getUbicacion();
        for(int i=1; i<destinos.size(); i++) {
            Destino destino = destinos.get(i);
            if(destino.getFechaHoraLlegada().isAfter(fechahora)) {
                //calcular con ruta usando segundos para mayor precisión
                long tiempoEnRutaSegundos = Duration.between(anterior.getFechaHoraSalida(), fechahora).toSeconds();
                double velocidadNodosPorSegundo = tipo.getVelocidadPromedio() / 60.0; // Convertir de nodos/minuto a nodos/segundo
                double posicionEnRuta = tiempoEnRutaSegundos * velocidadNodosPorSegundo;
                
                // Interpolación entre nodos para movimiento más suave
                if (destino.getRuta() != null && destino.getRuta().getNodos() != null && !destino.getRuta().getNodos().isEmpty()) {
                    List<Nodo> nodos = destino.getRuta().getNodos();
                    int nodoIndex = (int) posicionEnRuta;
                    
                    if (nodoIndex >= nodos.size()) {
                        // Si estamos más allá del último nodo, usar el último nodo
                        ubicacionActual = nodos.get(nodos.size() - 1);
                    } else if (nodoIndex < 0) {
                        // Si estamos antes del primer nodo, usar el primer nodo
                        ubicacionActual = nodos.get(0);
                    } else {
                        // Interpolación entre nodos
                        double fraccion = posicionEnRuta - nodoIndex;
                        
                        if (nodoIndex == nodos.size() - 1) {
                            // Estamos en el último nodo
                            ubicacionActual = nodos.get(nodoIndex);
                        } else {
                            // Interpolación entre nodo actual y siguiente
                            Nodo nodoActual = nodos.get(nodoIndex);
                            Nodo nodoSiguiente = nodos.get(nodoIndex + 1);
                            
                            double xInterpolado = nodoActual.getPosX() + (nodoSiguiente.getPosX() - nodoActual.getPosX()) * fraccion;
                            double yInterpolado = nodoActual.getPosY() + (nodoSiguiente.getPosY() - nodoActual.getPosY()) * fraccion;
                            
                            ubicacionActual = new Nodo(xInterpolado, yInterpolado);
                        }
                    }
                }
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

    public int construirRutaHaciaPedido(int code, SistemaPLG sistemaPLG) {
        Destino destinoInicial = destinos.get(0);
        int pedidosCant = destinos.size();
        int cantNodosInicial=pedidosCant, index = 0;


        if(pedidosCant == 2) {
            if (destinos.getFirst().getUbicacion().sonIguales(destinos.getLast().getUbicacion())) {
                return -5;
            }
            if(insertarNodosIntermediosCargaCombustible(destinos.getFirst(), destinos.getLast(), sistemaPLG, 0)==-1)return -4;
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
                if(insertarNodosIntermediosCargaCombustible(destinoInicial, destinoFinal, sistemaPLG, 0)==-1)return -4;
            } else if (resultadoNodosIntermedios == -1) {
                //System.out.println(pedidosCant-2+"?? 1: "+destinoInicial.getUbicacion()+" 2: "+destinoFinal.getUbicacion());
                return -3; // no se puede llegar a pedidoDestino solucion No Valida
            }

            if(destinoFinal instanceof EntregaPedido &&
                    destinoFinal.getFechaHoraLlegada()
                            .isAfter(destinoFinal.getPedido().getFechaHoraMaxEntrega())){
                //if(code != 3)return -1; //pedido con retraso
                if(sistemaPLG.getFechaHoraPrimerColapso() == null
                        || sistemaPLG.getFechaHoraPrimerColapso().isAfter(destinoFinal.getPedido().getFechaHoraMaxEntrega())){
                    sistemaPLG.setFechaHoraPrimerColapso(destinoFinal.getPedido().getFechaHoraMaxEntrega());
                    destinoFinal.getPedido().setCamiones(new ArrayList<>());
                    destinoFinal.getPedido().getCamiones().add(this);
                    sistemaPLG.setDestinoColapso(destinoFinal);
                }

            }
            if(destinoFinal.getRuta().getNodos()==null)return -2;


            if(destinoFinal instanceof EntregaPedido){
                destinoFinal.getPedido().setFechaHoraEntrega(destinoFinal.getFechaHoraLlegada());
            }

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

            if(tipo.getCargaGLPMax()<faltanteGLP){
                return -1;}
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
            int tope = 0;
            if(mejorCisterna*2==canditatos.size()){
                tope = canditatos.size();
            }
            int idxCamPrueba = canditatos.size()/2;
            if(canditatos.size()%2!=0)System.out.println("############################################Cantidad erronea############################################");
            for(int j=0; j<sistemaPLG.getCamionesAveriados().size(); j++){
                Trasvase trasvase = new Trasvase();
                int resultadoNodosIntermedios;
                Camion camionAveriado = sistemaPLG.getCamionesAveriados().get(j);
                if(faltanteGLP>camionAveriado.getCargaGLPActual() || !(camionAveriado.getDestinos().getFirst() instanceof Replanficacion)){continue;}
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
                idxCamPrueba++;

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

    private int insertarNodosIntermediosCargaCombustible(Destino start, Destino end, SistemaPLG sistemaPLG, int intentos) { //reformular
        //que no se repita el nodo Reabastecimiento entre dos pedidos
        //distancia manhatan que te deja mas cerca del otro pedido, no repetir nodo cisterna entre dos pedidos
        intentos++;
        if(intentos==5){return -1;}
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
                    return insertarNodosIntermediosCargaCombustible(mejorReabastecimiento, end, sistemaPLG, intentos);
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
            if(end instanceof Reabastecimiento)
                end.setEstadoCamion(EstadoCamion.EN_RECARGA_COMBUSTIBLE);
            destinos.add(end);
            return 1;
        }
        return 1;
    }

    /**
     * Deep copy all fields from 'otro' into this instance.
     */
    public void deepCopy(Camion otro) {
        this.id = otro.id;
        this.idxPorTipo = otro.idxPorTipo;
        this.codigo = otro.codigo;
        this.placa = otro.placa;
        this.tipo = otro.tipo;
        this.combustibleActual = otro.combustibleActual;
        this.cargaGLPActual = otro.cargaGLPActual;
        this.pesoTotal = otro.pesoTotal;
        this.combustibleEmpleado = otro.combustibleEmpleado;
        this.distanciaTotal = otro.distanciaTotal;
        this.estado = otro.estado;
//        this.pedidosAsignados = new ArrayList<>();
//        if (otro.pedidosAsignados != null) {
//            this.pedidosAsignados.addAll(otro.pedidosAsignados); // Shallow copy, as Pedido is likely shared
//        }
        this.destinos = otro.destinos;
//        this.destinos = new ArrayList<>();
//        if (otro.destinos != null) {
//            for (Destino destino : otro.destinos) {
//                this.destinos.add(destino != null ? destino.copiar() : null);
//            }
//        }
        this.ubicacionActual = otro.ubicacionActual;
        this.idxDestinoEnCurso = otro.idxDestinoEnCurso;
        this.mantenimientos = (otro.mantenimientos != null) ? new ArrayList<>(otro.mantenimientos) : null;
        this.averias = (otro.averias != null) ? new ArrayList<>(otro.averias) : null;
        //this.cargasGLP = (otro.cargasGLP != null) ? new ArrayList<>(otro.cargasGLP) : null;
        this.indicePedidoActual = otro.indicePedidoActual;
        this.destinoEnCurso = (otro.destinoEnCurso != null) ? otro.destinoEnCurso.copiar() : null;
    }

}
