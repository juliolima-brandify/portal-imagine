import { z } from 'zod'

// User roles - agora com 3 tipos incluindo voluntário
export const userRoleSchema = z.enum(['donor', 'admin', 'volunteer'])

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: userRoleSchema,
  avatar_url: z.string().url().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  role: userRoleSchema.default('donor'),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// Project validation schemas
export const projectSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  short_description: z.string().min(10).max(300),
  category: z.enum(['educacao', 'saude', 'meio-ambiente', 'esporte', 'social']),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0),
  status: z.enum(['ativo', 'concluido', 'pausado', 'cancelado']),
  image_url: z.string().url().optional(),
  location: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const createProjectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  short_description: z.string().min(10).max(300),
  category: z.enum(['educacao', 'saude', 'meio-ambiente', 'esporte', 'social']),
  target_amount: z.number().positive(),
  location: z.string().optional(),
})

// Donation validation schemas
export const donationSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('BRL'),
  project_id: z.string().uuid(),
  donor_id: z.string().uuid(),
  payment_method: z.enum(['credit_card', 'pix', 'boleto']),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  stripe_payment_intent_id: z.string().optional(),
  created_at: z.string().datetime(),
})

export const createDonationSchema = z.object({
  amount: z.number().positive(),
  project_id: z.string().uuid(),
  payment_method: z.enum(['credit_card', 'pix', 'boleto']),
})

// Payment validation schemas
export const paymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3),
  description: z.string().min(1).max(500),
  customer_email: z.string().email(),
})

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('brl'),
  description: z.string().min(1).max(500),
  customer_email: z.string().email(),
})

// API response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
})

// TypeScript types
export type UserRole = z.infer<typeof userRoleSchema>
export type User = z.infer<typeof userSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type Login = z.infer<typeof loginSchema>

export type Project = z.infer<typeof projectSchema>
export type CreateProject = z.infer<typeof createProjectSchema>

export type Donation = z.infer<typeof donationSchema>
export type CreateDonation = z.infer<typeof createDonationSchema>

export type Payment = z.infer<typeof paymentSchema>
export type CreatePaymentIntent = z.infer<typeof createPaymentIntentSchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>
