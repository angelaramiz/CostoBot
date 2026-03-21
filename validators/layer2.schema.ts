import { z } from 'zod';

export const ProcesoSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  insumoIds: z.array(z.string().min(1, 'El ID de insumo no puede estar vacío')),
  laborCost: z
    .number()
    .int('El costo de mano de obra debe ser un entero en centavos')
    .nonnegative('El costo de mano de obra no puede ser negativo'),
  totalCost: z
    .number()
    .int('El costo total debe ser un entero en centavos')
    .nonnegative('El costo total no puede ser negativo'),
});

export type ProcesoInput = z.infer<typeof ProcesoSchema>;
