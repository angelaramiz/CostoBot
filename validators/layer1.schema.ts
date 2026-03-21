import { z } from 'zod';

export const InsumoSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  unit: z.string().min(1, 'La unidad de medida es requerida'),
  costPerUnit: z
    .number()
    .int('El costo por unidad debe ser un entero en centavos')
    .nonnegative('El costo por unidad no puede ser negativo'),
  quantity: z.number().positive('La cantidad debe ser mayor a 0'),
});

export type InsumoInput = z.infer<typeof InsumoSchema>;
