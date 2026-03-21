/**
 * project.routes.js — CostoBot Backend
 * CRUD endpoints para BusinessProject.
 * Todos requieren Firebase JWT via verifyFirebaseToken middleware.
 * Ownership check incluido en cada operación.
 */
'use strict';

const express = require('express');
const router = express.Router();

const BusinessProject = require('../db/BusinessProject.model');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken.middleware');

// Todos los endpoints de proyectos requieren autenticación
router.use(verifyFirebaseToken);

// ── GET /api/projects ───────────────────────────────────────────────────────
// Lista todos los proyectos del usuario autenticado (solo id, name, updatedAt)
router.get('/', async (req, res) => {
  try {
    const projects = await BusinessProject
      .find({ ownerId: req.uid })
      .select('_id name updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ data: projects });
  } catch (err) {
    res.status(500).json({ error: 'Error al listar proyectos', message: err.message });
  }
});

// ── POST /api/projects ──────────────────────────────────────────────────────
// Crea un proyecto nuevo para el usuario autenticado
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Validation Error', message: 'El nombre del proyecto es requerido.' });
    }

    const project = await BusinessProject.create({
      ownerId: req.uid,
      name: name.trim().slice(0, 200),
      layers: { layer1: [], layer2: [], layer3: [], layer4: [] },
    });

    res.status(201).json({ data: project });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear proyecto', message: err.message });
  }
});

// ── GET /api/projects/:id ───────────────────────────────────────────────────
// Obtiene un proyecto completo (verifica ownership)
router.get('/:id', async (req, res) => {
  try {
    const project = await BusinessProject.findById(req.params.id).lean();

    if (!project) {
      return res.status(404).json({ error: 'Not Found', message: 'Proyecto no encontrado.' });
    }

    if (project.ownerId !== req.uid) {
      return res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para acceder a este proyecto.' });
    }

    res.json({ data: project });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener proyecto', message: err.message });
  }
});

// ── PATCH /api/projects/:id ─────────────────────────────────────────────────
// Actualiza capas del proyecto (solo las que se envíen en el body)
router.patch('/:id', async (req, res) => {
  try {
    const project = await BusinessProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Not Found', message: 'Proyecto no encontrado.' });
    }

    if (project.ownerId !== req.uid) {
      return res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para modificar este proyecto.' });
    }

    // Solo actualizar los campos permitidos (nunca ownerId ni _id)
    const { name, layers } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Validation Error', message: 'El nombre no puede estar vacío.' });
      }
      project.name = name.trim().slice(0, 200);
    }

    if (layers !== undefined) {
      if (layers.layer1 !== undefined) project.layers.layer1 = layers.layer1;
      if (layers.layer2 !== undefined) project.layers.layer2 = layers.layer2;
      if (layers.layer3 !== undefined) project.layers.layer3 = layers.layer3;
      if (layers.layer4 !== undefined) project.layers.layer4 = layers.layer4;
    }

    await project.save();
    res.json({ data: project });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar proyecto', message: err.message });
  }
});

// ── DELETE /api/projects/:id ────────────────────────────────────────────────
// Elimina un proyecto (verifica ownership)
router.delete('/:id', async (req, res) => {
  try {
    const project = await BusinessProject.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Not Found', message: 'Proyecto no encontrado.' });
    }

    if (project.ownerId !== req.uid) {
      return res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para eliminar este proyecto.' });
    }

    await project.deleteOne();
    res.json({ data: { message: 'Proyecto eliminado correctamente.' } });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar proyecto', message: err.message });
  }
});

module.exports = router;
