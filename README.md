# BDO - Calculadora de Recetas de Cocina


Calculadora de cocina 100% client-side (hecha en Javascript ECMA6), hermana de la de alquimia.

Datos: BDO SA (es-419), extraídos de bdocodex.

La lista de ingredientes tiene dos vistas: el **árbol de ingredientes** (anidado,
con las sub-recetas desplegables) y los **ingredientes puros**, la lista plana de
lo que hay que conseguir de verdad, con una barra de avance y un contador por
ingrediente de cuánto llevás juntado.

Los ingredientes puros incluyen métodos de obtención, detalles, fuentes y fecha
de verificación en `datosv1.json` → `datos` → `obtencion`. Se muestran varios
métodos cuando están verificados; no es una lista exhaustiva de recompensas o
eventos. Tienda NPC y Mercado Central son categorías distintas. El campo
«Precio de compra» de una ficha no demuestra que el ítem se venda en una tienda.
Los métodos corresponden al ingrediente mostrado, no a todos sus sustitutos.

Los materiales sustituibles llevan la marca ↻: al tocarla se despliegan los
ítems de su grupo con cuántos hacen falta de cada uno. Entre los ítems comunes
la sustitución es 1 a 1; las variantes «de Calidad» cubren 6 unidades y las «de
Alta Calidad» 36. Se resuelve **por cocinada**: lo que sobra de un ítem que
cubre varias unidades se pierde, no pasa a la siguiente. El «Valor» crudo que
publica bdocodex queda en el campo `vc` y se muestra en el tooltip cuando no
coincide con la equivalencia usada.

«Guardar preferencias» está en el panel desplegable de preferencias generales
(ratios y peso, para todas las recetas). «Guardar estado» está junto a la lista
de ingredientes y conserva el avance de **cada receta** por separado: cantidad,
precios, calidades, gastos tildados, imperiales y lo que ya conseguiste. Se
restaura al volver a abrirla, con un aviso que trae botón «Descartar».

Doble clic en la cantidad amarilla de un ingrediente puro permite ajustar toda
la receta a esa cantidad disponible. Enter o salir del campo aplica; Escape
cancela. También se puede abrir el editor con Tab y Enter. Se calculan las
máximas cocinadas completas posibles respetando los redondeos de cada
subreceta, y se conservan las cantidades ya conseguidas. Se aceptan enteros
como `1000` o `1.000`; si sobra material, se informa cuánto se utilizará.
