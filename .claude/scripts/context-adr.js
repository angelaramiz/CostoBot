#!/usr/bin/env node
/**
 * context-adr.js — CostoBot
 * Appends a new Architecture Decision Record (ADR) stub to ARCHITECTURE.md.
 * Usage: node .claude/scripts/context-adr.js "Título del ADR"
 *        npm run context:adr "Usar Redis para caché de sesiones"
 * [GREENFIELD — defined by user]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ARCH_MD = path.join(__dirname, '..', '..', 'ARCHITECTURE.md');
const title = process.argv.slice(2).join(' ').trim();

if (!title) {
  console.error('Usage: npm run context:adr "Título del ADR"');
  process.exit(1);
}

if (!fs.existsSync(ARCH_MD)) {
  console.error('❌ ARCHITECTURE.md not found.');
  process.exit(1);
}

// Count existing ADRs to assign next number
const content = fs.readFileSync(ARCH_MD, 'utf8');
const existingADRs = (content.match(/^## ADR-\d+/gm) || []).length;
const adrNumber = String(existingADRs + 1).padStart(3, '0');

const date = new Date().toISOString().split('T')[0];

const stub = `
---

## ADR-${adrNumber}: ${title}

**Status:** Proposed  
**Date:** ${date}  
**Context:** <!-- Describe the problem or situation that requires a decision -->

**Decision:** <!-- State the decision made -->

**Consequences:**
- ✅ <!-- Positive outcome -->
- ⚠️ <!-- Trade-off or risk -->
`;

fs.appendFileSync(ARCH_MD, stub, 'utf8');
console.log(`✅ ADR-${adrNumber} appended to ARCHITECTURE.md: "${title}"`);
