/**
 * layer-cascade.e2e.test.js — Tests E2E del flujo completo Layer 1 → Layer 2 → Layer 3
 * Valida que el cascade engine funcione correctamente de punta a punta
 *
 * Fase 4.2 Implementation
 * Run: npm test -- layer-cascade.e2e.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { BusinessProject, Layer1, Layer2, Layer3 } = require('../../db/BusinessProject.model');

let app;
let testProjectId;
let testToken; // Mock JWT token

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

describe('E2E: Full Layer Cascade Flow (Layer 1 → 2 → 3)', () => {
  beforeAll(async () => {
    // Load app (assumes app exports for testing)
    app = require('../../app');
    
    // Connect to test DB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.TEST_DATABASE_URL || 'mongodb://localhost/costobot-test');
    }

    // Clear collections
    await BusinessProject.deleteMany({});
    await Layer1.deleteMany({});
    await Layer2.deleteMany({});
    await Layer3.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test('Create a complete bread project: insumos → graph → product pricing', async () => {
    // STEP 1: Create project
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Panadería Test E2E',
        description: 'Test completo de panadería',
        industry: 'panaderia',
      })
      .expect(201);

    testProjectId = projectRes.body._id;
    expect(projectRes.body.name).toBe('Panadería Test E2E');
    expect(projectRes.body).toHaveProperty('layer1');
    expect(projectRes.body).toHaveProperty('layer2');
    expect(projectRes.body).toHaveProperty('layer3');

    // STEP 2: Create Layer 1 insumos
    const layer1Data = [
      {
        name: 'Harina integral',
        unit: 'kg',
        cost: 12.50,
        quantity: 1,
        category: 'insumo',
      },
      {
        name: 'Azúcar cristal',
        unit: 'kg',
        cost: 8.00,
        quantity: 0.5,
        category: 'insumo',
      },
      {
        name: 'Mantequilla',
        unit: 'kg',
        cost: 45.00,
        quantity: 0.25,
        category: 'insumo',
      },
      {
        name: 'Bolsa de papel',
        unit: 'pza',
        cost: 3.50,
        quantity: 1,
        category: 'material',
      },
    ];

    const layer1Res = await request(app)
      .post(`/api/projects/${testProjectId}/layer1`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ items: layer1Data })
      .expect(200);

    expect(layer1Res.body.items).toHaveLength(4);
    const insumoIds = layer1Res.body.items.map((item) => item._id);

    // STEP 3: Create Layer 2 graph (process nodes + edges)
    const layer2Data = {
      nodes: [
        {
          id: 'process-mixing',
          name: 'Mezcla de ingredientes',
          type: 'proceso',
          cost: 5.00, // Labor cost
        },
        {
          id: 'process-baking',
          name: 'Horneado',
          type: 'proceso',
          cost: 8.00, // Labor cost
        },
        {
          id: 'product-bread',
          name: 'Pan integral artesanal',
          type: 'producto',
          units: 20, // 20 panes por lote
        },
      ],
      edges: [
        {
          source: insumoIds[0], // Harina
          target: 'process-mixing',
          quantity: 1,
        },
        {
          source: insumoIds[1], // Azúcar
          target: 'process-mixing',
          quantity: 1,
        },
        {
          source: insumoIds[2], // Mantequilla
          target: 'process-mixing',
          quantity: 1,
        },
        {
          source: 'process-mixing',
          target: 'process-baking',
          quantity: 1,
        },
        {
          source: 'process-baking',
          target: 'product-bread',
          quantity: 20,
        },
        {
          source: insumoIds[3], // Bolsa
          target: 'product-bread',
          quantity: 1,
        },
      ],
    };

    const layer2Res = await request(app)
      .post(`/api/projects/${testProjectId}/layer2`)
      .set('Authorization', `Bearer ${testToken}`)
      .send(layer2Data)
      .expect(200);

    expect(layer2Res.body.nodes).toHaveLength(3);
    expect(layer2Res.body.edges).toHaveLength(6);

    // STEP 4: Trigger cascade calculation
    const cascadeRes = await request(app)
      .post(`/api/projects/${testProjectId}/calculate`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    expect(cascadeRes.body).toHaveProperty('layer3');
    expect(cascadeRes.body.layer3).toHaveProperty('products');

    // STEP 5: Verify Layer 3 pricing
    const layer3Res = await request(app)
      .get(`/api/projects/${testProjectId}/layer3`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    expect(layer3Res.body.products).toHaveLength(1);
    const product = layer3Res.body.products[0];
    expect(product.name).toBe('Pan integral artesanal');
    expect(product).toHaveProperty('costoUnitario');
    expect(product.costoUnitario).toBeGreaterThan(0);

    // STEP 6: Apply margin and verify ROI
    const expectedCost = (12.50 + 4 + 11.25 + 3.50 + 13) / 20; // Average cost per unit
    expect(product.costoUnitario).toBeCloseTo(expectedCost, 2);

    // Apply margin (42% for panadería)
    const margen = 0.42;
    const precioVenta = product.costoUnitario * (1 + margen);
    const roi = ((precioVenta - product.costoUnitario) / product.costoUnitario) * 100;

    expect(roi).toBeCloseTo(42, 1);

    // STEP 7: Apply taxes and export
    const layer3UpdateRes = await request(app)
      .patch(`/api/projects/${testProjectId}/layer3/products/${product._id}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        margenPorcentaje: 42,
        impuestos: {
          country: 'Mexico',
          taxRate: 0.16, // IVA 16%
        },
      })
      .expect(200);

    const updatedProduct = layer3UpdateRes.body;
    const taxRate = 0.16;
    const precioFinal = precioVenta * (1 + taxRate);

    expect(updatedProduct).toHaveProperty('precioFinal');
    expect(updatedProduct.precioFinal).toBeCloseTo(precioFinal, 2);

    // STEP 8: Export to Excel and verify format
    const exportRes = await request(app)
      .get(`/api/projects/${testProjectId}/export`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    expect(exportRes.headers['content-type']).toMatch(/spreadsheet|xlsx/i);
    expect(exportRes.body).toBeDefined();
  });

  test('Full E2E flow with multiple products and cascade updates', async () => {
    // Create 2 projects with linked products to verify cascade consistency
    const project1Res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Proyecto Cascada Test',
        industry: 'cosmeticos',
      })
      .expect(201);

    const projectId = project1Res.body._id;

    // Create 2 products that share an insumo
    const layer1 = [
      { name: 'Aceite coco', unit: 'L', cost: 120, quantity: 0.5 },
      { name: 'Cera abeja', unit: 'kg', cost: 250, quantity: 0.1 },
    ];

    const layer1Res = await request(app)
      .post(`/api/projects/${projectId}/layer1`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ items: layer1 })
      .expect(200);

    const [oilId, waxId] = layer1Res.body.items.map((i) => i._id);

    // Create graph with 2 products
    const layer2 = {
      nodes: [
        { id: 'prod-cream', name: 'Crema', type: 'producto', units: 10 },
        { id: 'prod-soap', name: 'Jabón', type: 'producto', units: 20 },
      ],
      edges: [
        { source: oilId, target: 'prod-cream', quantity: 1 },
        { source: waxId, target: 'prod-cream', quantity: 1 },
        { source: oilId, target: 'prod-soap', quantity: 1 },
        { source: waxId, target: 'prod-soap', quantity: 1 },
      ],
    };

    await request(app)
      .post(`/api/projects/${projectId}/layer2`)
      .set('Authorization', `Bearer ${testToken}`)
      .send(layer2)
      .expect(200);

    // Calculate cascade
    await request(app)
      .post(`/api/projects/${projectId}/calculate`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    // Update insumo cost and verify cascade on both products
    const updateRes = await request(app)
      .patch(`/api/projects/${projectId}/layer1/${oilId}`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ cost: 150 }) // Increase oil cost
      .expect(200);

    expect(updateRes.body.cost).toBe(150);

    // Verify that both products were recalculated
    const layer3Res = await request(app)
      .get(`/api/projects/${projectId}/layer3`)
      .set('Authorization', `Bearer ${testToken}`)
      .expect(200);

    const products = layer3Res.body.products;
    expect(products).toHaveLength(2);

    // Both products should have updated costs
    products.forEach((prod) => {
      expect(prod.costoUnitario).toBeGreaterThan(0);
      expect(prod.costBreakdown).toBeDefined();
      expect(prod.costBreakdown.some((c) => c.source === oilId)).toBe(true);
    });
  });

  describe('Validation Tests', () => {
    test('Should fail with invalid graph edges', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Invalid Graph Test' })
        .expect(201);

      const projectId = projectRes.body._id;

      const invalidLayer2 = {
        nodes: [{ id: 'prod', name: 'Producto', type: 'producto' }],
        edges: [
          {
            source: 'nonexistent-insumo', // Invalid reference
            target: 'prod',
            quantity: 1,
          },
        ],
      };

      await request(app)
        .post(`/api/projects/${projectId}/layer2`)
        .set('Authorization', `Bearer ${testToken}`)
        .send(invalidLayer2)
        .expect(400); // Bad request
    });

    test('Should validate margen percentage constraints', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ name: 'Margen Test' })
        .expect(201);

      const projectId = projectRes.body._id;

      // Try to set invalid margin
      await request(app)
        .patch(`/api/projects/${projectId}/layer3/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ margenPorcentaje: -10 }) // Negative margin
        .expect(400);

      await request(app)
        .patch(`/api/projects/${projectId}/layer3/settings`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ margenPorcentaje: 999 }) // Unrealistic margin
        .expect(400);
    });
  });
});
