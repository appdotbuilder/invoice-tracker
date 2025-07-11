
import { db } from '../db';
import { invoicesTable, clientsTable } from '../db/schema';
import { type UpdateInvoiceInput, type Invoice } from '../schema';
import { eq } from 'drizzle-orm';

export const updateInvoice = async (input: UpdateInvoiceInput): Promise<Invoice> => {
  try {
    // Check if invoice exists
    const existingInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, input.id))
      .limit(1)
      .execute();

    if (existingInvoice.length === 0) {
      throw new Error('Invoice not found');
    }

    // If client_id is being updated, verify the client exists
    if (input.client_id) {
      const client = await db.select()
        .from(clientsTable)
        .where(eq(clientsTable.id, input.client_id))
        .limit(1)
        .execute();

      if (client.length === 0) {
        throw new Error('Client not found');
      }
    }

    // Prepare update values - only include fields that are provided
    const updateValues: any = {};
    
    if (input.invoice_number !== undefined) {
      updateValues.invoice_number = input.invoice_number;
    }
    if (input.client_id !== undefined) {
      updateValues.client_id = input.client_id;
    }
    if (input.amount !== undefined) {
      updateValues.amount = input.amount.toString();
    }
    if (input.due_date !== undefined) {
      updateValues.due_date = input.due_date;
    }
    if (input.status !== undefined) {
      updateValues.status = input.status;
    }
    if (input.items !== undefined) {
      updateValues.items = input.items;
    }
    if (input.taxes !== undefined) {
      updateValues.taxes = input.taxes.toString();
    }
    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    // Update the invoice
    const result = await db.update(invoicesTable)
      .set(updateValues)
      .where(eq(invoicesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers and properly type items
    const invoice = result[0];
    return {
      ...invoice,
      amount: parseFloat(invoice.amount),
      taxes: parseFloat(invoice.taxes),
      items: invoice.items as { description: string; quantity: number; unit_price: number; total: number; }[]
    };
  } catch (error) {
    console.error('Invoice update failed:', error);
    throw error;
  }
};
