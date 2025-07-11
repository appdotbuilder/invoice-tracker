
import { db } from '../db';
import { clientsTable } from '../db/schema';
import { type Client } from '../schema';
import { eq } from 'drizzle-orm';

export const getClient = async (id: number): Promise<Client | null> => {
  try {
    const results = await db.select()
      .from(clientsTable)
      .where(eq(clientsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get client failed:', error);
    throw error;
  }
};
