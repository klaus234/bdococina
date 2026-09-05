/*
    BDO - Calculadora de Cocina
    Hermana de bdoalquimia. La lista de ingredientes tiene dos vistas
    (árbol e ingredientes puros), los materiales sustituibles muestran su
    grupo con la marca ↻ y cada ingrediente puro trae de dónde sale.

    TODO:
    - Guardar recetas favoritas.
*/

console.log("v 1.0.0");

function crearSelectoresNumero(input, etiqueta) {
    input.classList.add("numero_con_selectores");
    const controles = document.createElement("span");
    controles.className = "selectores_numero";
    const nombre = input.getAttribute("aria-label") || etiqueta || "cantidad";
    if (!input.hasAttribute("aria-label")) input.setAttribute("aria-label", nombre);
    [1, -1].forEach(function (direccion) {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = direccion > 0 ? "▲" : "▼";
        boton.setAttribute("aria-label", (direccion > 0 ? "Aumentar " : "Disminuir ") + nombre);
        boton.addEventListener("click", function () {
            if (input.disabled || input.readOnly) return;
            const anterior = input.value;
            if (direccion > 0) input.stepUp();
            else input.stepDown();
            if (input.value !== anterior) {
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
            }
        });
        controles.append(boton);
    });
    return controles;
}
let rdata;
let inglist = [];

const calidad_ing = [1, 3, 5];

let gpeso = 0;
let ingredientesbase = {};

const baseurl = window.location.href;

let modoseleccion = false;
let anteriorseleccion = -1;
let selectactual_recetas = -1;
let lista_recetas_ul;
let currentingrediente;
let calidades = {
    "normal": 0,
    "verde": 1,
    "azul": 2
}

function esReceta(id) {
    return rdata["recetas"][id] != undefined;
}

/* -----------------------------------------------------------------
   Grupos de materiales
   -----------------------------------------------------------------
   Un ingrediente con `grupo` acepta cualquier ítem de su grupo del
   juego. Acá los grupos se guardan con una etiqueta genérica
   ("Vegetales", "Carne (1)"), así que `miembros` lista los ítems
   concretos que sirven con su equivalencia:

       v = cuántas unidades comunes cubre ese ítem

   Los comunes van 1 a 1 entre sí; los "de Calidad" cubren 6 y los
   "de Alta Calidad" 36. `vc` guarda el "Valor" crudo de bdocodex
   cuando no coincide, para poder contrastarlo.
   ----------------------------------------------------------------- */

function tieneMiembros(clave) {
    const d = rdata["datos"][clave];
    return d["miembros"] != undefined && d["miembros"].length > 0;
}

function crearMarcaGrupo(clave) {
    const m = document.createElement("span");
    m.className = "marca_grupo";
    m.innerText = "↻";
    if (clave != undefined && tieneMiembros(clave)) {
        m.classList.add("desplegable");
        m.title = "Ver los " + rdata["datos"][clave]["miembros"].length + " ítems de su grupo";
    } else {
        m.title = "Sustituible por cualquier ítem de su grupo";
    }
    return m;
}

/* Cuántas unidades de un sustituto hacen falta en total.
   La sustitución se resuelve POR ELABORACIÓN: en el juego cada plato
   consume sus propios ingredientes y lo que sobra de un ítem que cubre
   varias unidades se pierde, no queda para el siguiente. Si la receta
   pide 5 cereales, un Trigo de Calidad (cubre 6) alcanza para esa
   cocinada y nada más: para 100 cocinadas hacen falta 100, no 84. */
function unidadesSustituto(usos, v) {
    let total = 0;
    for (let u of usos) {
        total += u["veces"] * Math.ceil(u["q"] / v);
    }
    return Math.ceil(total);
}

function llenarPanelGrupo(panel) {
    const clave = panel.bdoclave;
    const datos = rdata["datos"][clave];
    const miembros = datos["miembros"];
    const usos = panel.bdousos() || [];

    panel.innerHTML = "";

    const tit = document.createElement("div");
    tit.className = "panel_grupo_tit";
    tit.innerText = "Grupo #" + datos["gid"] + " · sirve cualquiera de estos";
    panel.append(tit);

    const ul = document.createElement("ul");
    for (let m of miembros) {
        const li = document.createElement("li");
        if (m["propio"])
            li.className = "propio";

        const nom = document.createElement("span");
        nom.className = "mg_nombre";
        nom.innerText = m["t"];

        const cant = document.createElement("span");
        cant.className = "mg_cant";
        cant.innerText = "x" + formatearMilesAR(unidadesSustituto(usos, m["v"]));
        cant.title = m["v"] > 1
            ? "1 cubre " + m["v"] + " unidades comunes; lo que sobra en una cocinada se pierde"
            : "Se cambia 1 a 1 con el resto de los comunes";
        if (m["vc"] != undefined)
            cant.title += " · bdocodex le pone Valor " + m["vc"];

        li.append(nom);
        li.append(cant);
        ul.append(li);
    }
    panel.append(ul);

    const nota = document.createElement("div");
    nota.className = "panel_grupo_nota";
    nota.innerText = "Los comunes se cambian 1 a 1. Se gasta por cocinada: lo que sobra de un ítem que cubre varias unidades no pasa a la siguiente.";
    panel.append(nota);
}

/* Cuelga la marca ↻ de `dondeMarca` y, si hay miembros, el panel
   desplegable de `dondePanel`. `obtenerUsos` devuelve [{q, veces}, ...]
   y se evalúa cada vez que se refresca el panel. */
function montarGrupo(dondeMarca, dondePanel, clave, obtenerUsos) {
    if (!rdata["datos"][clave]["grupo"])
        return;

    const marca = crearMarcaGrupo(clave);
    dondeMarca.append(marca);

    if (!tieneMiembros(clave))
        return;

    const panel = document.createElement("div");
    panel.className = "panel_grupo oculto";
    panel.bdoclave = clave;
    panel.bdousos = obtenerUsos;
    dondePanel.append(panel);

    marca.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const abierto = !panel.classList.contains("oculto");
        if (abierto) {
            panel.classList.add("oculto");
            marca.classList.remove("abierta");
        } else {
            llenarPanelGrupo(panel);
            panel.classList.remove("oculto");
            marca.classList.add("abierta");
        }
    });
}

/* Los paneles abiertos de la lista principal siguen a los inputs de cantidad. */
function refrescarPanelesGrupo() {
    document.querySelectorAll("#ingredientes .panel_grupo").forEach(function (p) {
        if (!p.classList.contains("oculto"))
            llenarPanelGrupo(p);
    });
}

/* Métodos verificados por ingrediente; el precio del Codex no implica venta NPC. */
const OBTENCION = {
    recoleccion: { icono: "⛏", label: "Recolección" },
    cultivo: { icono: "🌱", label: "Cultivo" },
    pesca: { icono: "🎣", label: "Pesca" },
    caza: { icono: "🏹", label: "Caza" },
    botin: { icono: "⚔", label: "Botín" },
    nodos: { icono: "⚒", label: "Nodos" },
    npc: { icono: "🏪", label: "Tienda NPC" },
    procesamiento: { icono: "⚙", label: "Procesamiento" },
    cocina: { icono: "🍳", label: "Subproducto" },
    mercado: { icono: "⚖", label: "Mercado" }
};

function crearIconoObtencion(tipo) {
    const metodo = OBTENCION[tipo];
    const badge = document.createElement("span");
    badge.className = "badge_obtencion obtencion_" + tipo;
    badge.title = metodo.label;
    const icono = document.createElement("span");
    icono.setAttribute("aria-hidden", "true");
    icono.textContent = metodo.icono;
    badge.append(icono, document.createTextNode(metodo.label));
    return badge;
}

function crearObtencion(clave) {
    const dato = rdata["datos"][clave];
    const info = dato.obtencion;
    const detalles = document.createElement("details");
    detalles.className = "obtencion";
    const resumen = document.createElement("summary");
    resumen.setAttribute("aria-label", "Cómo obtener " + dato.titulo);
    resumen.title = "Ver métodos de obtención y fuentes de " + dato.titulo;
    if (info && info.metodos.length) {
        for (const tipo of info.metodos) {
            if (OBTENCION[tipo] != undefined)
                resumen.append(crearIconoObtencion(tipo));
        }
    } else {
        resumen.textContent = "ⓘ Obtención sin verificar";
    }
    const texto = document.createElement("p");
    texto.textContent = info ? info.detalle : "Todavía no hay métodos verificados para este ingrediente.";
    detalles.append(resumen, texto);
    if (info) {
        for (const fuente of info.fuentes) {
            const enlace = document.createElement("a");
            enlace.href = fuente;
            enlace.target = "_blank";
            enlace.rel = "noopener noreferrer";
            enlace.textContent = fuente.includes("materialgroup") ? "Grupo en BDO Codex ↗" : "BDO Codex ↗";
            detalles.append(enlace);
        }
    }
    return detalles;
}

/* La lista de ingredientes tiene dos vistas: el árbol anidado y la lista
   plana de ingredientes puros (los que no salen de ninguna receta: se
   compran, se recolectan, se cultivan...). */
let vistaBaseActual = "arbol";

function cambiarVistaBase(vista) {
    vistaBaseActual = vista;

    const btnArbol = document.getElementById("tab_arbol");
    const btnPuros = document.getElementById("tab_puros");
    btnArbol.classList.toggle("activo", vista == "arbol");
    btnPuros.classList.toggle("activo", vista == "puros");

    document.getElementById("ingredientes_base").classList.toggle("oculto", vista != "arbol");
    document.getElementById("ingredientes_puros").classList.toggle("oculto", vista != "puros");

    filtrarIngredientesBase();
}

function filtrarIngredientesPuros(texto) {
    document.querySelectorAll("#ingredientes_puros .ingrediente_puro").forEach(item => {
        const spanTitulo = item.querySelector(".titing");
        const coincide = texto.trim() === "" ||
            (spanTitulo && spanTitulo.textContent.toLowerCase().includes(texto));
        item.style.display = coincide ? "" : "none";
    });
}

function filtrarIngredientesBase() {
    const texto = document.getElementById("buscador_ingredientes").value.toLowerCase();

    if (vistaBaseActual == "puros") {
        filtrarIngredientesPuros(texto);
        return;
    }

    const items = document.querySelectorAll("#ingredientes_base .ingrediente_item");
    
    // First, reset all
    items.forEach(item => {
        item.style.display = "";
        item.classList.remove("match_found");
        item.classList.remove("child_of_match");
    });
    
    if (texto.trim() === "") return;
    
    // Mark items that match directly
    items.forEach(item => {
        // Enforce checking only the direct title of this item, 
        // which is inside the immediate .ing_contenedor so we don't accidentally match sub-items.
        // Actually .titing is the class. We can use scoped query or just the first .titing
        const spanTitulo = item.querySelector(".titing");
        if (spanTitulo && spanTitulo.textContent.toLowerCase().includes(texto)) {
            item.classList.add("match_found");
        } else {
            item.style.display = "none";
        }
    });

    // Mark children of matched items so they are also visible
    items.forEach(item => {
        if (item.classList.contains("match_found")) {
            const children = item.querySelectorAll(".ingrediente_item");
            children.forEach(child => {
                child.classList.add("child_of_match");
            });
        }
    });
    
    // Unhide parents of matching items and children of matching items
    items.forEach(item => {
        if (item.classList.contains("match_found") || item.classList.contains("child_of_match")) {
            item.style.display = "";
            let parent = item.parentElement.closest(".ingrediente_item");
            while (parent) {
                parent.style.display = "";
                // Expand parent if it has a button
                const btn = parent.querySelector(":scope > .ing_wrapper > .ing_contenedor > .btn_expand") || 
                            parent.querySelector(".ing_wrapper > .ing_contenedor > .btn_expand");
                if (btn && btn.getAttribute("data-expanded") === "false") {
                    btn.click();
                }
                parent = parent.parentElement.closest(".ingrediente_item");
            }
        }
    });
}

/* Barra de avance encima de la lista de puros. */
function crearCabeceraProgreso() {
    const li = document.createElement("li");
    li.className = "progreso_puros";

    const txt = document.createElement("span");
    txt.id = "progreso_puros_txt";
    txt.className = "progreso_puros_txt";

    const barra = document.createElement("span");
    barra.className = "b_base b_contenedor progreso_puros_cont";
    const relleno = document.createElement("span");
    relleno.id = "progreso_puros_barra";
    relleno.className = "b_base b_usado";
    relleno.style = "width: 0%;";
    barra.append(relleno);

    const btn = document.createElement("button");
    btn.className = "btn_limpiar_tildes";
    btn.innerText = "Vaciar todo";
    btn.title = "Pone en cero lo juntado de todos los ingredientes";
    btn.addEventListener("click", function () {
        tenidos = {};
        document.querySelectorAll("#ingredientes_puros .ingrediente_puro").forEach(function (el) {
            el.querySelector(".chk_puro").checked = false;
            el.querySelector(".inp_tengo").value = 0;
            el.classList.remove("completado");
            el.classList.remove("parcial");
        });
        actualizarProgresoPuros();
    });

    li.append(txt);
    li.append(barra);
    li.append(btn);
    return li;
}

function actualizarProgresoPuros() {
    const items = document.querySelectorAll("#ingredientes_puros .ingrediente_puro");
    const total = items.length;
    let hechos = 0;
    let avance = 0;

    items.forEach(function (el) {
        const nec = el.bdonecesario || 0;
        const tengo = cantidadTenida(el.bdoclave, nec);
        if (nec > 0 && tengo >= nec) hechos++;
        /* cada ingrediente pesa igual: si no, los que se piden de a 60
           taparían por completo a los que se piden de a 1 */
        if (nec > 0) avance += Math.min(tengo, nec) / nec;
    });

    const pct = total > 0 ? Math.round(avance * 100 / total) : 0;

    const tab = document.getElementById("tab_puros");
    if (tab != null)
        tab.innerText = total > 0
            ? "Ingredientes puros (" + hechos + "/" + total + ")"
            : "Ingredientes puros";

    const barra = document.getElementById("progreso_puros_barra");
    const txt = document.getElementById("progreso_puros_txt");
    if (barra != null) barra.style = "width: " + pct + "%;";
    if (txt != null) txt.innerText = hechos + " de " + total + " completos · " + pct + "%";
}

/* ¿`clave` cuelga en algún lado del árbol de `recetaId`? No sirve mirar
   cuánto se consume con 1 cocinada: el árbol divide por el ratio con
   Math.floor, así que con cantidades chicas las ramas hondas dan 0. */
function perteneceAlArbol(recetaId, clave, visitados) {
    if (visitados == undefined) visitados = {};
    if (visitados[recetaId]) return false;
    visitados[recetaId] = true;
    const ingredientes = rdata["recetas"][recetaId];
    for (let ingId of Object.keys(ingredientes)) {
        if (ingId === clave) return true;
        if (esReceta(ingId) && perteneceAlArbol(ingId, clave, visitados)) return true;
    }
    return false;
}

/* Invertir el mismo árbol que se muestra, incluidos sus redondeos por
   rama. Una proporción directa falla cuando un material aparece en
   varias subrecetas. */
function cocinadasConIngrediente(recetaId, clave, disponible) {
    if (!Number.isSafeInteger(disponible) || disponible < 0)
        throw new RangeError("Ingresá una cantidad entera, positiva o cero.");
    if (esReceta(clave) || !perteneceAlArbol(recetaId, clave))
        throw new Error("El ingrediente no pertenece a esta receta.");
    const consumo = function (cantidad) {
        const totales = {};
        acumularTotalesArbol(recetaId, cantidad, 0, totales);
        return totales[clave] || 0;
    };
    if (disponible === 0) return 0;
    let minimo = 0;
    let maximo = 1;
    while (consumo(maximo) <= disponible) {
        minimo = maximo;
        if (maximo === Number.MAX_SAFE_INTEGER) return maximo;
        maximo = Math.min(maximo * 2, Number.MAX_SAFE_INTEGER);
    }
    while (maximo - minimo > 1) {
        const medio = minimo + Math.floor((maximo - minimo) / 2);
        if (consumo(medio) <= disponible) minimo = medio;
        else maximo = medio;
    }
    return minimo;
}

function crearCantidadPuro(clave, necesario) {
    const contenedor = document.createElement("span");
    contenedor.className = "cantcing";
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "cantcing_local cantidad_puro_editable";
    boton.textContent = "x" + formatearMilesAR(necesario);
    boton.title = "Doble clic para ajustar toda la receta usando esta cantidad";
    boton.setAttribute("aria-label", "Ajustar receta según " + rdata["datos"][clave].titulo + ": " + necesario);
    contenedor.append(boton);
    const editar = function () {
        if (contenedor.querySelector("input")) return;
        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "numeric";
        input.className = "editar_cantidad_puro";
        input.value = necesario;
        input.setAttribute("aria-label", "Cantidad para recalcular con " + rdata["datos"][clave].titulo);
        input.title = "Enter o salir del campo: aplicar. Escape: cancelar. Se usan cocinadas completas.";
        boton.hidden = true;
        contenedor.append(input);
        input.focus();
        input.select();
        let terminado = false;
        const cancelar = function () {
            terminado = true;
            input.remove();
            boton.hidden = false;
            boton.focus({ preventScroll: true });
        };
        const confirmar = function () {
            if (terminado) return;
            const texto = input.value.trim();
            const valor = Number(texto.replace(/\./g, ""));
            if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(texto) || !Number.isSafeInteger(valor)) {
                input.setCustomValidity("Ingresá un entero positivo o cero, por ejemplo 1000 o 1.000.");
                input.reportValidity();
                return;
            }
            if (valor === necesario) { cancelar(); return; }
            const cantidad = cocinadasConIngrediente(currentingrediente, clave, valor);
            terminado = true;
            const abiertos = Array.from(document.querySelectorAll(".ingrediente_puro .obtencion[open]"))
                .map(el => el.closest(".ingrediente_puro").bdoclave);
            const inpCantidad = document.getElementById("cantidad");
            inpCantidad.value = cantidad;
            inpCantidad.dispatchEvent(new Event("input"));
            generarListaIngredientes();
            document.querySelectorAll(".ingrediente_puro").forEach(el => {
                if (abiertos.includes(el.bdoclave)) el.querySelector(".obtencion").open = true;
                if (el.bdoclave === clave) {
                    el.querySelector(".cantidad_puro_editable").focus({ preventScroll: true });
                    const aviso = document.getElementById("aviso_recalculo_puro");
                    aviso.textContent = formatearMilesAR(cantidad) + " cocinadas: se necesitan " +
                        formatearMilesAR(el.bdonecesario) + " de " + rdata["datos"][clave].titulo +
                        " de las " + formatearMilesAR(valor) + " indicadas.";
                }
            });
        };
        input.addEventListener("input", () => input.setCustomValidity(""));
        input.addEventListener("blur", confirmar);
        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                if (e.key === "Escape") cancelar();
                else confirmar();
            }
        });
    };
    boton.addEventListener("dblclick", editar);
    boton.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); editar(); }
    });
    return contenedor;
}

/* Lista plana con lo que hay que conseguir de verdad: las hojas del
   árbol, es decir todo lo que NO es una receta. Las cantidades son los
   totales ya acumulados de todas las ramas. */
function crearListaPuros(totalesGlobales, usosGlobales) {
    const ul = document.createElement("ul");
    ul.className = "lista_puros";

    const puros = Object.keys(totalesGlobales)
        .filter(k => !esReceta(k))
        .sort((a, b) => rdata["datos"][a]["titulo"].localeCompare(rdata["datos"][b]["titulo"], "es"));

    for (let k of puros) {
        const li = document.createElement("li");
        li.className = "ingrediente_puro";
        const necesario = Math.ceil(totalesGlobales[k]);
        li.bdoclave = k;
        li.bdonecesario = necesario;

        /* el tilde es el atajo de "ya lo tengo todo"; el input de al lado
           es para ir anotando lo que juntás. Los dos escriben en
           `tenidos`, que es lo único que se guarda. */
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.className = "chk_puro";
        chk.id = "chk_" + k;
        chk.title = "Marcar como conseguido del todo";
        chk.setAttribute("aria-label", "Marcar " + rdata["datos"][k].titulo + " como conseguido");
        li.append(chk);

        const span_contenedor = document.createElement("span");
        span_contenedor.className = "ing_contenedor";

        const span_titulo = document.createElement("span");
        span_titulo.className = "ing_titulo_ingrediente";
        span_titulo.innerHTML = `<span class="titing">${rdata["datos"][k]["titulo"]}</span>`;

        span_contenedor.append(span_titulo);
        span_contenedor.append(crearCantidadPuro(k, necesario));
        li.append(span_contenedor);

        const tengoWrap = document.createElement("span");
        tengoWrap.className = "tengo_wrap";

        const inpTengo = document.createElement("input");
        inpTengo.type = "number";
        inpTengo.className = "inp_tengo";
        inpTengo.min = 0;
        inpTengo.value = cantidadTenida(k, necesario);
        inpTengo.setAttribute("aria-label", "Cantidad conseguida de " + rdata["datos"][k].titulo);

        const nec = document.createElement("span");
        nec.className = "nec_txt";
        nec.innerText = "/ " + formatearMilesAR(necesario);

        tengoWrap.append(inpTengo);
        tengoWrap.append(crearSelectoresNumero(inpTengo));
        tengoWrap.append(nec);
        li.append(tengoWrap);
        li.append(crearObtencion(k));

        /* después del contador, para que el panel de sustitutos quede
           último y ocupe su propio renglón debajo de toda la fila. Acá el
           ingrediente puede venir de varias ramas, así que van todos sus usos. */
        montarGrupo(span_contenedor, li, k, function () { return usosGlobales[k] || []; });

        const sincronizar = function () {
            const tengo = cantidadTenida(k, necesario);
            const completo = necesario > 0 && tengo >= necesario;
            chk.checked = completo;
            li.classList.toggle("completado", completo);
            li.classList.toggle("parcial", !completo && tengo > 0);
            const falta = Math.max(0, necesario - tengo);
            inpTengo.title = falta > 0 ? "Faltan " + formatearMilesAR(falta) : "Completo";
        };

        inpTengo.addEventListener("input", function () {
            let n = parseInt(this.value, 10);
            if (!isFinite(n) || n < 0) n = 0;
            tenidos[k] = n;
            sincronizar();
            actualizarProgresoPuros();
        });

        chk.addEventListener("change", function () {
            tenidos[k] = this.checked ? necesario : 0;
            inpTengo.value = tenidos[k];
            sincronizar();
            actualizarProgresoPuros();
        });

        sincronizar();
        ul.append(li);
    }

    return { ul: ul, cantidad: puros.length };
}

function generarListaIngredientes() {
    const ulingredientes = document.getElementById("ingredientes_base");
    const ulpuros = document.getElementById("ingredientes_puros");
    ulingredientes.innerHTML = "";
    ulpuros.innerHTML = "";

    const buscadorIngredientes = document.getElementById("buscador_ingredientes");
    if (buscadorIngredientes) {
        buscadorIngredientes.style.display = "";
        buscadorIngredientes.removeEventListener("input", filtrarIngredientesBase);
        buscadorIngredientes.addEventListener("input", filtrarIngredientesBase);
    }

    const cantidad = parseFloat(document.getElementById("cantidad").value) || 0;
    const totalesGlobales = {};
    const usosGlobales = {};
    acumularTotalesArbol(currentingrediente, cantidad, 0, totalesGlobales, usosGlobales);

    const ul = crearArbolIngredientes(currentingrediente, cantidad, 0, totalesGlobales);
    ulingredientes.append(ul);

    /* las dos vistas se arman juntas y se muestra la que esté activa */
    const puros = crearListaPuros(totalesGlobales, usosGlobales);
    ulpuros.append(crearCabeceraProgreso());
    const ayudaEdicion = document.createElement("li");
    ayudaEdicion.className = "ayuda_obtencion";
    ayudaEdicion.textContent = "Doble clic en una cantidad amarilla para recalcular toda la receta con ese ingrediente. Enter aplica y Escape cancela. Lo que ya conseguiste se conserva.";
    const avisoRecalculo = document.createElement("li");
    avisoRecalculo.id = "aviso_recalculo_puro";
    avisoRecalculo.className = "aviso_recalculo_puro";
    avisoRecalculo.setAttribute("role", "status");
    ulpuros.append(ayudaEdicion, avisoRecalculo);
    const ayudaObtencion = document.createElement("li");
    ayudaObtencion.className = "ayuda_obtencion";
    ayudaObtencion.textContent = "Cómo conseguirlos · Tocá los íconos para ver detalles y fuentes. Pueden tener varios métodos. Mercado = compra a otros jugadores, según disponibilidad. Los métodos corresponden al ítem indicado; los sustitutos pueden variar.";
    ulpuros.append(ayudaObtencion);
    ulpuros.append(puros.ul);
    actualizarProgresoPuros();

    if (buscadorIngredientes && buscadorIngredientes.value.trim() !== "") {
        filtrarIngredientesBase();
    }
}

function generarListaIngredientesSiHay() {
    if (document.querySelector("#ingredientes_base .ingrediente_item") != null)
        generarListaIngredientes();
}

function obtenerRatioSeguro() {
    const ratioL = parseFloat(document.getElementById("ratio").value);
    if (!isFinite(ratioL) || ratioL <= 0) {
        return 1;
    }
    return ratioL;
}

function formatearMilesAR(numero) {
    const valor = Math.floor(Number(numero) || 0);
    return valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function crearSpanCantidad(cantidadLocal, cantidadTotalGlobal) {
    const spanCant = document.createElement("span");
    spanCant.className = "cantcing";

    const spanLocal = document.createElement("span");
    spanLocal.className = "cantcing_local";
    spanLocal.textContent = "x" + formatearMilesAR(cantidadLocal);
    spanCant.append(spanLocal);

    if (cantidadTotalGlobal > cantidadLocal) {
        const spanTotal = document.createElement("span");
        spanTotal.className = "cantcing_total";
        spanTotal.textContent = " (" + formatearMilesAR(cantidadTotalGlobal) + " total)";
        spanCant.append(spanTotal);
    }

    return spanCant;
}

/* Además del total, anota cada "uso": cuántas unidades pide la receta por
   cocinada y cuántas veces se cocina. Un mismo ingrediente puede entrar
   por varias ramas con cantidades distintas, y los sustitutos de grupo se
   calculan por cocinada, no sobre el total. */
function acumularTotalesArbol(recetaId, cantidad, nivel, totalesGlobales, usosGlobales) {
    const ingredientes = rdata["recetas"][recetaId];
    const keysLista = Object.keys(ingredientes).sort();

    let cantidad_cocinadas;
    if (nivel === 0) {
        cantidad_cocinadas = cantidad;
    } else {
        const ratioL = obtenerRatioSeguro();
        cantidad_cocinadas = Math.floor(cantidad / ratioL);
    }

    for (let ingId of keysLista) {
        const porCocinada = Number(ingredientes[ingId]);
        const cantidad_ing = Math.floor(cantidad_cocinadas * porCocinada);
        if (!totalesGlobales[ingId]) {
            totalesGlobales[ingId] = 0;
        }
        totalesGlobales[ingId] += cantidad_ing;

        if (usosGlobales != undefined) {
            if (!usosGlobales[ingId]) usosGlobales[ingId] = [];
            usosGlobales[ingId].push({ "q": porCocinada, "veces": cantidad_cocinadas });
        }

        if (ingId in rdata["recetas"]) {
            acumularTotalesArbol(ingId, cantidad_ing, nivel + 1, totalesGlobales, usosGlobales);
        }
    }
}

function crearArbolIngredientes(recetaId, cantidad, nivel, totalesGlobales) {
    const ul = document.createElement("ul");
    ul.className = "ingredientes_arbol nivel_" + nivel;
    
    const ingredientes = rdata["recetas"][recetaId];
    const keysLista = Object.keys(ingredientes).sort();
    
    // 1. Calcular cuántas "cocinadas" necesitamos de esta receta
    let cantidad_cocinadas;
    if (nivel === 0) {
        // En el primer nivel, la cantidad que ingresó el usuario son las cocinadas
        cantidad_cocinadas = cantidad;
    } else {
        // En sub-niveles, 'cantidad' es el número de ÍTEMS que necesitamos.
        // Lo dividimos por el ratio para saber cuántas veces hay que cocinar.
        const ratioL = obtenerRatioSeguro();
        cantidad_cocinadas = Math.floor(cantidad / ratioL);
    }
    
    for (let ingId of keysLista) {
        const li = document.createElement("li");
        li.className = "ingrediente_item";
        
        const esReceta = ingId in rdata["recetas"];
        
        // 2. La cantidad total del ingrediente es simplemente:
        // (Veces que cocino la receta padre) * (Lo que me pide la receta)
        let cantidad_ing = Math.floor(cantidad_cocinadas * ingredientes[ingId]);
        const cantidad_total_global = Math.floor(totalesGlobales[ingId] || 0);
        
        const span_contenedor = document.createElement("span");
        span_contenedor.className = "ing_contenedor";
        
        if (esReceta) {
            const btnExpand = document.createElement("button");
            btnExpand.className = "btn_expand";
            btnExpand.textContent = "▼";
            btnExpand.setAttribute("data-expanded", "true");
            
            const divContenedor = document.createElement("div");
            divContenedor.className = "ing_wrapper";
            
            const span_titulo = document.createElement("span");
            span_titulo.className = "ing_titulo_receta";
            span_titulo.innerHTML = `<span class="titing">${rdata["datos"][ingId]["titulo"]}</span>`;
            
            const span_cant = crearSpanCantidad(cantidad_ing, cantidad_total_global);
            
            btnExpand.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                const expanded = btnExpand.getAttribute("data-expanded") === "true";
                const subArbol = divContenedor.querySelector(".ingredientes_arbol");
                
                if (expanded) {
                    subArbol.classList.add("oculto");
                    btnExpand.textContent = "▶";
                    btnExpand.setAttribute("data-expanded", "false");
                } else {
                    subArbol.classList.remove("oculto");
                    btnExpand.textContent = "▼";
                    btnExpand.setAttribute("data-expanded", "true");
                }
            });
            
            span_contenedor.append(btnExpand);
            span_contenedor.append(span_titulo);
            span_contenedor.append(span_cant);
            
            // Aquí pasamos la cantidad_ing (que ahora representa correctamente 
            // la cantidad de ÍTEMS que necesitamos de esta sub-receta)
            const subArbol = crearArbolIngredientes(ingId, cantidad_ing, nivel + 1, totalesGlobales);
            
            divContenedor.append(span_contenedor);
            divContenedor.append(subArbol);
            
            li.append(divContenedor);
        } else {
            const span_titulo = document.createElement("span");
            span_titulo.className = "ing_titulo_ingrediente";
            span_titulo.innerHTML = `<span class="titing">${rdata["datos"][ingId]["titulo"]}</span>`;
            
            const span_cant = crearSpanCantidad(cantidad_ing, cantidad_total_global);

            span_contenedor.append(span_titulo);
            span_contenedor.append(span_cant);
            li.append(span_contenedor);
            montarGrupo(span_contenedor, li, ingId, function () {
                return [{ "q": Number(ingredientes[ingId]), "veces": cantidad_cocinadas }];
            });
        }

        ul.append(li);
    }
    
    return ul;
}

function rAgregarABase(cingrediente, cantidad) {
    const listaingL = Object.keys(rdata["recetas"][cingrediente]);
    for (let iL of listaingL) {
        if (iL in rdata["recetas"]) {
            let ratioL = document.getElementById("ratio").value;
            let cantidadL = Math.floor((cantidad * rdata["recetas"][cingrediente][iL]) / ratioL)
            rAgregarABase(iL, cantidadL); 
        } else {
            

            if (!ingredientesbase[iL])
                ingredientesbase[iL] = cantidad * rdata["recetas"][cingrediente][iL];
            else
                ingredientesbase[iL] += cantidad * rdata["recetas"][cingrediente][iL];
        }
    }
}

/* El enlace lleva la cantidad pedida y el ratio, así la pestaña nueva
   abre la sub-receta con el mismo contexto. */
function enlaceReceta(id, total) {
    const ratio = document.getElementById("ratio");
    let url = "?id=" + id;
    if (total != undefined)
        url += "&t=" + total;
    if (ratio != null)
        url += "&r=" + ratio.value;
    return url;
}

function recalcularTodo() {
    const cantidad = document.getElementById("cantidad");
    cantidad.dispatchEvent(new Event("input"));
}

function actualizarIngredientes(valor) {
    let platatotal = 0;
    let pesototal = 0;

    for (let ingx of inglist) {

        let inputcocic = document.getElementById(ingx + "_cant");
        inputcocic.value = valor * Math.ceil(inputcocic.bdocant / calidad_ing[calidades[inputcocic.bdogrado]]); // Math.ceil(this.bdocant / calidad_ing[calidades[this.bdogrado]])
        let titletag = document.getElementById("titulo_" + ingx);
        let platainp = document.getElementById("inpplata_" + ingx);
        let costo = platainp.value.replace(/\./g, "");
        if(gastoIngCalculados[ingx])
            platatotal += costo * inputcocic.value;
        if (titletag.localName == "a")
            titletag.href = enlaceReceta(ingx, inputcocic.value);

        pesototal += parseFloat(rdata["datos"][ingx]["peso"]) * inputcocic.value;

    }
    document.getElementById("gasto").innerText = "$ " + platatotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setPeso(pesototal);
    refrescarPanelesGrupo();
}

function modificarSegunRatio() {
    let total = document.getElementById("total");
    total.value = Math.floor(this.value * document.getElementById("cantidad").value);
    /* el ratio manda en cuántas veces hay que cocinar cada sub-receta */
    generarListaIngredientesSiHay();
}

function modificarSegunRatioEspecial() {
    let total_especiales = document.getElementById("total_especiales");
    total_especiales.value = Math.floor(this.value * document.getElementById("cantidad").value);

}

function setPeso(p)
{
    document.getElementById("peso").innerText = "LT " + p.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    gpeso = p;
}

function modificadorIngrediente(e) {
    const cantidadr = Math.floor(this.value / Math.ceil(this.bdocant / calidad_ing[calidades[this.bdogrado]]));
    let platatotal = 0;
    let pesototal = 0;
    for (let ingx of inglist) {
        const inputcocic = document.getElementById(ingx + "_cant");
        const platainp = document.getElementById("inpplata_" + ingx);
        const costo = platainp.value.replace(/\./g, "");

        if (this.bdoing != ingx) {

            inputcocic.value = cantidadr * Math.ceil(inputcocic.bdocant / calidad_ing[calidades[inputcocic.bdogrado]]);

        }
        if(gastoIngCalculados[ingx])
            platatotal += costo * inputcocic.value;
        const titletag = document.getElementById("titulo_" + ingx);
        if (titletag.localName == "a")
            titletag.href = enlaceReceta(ingx, inputcocic.value);
        pesototal += parseFloat(rdata["datos"][ingx]["peso"]) * inputcocic.value;
    }
    document.getElementById("gasto").innerText = "$ " + platatotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setPeso(pesototal);
    refrescarPanelesGrupo();

    const cantidadinp = document.getElementById("cantidad");
    const total = document.getElementById("total");
    const total_especiales = document.getElementById("total_especiales");
    cantidadinp.value = cantidadr;
    total.value = Math.floor(cantidadr * document.getElementById("ratio").value);
    total_especiales.value = Math.floor(cantidadr * document.getElementById("ratio_especial").value);
    const imperiales = document.getElementById("imperiales");
    const imperiales_especiales = document.getElementById("imperiales_especiales");
    const imperiales_total = document.getElementById("imperiales_total");
    if(imperiales != undefined) {
        imperiales.value = Math.floor(total.value / imperiales.multiplicador);
        imperiales_especiales.value = Math.floor(total_especiales.value / imperiales_especiales.multiplicador);
        imperiales_total.value = Math.floor(parseInt(imperiales.value) + parseInt(imperiales_especiales.value));
        actualizarDiasUI();
    }
}

function modificarSegunCantidad() {
    actualizarIngredientes(this.value);
    const total = document.getElementById("total");
    const total_especiales = document.getElementById("total_especiales");
    const imperiales = document.getElementById("imperiales");
    const imperiales_especiales = document.getElementById("imperiales_especiales");
    const imperiales_total = document.getElementById("imperiales_total");
    total.value = Math.floor(this.value * document.getElementById("ratio").value);
    if(!flagTotalEspecialesLoad)
        total_especiales.value = Math.floor(this.value * document.getElementById("ratio_especial").value);
    else
        flagTotalEspecialesLoad = false;

    if(imperiales != undefined)
    {
        imperiales.value = Math.floor(total.value / imperiales.multiplicador);
        imperiales_especiales.value = Math.floor(total_especiales.value / imperiales_especiales.multiplicador);
        if(!flagImperialTotal)
        {
            imperiales_total.value = Math.floor(parseInt(imperiales.value) + parseInt(imperiales_especiales.value));
            actualizarDiasUI();
            flagImperialTotal = true;
        }else{
            flagImperialTotal = false;
        }
    }
       

    updatePeso();
        
    
}

function modificarSegunTotal() {
    const ratiox = document.getElementById("ratio").value;
    const total_especiales = document.getElementById("total_especiales");

    const cantidadx = document.getElementById("cantidad");
    cantidadx.value = Math.floor(this.value / ratiox);
    total_especiales.value = Math.floor(cantidadx.value * document.getElementById("ratio_especial").value);
    const imperiales = document.getElementById("imperiales");
    const imperiales_especiales = document.getElementById("imperiales_especiales");
    const imperiales_total = document.getElementById("imperiales_total");
    actualizarIngredientes(cantidadx.value);
    if(imperiales != undefined)
    {
        imperiales.value = Math.floor(this.value / imperiales.multiplicador);
        imperiales_especiales.value = Math.floor(total_especiales.value / imperiales_especiales.multiplicador);
        imperiales_total.value = Math.floor(parseInt(imperiales.value) + parseInt(imperiales_especiales.value));
        actualizarDiasUI();
    }
       
    updatePeso();


}

let flagTotalEspecialesLoad = false;

function modificarSegunTotalEspeciales()
{
    const total_especiales = document.getElementById("total_especiales");
    const cantidadx = document.getElementById("cantidad");
    const ratio_especial = document.getElementById("ratio_especial").value;
    cantidadx.value = Math.floor(total_especiales.value / ratio_especial);
    const e = new Event("input");
    flagTotalEspecialesLoad = true;
    cantidadx.dispatchEvent(e);
}
function modificarSegunImperiales()
{
    const imperiales = document.getElementById("imperiales");
    const total = document.getElementById("total");
    total.value = imperiales.multiplicador * imperiales.value;
    const e = new Event("input");
    actualizarDiasUI();
    total.dispatchEvent(e);
    
}
function modificarSegunImperialesEspeciales()
{
    const imperiales_especiales = document.getElementById("imperiales_especiales");
    const total_especiales = document.getElementById("total_especiales");
    total_especiales.value = imperiales_especiales.multiplicador * imperiales_especiales.value;
    const e = new Event("input");
    total_especiales.dispatchEvent(e);
}
let flagImperialTotal = false;
function modificarSegunImperialesTotales()
{
    const ratio = document.getElementById("ratio").value;
    const ratio_especial = document.getElementById("ratio_especial").value;
    const imperiales_total = document.getElementById("imperiales_total").value;

    const imperiales_especiales = document.getElementById("imperiales_especiales");
    const imperiales = document.getElementById("imperiales");

    const cantidadx = document.getElementById("cantidad");

    const totalratio = (parseFloat(ratio) / parseFloat(imperiales.multiplicador)) + (parseFloat(ratio_especial) / parseFloat(imperiales_especiales.multiplicador));

    let ecx = Math.ceil((parseFloat(imperiales_total) / totalratio));
    if(imperiales_total == 1)
        ecx += Math.ceil(ratio);

    flagImperialTotal = true;
    cantidadx.value = ecx;
    console.log(cantidadx.value);
    
    const e = new Event("input");
    cantidadx.dispatchEvent(e);
}

function actualizarDiasUI() {
    const imperiales_total = document.getElementById("imperiales_total");
    const dias_imperiales = document.getElementById("dias_imperiales");
    const imperiales_max = document.getElementById("imperiales_max");
    if (imperiales_total && dias_imperiales && imperiales_max && imperiales_max.value > 0) {
        dias_imperiales.value = Math.round(parseFloat((imperiales_total.value / imperiales_max.value).toFixed(2)));
    }
}

function modificarSegunDiasImperiales()
{
    const dias_imperiales = document.getElementById("dias_imperiales").value;
    const imperiales_max = document.getElementById("imperiales_max").value;
    const imperiales_total = document.getElementById("imperiales_total");

    imperiales_total.value = dias_imperiales * imperiales_max;
    const e = new Event("input");
    imperiales_total.dispatchEvent(e);
}
function crearCaja(cname, idname) {
    const box = document.createElement("span");
    box.className = "cajita " + cname;
    box.id = "box_" + idname + "_" + cname;
    box.addEventListener("click", seleccionarCaja);
    return box;
}

/* Los campos de peso pueden estar vacíos: sin esto parseFloat("") = NaN y
   el NaN se propaga al texto y al ancho de las barras. */
function numeroSeguro(valor) {
    const n = parseFloat(valor);
    return isFinite(n) ? n : 0;
}

function calcPrct(total, usado)
{
    total = numeroSeguro(total);
    usado = numeroSeguro(usado);
    if (total <= 0)
        return 0;
    const p = (usado * 100) / total;
    return p > 100 ? 100 : p;
}

function seleccionarCaja() {
    const cajas = ["normal", "verde", "azul"];
    const datos = this.id.split("_");
    if (!this.className.includes("seleccionado") && !this.className.includes("vacia")) {
        this.className += " seleccionado";
        const titulospan = document.getElementById("titulo_" + datos[1]);

        const inputx = document.getElementById(datos[1] + "_cant");
        titulospan.innerText = rdata["datos"][datos[1]]["titulo"] + " x" + Math.ceil(inputx.bdocant / calidad_ing[calidades[datos[2]]]);
        document.getElementById(datos[1] + "_cant").bdogrado = datos[2];
        const e = new Event("input");
        inputx.dispatchEvent(e);
        for (let cc of cajas) {

            if (cc != datos[2]) {
                const bx = document.getElementById("box_" + datos[1] + "_" + cc);
                bx.className = "cajita " + cc;
            }
        }
    }
}

let secondLoad = false;

let gastoIngCalculados = {};

function updatePeso()
{
    const pmax = numeroSeguro(document.getElementById("pesomax").value);
    const pmio = numeroSeguro(document.getElementById("mipeso").value);


    const bocupado = document.getElementById("bocupado");
    const busado = document.getElementById("busado");

    let pocupado = calcPrct(pmax, pmio);
    let pusado = calcPrct(pmax, gpeso);
    const resultado = Math.round(((pmio + numeroSeguro(gpeso)) + Number.EPSILON) * 100) / 100;

    const pocup = document.getElementById("pesoocu")
    const pomax = document.getElementById("pesotot");
    pocup.innerText = resultado.toFixed(2);
    pomax.innerText = "/ " + pmax.toFixed(2) + " LT";

    /* sin peso máximo cargado no hay nada que avisar */
    if(pmax <= 0)
        pocup.style = "none";
    else if((pmax - resultado) < 50)
        if((pmax - resultado) < 0)
            pocup.style = "color: red;";
        else
            pocup.style = "color: orange";
    else
        pocup.style = "none";

    bocupado.style = "width: " + pocupado + "%;";
    if(pocupado + pusado > 100)
    {
        pusado = 100 - pocupado;
        if(pusado < 0)
            pusado = 0;
    }
    busado.style = "width: " + pusado + "%;";
}
function valorDe(id) {
    const e = document.getElementById(id);
    return e == null ? undefined : e.value;
}

function ponerValor(id, valor) {
    const e = document.getElementById(id);
    if (e != null && valor != undefined) e.value = valor;
}

function guardarPreferencias()
{
    const anterior = leerPreferencias();
    this.disabled = true;
    this.style = "opacity: 0.5;"
    //  "Guardar preferencias"
    //  "        Ok          "
    this.innerText = "Guardando...";
    const dictSave =
    {
        "ratio": valorDe("ratio"),
        "ratio_especial": valorDe("ratio_especial"),
        "pesomax": valorDe("pesomax"),
        "mipeso": valorDe("mipeso"),
        /* las recetas sin caja imperial no dibujan el campo: se conserva
           lo que ya estaba guardado en vez de borrarlo */
        "maximperiales": valorDe("imperiales_max") != undefined
            ? valorDe("imperiales_max") : anterior["maximperiales"]
    }
    localStorage.setItem("preferencias", JSON.stringify(dictSave));
    setTimeout(function(){this.disabled = false; this.style = ""; this.innerText = "Guardar preferencias"}.bind(this), 300);

}

function leerPreferencias() {
    const p = localStorage.getItem("preferencias");
    if (p == null || p == "") return {};
    try { return JSON.parse(p) || {}; } catch (e) { return {}; }
}

/* -----------------------------------------------------------------
   Estado de progreso
   -----------------------------------------------------------------
   Distinto de las preferencias: las preferencias son los ajustes que
   valen para toda la calculadora (ratios, peso de la mula, máx
   imperiales), mientras que el estado es el avance concreto de UNA
   receta — cuánto vas a cocinar, a qué precio, con qué calidades y qué
   ingredientes ya conseguiste. Se guarda uno por receta y se restaura
   solo al abrirla.
   ----------------------------------------------------------------- */
const CLAVE_ESTADO = "estado_cocina";

/* Cuánto llevás juntado de cada ingrediente puro de la receta abierta:
   { clave: cantidad }. El tilde no se guarda aparte — un ingrediente
   está completo cuando lo que tenés llega a lo que hace falta. */
let tenidos = {};

function cantidadTenida(clave, necesario) {
    const t = tenidos[clave];
    return t > 0 ? t : 0;
}

function leerEstados() {
    const p = localStorage.getItem(CLAVE_ESTADO);
    if (p == null || p == "") return {};
    try { return JSON.parse(p) || {}; } catch (e) { return {}; }
}

function guardarEstado() {
    const est = {
        "v": 1,
        "fecha": Date.now(),
        "cantidad": valorDe("cantidad"),
        "ratio": valorDe("ratio"),
        "ratio_especial": valorDe("ratio_especial"),
        "imperiales_max": valorDe("imperiales_max"),
        "dias_imperiales": valorDe("dias_imperiales"),
        "pesomax": valorDe("pesomax"),
        "mipeso": valorDe("mipeso"),
        "vista": vistaBaseActual,
        "calidades": {},
        "precios": {},
        "gastos": [],
        "tenidos": {}
    };

    /* sólo lo que tiene algo juntado, para no engordar el localStorage */
    for (let k in tenidos) {
        if (tenidos[k] > 0)
            est["tenidos"][k] = tenidos[k];
    }

    for (let ing of inglist) {
        const inp = document.getElementById(ing + "_cant");
        if (inp != null && inp.bdogrado != "normal")
            est["calidades"][ing] = inp.bdogrado;
        const pl = document.getElementById("inpplata_" + ing);
        if (pl != null && pl.value != rdata["datos"][ing]["plata"])
            est["precios"][ing] = pl.value;
        if (gastoIngCalculados[ing])
            est["gastos"].push(ing);
    }

    const todos = leerEstados();
    todos[currentingrediente] = est;
    localStorage.setItem(CLAVE_ESTADO, JSON.stringify(todos));

    this.disabled = true;
    this.style = "opacity: 0.5;";
    this.innerText = "Guardando...";
    setTimeout(function () {
        this.disabled = false; this.style = ""; this.innerText = "Guardar estado";
    }.bind(this), 300);
}

function borrarEstado(recetaId) {
    const todos = leerEstados();
    delete todos[recetaId];
    localStorage.setItem(CLAVE_ESTADO, JSON.stringify(todos));
}

function fechaCorta(ms) {
    const d = new Date(ms);
    const p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
}

function mostrarAvisoEstado(est) {
    const seccion = document.querySelector(".seccion");
    const aviso = document.createElement("div");
    aviso.id = "aviso_estado";
    aviso.className = "aviso_estado";

    const txt = document.createElement("span");
    txt.innerText = "Estado restaurado" + (est["fecha"] ? " · guardado el " + fechaCorta(est["fecha"]) : "");
    aviso.append(txt);

    const btn = document.createElement("button");
    btn.className = "btn_descartar";
    btn.innerText = "Descartar";
    btn.title = "Borra el estado guardado de esta receta y empieza de cero";
    btn.addEventListener("click", function () {
        borrarEstado(currentingrediente);
        const o = { "id": currentingrediente };
        o.setAndLoad = setAndLoad;
        o.setAndLoad();
    });
    aviso.append(btn);

    seccion.parentNode.insertBefore(aviso, seccion);
}

/* Aplica el estado sobre una receta recién montada. El orden importa: las
   calidades cambian cuánto rinde cada ingrediente, así que van antes de
   fijar la cantidad, que es lo que dispara el recálculo general. */
function aplicarEstado(est) {
    ponerValor("ratio", est["ratio"]);
    ponerValor("ratio_especial", est["ratio_especial"]);
    ponerValor("imperiales_max", est["imperiales_max"]);

    const cal = est["calidades"] || {};
    for (let ing in cal) {
        const caja = document.getElementById("box_" + ing + "_" + cal[ing]);
        if (caja != null) caja.click();
    }

    const pre = est["precios"] || {};
    for (let ing in pre) ponerValor("inpplata_" + ing, pre[ing]);

    for (let ing of (est["gastos"] || [])) {
        const b = document.getElementById("actplata_" + ing);
        if (b != null && !gastoIngCalculados[ing]) b.click();
    }

    ponerValor("pesomax", est["pesomax"]);
    ponerValor("mipeso", est["mipeso"]);

    tenidos = {};
    const guardados = est["tenidos"] || {};
    for (let k in guardados) tenidos[k] = guardados[k];

    const c = document.getElementById("cantidad");
    c.value = est["cantidad"] || 0;
    c.dispatchEvent(new Event("input"));
    ponerValor("dias_imperiales", est["dias_imperiales"]);
    updatePeso();

    generarListaIngredientes();
    if (est["vista"]) cambiarVistaBase(est["vista"]);

    mostrarAvisoEstado(est);
}
function setAndLoad() {
    gastoIngCalculados = {};
    modoseleccion = false;

    /* al cambiar de receta se limpia el avance y las listas calculadas: si
       quedaran las de la receta anterior, "Guardar estado" grabaría datos
       que no son de esta receta */
    tenidos = {};
    const avisoViejo = document.getElementById("aviso_estado");
    if (avisoViejo != null) avisoViejo.remove();
    for (let idLista of ["ingredientes_base", "ingredientes_puros"]) {
        const ul = document.getElementById(idLista);
        if (ul != null) ul.innerHTML = "<li>Sin calcular aún</li>";
    }
    const tabPuros = document.getElementById("tab_puros");
    if (tabPuros != null) tabPuros.innerText = "Ingredientes puros";
    const buscadorIng = document.getElementById("buscador_ingredientes");
    if (buscadorIng != null) { buscadorIng.value = ""; buscadorIng.style.display = "none"; }

    const t = rdata["datos"][this.id]["titulo"];
    document.title = t + " - Cocina BDO";
    inglist = [];
    const buscador = document.getElementById("buscador");
    const lista_recetas = document.getElementById("lista_recetas");
    buscador.value = t;
    setTimeout(function () { lista_recetas.style = "display: none"; }, 50)
    const ilista = document.getElementById("ingredientes");
    ilista.innerHTML = "";
    if (secondLoad)
        window.history.pushState(this.id, "Titulo", "?id=" + this.id);
    else {
        const url = new URL(window.location.href);
        url.searchParams.set("id", this.id);
        window.history.replaceState(this.id, "Titulo", url);
    }
    ingredientes = rdata["recetas"][this.id];
    currentingrediente = this.id;
    const otros = document.getElementById("otros");
    otros.innerHTML = "";
    for (let ird of Object.keys(ingredientes)) {
        inglist.push(ird);
        let lix = document.createElement("li");
        let spanmoney = document.createElement("span");
        spanmoney.className = "signplata";
        

        let spancash = document.createElement("span");
        spancash.className = "valx";
        spancash.innerText = "$";
        spancash.id = "actplata_" + ird;
        spancash.bdoing = ird;

        // separarlo en otra funcion
        spancash.addEventListener("click", function(){
            if(!gastoIngCalculados[this.bdoing])
            {
                gastoIngCalculados[this.bdoing] = true;
                this.className = "valx vpressed";
            }else{
                gastoIngCalculados[this.bdoing] = false;
                this.className = "valx";
            }
            recalcularTodo();
        });

        let spanmas = document.createElement("span");
        

        let spanplatainput = document.createElement("span");
        spanplatainput.className = "oculto";
        spanplatainput.id = "expplata_" + ird;
        

        let inputplata = document.createElement("input");
        inputplata.id = "inpplata_" + ird;
        inputplata.value = rdata["datos"][ird]["plata"];
        inputplata.addEventListener("input", function(){
            const original = this.value.replace(/\./g, "");
            this.value =  original.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            recalcularTodo();
        });

        spanplatainput.append(inputplata);

        let spanbotonplata = document.createElement("span");
        spanbotonplata.innerText = "+";
        spanbotonplata.ingid = ird;
        spanbotonplata.addEventListener("click", function()
        {
            const spaninput = document.getElementById("expplata_" + this.ingid);
            if(this.innerText == "+")
                this.innerText = " - ";
            else
                this.innerText = " + ";
            if(spaninput.className == "oculto")
                spaninput.className = "normal";
            else
                spaninput.className = "oculto";
        });

        spanmas.append(spanplatainput);
        spanmas.append(spanbotonplata);


        spanmas.className = "expandir";

        spanmoney.append(spancash);
        spanmoney.append(spanmas);
        let isLink = ird in rdata["recetas"];

        let tipoing = isLink ? "a" : "span";

        let spantitle = document.createElement(tipoing);
        spantitle.innerText = rdata["datos"][ird]["titulo"] + " x" + ingredientes[ird] + " "
        spantitle.className = "titulo";
        spantitle.id = "titulo_" + ird;
        if (isLink) {
            spantitle.href = enlaceReceta(ird);
            spantitle.target = "_blank";

        }
        let spansector = document.createElement("span");
        spansector.className = "seccajas";
    
        let inputcant = document.createElement("input");

        inputcant.addEventListener("input", modificadorIngrediente);
        inputcant.className = "reccant";
        inputcant.id = ird + "_cant";
        inputcant.type = "number";
        inputcant.bdoing = ird;
        inputcant.bdocant = ingredientes[ird];
        inputcant.bdogrado = "normal";

        let boxnormal = document.createElement("span");
        boxnormal.className = "boxnormal";


        lix.append(spanmoney);

        /* Título y marca ↻ van juntos dentro de .ing_cabeza: como el <li>
           es flex-wrap, sin este contenedor un título largo hace que las
           cajas de calidad se vayan a una línea nueva. El panel
           desplegable se cuelga del <li> entero para que caiga en su
           propio renglón, debajo de las cajitas. */
        let cabeza = document.createElement("span");
        cabeza.className = "ing_cabeza";
        cabeza.append(spantitle);
        let contMarca = document.createElement("span");
        contMarca.className = "cont_marca";
        cabeza.append(contMarca);
        lix.append(cabeza);

        spansector.append(inputcant);
        spansector.append(crearSelectoresNumero(inputcant, "Cantidad de " + rdata["datos"][ird].titulo));
		if(rdata["datos"][ird]["nomejorable"] == undefined)
		{
			spansector.append(crearCaja("normal", ird));
			spansector.append(crearCaja("verde", ird));
			spansector.append(crearCaja("azul", ird));
		}else{
			spansector.append(crearCaja("vacia", ird));
			spansector.append(crearCaja("vacia", ird));
			spansector.append(crearCaja("vacia", ird));
		}
		
		lix.append(spansector)
        montarGrupo(contMarca, lix, ird, function () {
            const inp = document.getElementById(ird + "_cant");
            const cant = document.getElementById("cantidad");
            if (inp == null || cant == null) return [];
            /* lo que pide la receta por cocinada, ya con la calidad elegida */
            const q = Math.ceil(inp.bdocant / calidad_ing[calidades[inp.bdogrado]]);
            return [{ "q": q, "veces": Number(cant.value) || 0 }];
        });
        ilista.append(lix);

    }

    const prefs = leerPreferencias();

    /* Los ratios y el peso valen para todas las recetas, así que viven en
       un panel de preferencias aparte del cálculo de esta receta. */
    const ajustes = document.createElement("details");
    ajustes.id = "ajustes_generales";
    const resumenAjustes = document.createElement("summary");
    resumenAjustes.textContent = "⚙ Preferencias de la calculadora";
    const ayudaAjustes = document.createElement("p");
    ayudaAjustes.className = "ayuda_guardado";
    ayudaAjustes.textContent = "Ratios y peso predeterminados para todas las recetas.";
    const listaAjustes = document.createElement("ul");
    ajustes.append(resumenAjustes, ayudaAjustes, listaAjustes);

    let cant = crearElementoLi(otros, "Cantidad cocinada: ", "cantidad");
    let ratio = crearElementoLi(listaAjustes, "Ratio: ", "ratio");
    let ratio_especial = crearElementoLi(listaAjustes, "Ratio Especial: ", "ratio_especial");

    ratio_especial.classList.add("especiales_txt")

    let nli = document.createElement("li");
    nli.classList.add("botonera");
    let boton = document.createElement("button");
    let botonsave = document.createElement("button");
    botonsave.innerText = "Guardar preferencias";
    botonsave.classList.add("savebtn");
    botonsave.title = "Ratios, peso y máx imperiales, para todas las recetas";
    botonsave.onclick = guardarPreferencias;

    /* el avance de ESTA receta, aparte de las preferencias generales */
    let botonestado = document.createElement("button");
    botonestado.innerText = "Guardar estado";
    botonestado.classList.add("estadobtn");
    botonestado.title = "Cantidad, precios, calidades y lo ya conseguido de esta receta";
    botonestado.onclick = guardarEstado;

    boton.innerText = "Calcular Ingredientes";
    boton.addEventListener("click", generarListaIngredientes);
    nli.append(boton);
    ajustes.append(botonsave);

    let avance = document.getElementById("acciones_estado");
    if (!avance) {
        avance = document.createElement("div");
        avance.id = "acciones_estado";
        const tabs = document.getElementById("tabs_base");
        tabs.parentNode.insertBefore(avance, tabs);
    }
    avance.replaceChildren();
    const ayudaEstado = document.createElement("div");
    const tituloEstado = document.createElement("strong");
    tituloEstado.textContent = "Avance de esta receta";
    const detalleEstado = document.createElement("p");
    detalleEstado.className = "ayuda_guardado";
    detalleEstado.textContent = "Guardá cantidades, precios, calidades e ingredientes conseguidos. Se restaura al volver a abrirla.";
    ayudaEstado.append(tituloEstado, detalleEstado);
    avance.append(ayudaEstado, botonestado);

    cant.children[1].addEventListener("input", modificarSegunCantidad);
    ratio.children[1].value = 2.4;
    ratio.children[1].step = 0.1;
    ratio.children[1].addEventListener("input", modificarSegunRatio)

    ratio_especial.children[1].value = 0.5;
    ratio_especial.children[1].step = 0.1;
    ratio_especial.children[1].addEventListener("input", modificarSegunRatioEspecial)
    let total = crearElementoLi(otros, "Total obtenidos: ", "total");
    let total_especiales = crearElementoLi(otros, "Total (especiales) obtenidos: ", "total_especiales");
    total_especiales.classList.add("especiales_txt");
    /* fuera del if: hace falta más abajo para restaurar la preferencia */
    let imperiales_max = null;
    if(rdata["datos"][currentingrediente]["imperiales"] != undefined)
    {
        let imperiales = crearElementoLi(otros, "Imperiales: (x" + rdata["datos"][currentingrediente]["imperiales"] + "): ", "imperiales");
        let imperiales_especiales = crearElementoLi(otros, "Imperiales (especiales) : (x" + rdata["datos"][currentingrediente]["imperiales"] / 3 + "): ", "imperiales_especiales");
        let imperiales_total = crearElementoLi(otros, "Imperiales total (±1):  ", "imperiales_total");
        imperiales_max = crearElementoLi(otros, "Máx imperiales", "imperiales_max");
        imperiales_max.children[1].value = 186;
        imperiales_max.classList.add("maximperiales");
        imperiales_max.children[1].classList.add("maximperiales");
        imperiales_max.children[1].addEventListener("input", actualizarDiasUI);

        let dias_imperiales = crearElementoLi(otros, "Días imperiales", "dias_imperiales");
        dias_imperiales.children[1].value = 0;

        dias_imperiales.children[1].addEventListener("input", modificarSegunDiasImperiales);

        imperiales_total.classList.add("totaldef_txt");
        imperiales_total.children[1].addEventListener("input", modificarSegunImperialesTotales);

        imperiales_especiales.classList.add("especiales_txt");
        imperiales_especiales.children[1].addEventListener("input", modificarSegunImperialesEspeciales);
        imperiales_especiales.children[1].multiplicador = rdata["datos"][currentingrediente]["imperiales"] / 3;

        imperiales.children[1].addEventListener("input", modificarSegunImperiales);
        imperiales.children[1].multiplicador = rdata["datos"][currentingrediente]["imperiales"];
    }

    crearElementoLi(otros, "Gasto", "gasto", false);
    let ppeso = crearElementoLi(otros, "Peso", "peso", false);


    let divpeso = document.createElement("div");

    divpeso.className = "pextra";

    let aextra = document.createElement("a");

    aextra.onclick = function()
    {
        const d = document.getElementById("pi5");
   
        if(!d.mostrar)
        {
            this.children[1].innerText = " Mostrar opciones peso";
            this.children[0].innerText = "+";
            d.style = "display: none;";
        }else{
            this.children[1].innerText = " Ocultar opciones peso";
            this.children[0].innerText = "-";
            d.style = "display: block;";
        }
        d.mostrar = !d.mostrar;
    }
    aextra.innerHTML = "<span>+</span><b>Mostrar opciones peso</b>";
    divpeso.append(aextra);
    let dinputpeso = document.createElement("div");
    dinputpeso.className = "pinputs";
    dinputpeso.id = "pi5";
    dinputpeso.mostrar = true;
    dinputpeso.style = "display: none;";

    divpeso.append(dinputpeso);


    ajustes.insertBefore(divpeso, botonsave);


    let pesomax = crearElementoLi(dinputpeso, "Peso máx", "pesomax");
    pesomax.children[1].step = 0.01;

    pesomax.children[1].oninput = function(event)
    {
        updatePeso();
        
    };

    let mipeso = crearElementoLi(dinputpeso, "Mi peso", "mipeso");
    mipeso.children[1].step = 0.01;

    mipeso.children[1].oninput = function()
    {
    
        updatePeso();
    }
    let pbarras = document.createElement("li");
    pbarras.innerHTML = "<span class=\"b_base b_contenedor\"><span id=\"bocupado\" class=\"b_base b_pocupado\" style=\"width: 0%;\"></span><span id=\"busado\" class=\"b_base b_usado\" style=\"width: 0%;\"></span></span>";
    dinputpeso.append(pbarras);

    // inicio de peso

    let infopesox = document.createElement("div");
    let spaninfpoc = document.createElement("span");
    spaninfpoc.id = "pesoocu";
    let spaninfpto = document.createElement("span");
    spaninfpto.id = "pesotot";

    spaninfpoc.innerText = "0.00";
    spaninfpto.innerText = "/ 0.00";

    let fbutton = document.createElement("span");
    fbutton.className = "fillbtn";
    fbutton.innerText = "LLENAR";

    fbutton.onclick = function()
    {
        // calcular cantidad para llenar el peso actual.
        const pmax = numeroSeguro(document.getElementById("pesomax").value);
        const pmio = numeroSeguro(document.getElementById("mipeso").value);

        const disponible = pmax - pmio;

        let pesodata = 0;
        for (let ingx of inglist) {

            let inputcocic = document.getElementById(ingx + "_cant");
            const ddato = 1 * Math.ceil(inputcocic.bdocant / calidad_ing[calidades[inputcocic.bdogrado]]); // Math.ceil(this.bdocant / calidad_ing[calidades[this.bdogrado]])
            pesodata += parseFloat(rdata["datos"][ingx]["peso"]) * ddato;

        }
        /* sin peso máximo cargado, o con ingredientes sin peso, no hay nada que llenar */
        if (disponible <= 0 || pesodata <= 0)
            return;

        const resultado = Math.floor((disponible / pesodata) * 0.95);

        const tinput = document.getElementById("cantidad");
        tinput.value = resultado;
        let e = new Event("input");
        tinput.dispatchEvent(e);
        // fin de calculo

    }
    infopesox.append(spaninfpoc);
    infopesox.append(spaninfpto);
    infopesox.append(fbutton);

    // fin peso
    ppeso.children[1].innerText = "LT 0.00";
    otros.append(nli);
    const filaAjustes = document.createElement("li");
    filaAjustes.className = "fila_ajustes";
    filaAjustes.append(ajustes);
    otros.append(filaAjustes);

    dinputpeso.append(infopesox);
    total.children[1].addEventListener("input", modificarSegunTotal);
    total_especiales.children[1].addEventListener("input", modificarSegunTotalEspeciales);


    if (prefs["ratio"] != undefined) ratio.children[1].value = prefs["ratio"];
    if (prefs["ratio_especial"] != undefined) ratio_especial.children[1].value = prefs["ratio_especial"];
    if (prefs["pesomax"] != undefined) pesomax.children[1].value = prefs["pesomax"];
    if (prefs["mipeso"] != undefined) mipeso.children[1].value = prefs["mipeso"];
    if (imperiales_max != null && prefs["maximperiales"] != undefined)
        imperiales_max.children[1].value = prefs["maximperiales"];

    if (!secondLoad && totalget != null) {
        total.children[1].value = totalget;
        if(ratioget != undefined)
            ratio.children[1].value = ratioget;
        let e = new Event("input");
        total.children[1].dispatchEvent(e);

    }

    /* si esta receta tiene avance guardado, se restaura encima de todo lo anterior */
    const estadoGuardado = leerEstados()[this.id];
    if (estadoGuardado != undefined)
        aplicarEstado(estadoGuardado);

    secondLoad = true;
}

function crearElementoLi(donde, texto, id, sininput) {
    let lix = document.createElement("li");
    let spantitle = document.createElement("span");
    spantitle.innerText = texto;
    let inputcant;
    if(sininput == undefined)
    {
        inputcant = document.createElement("input");
        inputcant.className = "cantidadtotal";
    }else{
        inputcant = document.createElement("span");
        inputcant.className = "infodata";
    }
    inputcant.id = id;
    inputcant.type = "number";
    lix.append(spantitle);
    lix.append(inputcant);
    if (sininput == undefined) {
        lix.classList.add("fila_numero");
        lix.append(crearSelectoresNumero(inputcant, texto));
    }
    donde.append(lix);
    return lix;
}

function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

let totalget;
document.addEventListener('keydown', function (event) {
    if (modoseleccion) {
        const lista_li_recetas = lista_recetas_ul.children;

        if (lista_li_recetas[anteriorseleccion] != undefined)
            lista_li_recetas[anteriorseleccion].className = "";

        if (event.key == "ArrowDown") {
            selectactual_recetas++;
        } else if (event.key == "ArrowUp") {
            selectactual_recetas--;

        } else if (event.key == "Enter") {
            let e = new Event("click");
            if (lista_li_recetas[selectactual_recetas] != undefined) {
                lista_li_recetas[selectactual_recetas].dispatchEvent(e);
                modoseleccion = false;
            }
        }
        anteriorseleccion = selectactual_recetas;
        if (lista_li_recetas[selectactual_recetas] != undefined) {
            lista_li_recetas[selectactual_recetas].className = "hover";
            lista_li_recetas[selectactual_recetas].scrollIntoView(false);
        }
        if (selectactual_recetas < 0) selectactual_recetas = lista_li_recetas.length;
        if (selectactual_recetas > lista_li_recetas.length) selectactual_recetas = -1;



    }
});

function seleccionarItem() {
    if (lista_recetas_ul.children[anteriorseleccion] != undefined)
        lista_recetas_ul.children[anteriorseleccion].className = "";
    if (lista_recetas_ul.children[selectactual_recetas] != undefined)
        lista_recetas_ul.children[selectactual_recetas].className = "";
    selectactual_recetas = this.contador;
    anteriorseleccion = selectactual_recetas;
    this.className = "hover";
}

let ratioget;
window.addEventListener("load", function () {
    const buscador = document.getElementById("buscador");
    const lista_recetas = document.getElementById("lista_recetas");
    let idresget = findGetParameter("id");
    totalget = findGetParameter("t");
    ratioget = findGetParameter("r");
    lista_recetas_ul = document.getElementById("lista_recetas");

    document.getElementById("tab_arbol").addEventListener("click", function () { cambiarVistaBase("arbol"); });
    document.getElementById("tab_puros").addEventListener("click", function () { cambiarVistaBase("puros"); });

    fetch("datosv1.json")
        .then(function (rep) {
            return rep.json()
        })
        .then(function (jj) {
            rdata = jj;
            lista_recetas.innerHTML = "";
            let ccc = 0;
            for (let k of Object.keys(rdata["datos"])) {
                if (k in rdata["recetas"]) {
                    let nli = document.createElement("li");
                    nli.id = k;
                    nli.contador = ccc;
                    nli.innerText = rdata["datos"][k]["titulo"];
                    nli.addEventListener("click", setAndLoad);
                    nli.addEventListener("mouseover", seleccionarItem);
                    lista_recetas.append(nli);
                    ccc++;
                }

            }
            if (idresget != null && rdata["datos"][idresget] != undefined) {
                tempObj = { "id": idresget };
                tempObj.setAndLoad = setAndLoad;
                tempObj.setAndLoad();
            }
        });

    buscador.addEventListener("input", function () {
        lista_recetas.style = "display: block";
        let v = this.value.toLowerCase();
        modoseleccion = true;
        if (lista_recetas_ul.children[selectactual_recetas] != undefined)
            lista_recetas_ul.children[selectactual_recetas].className = "";

        if (lista_recetas_ul.children[anteriorseleccion] != undefined)
            lista_recetas_ul.children[anteriorseleccion].className = "";
        selectactual_recetas = 0;
        anteriorseleccion = 0;

        v = v.replace("á", "a");
        v = v.replace("é", "e");
        v = v.replace("í", "i");
        v = v.replace("ó", "o");
        v = v.replace("ú", "u");
        v = v.replace("b", "v");
        v = v.replace(/ /g, "");

        lista_recetas.innerHTML = "";
        let ccc = 0;
        for (let k of Object.keys(rdata["datos"])) {
            let titulo = rdata["datos"][k]["titulo"].toLowerCase();
            titulo = titulo.replace(" /g", "");
            titulo = titulo.replace("b", "v");
            titulo = titulo.replace(/ /g, "");
            titulo = titulo.replace("á", "a");
            titulo = titulo.replace("é", "e");
            titulo = titulo.replace("ú", "u");
            titulo = titulo.replace("í", "i");

            if (titulo.includes(v) || v == "") {
                if (k in rdata["recetas"]) {
                    let nli = document.createElement("li");
                    nli.id = k;
                    nli.contador = ccc;
                    ccc++;
                    nli.innerText = rdata["datos"][k]["titulo"];
                    nli.addEventListener("click", setAndLoad);
                    nli.addEventListener("mouseover", seleccionarItem);

                    lista_recetas.append(nli);
                }

            }
        }
    });
    buscador.addEventListener("focus", function () {
        lista_recetas.style = "display: block";
        modoseleccion = true;
    });

});

window.onpopstate = function (event) {
    let idresget = findGetParameter("id");
    if (idresget == null || rdata["datos"][idresget] == undefined) return;
    tempObj = { "id": idresget };
    tempObj.setAndLoad = setAndLoad;
    tempObj.setAndLoad();
}
