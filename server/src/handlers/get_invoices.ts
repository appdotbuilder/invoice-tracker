
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type Invoice, type InvoiceFilter } from '../schema';
import { eq, lte, and, type SQL } from 'drizzle-orm';

export const getInvoices = async (filter?: InvoiceFilter): Promise<Invoice[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.status) {
      conditions.push(eq(invoicesTable.status, filter.status));
    }

    if (filter?.due_date) {
      conditions.push(lte(invoicesTable.due_date, filter.due_date));
    }

    // Build query with or without where clause
    const results = conditions.length > 0
      ? await db.select()
          .from(invoicesTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(invoicesTable)
          .execute();

    // Convert numeric fields back to numbers and parse JSON items
    return results.map(invoice => ({
      ...invoice,
      amount: parseFloat(invoice.amount),
      taxes: parseFloat(invoice.taxes),
      items: Array.isArray(invoice.items) ? invoice.items : []
    }));
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    throw error;
  }
};
