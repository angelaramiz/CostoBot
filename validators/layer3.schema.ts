import { z } from 'zod';

export const ProductoSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  procesoIds: z.array(z.string().min(1, 'El ID de proceso no puede estar vacío')),
  costoUnitario: z
    .number()
    .int('El costo unitario debe ser un entero en centavos')
    .nonnegative('El costo unitario no puede ser negativo'),
});

export type ProductoInput = z.infer<typeof ProductoSchema>;
