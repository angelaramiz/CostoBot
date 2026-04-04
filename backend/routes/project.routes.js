/**
 * project.routes.js — CostoBot Backend
 * CRUD endpoints para BusinessProject.
 * Todos requieren Firebase JWT via verifyFirebaseToken middleware.
 * Ownership check incluido en cada operación.
 * Logging: audit trail de todas las operaciones CRUD
 */
'use strict';

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const BusinessProject = require('../db/BusinessProject.model');
const verifyFirebaseToken = require('../middleware/verifyFirebaseToken.middleware');
const logger = require('../lib/logger');

/** Valida que el id sea un ObjectId de MongoDB válido (previene CastError + prototype pollution) */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

// Todos los endpoints de proyectos requieren autenticación
router.use(verifyFirebaseToken);

// ── GET /api/projects ───────────────────────────────────────────────────────
// Lista todos los proyectos del usuario autenticado (con contadores de capas)
router.get('/', async (req, res) => {
  try {
    const rawProjects = await BusinessProject
      .find({ ownerId: req.uid })
      .select('_id name updatedAt createdAt layers')
      .sort({ updatedAt: -1 })
      .lean();

    // Retorna solo los contadores por capa para el dashboard (evita enviar el payload completo)
    const projects = rawProjects.map((p) => ({
      _id: p._id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      layers: {
        layer1: p.layers?.layer1 ?? [],
        layer2: p.layers?.layer2 ?? [],
        layer3: {
          products: p.layers?.layer3?.products ?? [],
        },
      },
    }));
    
    logger.info('projects_listed', {
      userId: req.uid,
      projectCount: projects.length,
      ip: req.ip,
    });

    res.json({ data: projects });
  } catch (err) {
    logger.error('projects_list_failed', {
      userId: req.uid,
      error: err.message,
      ip: req.ip,
    });
    res.status(500).json({ error: 'Error al listar proyectos' });
  }
});

// ── POST /api/projects ──────────────────────────────────────────────────────
// Crea un proyecto nuevo para el usuario autenticado
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      logger.warn('project_creation_failed_validation', {
        userId: req.uid,
        reason: 'empty_or_invalid_name',
        ip: req.ip,
      });
      return res.status(400).json({ error: 'Validation Error', message: 'El nombre del proyecto es requerido.' });
    }

    const project = await BusinessProject.create({
      ownerId: req.uid,
      name: name.trim().slice(0, 200),
      layers: {
        layer1: [],
        layer2: [],
        layer3: {
          version: '1.0',
          updatedAt: new Date().toISOString(),
          services: {},
          taxes: {},
          products: [],
        },
      },
    });

    logger.info('project_created', {
      userId: req.uid,
      projectId: project._id,
      projectName: project.name,
      ip: req.ip,
    });

    res.status(201).json({ data: project });
  } catch (err) {
    logger.error('project_creation_failed', {
      userId: req.uid,
      error: err.message,
      ip: req.ip,
    });
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

// ── GET /api/projects/:id ───────────────────────────────────────────────────
// Obtiene un proyecto completo (verifica ownership)
router.get('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      logger.warn('project_fetch_invalid_id', {
        userId: req.uid,
        invalidId: req.params.id,
        ip: req.ip,
      });
      return res.status(400).json({ error: 'Bad Request', message: 'ID de proyecto inválido.' });
    }

    const project = await BusinessProject.findById(req.params.id).lean();

    if (!project) {
      logger.warn('project_not_found', {
        userId: req.uid,
        projectId: req.params.id,
        ip: req.ip,
      });
      return res.status(404).json({ error: 'Not Found', message: 'Proyecto no encontrado.' });
    }

    if (project.ownerId !== req.uid) {
      logger.warn('project_access_denied', {
        userId: req.uid,
        projectId: project._id,
        ownerId: project.ownerId,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para acceder a este proyecto.' });
    }

    logger.debug('project_fetched', {
      userId: req.uid,
      projectId: project._id,
      ip: req.ip,
    });

    res.json({ data: project });
  } catch (err) {
    logger.error('project_fetch_failed', {
      userId: req.uid,
      projectId: req.params.id,
      error: err.message,
      ip: req.ip,
    });
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

// ── PATCH /api/projects/:id ─────────────────────────────────────────────────
// Actualiza capas del proyecto (solo las que se envíen en el body)
router.patch('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      logger.warn('project_update_invalid_id', {
        userId: req.uid,
        invalidId: req.params.id,
        ip: req.ip,
      });
      return res.status(400).json({ error: 'Bad Request', message: 'ID de proyecto inválido.' });
    }

    const project = await BusinessProject.findById(req.params.id);

    if (!project) {
      logger.warn('project_update_not_found', {
        userId: req.uid,
        projectId: req.params.id,
        ip: req.ip,
      });
      return res.status(404).json({ error: 'Not Found', message: 'Proyecto no encontrado.' });
    }

    if (project.ownerId !== req.uid) {
      logger.warn('project_update_denied', {
        userId: req.uid,
        projectId: project._id,
        ownerId: project.ownerId,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para modificar este proyecto.' });
    }

    // Solo actualizar los campos permitidos (nunca ownerId ni _id)
    const { name, layers } = req.body;
    const changedFields = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        logger.warn('project_update_invalid_name', {
          userId: req.uid,
          projectId: project._id,
          ip: req.ip,
        });
        return res.status(400).json({ error: 'Validation Error', message: 'El nombre no puede estar vacío.' });
      }
      project.name = name.trim().slice(0, 200);
      changedFields.push('name');
    }

    if (layers !== undefined) {
      if (layers.layer1 !== undefined) {
        project.layers.layer1 = layers.layer1;
        changedFields.push('layer1');
      }
      if (layers.layer2 !== undefined) {
        project.layers.layer2 = layers.layer2;
        changedFields.push('layer2');
      }
      if (layers.layer3 !== undefined) {
        project.layers.layer3 = layers.layer3;
        changedFields.push('layer3');
      }
    }

    await project.save();

    logger.info('project_updated', {
      userId: req.uid,
      projectId: project._id,
      changedFields,
      ip: req.ip,
    });

    res.json({ data: project });
  } catch (err) {
    logger.error('project_update_failed', {
      userId: req.uid,
      projectId: req.params.id,
      error: err.message,
      ip: req.ip,
    });
    res.status(500).json({ error: 'Error al actualizar proyecto' });
  }
});

// ── DELETE /api/projects/:id ────────────────────────────────────────────────
// Elimina un proyecto (verifica ownership)
router.delete('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      logger.warn('project_delete_invalid_id', {
        userId: req.uid,
        invalidId: req.params.id,
        ip: req.ip,
      });
      return res.status(400).json({ error: 'Bad Request', message: 'ID de proyecto inválido.' });
    }

    const project = await BusinessProject.findById(req.params.id);

    if (!project) {
      logger.warn('project_delete_not_found', {
        userId: req.uid,
        projectId: req.params.id,
        ip: req.ip,
      });
      return res.status(404).json({ error: 'Not Found', message: 'Proyecto no encontrado.' });
    }

    if (project.ownerId !== req.uid) {
      logger.warn('project_delete_denied', {
        userId: req.uid,
        projectId: project._id,
        ownerId: project.ownerId,
        ip: req.ip,
      });
      return res.status(403).json({ error: 'Forbidden', message: 'No tienes permiso para eliminar este proyecto.' });
    }

    const projectName = project.name;
    await project.deleteOne();

    logger.warn('project_deleted', {
      userId: req.uid,
      projectId: project._id,
      projectName,
      ip: req.ip,
    });

    res.json({ data: { message: 'Proyecto eliminado correctamente.' } });
  } catch (err) {
    logger.error('project_delete_failed', {
      userId: req.uid,
      projectId: req.params.id,
      error: err.message,
      ip: req.ip,
    });
    res.status(500).json({ error: 'Error al eliminar proyecto' });
  }
});

module.exports = router;
