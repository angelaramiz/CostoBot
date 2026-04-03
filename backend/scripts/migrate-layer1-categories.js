/**
 * migrate-layer1-categories.js
 *
 * Script de migración de Layer 1: normaliza los insumos existentes
 * que tengan category fuera del nuevo enum (añade soporte para 'material').
 *
 * No destruye datos. Los insumos con category válida no se tocan.
 * Sólo actualiza documentos con category inválida o faltante.
 *
 * Uso:
 *   node backend/scripts/migrate-layer1-categories.js
 *
 * Requiere DATABASE_URL en el entorno (.env o variables de entorno).
 */
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');

const VALID_CATEGORIES = new Set(['ingrediente', 'maquina', 'utensilio', 'material']);
const FALLBACK_CATEGORY = 'ingrediente';

async function run() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('ERROR: DATABASE_URL no está configurado en .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Conectado a MongoDB.');

  const db = mongoose.connection.db;
  const collection = db.collection('businessprojects');

  // Buscar documentos que tengan algún insumo con categoría inválida
  const cursor = collection.find({
    'layers.layer1': {
      $elemMatch: {
        category: { $nin: Array.from(VALID_CATEGORIES) },
      },
    },
  });

  let updated = 0;
  let totalFixed = 0;

  for await (const doc of cursor) {
    const layer1 = Array.isArray(doc.layers?.layer1) ? doc.layers.layer1 : [];
    let changed = false;

    const fixedLayer1 = layer1.map((insumo) => {
      if (!VALID_CATEGORIES.has(insumo.category)) {
        console.log(
          `  [${doc._id}] Insumo "${insumo.name}" category="${insumo.category}" → "${FALLBACK_CATEGORY}"`
        );
        changed = true;
        totalFixed++;
        return { ...insumo, category: FALLBACK_CATEGORY };
      }
      return insumo;
    });

    if (changed) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: { 'layers.layer1': fixedLayer1 } }
      );
      updated++;
    }
  }

  console.log(`\nMigración completada:`);
  console.log(`  Documentos actualizados: ${updated}`);
  console.log(`  Insumos corregidos:      ${totalFixed}`);
  console.log('  (Los insumos con categoría válida no fueron tocados)');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Error durante la migración:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
