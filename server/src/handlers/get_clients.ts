
import { db } from '../db';
import { clientsTable } from '../db/schema';
import { type Client } from '../schema';

export const getClients = async (): Promise<Client[]> => {
  try {
    const results = await db.select()
      .from(clientsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Get clients failed:', error);
    throw error;
  }
};
