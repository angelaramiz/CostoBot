/**
 * BusinessProject.model.js — CostoBot Backend
 * Mongoose schema y modelo para los proyectos de negocio.
 * Arquitectura de 3 capas: Insumos → Productos (grafos) → Precios.
 * Todas las cantidades monetarias se almacenan en centavos (enteros).
 */
'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Layer 1: Insumos ────────────────────────────────────────────────────────
const InsumoSchema = new Schema(
  {
    id:               { type: String,  required: true },
    name:             { type: String,  required: true },
    unit:             { type: String,  required: true },
    costPerUnit:      { type: Number,  required: true, min: 0 }, // centavos
    category:         { type: String,  required: true, enum: ['ingrediente', 'maquina', 'utensilio', 'material'] },
    isReusable:       { type: Boolean, required: true, default: false },
    // Campos de depreciación (opcionales, para maquina/utensilio)
    acquisitionCost:  { type: Number, min: 0 },
    usefulLifeMonths: { type: Number, min: 1 },
    residualValue:    { type: Number, min: 0 },
    // Campos de material (opcionales, para material)
    supplier:         { type: String },
    sku:              { type: String },
    // Campos de paquete (cuando unit === 'paquete')
    packageQuantity:  { type: Number, min: 0.001 },
    packageUnit:      { type: String },
  },
  { _id: false }
);

// ── Layer 2: Grafos de Productos ────────────────────────────────────────────

const NodePositionSchema = new Schema(
  { x: { type: Number, required: true }, y: { type: Number, required: true } },
  { _id: false }
);

const ProductNodeSchema = new Schema(
  {
    id:       { type: String, required: true },
    type:     { type: String, required: true, enum: ['ingredient', 'utensil', 'machine', 'resultado', 'export', 'import'] },
    position: { type: NodePositionSchema, required: true },
    data:     { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const EdgeDataSchema = new Schema(
  {
    quantityUsed: { type: Number },
    unit:         { type: String },
    timeUsed:     { type: Number },
  },
  { _id: false }
);

const ProductEdgeSchema = new Schema(
  {
    id:     { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    data:   { type: EdgeDataSchema },
  },
  { _id: false }
);

const ProductGraphSchema = new Schema(
  {
    productId:     { type: String, required: true },
    productName:   { type: String, required: true },
    version:       { type: String, required: true, default: '1.0' },
    nodes:         { type: [ProductNodeSchema], default: [] },
    edges:         { type: [ProductEdgeSchema], default: [] },
    totalCost:     { type: Number, required: true, min: 0, default: 0 },
    laborCost:     { type: Number, required: true, min: 0, default: 0 },
    // Consumo de servicios por unidad (ej: { electricity: 2.5 } → 2.5 kWh/unidad)
    servicesUsage: { type: Map, of: Number, default: undefined },
  },
  { _id: false }
);

// ── Layer 3: Precios, Servicios e Impuestos ─────────────────────────────────

const ServiceRateSchema = new Schema(
  {
    baseRate: { type: Number, required: true, min: 0 },
    unit:     { type: String, required: true },
    currency: { type: String, required: true },
  },
  { _id: false }
);

const TaxConfigSchema = new Schema(
  {
    rate:    { type: Number, required: true, min: 0, max: 1 },
    enabled: { type: Boolean, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const CostBreakdownSchema = new Schema(
  {
    ingredients: { type: Number, required: true, min: 0, default: 0 },
    machines:    { type: Number, required: true, min: 0, default: 0 },
    utensils:    { type: Number, required: true, min: 0, default: 0 },
    services:    { type: Number, required: true, min: 0, default: 0 },
    labor:       { type: Number, required: true, min: 0, default: 0 },
    totalCost:   { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const ProductPricingSchema = new Schema(
  {
    productId:        { type: String, required: true },
    productName:      { type: String, required: true },
    costBreakdown:    { type: CostBreakdownSchema, required: true },
    margenPorcentaje: { type: Number, required: true, min: 0 },
    precioVenta:      { type: Number, required: true, min: 0 }, // centavos, calculado
    ganancia:         { type: Number, required: true }, // ganancia en centavos
  },
  { _id: false }
);

const Layer3PreciosSchema = new Schema(
  {
    version:   { type: String, required: true, default: '1.0' },
    updatedAt: { type: String },
    services:  { type: Map, of: ServiceRateSchema, default: new Map() },
    taxes:     { type: Map, of: TaxConfigSchema, default: new Map() },
    products:  { type: [ProductPricingSchema], default: [] },
  },
  { _id: false }
);

// ── BusinessProject ─────────────────────────────────────────────────────────
const BusinessProjectSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true }, // Firebase UID
    name:    { type: String, required: true, maxlength: 200 },
    layers: {
      layer1: { type: [InsumoSchema],       default: [] },
      layer2: { type: [ProductGraphSchema],  default: [] },
      layer3: { type: Layer3PreciosSchema,   default: () => ({ version: '1.0', services: {}, taxes: {}, products: [] }) },
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

// Índice compuesto para listar proyectos del usuario ordenados por última modificación
BusinessProjectSchema.index({ ownerId: 1, updatedAt: -1 });

module.exports = mongoose.model('BusinessProject', BusinessProjectSchema);
