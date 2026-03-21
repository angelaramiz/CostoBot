import { z } from 'zod';
import { InsumoSchema } from './layer1.schema';
import { ProcesoSchema } from './layer2.schema';
import { ProductoSchema } from './layer3.schema';
import { PrecioSchema } from './layer4.schema';

export const ProjectLayersSchema = z.object({
  layer1: z.array(InsumoSchema),
  layer2: z.array(ProcesoSchema),
  layer3: z.array(ProductoSchema),
  layer4: z.array(PrecioSchema),
});

export const BusinessProjectSchema = z.object({
  id: z.string().min(1, 'El ID del proyecto es requerido'),
  name: z
    .string()
    .min(1, 'El nombre del proyecto es requerido')
    .max(200, 'El nombre no puede superar los 200 caracteres'),
  ownerId: z.string().min(1, 'El ID del propietario es requerido'),
  createdAt: z.date({ required_error: 'La fecha de creación es requerida' }),
  updatedAt: z.date({ required_error: 'La fecha de actualización es requerida' }),
  layers: ProjectLayersSchema,
});

export type BusinessProjectInput = z.infer<typeof BusinessProjectSchema>;
