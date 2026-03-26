/**
 * config.ts — CostoBot Frontend
 * Centraliza las constantes de configuración compartidas entre
 * componentes, hooks y el store. Importar desde aquí en lugar de
 * redefinir la constante en cada archivo.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
