/**
 * VersionHistory.model.js — CostoBot Backend
 * Mongoose model for the version_history collection.
 * [GREENFIELD — defined by user]
 */
'use strict';

const mongoose = require('mongoose');

const versionHistorySchema = new mongoose.Schema(
  {
    version:    { type: String, required: true },
    bumpType:   { type: String, required: true, enum: ['patch', 'minor', 'major', 'rollback'] },
    message:    { type: String, required: true },
    commitHash: { type: String, default: null },
    branch:     { type: String, default: 'main' },
    project:    { type: String, default: 'CostoBot' },
    pushedAt:   { type: Date,   default: Date.now },
  },
  { timestamps: true }
);

versionHistorySchema.index({ version: 1 });
versionHistorySchema.index({ project: 1 });
versionHistorySchema.index({ pushedAt: -1 });

module.exports = mongoose.model('VersionHistory', versionHistorySchema);
