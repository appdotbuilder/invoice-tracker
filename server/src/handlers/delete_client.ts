
import { db } from '../db';
import { clientsTable, invoicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteClient = async (id: number): Promise<boolean> => {
  try {
    // Check if client has any invoices
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.client_id, id))
      .execute();

    if (invoices.length > 0) {
      // Cannot delete client with existing invoices
      return false;
    }

    // Delete the client
    const result = await db.delete(clientsTable)
      .where(eq(clientsTable.id, id))
      .execute();

    // Return true if a row was deleted
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Client deletion failed:', error);
    throw error;
  }
};
