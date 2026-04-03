import { z } from 'zod';

export const InsumoCategorySchema = z.enum(['ingrediente', 'maquina', 'utensilio', 'material']);

export const InsumoSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  unit: z.string().min(1, 'La unidad de medida es requerida'),
  costPerUnit: z
    .number()
    .int('El costo por unidad debe ser un entero en centavos')
    .nonnegative('El costo por unidad no puede ser negativo'),
  category: InsumoCategorySchema,
  isReusable: z.boolean(),
  // Campos de depreciacion (opcionales, solo para maquina/utensilio)
  acquisitionCost: z
    .number()
    .int('El costo de adquisicion debe ser entero en centavos')
    .nonnegative()
    .optional(),
  usefulLifeMonths: z
    .number()
    .int()
    .positive('La vida util debe ser mayor a 0')
    .optional(),
  residualValue: z
    .number()
    .int('El valor residual debe ser entero en centavos')
    .nonnegative()
    .optional(),
  supplier: z.string().optional(),
  sku: z.string().optional(),
});

export type InsumoInput = z.infer<typeof InsumoSchema>;