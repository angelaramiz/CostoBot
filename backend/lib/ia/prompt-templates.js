/**
 * prompt-templates.js — Plantillas de prompts por industria para CostoBot.
 * Añaden contexto especializado al system prompt en modo 'project'.
 */
'use strict';

/**
 * Mapa de industria → guía contextual para el asistente.
 * Cada entrada tiene:
 *  - keywords: palabras clave en nombres de insumos/productos para detectar la industria
 *  - guidance: bloque de texto que se inyecta en el system prompt
 */
const INDUSTRY_TEMPLATES = {
  panaderia: {
    keywords: ['harina', 'azúcar', 'azucar', 'levadura', 'mantequilla', 'manteca', 'leche', 'huevo', 'pan', 'pastel', 'galleta', 'masa', 'trigo'],
    label: 'Panadería / Pastelería',
    guidance: `INDUSTRIA DETECTADA: Panadería / Pastelería
Contexto especializado para este negocio:
- Los insumos más críticos son: harina, levadura, mantequilla y azúcar. Analiza si son los de mayor costo.
- El rendimiento (yield) del grafo de producto es clave: cuántas piezas salen por lote.
- Considera el punto de equilibrio por número de piezas vendidas al día.
- Los servicios de gas/electricidad para hornos son costos fijos importantes a incluir en Capa 3.
- El margen típico para panadería artesanal es 35-50%. Si es menor, sugiere revisión de costos.
- Preguntas útiles a responder: ¿cuántas piezas al día necesita vender para cubrir costos fijos?`,
  },

  cosmeticos: {
    keywords: ['cera', 'aceite', 'esencia', 'perfume', 'crema', 'labial', 'manteca', 'glicerina', 'colorante', 'conservante', 'emulsificante', 'fragancia'],
    label: 'Cosméticos / Belleza artesanal',
    guidance: `INDUSTRIA DETECTADA: Cosméticos / Belleza artesanal
Contexto especializado para este negocio:
- El costo de materias primas (aceites, ceras, esencias) suele ser el 40-60% del precio final.
- El margen estándar en cosméticos artesanales es 60-80% para cubrir tiempo de elaboración y packaging.
- Los insumos de packaging (envases, etiquetas) deben estar en Capa 1 como categoría 'material'.
- Los servicios eléctricos para equipos (mezcladora, selladora) van en Capa 3.
- El ROI esperado en cosméticos artesanales es usualmente > 50%.
- Considera costos de certificación o regulación sanitaria como gasto extra en Capa 3.`,
  },

  textil: {
    keywords: ['tela', 'hilo', 'botón', 'boton', 'zipper', 'cierre', 'elástico', 'elastico', 'aguja', 'ropa', 'camisa', 'pantalón', 'pantalon', 'vestido', 'costura'],
    label: 'Textil / Confección',
    guidance: `INDUSTRIA DETECTADA: Textil / Confección
Contexto especializado para este negocio:
- El costo de tela por metro / la eficiencia de corte son críticos. Revisa si hay desperdicio calculado.
- La mano de obra (tiempo de costura) debe modelarse como nodo de proceso en Capa 2.
- El margen típico en confección artesanal es 50-70% dependiendo del tipo de prenda.
- Los insumos de packaging (bolsas, etiquetas, cajas) son parte del costo total por pieza.
- Para líneas de ropa considera el costo por talla — puede variar el consumo de tela.`,
  },

  alimentos: {
    keywords: ['sal', 'pimienta', 'chile', 'salsa', 'caldo', 'pollo', 'carne', 'res', 'cerdo', 'tomate', 'jitomate', 'cebolla', 'ajo', 'limón', 'limon', 'tortilla', 'queso', 'crema'],
    label: 'Alimentos / Cocina',
    guidance: `INDUSTRIA DETECTADA: Alimentos / Cocina
Contexto especializado para este negocio:
- El merma (pérdida en cocción, corte, limpieza) es un factor crítico. Revisar el yield del grafo.
- Los costos de gas/agua/electricidad son significativos — incluir como servicios en Capa 3.
- Los insumos perecederos tienen fluctuación de precios. Actualizar costos regularmente.
- El margen en comida preparada es generalmente 60-70% sobre el costo de insumos.
- Calcular el costo por porción es clave para definir precios de menú.`,
  },

  servicios: {
    keywords: ['hora', 'servicio', 'software', 'licencia', 'consulta', 'asesoría', 'asesoria', 'diseño', 'diseño', 'capacitacion', 'capacitación', 'formacion'],
    label: 'Servicios profesionales',
    guidance: `INDUSTRIA DETECTADA: Servicios profesionales
Contexto especializado para este negocio:
- El principal insumo es el tiempo (costo por hora). Asegúrate de que esté en Capa 1.
- Las herramientas y licencias de software son insumos de categoría 'maquina' o 'material'.
- El margen en servicios puede ser muy alto (70-90%) si el costo de herramientas es bajo.
- Considera costos fijos mensuales (renta, internet, energía) divididos entre proyectos activos.
- El ROI en servicios refleja qué tan bien se cubre el costo del tiempo invertido.`,
  },

  reventa: {
    keywords: ['producto terminado', 'paquete', 'caja', 'unidad', 'lote', 'mayoreo'],
    label: 'Reventa / Retail',
    guidance: `INDUSTRIA DETECTADA: Reventa / Retail
Contexto especializado para este negocio:
- En reventa, el costo principal es el precio de compra. Revisar si está correctamente registrado.
- El margen típico en reventa es 20-40% dependiendo de la rotación de inventario.
- Los gastos operativos (envío, almacenamiento) deben estar en los servicios de Capa 3.
- Considera el volumen de compra: más unidades = menor costo por unidad (economías de escala).
- El ROI en reventa suele ser menor que en fabricación — la velocidad de venta es crítica.`,
  },
};

/**
 * Detecta la industria probable del proyecto basándose en los nombres de insumos y productos.
 * @param {Array<{name: string, category: string}>} layer1 — insumos del proyecto
 * @param {Array<{mainProduct?: {name?: string}}>} layer2 — grafos de producto
 * @returns {string} — clave de INDUSTRY_TEMPLATES, o 'default'
 */
function detectIndustry(layer1 = [], layer2 = []) {
  const allNames = [
    ...layer1.map((i) => (i.name ?? '').toLowerCase()),
    ...layer2.map((g) => (g.mainProduct?.name ?? g.productId ?? '').toLowerCase()),
  ].join(' ');

  let bestMatch = null;
  let bestScore = 0;

  for (const [key, template] of Object.entries(INDUSTRY_TEMPLATES)) {
    const score = template.keywords.filter((kw) => allNames.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }

  // Requiere al menos 1 keyword coincidente para considerar la industria
  return bestScore > 0 ? bestMatch : 'default';
}

/**
 * Retorna el bloque de texto de guía especializada para la industria dada.
 * @param {string} industry — clave de industria (resultado de detectIndustry)
 * @returns {string}
 */
function getIndustryGuidance(industry) {
  return INDUSTRY_TEMPLATES[industry]?.guidance ?? '';
}

/**
 * Retorna la etiqueta legible de una industria.
 * @param {string} industry
 * @returns {string}
 */
function getIndustryLabel(industry) {
  return INDUSTRY_TEMPLATES[industry]?.label ?? 'General';
}

module.exports = { detectIndustry, getIndustryGuidance, getIndustryLabel, INDUSTRY_TEMPLATES };
