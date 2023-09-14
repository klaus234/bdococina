/*
    TODO: 
    - Agregar Mis max imperiales.
    - Agregar días según max imperiales.
    - Agregar opción de guardar usando cookies.

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
    const total_especiales = document.getElementById("total_especiales");
    cantidadinp.value = cantidadr;
    total.value = Math.floor(cantidadr * document.getElementById("ratio").value);
    total_especiales.value = Math.floor(cantidadr * document.getElementById("ratio_especial").value);
    const imperiales = document.getElementById("imperiales");
    const imperiales_especiales = document.getElementById("imperiales_especiales");
    const imperiales_total = document.getElementById("imperiales_total");
    if(imperiales != undefined)
        imperiales.value = Math.floor(total.value / imperiales.multiplicador);
        imperiales_especiales.value = Math.floor(total_especiales.value / imperiales_especiales.multiplicador);
        imperiales_total.value = Math.floor(parseInt(imperiales.value) + parseInt(imperiales_especiales.value));
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

function calcPrct(total, usado)
{
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

function updatePeso()
{
    const pmax = document.getElementById("pesomax").value;
    const pmio = document.getElementById("mipeso").value;
    

    const bocupado = document.getElementById("bocupado"); 
    const busado = document.getElementById("busado");

    let pocupado = calcPrct(pmax, pmio);
    let pusado = calcPrct(pmax, gpeso);
    const resultado = Math.round(((parseFloat(pmio) + parseFloat(gpeso)) + Number.EPSILON) * 100) / 100;

    const pocup = document.getElementById("pesoocu")
    const pomax = document.getElementById("pesotot");
    pocup.innerText = "" + resultado ;
    pomax.innerText = "/ " + pmax + " LT";

    if((pmax - resultado) < 50)
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
function guardarPreferencias()
{
    const ratio = document.getElementById("ratio").value;
    const ratio_especial = document.getElementById("ratio_especial").value;
    const pesomax = document.getElementById("pesomax").value;
    const mipeso = document.getElementById("mipeso").value;
    const maximperiales = document.getElementById("imperiales_max").value;
    this.disabled = true;
    this.style = "opacity: 0.5;"
    //  "Guardar preferencias"
    //  "        Ok          "
    this.innerText = "Guardando...";
    const dictSave = 
    {
        "ratio": ratio,
        "ratio_especial": ratio_especial,
        "pesomax": pesomax,
        "mipeso": mipeso,
        "maximperiales": maximperiales
    }
    localStorage.setItem("preferencias", JSON.stringify(dictSave));
    setTimeout(function(){this.disabled = false; this.style = ""; this.innerText = "Guardar preferencias"}.bind(this), 300);

}
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
        window.history.pushState(this.id, "Titulo", "?id=" + this.id);
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
    let ratio_especial = crearElementoLi(otros, "Ratio Especial: ", "ratio_especial");
    
    ratio_especial.classList.add("especiales_txt")

    let nli = document.createElement("li");
    nli.classList.add("botonera");
    let boton = document.createElement("button");
    let botonsave = document.createElement("button");
    botonsave.innerText = "Guardar preferencias";
    botonsave.classList.add("savebtn");
    botonsave.onclick = guardarPreferencias;

    boton.innerText = "Calcular Ingredientes";
    boton.addEventListener("click", generarListaIngredientes);
    nli.append(boton);
    nli.append(botonsave);
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
    if(rdata["datos"][currentingrediente]["imperiales"] != undefined)
    {
        let imperiales = crearElementoLi(otros, "Imperiales: (x" + rdata["datos"][currentingrediente]["imperiales"] + "): ", "imperiales");
        let imperiales_especiales = crearElementoLi(otros, "Imperiales (especiales) : (x" + rdata["datos"][currentingrediente]["imperiales"] / 3 + "): ", "imperiales_especiales");
        let imperiales_total = crearElementoLi(otros, "Imperiales total (±1):  ", "imperiales_total");
        let imperiales_max = crearElementoLi(otros, "Máx imperiales", "imperiales_max");
        imperiales_max.children[1].value = 186;
        imperiales_max.classList.add("maximperiales");
        imperiales_max.children[1].classList.add("maximperiales");

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


    otros.append(divpeso);
    

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
        let pmax = document.getElementById("pesomax").value;
        let pmio = document.getElementById("mipeso").value;

        if(pmax == "") pmax = 0;
        if(pmio == "") pmio = 0;

        const disponible = pmax - pmio;

        let pesodata = 0;
        for (let ingx of inglist) {

            let inputcocic = document.getElementById(ingx + "_cant");
            const ddato = 1 * Math.ceil(inputcocic.bdocant / calidad_ing[calidades[inputcocic.bdogrado]]); // Math.ceil(this.bdocant / calidad_ing[calidades[this.bdogrado]])
            pesodata += parseFloat(rdata["datos"][ingx]["peso"]) * ddato;
        
        }
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

    dinputpeso.append(infopesox);
    total.children[1].addEventListener("input", modificarSegunTotal);
    total_especiales.children[1].addEventListener("input", modificarSegunTotalEspeciales);
    

    const preferencias = localStorage.getItem("preferencias");
    if(preferencias != null && preferencias != "")
    {
        const dictPreferencias = JSON.parse(preferencias);
        ratio.children[1].value = dictPreferencias["ratio"];
        ratio_especial.children[1].value = dictPreferencias["ratio_especial"];
        pesomax.children[1].value = dictPreferencias["pesomax"];
        mipeso.children[1].value = dictPreferencias["mipeso"];
        const isDefined = typeof imperiales_max;

        if(isDefined == undefined)
            imperiales_max.value = dictPreferencias["maximperiales"];
    }
    if (!secondLoad && totalget != null) {
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
