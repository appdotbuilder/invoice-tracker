
import { db } from '../db';
import { invoicesTable, clientsTable } from '../db/schema';
import { type CreateInvoiceInput, type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice> => {
  try {
    // Verify client exists to prevent foreign key constraint violation
    const client = await db.select()
      .from(clientsTable)
      .where(eq(clientsTable.id, input.client_id))
      .execute();

    if (client.length === 0) {
      throw new Error(`Client with ID ${input.client_id} not found`);
    }

    // Insert invoice record
    const result = await db.insert(invoicesTable)
      .values({
        invoice_number: input.invoice_number,
        client_id: input.client_id,
        amount: input.amount.toString(), // Convert number to string for numeric column
        due_date: input.due_date,
        status: input.status || 'Pending',
        items: input.items, // jsonb column accepts objects directly
        taxes: input.taxes !== undefined ? input.taxes.toString() : '0', // Convert number to string for numeric column
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const invoice = result[0];
    return {
      ...invoice,
      amount: parseFloat(invoice.amount), // Convert string back to number
      taxes: parseFloat(invoice.taxes), // Convert string back to number
      items: invoice.items as any // jsonb column returns objects directly
    };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    throw error;
  }
};
