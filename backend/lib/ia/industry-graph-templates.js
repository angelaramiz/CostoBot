/**
 * industry-graph-templates.js — Plantillas de grafos pre-construidos por industria
 * Facilita que usuarios nuevos comiencen con una estructura de grafo base realista
 *
 * Cada template incluye:
 * - Nodos Layer 2 típicos: insumo → proceso → producto
 * - Margen recomendado y tarifas de servicios comunes
 * - Estructura lista para personalización
 *
 * Fase 4.1 Implementation
 */

const industryGraphTemplates = {
  panaderia: {
    industryName: 'Panadería / Pastelería',
    description: 'Grafo típico para pan, pasteles, galletas artesanales',
    recommendedMargin: 42, // 35-50% → default 42%
    recommendedTaxRate: 16, // IVA estándar Mexico
    services: [
      { name: 'Energía eléctrica horno', unit: 'kWh', baseRate: 2.50, estimatedUsage: 5 },
      { name: 'Gas/GLP', unit: 'kg', baseRate: 15, estimatedUsage: 2 },
      { name: 'Agua', unit: 'm³', baseRate: 20, estimatedUsage: 0.5 },
    ],
    sampleNodes: [
      {
        id: 'node-flour',
        name: 'Harina integral',
        category: 'insumo',
        costPerUnit: 12.50,
        unit: 'kg',
        defaultQuantity: 1,
      },
      {
        id: 'node-sugar',
        name: 'Azúcar cristal',
        category: 'insumo',
        costPerUnit: 8.00,
        unit: 'kg',
        defaultQuantity: 0.5,
      },
      {
        id: 'node-butter',
        name: 'Mantequilla',
        category: 'insumo',
        costPerUnit: 45.00,
        unit: 'kg',
        defaultQuantity: 0.25,
      },
      {
        id: 'node-yeast',
        name: 'Levadura',
        category: 'insumo',
        costPerUnit: 150.00,
        unit: 'kg',
        defaultQuantity: 0.02,
      },
      {
        id: 'node-packaging',
        name: 'Bolsa de papel + etiqueta',
        category: 'material',
        costPerUnit: 3.50,
        unit: 'pza',
        defaultQuantity: 1,
      },
      {
        id: 'process-mixing',
        name: 'Mezcla de ingredientes',
        category: 'proceso',
        laborCostPerUnit: 5.00,
        unit: 'lote',
        yield: 20, // 20 piezas por lote
      },
      {
        id: 'process-baking',
        name: 'Horneado',
        category: 'proceso',
        laborCostPerUnit: 8.00,
        unit: 'lote',
        yield: 1,
      },
      {
        id: 'product-bread',
        name: 'Pan integral artesanal',
        category: 'producto',
        costoUnitario: null, // Calculado por cascade
        defaultMargin: 42,
      },
    ],
    sampleEdges: [
      { source: 'node-flour', target: 'process-mixing', quantity: 1 },
      { source: 'node-sugar', target: 'process-mixing', quantity: 1 },
      { source: 'node-butter', target: 'process-mixing', quantity: 1 },
      { source: 'node-yeast', target: 'process-mixing', quantity: 1 },
      { source: 'process-mixing', target: 'process-baking', quantity: 1 },
      { source: 'process-baking', target: 'product-bread', quantity: 20 },
      { source: 'node-packaging', target: 'product-bread', quantity: 1 },
    ],
  },

  cosmeticos: {
    industryName: 'Cosméticos / Belleza artesanal',
    description: 'Grafo para cremas, jabones, sérum caseros',
    recommendedMargin: 70, // 60-80%
    recommendedTaxRate: 16,
    services: [
      { name: 'Energía eléctrica laboratorio', unit: 'kWh', baseRate: 3.00, estimatedUsage: 2 },
      { name: 'Agua destilada', unit: 'L', baseRate: 2.00, estimatedUsage: 5 },
    ],
    sampleNodes: [
      {
        id: 'node-oil-coconut',
        name: 'Aceite de coco virgen',
        category: 'insumo',
        costPerUnit: 120.00,
        unit: 'L',
        defaultQuantity: 0.2,
      },
      {
        id: 'node-oil-jojoba',
        name: 'Aceite de jojoba',
        category: 'insumo',
        costPerUnit: 180.00,
        unit: 'L',
        defaultQuantity: 0.1,
      },
      {
        id: 'node-beeswax',
        name: 'Cera de abeja',
        category: 'insumo',
        costPerUnit: 250.00,
        unit: 'kg',
        defaultQuantity: 0.05,
      },
      {
        id: 'node-fragrance',
        name: 'Esencia de lavanda',
        category: 'insumo',
        costPerUnit: 80.00,
        unit: 'mL',
        defaultQuantity: 5,
      },
      {
        id: 'node-container',
        name: 'Frasco de vidrio 100mL + etiqueta',
        category: 'material',
        costPerUnit: 15.00,
        unit: 'pza',
        defaultQuantity: 1,
      },
      {
        id: 'process-emulsify',
        name: 'Emulsificación + mezclado',
        category: 'proceso',
        laborCostPerUnit: 12.00,
        unit: 'lote',
        yield: 12, // 12 frascos por lote
      },
      {
        id: 'product-cream',
        name: 'Crema facial de lavanda',
        category: 'producto',
        costoUnitario: null,
        defaultMargin: 70,
      },
    ],
    sampleEdges: [
      { source: 'node-oil-coconut', target: 'process-emulsify', quantity: 1 },
      { source: 'node-oil-jojoba', target: 'process-emulsify', quantity: 1 },
      { source: 'node-beeswax', target: 'process-emulsify', quantity: 1 },
      { source: 'node-fragrance', target: 'process-emulsify', quantity: 1 },
      { source: 'process-emulsify', target: 'product-cream', quantity: 12 },
      { source: 'node-container', target: 'product-cream', quantity: 1 },
    ],
  },

  textil: {
    industryName: 'Textil / Confección',
    description: 'Grafo para prendas de ropa artesanal',
    recommendedMargin: 60, // 50-70%
    recommendedTaxRate: 16,
    services: [
      { name: 'Energía (máquina de coser)', unit: 'kWh', baseRate: 2.50, estimatedUsage: 1 },
      { name: 'Hilo industrial', unit: 'kg', baseRate: 200, estimatedUsage: 0.1 },
    ],
    sampleNodes: [
      {
        id: 'node-fabric',
        name: 'Tela de algodón 100% (metro)',
        category: 'insumo',
        costPerUnit: 45.00,
        unit: 'm',
        defaultQuantity: 1.5, // Desperdicio incluido
      },
      {
        id: 'node-button',
        name: 'Botones de madera',
        category: 'material',
        costPerUnit: 0.80,
        unit: 'pza',
        defaultQuantity: 5,
      },
      {
        id: 'node-elastic',
        name: 'Elástico para cintura',
        category: 'material',
        costPerUnit: 2.00,
        unit: 'm',
        defaultQuantity: 0.8,
      },
      {
        id: 'node-tag',
        name: 'Etiqueta bordada + empaque',
        category: 'material',
        costPerUnit: 3.50,
        unit: 'pza',
        defaultQuantity: 1,
      },
      {
        id: 'process-cutting',
        name: 'Corte de tela',
        category: 'proceso',
        laborCostPerUnit: 4.00,
        unit: 'prenda',
        yield: 1,
      },
      {
        id: 'process-sewing',
        name: 'Costura manual',
        category: 'proceso',
        laborCostPerUnit: 8.00,
        unit: 'prenda',
        yield: 1,
      },
      {
        id: 'product-shirt',
        name: 'Blusa de algodón talla M',
        category: 'producto',
        costoUnitario: null,
        defaultMargin: 60,
      },
    ],
    sampleEdges: [
      { source: 'node-fabric', target: 'process-cutting', quantity: 1 },
      { source: 'process-cutting', target: 'process-sewing', quantity: 1 },
      { source: 'node-button', target: 'process-sewing', quantity: 5 },
      { source: 'node-elastic', target: 'process-sewing', quantity: 1 },
      { source: 'process-sewing', target: 'product-shirt', quantity: 1 },
      { source: 'node-tag', target: 'product-shirt', quantity: 1 },
    ],
  },

  alimentos: {
    industryName: 'Alimentos / Cocina',
    description: 'Grafo para comida preparada o salsas caseras',
    recommendedMargin: 65, // 60-70%
    recommendedTaxRate: 16,
    services: [
      { name: 'Gas para cocina', unit: 'kg', baseRate: 18, estimatedUsage: 1 },
      { name: 'Agua', unit: 'L', baseRate: 0.50, estimatedUsage: 10 },
      { name: 'Energía eléctrica', unit: 'kWh', baseRate: 2.50, estimatedUsage: 0.5 },
    ],
    sampleNodes: [
      {
        id: 'node-tomato',
        name: 'Tomate fresco (kg)',
        category: 'insumo',
        costPerUnit: 8.00,
        unit: 'kg',
        defaultQuantity: 2,
      },
      {
        id: 'node-onion',
        name: 'Cebolla (kg)',
        category: 'insumo',
        costPerUnit: 5.00,
        unit: 'kg',
        defaultQuantity: 0.5,
      },
      {
        id: 'node-garlic',
        name: 'Ajo (kg)',
        category: 'insumo',
        costPerUnit: 25.00,
        unit: 'kg',
        defaultQuantity: 0.1,
      },
      {
        id: 'node-chile',
        name: 'Chile rojo (kg)',
        category: 'insumo',
        costPerUnit: 40.00,
        unit: 'kg',
        defaultQuantity: 0.2,
      },
      {
        id: 'node-salt',
        name: 'Sal / especias',
        category: 'material',
        costPerUnit: 3.00,
        unit: 'unidad',
        defaultQuantity: 1,
      },
      {
        id: 'node-jar',
        name: 'Frasco de vidrio 500mL',
        category: 'material',
        costPerUnit: 8.00,
        unit: 'pza',
        defaultQuantity: 1,
      },
      {
        id: 'process-cooking',
        name: 'Cocción y reducción',
        category: 'proceso',
        laborCostPerUnit: 10.00,
        unit: 'lote',
        yield: 4, // 4 frascos por lote
      },
      {
        id: 'product-salsa',
        name: 'Salsa roja casera',
        category: 'producto',
        costoUnitario: null,
        defaultMargin: 65,
      },
    ],
    sampleEdges: [
      { source: 'node-tomato', target: 'process-cooking', quantity: 2 },
      { source: 'node-onion', target: 'process-cooking', quantity: 1 },
      { source: 'node-garlic', target: 'process-cooking', quantity: 1 },
      { source: 'node-chile', target: 'process-cooking', quantity: 1 },
      { source: 'node-salt', target: 'process-cooking', quantity: 1 },
      { source: 'process-cooking', target: 'product-salsa', quantity: 4 },
      { source: 'node-jar', target: 'product-salsa', quantity: 1 },
    ],
  },

  servicios: {
    industryName: 'Servicios profesionales',
    description: 'Grafo para consultoría, diseño, capacitación',
    recommendedMargin: 75, // 70-90%
    recommendedTaxRate: 16,
    services: [
      { name: 'Computadora / laptop', unit: 'hora', baseRate: 5.00, estimatedUsage: 8 }, // Depreciation
      { name: 'Software/licencias', unit: 'mes', baseRate: 500, estimatedUsage: 0.1 },
    ],
    sampleNodes: [
      {
        id: 'node-labor-senior',
        name: 'Hora de trabajo especialista senior',
        category: 'insumo',
        costPerUnit: 250.00,
        unit: 'hora',
        defaultQuantity: 20,
      },
      {
        id: 'node-labor-junior',
        name: 'Hora de trabajo asistente junior',
        category: 'insumo',
        costPerUnit: 100.00,
        unit: 'hora',
        defaultQuantity: 10,
      },
      {
        id: 'node-templates',
        name: 'Templates/materiales preparados',
        category: 'material',
        costPerUnit: 50.00,
        unit: 'actividad',
        defaultQuantity: 1,
      },
      {
        id: 'process-research',
        name: 'Investigación y análisis',
        category: 'proceso',
        laborCostPerUnit: 0, // Ya incluido en labor
        unit: 'proyecto',
        yield: 1,
      },
      {
        id: 'process-delivery',
        name: 'Entrega y capacitación',
        category: 'proceso',
        laborCostPerUnit: 0,
        unit: 'proyecto',
        yield: 1,
      },
      {
        id: 'product-consulting',
        name: 'Servicio de consultoría completo',
        category: 'producto',
        costoUnitario: null,
        defaultMargin: 75,
      },
    ],
    sampleEdges: [
      { source: 'node-labor-senior', target: 'process-research', quantity: 20 },
      { source: 'node-labor-junior', target: 'process-research', quantity: 10 },
      { source: 'node-templates', target: 'process-research', quantity: 1 },
      { source: 'process-research', target: 'process-delivery', quantity: 1 },
      { source: 'process-delivery', target: 'product-consulting', quantity: 1 },
    ],
  },
};

/**
 * Obtiene la plantilla de grafo para una industria
 * @param {string} industry — key de industria (ej: 'panaderia', 'cosmeticos')
 * @returns {Object|null} — template o null si no existe
 */
function getGraphTemplate(industry) {
  return industryGraphTemplates[industry] ?? null;
}

/**
 * Lista todos los indices de industrias disponibles
 * @returns {Array<string>}
 */
function getAvailableIndustries() {
  return Object.keys(industryGraphTemplates);
}

module.exports = {
  industryGraphTemplates,
  getGraphTemplate,
  getAvailableIndustries,
};
