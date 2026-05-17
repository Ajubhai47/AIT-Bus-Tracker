import { z } from "zod";

// Zod schemas for validation
export const insertDriverSchema = z.object({
  name: z.string().min(1),
  busId: z.string().min(1),
  route: z.string().min(1),
  password: z.string().min(6),
});

export const insertBusLocationSchema = z.object({
  busId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  isTracking: z.boolean(),
});

export const loginDriverSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(1),
});

// TypeScript types inferred from Zod schemas
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type InsertBusLocation = z.infer<typeof insertBusLocationSchema>;
export type LoginDriver = z.infer<typeof loginDriverSchema>;

// Domain types matching MongoDB models
export type Driver = {
  _id?: string;
  id?: string;
  name: string;
  busId: string;
  route: string;
  password: string;
  isActive: boolean;
  createdAt: Date;
};

export type BusLocation = {
  _id?: string;
  id?: string;
  busId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  isTracking: boolean;
};

export type Bus = {
  _id?: string;
  id: string;
  name: string;
  route: string;
  color: string;
  isActive: boolean;
};
