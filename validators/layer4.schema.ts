import { z } from 'zod';

export const PrecioSchema = z.object({
  id: z.string().min(1, 'El ID es requerido'),
  productoId: z.string().min(1, 'El ID del producto es requerido'),
  margenPorcentaje: z
    .number()
    .nonnegative('El margen de ganancia no puede ser negativo'),
  precioVenta: z
    .number()
    .int('El precio de venta debe ser un entero en centavos')
    .nonnegative('El precio de venta no puede ser negativo'),
  roi: z.number({ required_error: 'El ROI es requerido' }),
});

export type PrecioInput = z.infer<typeof PrecioSchema>;
