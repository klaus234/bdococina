/*
    TODO: 
    - Agregar porcentaje de barra de PESO.
    - Completar código con comentarios.
    - Refactor a todo jaja.
    - Agregar más ingredientes y recetas.
    - Poner una indicación de ingredientes procesados.
    - Agregarle peso a todos los ingredientes y recetas.
    - Agregarle precio default a todos los ingredientes y recetas.
    - Versión OOP ?

*/

console.log("v 1.0.0");
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

function generarListaIngredientes() {

    ingredientesbase = {};
    rAgregarABase(currentingrediente, document.getElementById("cantidad").value);

    let keysLista = Object.keys(ingredientesbase);
    const ulingredientes = document.getElementById("ingredientes_base");
    ulingredientes.innerHTML = "";
    keysLista = keysLista.sort();
    for (let kl of keysLista) {
        let kli = document.createElement("li");
        kli.innerHTML = "<span class=\"titing\">" + rdata["datos"][kl]["titulo"] + "</span>: <span class=\"cantcing\">" + ingredientesbase[kl] + "</span>";
        ulingredientes.append(kli);
    }
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

function actualizarIngredientes(valor) {
    const ratiog = document.getElementById("ratio");
    let platatotal = 0;
    let pesototal = 0;

    for (let ingx of inglist) {

        let inputcocic = document.getElementById(ingx + "_cant");
        inputcocic.value = valor * Math.ceil(inputcocic.bdocant / calidad_ing[calidades[inputcocic.bdogrado]]); // Math.ceil(this.bdocant / calidad_ing[calidades[this.bdogrado]])
        let titletag = document.getElementById("titulo_" + ingx);
        let platainp = document.getElementById("inpplata_" + ingx);
        let costo = platainp.value.replace(".", "");
        if(gastoIngCalculados[ingx])
            platatotal += costo * inputcocic.value;
        if (titletag.localName == "a")
            titletag.href = "?id=" + ingx + "&t=" + inputcocic.value + "&r=" + ratiog.value;
        
        pesototal += parseFloat(rdata["datos"][ingx]["peso"]) * inputcocic.value;
    
    }
    document.getElementById("gasto").innerText = "$ " + platatotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setPeso(pesototal);
}

function modificarSegunRatio() {
    let total = document.getElementById("total");
    total.value = Math.floor(this.value * document.getElementById("cantidad").value);

}

function setPeso(p)
{
    document.getElementById("peso").innerText = "LT " + p.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    gpeso = p;
}

function modificadorIngrediente(e) {
    const cantidadr = Math.floor(this.value / Math.ceil(this.bdocant / calidad_ing[calidades[this.bdogrado]]));
    const ratiog = document.getElementById("ratio");
    let platatotal = 0;
    let pesototal = 0;
    for (let ingx of inglist) {
        const inputcocic = document.getElementById(ingx + "_cant");
        const platainp = document.getElementById("inpplata_" + ingx);
        const costo = platainp.value.replace(".", "");

        if (this.bdoing != ingx) {

            inputcocic.value = cantidadr * Math.ceil(inputcocic.bdocant / calidad_ing[calidades[inputcocic.bdogrado]]);

        }
        if(gastoIngCalculados[ingx])
            platatotal += costo * inputcocic.value;
        const titletag = document.getElementById("titulo_" + ingx);
        if (titletag.localName == "a")
            titletag.href = "?id=" + ingx + "&t=" + inputcocic.value + "&r=" + ratiog.value;
        pesototal += parseFloat(rdata["datos"][ingx]["peso"]) * inputcocic.value;
    }
    document.getElementById("gasto").innerText = "$ " + platatotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setPeso(pesototal);

    const cantidadinp = document.getElementById("cantidad");
    const total = document.getElementById("total");
    cantidadinp.value = cantidadr;
    total.value = Math.floor(cantidadr * document.getElementById("ratio").value);
    const imperiales = document.getElementById("imperiales");
    if(imperiales != undefined)
        imperiales.value = Math.floor(total.value / imperiales.multiplicador);
}

function modificarSegunCantidad() {
    actualizarIngredientes(this.value);
    const total = document.getElementById("total");
    const imperiales = document.getElementById("imperiales");

    total.value = Math.floor(this.value * document.getElementById("ratio").value);
    if(imperiales != undefined)
        imperiales.value = Math.floor(total.value / imperiales.multiplicador);
        
    
}

function modificarSegunTotal() {
    const ratiox = document.getElementById("ratio").value;
    const cantidadx = document.getElementById("cantidad");
    cantidadx.value = Math.floor(this.value / ratiox);
    const imperiales = document.getElementById("imperiales");
    actualizarIngredientes(cantidadx.value);
    if(imperiales != undefined)
        imperiales.value = Math.floor(this.value / imperiales.multiplicador);


}

function modificarSegunImperiales()
{
    const imperiales = document.getElementById("imperiales");
    const total = document.getElementById("total");
    total.value = imperiales.multiplicador * imperiales.value;
    const e = new Event("input");
    total.dispatchEvent(e);
    
}

function crearCaja(cname, idname) {
    const box = document.createElement("span");
    box.className = "cajita " + cname;
    box.id = "box_" + idname + "_" + cname;
    box.addEventListener("click", seleccionarCaja);
    return box;
}

function calcPrct(total, usado)
{
    console.log("--> ", total, " | ", usado);
    if(total != 0 || total != undefined)
    {
        return (usado * 100) / total > 100 ? 100 : (usado * 100) / total;
    }
        
    return 0;
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

function setAndLoad() {
    gastoIngCalculados = {};
    modoseleccion = false;
    const t = this.innerText;
    document.title = t + " - Cocina BDO v2";
    inglist = [];
    const buscador = document.getElementById("buscador");
    buscador.value = t;
    setTimeout(function () { lista_recetas.style = "display: none"; }, 50)
    const ilista = document.getElementById("ingredientes");
    ilista.innerHTML = "";
    if (secondLoad)
        window.history.pushState(this.id, "Titulo", "cocina.html?id=" + this.id);
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
        });

        let spanmas = document.createElement("span");
        

        let spanplatainput = document.createElement("span");
        spanplatainput.className = "oculto";
        spanplatainput.id = "expplata_" + ird;
        

        let inputplata = document.createElement("input");
        inputplata.id = "inpplata_" + ird;
        inputplata.value = rdata["datos"][ird]["plata"];
        inputplata.addEventListener("input", function(){
            const original = this.value.replace(".", "");
            this.value =  original.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
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
            spantitle.href = "?id=" + ird;
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
        lix.append(spantitle);

        spansector.append(inputcant)
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
        ilista.append(lix);

    }
    let cant = crearElementoLi(otros, "Cantidad cocinada: ", "cantidad");
    let ratio = crearElementoLi(otros, "Ratio: ", "ratio");
    

    let nli = document.createElement("li");
    let boton = document.createElement("button");
    boton.innerText = "Calcular Ingredientes";
    boton.addEventListener("click", generarListaIngredientes);
    nli.append(boton);
    cant.children[1].addEventListener("input", modificarSegunCantidad);
    ratio.children[1].value = 2.4;
    ratio.children[1].step = 0.1;
    ratio.children[1].addEventListener("input", modificarSegunRatio)
    let total = crearElementoLi(otros, "Total obtenidos: ", "total");
    
    if(rdata["datos"][currentingrediente]["imperiales"] != undefined)
    {
        let imperiales = crearElementoLi(otros, "Imperiales: (x" + rdata["datos"][currentingrediente]["imperiales"] + "): ", "imperiales");
    
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
            this.children[1].innerText = "Mostrar opciones peso";
            this.children[0].innerText = "+";
            d.style = "display: none;";
        }else{
            this.children[1].innerText = "Ocultar opciones peso";
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

    // <span class="b_base b_contenedor"><span class="b_base b_pocupado"></span><span class="b_base b_usado"></span></span>
   

    otros.append(divpeso);
    

    let pesomax = crearElementoLi(dinputpeso, "Peso máx", "pesomax");
    pesomax.children[1].step = 0.01;

    pesomax.children[1].oninput = function(event)
    {
        const pmax = this.value;
        const pmio = document.getElementById("mipeso").value;
        

        const bocupado = document.getElementById("bocupado"); 
        const busado = document.getElementById("busado");

        let pocupado = calcPrct(pmax, pmio);
        let pusado = calcPrct(pmax, gpeso);

        bocupado.style = "width: " + pocupado + "%;";
        if(pocupado + pusado > 100)
        {
            pusado = 100 - pocupado;
            if(pusado < 0)
                pusado = 0;
        }
        busado.style = "width: " + pusado + "%;";
        
    };

    let mipeso = crearElementoLi(dinputpeso, "Mi peso", "mipeso");
    mipeso.children[1].step = 0.01;

    mipeso.children[1].oninput = function()
    {
        const pmax = document.getElementById("pesomax").value;
        const pmio = this.value

        const bocupado = document.getElementById("bocupado"); // es pmio
        const busado = document.getElementById("busado");

        let pocupado = calcPrct(pmax, pmio);
        let pusado = calcPrct(pmax, gpeso);

        bocupado.style = "width: " + pocupado + "%;";
        if(pocupado + pusado > 100)
        {
            pusado = 100 - pocupado;
            if(pusado < 0)
                pusado = 0;
        }
        busado.style = "width: " + pusado + "%;";
    }
    let pbarras = document.createElement("div");
    pbarras.innerHTML = "<span class=\"b_base b_contenedor\"><span id=\"bocupado\" class=\"b_base b_pocupado\" style=\"width: 0%;\"></span><span id=\"busado\" class=\"b_base b_usado\" style=\"width: 0%;\"></span></span>";
    dinputpeso.append(pbarras);


    
    ppeso.children[1].innerText = "LT 0.00";
    otros.append(nli);

    total.children[1].addEventListener("input", modificarSegunTotal);
    if (!secondLoad && totalget != null) {
        console.log("SETEAR " + totalget);
        total.children[1].value = totalget;
        if(ratioget != undefined)
            ratio.children[1].value = ratioget;
        let e = new Event("input");
        total.children[1].dispatchEvent(e);

    }

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
            if (idresget != null) {
                tempObj = { "id": idresget, "innerText": rdata["datos"][idresget]["titulo"] };
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
    tempObj = { "id": idresget, "innerText": rdata["datos"][idresget]["titulo"] };
    tempObj.setAndLoad = setAndLoad;
    tempObj.setAndLoad();
}
