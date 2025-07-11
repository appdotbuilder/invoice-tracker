
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const invoiceStatusEnum = pgEnum('invoice_status', ['Pending', 'Paid', 'Overdue']);

// Clients table
export const clientsTable = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Invoices table
export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoice_number: text('invoice_number').notNull().unique(),
  client_id: integer('client_id').notNull().references(() => clientsTable.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  due_date: timestamp('due_date').notNull(),
  status: invoiceStatusEnum('status').notNull().default('Pending'),
  items: jsonb('items').notNull(), // Array of invoice items as JSON
  taxes: numeric('taxes', { precision: 10, scale: 2 }).notNull().default('0'),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const clientsRelations = relations(clientsTable, ({ many }) => ({
  invoices: many(invoicesTable),
}));

export const invoicesRelations = relations(invoicesTable, ({ one }) => ({
  client: one(clientsTable, {
    fields: [invoicesTable.client_id],
    references: [clientsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Client = typeof clientsTable.$inferSelect;
export type NewClient = typeof clientsTable.$inferInsert;
export type Invoice = typeof invoicesTable.$inferSelect;
export type NewInvoice = typeof invoicesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  clients: clientsTable, 
  invoices: invoicesTable 
};
