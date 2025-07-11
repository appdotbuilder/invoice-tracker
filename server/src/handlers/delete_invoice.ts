
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteInvoice = async (id: number): Promise<boolean> => {
  try {
    // Delete the invoice by ID
    const result = await db.delete(invoicesTable)
      .where(eq(invoicesTable.id, id))
      .execute();

    // Check if any rows were affected (deleted)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Invoice deletion failed:', error);
    throw error;
  }
};
