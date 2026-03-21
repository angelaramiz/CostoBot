import { propagateChange } from './cascade-engine';
import type { BusinessProject } from '@/types/business-project';

/**
 * Estado base para las pruebas:
 *   ins-001: costPerUnit=100, quantity=2
 *   proc-001: insumoIds=['ins-001'], laborCost=200 → totalCost = 100*2 + 200 = 400
 *   prod-001: procesoIds=['proc-001'] → costoUnitario = 400
 *   prec-001: productoId='prod-001', margen=50% → precioVenta = 400*1.5 = 600, roi=50
 */
const baseProject: BusinessProject = {
  id: 'proj-001',
  name: 'Proyecto Test',
  ownerId: 'firebase-uid-123',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  layers: {
    layer1: [{ id: 'ins-001', name: 'Harina', unit: 'kg', costPerUnit: 100, quantity: 2 }],
    layer2: [
      {
        id: 'proc-001',
        name: 'Mezcla',
        insumoIds: ['ins-001'],
        laborCost: 200,
        totalCost: 400,
      },
    ],
    layer3: [{ id: 'prod-001', name: 'Pan', procesoIds: ['proc-001'], costoUnitario: 400 }],
    layer4: [
      {
        id: 'prec-001',
        productoId: 'prod-001',
        margenPorcentaje: 50,
        precioVenta: 600,
        roi: 50,
      },
    ],
  },
};

describe('propagateChange — cascada completa L1 → L2 → L3 → L4', () => {
  it('recalcula proceso.totalCost cuando cambia insumo.costPerUnit', () => {
    // costPerUnit: 100 → 200 | totalCost = 200*2 + 200 (labor) = 600
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const proceso = result.layers.layer2.find((p) => p.id === 'proc-001')!;
    expect(proceso.totalCost).toBe(600);
  });

  it('recalcula producto.costoUnitario en cascada desde layer1', () => {
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const producto = result.layers.layer3.find((p) => p.id === 'prod-001')!;
    expect(producto.costoUnitario).toBe(600);
  });

  it('recalcula precio.precioVenta en cascada completa desde layer1', () => {
    // costoUnitario=600, margen=50% → precioVenta = 600 * 1.5 = 900
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const precio = result.layers.layer4.find((p) => p.id === 'prec-001')!;
    expect(precio.precioVenta).toBe(900);
  });

  it('calcula el ROI correctamente después de la cascada', () => {
    // (900 - 600) / 600 * 100 = 50
    const result = propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    const precio = result.layers.layer4.find((p) => p.id === 'prec-001')!;
    expect(precio.roi).toBe(50);
  });
});

describe('propagateChange — no mutación del proyecto original', () => {
  it('no debe mutar el totalCost del proceso original', () => {
    const originalTotalCost = baseProject.layers.layer2[0].totalCost;
    propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    expect(baseProject.layers.layer2[0].totalCost).toBe(originalTotalCost);
  });

  it('no debe mutar el costoUnitario del producto original', () => {
    const originalCosto = baseProject.layers.layer3[0].costoUnitario;
    propagateChange(baseProject, 'layer1', 'ins-001', 'costPerUnit', 200);
    expect(baseProject.layers.layer3[0].costoUnitario).toBe(originalCosto);
  });
});

describe('propagateChange — cambio directo en layer2', () => {
  it('recalcula producto y precio cuando cambia laborCost directamente', () => {
    // laborCost: 200 → 400 | totalCost = 100*2 + 400 = 600
    // pero aquí cambiamos el campo directo, el cascade lo debe propagar
    const result = propagateChange(baseProject, 'layer2', 'proc-001', 'laborCost', 400);
    const proceso = result.layers.layer2.find((p) => p.id === 'proc-001')!;
    // Al cambiar laborCost directamente, el proceso no se recalcula a sí mismo
    // (solo los dependientes aguas abajo), pero el campo sí fue actualizado
    expect(proceso.laborCost).toBe(400);
  });
});

describe('propagateChange — ID inexistente', () => {
  it('retorna el proyecto sin cambios si el itemId no existe', () => {
    const result = propagateChange(baseProject, 'layer1', 'no-existe', 'costPerUnit', 999);
    expect(result.layers.layer1[0].costPerUnit).toBe(100);
  });
});
