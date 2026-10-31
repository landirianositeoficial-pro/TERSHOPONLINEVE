# Tershop Online VE

Versión 1.2 de la tienda estática, preparada para probarse localmente y desplegarse en GitHub Pages.

## Archivos
- `index.html`: estructura de la tienda y SEO base.
- `styles.css`: contiene solo los estilos complementarios; el diseño original se conserva en el HTML y se guarda una copia del CSS recibido en `respaldo/`.
- `tershop-commerce.js`: motor del catálogo de franelas, variantes, precios, carrito y envío a WhatsApp.
- `catalogo.js`: manifiesto público de diseños para que todos los visitantes vean el mismo catálogo en GitHub Pages.
- `LOGO/`, `PRODUCTOS/`, `REDES/`, `FONDO-DE-PAGINA-WEB/`: imágenes organizadas por tipo.
- `respaldo/`: JavaScript original y archivos de precios/colores recibidos. No se cargan en la página.

## Flujo de compra
1. El cliente elige Dama, Caballero o Niños/Niñas.
2. Selecciona modalidad, talla, color y cantidad.
3. Si elige catálogo, selecciona el diseño principal incluido y puede seleccionar otros diseños del catálogo como adicionales.
4. Si elige personalizado, indica cuántos diseños adicionales necesita y en qué zonas de la franela.
5. El carrito permite cambiar cantidades, eliminar líneas y continuar explorando.
6. El cliente completa nombre, teléfono y ubicación; el pedido se envía a WhatsApp Business.
7. Al iniciar el envío a WhatsApp, el carrito local se vacía para una nueva compra.

## Tarifas cargadas

| Modalidad | Tallas regulares detal | Tallas regulares mayor | 2XL–3XL detal | 2XL–3XL mayor |
|---|---:|---:|---:|---:|
| Unicolor | $5.00 | $2.96 | $6.00 | $5.50 |
| Sublimado de catálogo | $6.00 | $4.20 | $7.00 | $5.90 |
| Sublimado personalizado | $6.50 | $4.90 | $8.00 | $6.80 |

- Diseño principal de catálogo: incluido en el precio base.
- Cada diseño adicional de catálogo: +$0.60 por franela.
- Diseño personalizado principal: incluido en el precio base.
- Cada diseño adicional personalizado: +$0.75 por franela.
- Los adicionales se multiplican por la cantidad de franelas de esa línea.
- Tallas 4XL, 5XL y 6XL: se envían a cotización; solo se permite continuar cuando el pedido total supera 100 unidades. El precio y los colores se confirman por WhatsApp.

## Regla mayorista confirmada

El precio mayorista se activa desde **4 unidades en total dentro del carrito**. Las unidades se suman entre todas las líneas: el cliente puede combinar libremente género (dama, caballero y niños), tallas, colores y modalidades (unicolor, sublimado de catálogo y sublimado personalizado). Al llegar a 4 unidades, el sistema aplica automáticamente los precios mayoristas a las líneas elegibles del pedido completo.

La regla está centralizada en `tershop-commerce.js`, en `WHOLESALE_MIN` (valor confirmado: `4`). Si en el futuro se desea cambiar el mínimo, se puede configurar con `window.TERSHOP_WHOLESALE_MIN` antes de cargar el motor de comercio.

## Catálogo de diseños

El catálogo público se lee desde `catalogo.js`, para que todos los visitantes vean las mismas colecciones. Ya están creadas las 17 carpetas con los nombres que indicó el negocio dentro de `CATALOGO-DE-DISENO/`. El manifiesto espera `1.webp` como primera imagen de cada carpeta. Para añadir el resto de imágenes de una colección, registra sus rutas en la propiedad `imagenes` de esa colección en `catalogo.js`.

**Importante:** el ZIP de origen V1.1 contenía el archivo de instrucciones del catálogo, pero no incluía los archivos de imagen de esas 17 carpetas. Por eso esta versión prepara las carpetas y las rutas, pero no puede mostrar los diseños reales hasta copiar los `.webp` dentro de sus carpetas correspondientes. GitHub Pages no puede descubrir automáticamente todos los archivos de una carpeta; por eso hay que mantener el manifiesto `catalogo.js`.

La interfaz permite elegir un diseño principal y diseños adicionales del catálogo. Antes de publicar, comprueba que cada ruta del manifiesto coincida exactamente con el nombre real del archivo (incluyendo mayúsculas, minúsculas y extensión).

## Nuevos productos

El archivo `tershop-commerce.js` expone `window.TERSHOP_CATALOG_SCHEMA` como esqueleto para categorías futuras: tazas, gorras, pantalones, zapatos, uniformes y otras prendas. No se activan precios de productos futuros hasta que se definan sus reglas comerciales.

## Redes y WhatsApp
- Facebook: https://www.facebook.com/profile.php?id=61573316013361
- TikTok: https://www.tiktok.com/@tershoponline
- WhatsApp: https://wa.me/message/OONJORDXA2NYA1
- Número de pedidos: +584242674477

## Probar localmente en Windows 11
1. Descomprime la carpeta.
2. Abre `index.html` con Chrome o Edge.
3. Para probar catálogo y rutas de imágenes, es preferible usar un servidor local sencillo (por ejemplo, la extensión Live Server de VS Code), no abrirlo desde una vista previa de texto.

## Publicar en GitHub Pages
1. Crea o abre el repositorio de GitHub donde vivirá la tienda.
2. Sube **todo el contenido de esta carpeta**, respetando subcarpetas y nombres.
3. En Settings → Pages, elige Deploy from a branch, rama `main` y carpeta `/ (root)`.
4. Guarda y espera el enlace de publicación.
5. Cuando tengas la URL definitiva, actualiza `robots.txt` con la ruta del sitemap y añade `sitemap.xml` con esa URL real.

## Antes de anunciar la tienda
- El mínimo mayorista ya está confirmado: 4 unidades combinadas entre las distintas variantes.
- Compartir e integrar las carpetas reales del catálogo de diseños.
- Confirmar el precio y las tallas de franelas de algodón; no se habilitaron porque el archivo recibido no coincide con los precios indicados en tu mensaje más reciente.
- Probar en un teléfono real que el mensaje abre correctamente WhatsApp y que el pedido se copia completo.
- Confirmar política de envío y costos por región antes de publicar textos de entrega.

## Cambios de diseño V1.2
- Oscurecimiento suave de los fondos fotográficos de Hero, Productos, Catálogo, Ubicación y Preguntas frecuentes mediante `background-blend-mode: multiply`.
- Mayor contraste en subtítulos y textos del pie de página sin aclarar los textos de formularios y paneles blancos.
- Pie de página rediseñado para pantallas estrechas: columnas apiladas, enlaces con salto de línea, iconos flexibles y contención del ancho para evitar desbordamiento horizontal.
- Carpeta de fondos renombrada a `FONDO-DE-PAGINA-WEB/`; las referencias locales del HTML se actualizaron.


## V1.3 — catálogo automático y adaptación responsive

### Agregar diseños sin escribir sus nombres
1. Copia las imágenes `.webp` directamente dentro de la colección correspondiente en `CATALOGO-DE-DISENO/` (por ejemplo `CATALOGO-DE-DISENO/CATALOGO-CABALLERO/`).
2. Puedes conservar nombres numéricos como `1.webp`, `2.webp`, `003.webp`, etc. El generador ordena los números naturalmente y crea etiquetas automáticas como `Caballero · Diseño 001`.
3. En Windows ejecuta `GENERAR-CATALOGO.bat` después de agregar imágenes.
4. Sube los cambios a GitHub. El workflow `.github/workflows/actualizar-catalogo.yml` también genera `catalogo.js` automáticamente al detectar cambios en `CATALOGO-DE-DISENO/` (requiere GitHub Actions habilitado y permiso de escritura del workflow).

**Límite técnico:** una página estática de GitHub Pages no puede enumerar por sí sola el contenido de una carpeta del servidor. Por eso se genera un índice `catalogo.js` durante el proceso de publicación; no hace falta escribir a mano los nombres ni rutas de cada imagen.

### Diseño adaptable
V1.3 refuerza contraste de preguntas frecuentes, reduce desbordamientos horizontales y adapta el pie de página a pantallas de escritorio, tablet y móvil.
