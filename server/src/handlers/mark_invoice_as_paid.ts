
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type MarkInvoiceAsPaidInput, type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export const markInvoiceAsPaid = async (input: MarkInvoiceAsPaidInput): Promise<Invoice> => {
  try {
    // Update invoice status to 'Paid'
    const result = await db.update(invoicesTable)
      .set({ status: 'Paid' })
      .where(eq(invoicesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Invoice with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const invoice = result[0];
    return {
      ...invoice,
      amount: parseFloat(invoice.amount),
      taxes: parseFloat(invoice.taxes),
      items: invoice.items as any[] // JSONB field - already parsed
    };
  } catch (error) {
    console.error('Mark invoice as paid failed:', error);
    throw error;
  }
};
