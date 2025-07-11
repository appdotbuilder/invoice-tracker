
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export const getInvoice = async (id: number): Promise<Invoice | null> => {
  try {
    const results = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const invoice = results[0];
    
    // Convert numeric fields back to numbers and parse JSON items
    return {
      ...invoice,
      amount: parseFloat(invoice.amount),
      taxes: parseFloat(invoice.taxes),
      items: invoice.items as any, // JSON field is already parsed by Drizzle
      notes: invoice.notes // Already nullable
    };
  } catch (error) {
    console.error('Invoice retrieval failed:', error);
    throw error;
  }
};
