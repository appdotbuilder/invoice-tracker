
import { z } from 'zod';

// Enums
export const invoiceStatusEnum = z.enum(['Pending', 'Paid', 'Overdue']);
export type InvoiceStatus = z.infer<typeof invoiceStatusEnum>;

// Client schemas
export const clientSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type Client = z.infer<typeof clientSchema>;

export const createClientInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required')
});

export type CreateClientInput = z.infer<typeof createClientInputSchema>;

export const updateClientInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional()
});

export type UpdateClientInput = z.infer<typeof updateClientInputSchema>;

// Invoice item schema
export const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unit_price: z.number().positive(),
  total: z.number().positive()
});

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

// Invoice schemas
export const invoiceSchema = z.object({
  id: z.number(),
  invoice_number: z.string(),
  client_id: z.number(),
  amount: z.number().positive(),
  due_date: z.coerce.date(),
  status: invoiceStatusEnum,
  items: z.array(invoiceItemSchema),
  taxes: z.number().nonnegative(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const createInvoiceInputSchema = z.object({
  invoice_number: z.string().min(1, 'Invoice number is required'),
  client_id: z.number().positive(),
  amount: z.number().positive(),
  due_date: z.coerce.date(),
  status: invoiceStatusEnum.default('Pending'),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    total: z.number().positive()
  })),
  taxes: z.number().nonnegative().default(0),
  notes: z.string().nullable().optional()
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

export const updateInvoiceInputSchema = z.object({
  id: z.number(),
  invoice_number: z.string().min(1, 'Invoice number is required').optional(),
  client_id: z.number().positive().optional(),
  amount: z.number().positive().optional(),
  due_date: z.coerce.date().optional(),
  status: invoiceStatusEnum.optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    total: z.number().positive()
  })).optional(),
  taxes: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceInputSchema>;

// Filter schemas
export const invoiceFilterSchema = z.object({
  status: invoiceStatusEnum.optional(),
  due_date: z.coerce.date().optional()
});

export type InvoiceFilter = z.infer<typeof invoiceFilterSchema>;

// Mark invoice as paid schema
export const markInvoiceAsPaidInputSchema = z.object({
  id: z.number()
});

export type MarkInvoiceAsPaidInput = z.infer<typeof markInvoiceAsPaidInputSchema>;
