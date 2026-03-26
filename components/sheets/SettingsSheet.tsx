'use client';

import { useState } from 'react';
import styles from '@/components/ui/Sheet.module.css';
import { useProjectStore } from '@/store/project.store';
import { useAuthStore } from '@/store/auth.store';

const COUNTRIES = [
  { code: 'MX', name: 'México' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'ES', name: 'España' },
  { code: 'US', name: 'Estados Unidos' },
];

const CURRENCIES = [
  { code: 'MXN', symbol: '$' },
  { code: 'USD', symbol: '$' },
  { code: 'COP', symbol: '$' },
  { code: 'ARS', symbol: '$' },
  { code: 'CLP', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'PEN', symbol: 'S/' },
];

export default function SettingsSheet() {
  const token = useAuthStore((s) => s.token) ?? '';
  const project = useProjectStore((s) => s.currentProject);
  const updateProjectData = useProjectStore((s) => s.updateProjectData);

  if (!project) return null;

  const settings = project.settings ?? { country: 'MX', currency: 'MXN', businessName: '' };

  function handleUpdateSetting(key: string, value: unknown) {
    const updatedSettings = { ...settings, [key]: value };
    updateProjectData({ ...project, settings: updatedSettings }, token);
  }

  return (
    <div className={styles.sheetWrapper}>
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}>
            ⚙️ Configuración General
          </h3>

          {/* ── Nombre del Negocio ────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Nombre del negocio/empresa
            </label>
            <input
              type="text"
              value={String(settings.businessName ?? '')}
              onChange={(e) => handleUpdateSetting('businessName', e.target.value)}
              placeholder="Mi Empresa S.A."
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* ── País ────────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              País
            </label>
            <select
              value={String(settings.country ?? 'MX')}
              onChange={(e) => handleUpdateSetting('country', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, display: 'block' }}>
              Esta configuración afecta los impuestos por defecto
            </span>
          </div>

          {/* ── Moneda ────────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500, display: 'block', marginBottom: 6 }}>
              Moneda
            </label>
            <select
              value={String(settings.currency ?? 'MXN')}
              onChange={(e) => handleUpdateSetting('currency', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
            <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, display: 'block' }}>
              Selecciona la moneda para todos los cálculos de costos
            </span>
          </div>

          {/* ── Resumen del Proyecto ────────────────────────── */}
          <div style={{ marginTop: 24, padding: '12px', background: '#0f172a', borderRadius: 6, borderLeft: '3px solid #3b82f6' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#60a5fa', marginBottom: 8 }}>
              📊 Resumen del Proyecto
            </div>
            <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              <div>
                <strong>Nombre del proyecto:</strong> {project.name}
              </div>
              <div>
                <strong>ID:</strong> {project.id}
              </div>
              <div>
                <strong>Capas activas:</strong>
                <ul style={{ margin: '4px 0 0 16px', paddingLeft: 0 }}>
                  <li>✓ Capa 1 — Insumos ({project.layers.layer1?.length ?? 0} items)</li>
                  <li>✓ Capa 2 — Productos ({project.layers.layer2?.length ?? 0} productos)</li>
                  <li>✓ Capa 3 — Precios ({project.layers.layer3?.products?.length ?? 0} precios)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Información del Sistema ─────────────────────── */}
          <div style={{ marginTop: 16, padding: '12px', background: '#0f172a', borderRadius: 6, borderLeft: '3px solid #64748b' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
              ℹ️ Información del Sistema
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>
              <div>
                <strong>Creado:</strong> {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div>
                <strong>Última actualización:</strong> {new Date(project.updatedAt).toLocaleDateString()}
              </div>
              <div style={{ marginTop: 8 }}>
                <strong>Versión del proyecto:</strong> v{project.version ?? '1.0.0'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
