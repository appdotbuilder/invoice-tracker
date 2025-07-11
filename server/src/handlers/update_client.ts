
import { db } from '../db';
import { clientsTable } from '../db/schema';
import { type UpdateClientInput, type Client } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClient = async (input: UpdateClientInput): Promise<Client> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      email: string;
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    // If no fields to update, fetch and return existing client
    if (Object.keys(updateData).length === 0) {
      const existingClients = await db.select()
        .from(clientsTable)
        .where(eq(clientsTable.id, input.id))
        .execute();

      if (existingClients.length === 0) {
        throw new Error(`Client with id ${input.id} not found`);
      }

      return existingClients[0];
    }

    // Update client record
    const result = await db.update(clientsTable)
      .set(updateData)
      .where(eq(clientsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Client with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Client update failed:', error);
    throw error;
  }
};
