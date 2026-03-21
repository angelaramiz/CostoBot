/**
 * BusinessProject.model.js — CostoBot Backend
 * Mongoose schema y modelo para los proyectos de negocio.
 * Todas las cantidades monetarias se almacenan en centavos (enteros).
 */
'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ── Layer 1: Insumos ────────────────────────────────────────────────────────
const InsumoSchema = new Schema(
  {
    id:          { type: String, required: true },
    name:        { type: String, required: true },
    unit:        { type: String, required: true },
    costPerUnit: { type: Number, required: true, min: 0 }, // centavos
    quantity:    { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// ── Layer 2: Procesos ───────────────────────────────────────────────────────
const ProcesoSchema = new Schema(
  {
    id:         { type: String, required: true },
    name:       { type: String, required: true },
    insumoIds:  [{ type: String }],
    laborCost:  { type: Number, required: true, min: 0 }, // centavos
    totalCost:  { type: Number, required: true, min: 0 }, // centavos, calculado
  },
  { _id: false }
);

// ── Layer 3: Productos ──────────────────────────────────────────────────────
const ProductoSchema = new Schema(
  {
    id:            { type: String, required: true },
    name:          { type: String, required: true },
    procesoIds:    [{ type: String }],
    costoUnitario: { type: Number, required: true, min: 0 }, // centavos, calculado
  },
  { _id: false }
);

// ── Layer 4: Precios ────────────────────────────────────────────────────────
const PrecioSchema = new Schema(
  {
    id:               { type: String, required: true },
    productoId:       { type: String, required: true },
    margenPorcentaje: { type: Number, required: true, min: 0 },
    precioVenta:      { type: Number, required: true, min: 0 }, // centavos, calculado
    roi:              { type: Number, required: true },
  },
  { _id: false }
);

// ── BusinessProject ─────────────────────────────────────────────────────────
const BusinessProjectSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true }, // Firebase UID
    name:    { type: String, required: true, maxlength: 200 },
    layers: {
      layer1: { type: [InsumoSchema],   default: [] },
      layer2: { type: [ProcesoSchema],  default: [] },
      layer3: { type: [ProductoSchema], default: [] },
      layer4: { type: [PrecioSchema],   default: [] },
    },
  },
  {
    timestamps: true, // agrega createdAt y updatedAt automáticamente
  }
);

// Índice compuesto para listar proyectos del usuario ordenados por última modificación
BusinessProjectSchema.index({ ownerId: 1, updatedAt: -1 });

module.exports = mongoose.model('BusinessProject', BusinessProjectSchema);
