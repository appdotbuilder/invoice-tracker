
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable } from '../db/schema';
import { getClient } from '../handlers/get_client';

describe('getClient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return client by id', async () => {
    // Create test client
    const insertResult = await db.insert(clientsTable)
      .values({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const createdClient = insertResult[0];

    const result = await getClient(createdClient.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdClient.id);
    expect(result!.name).toEqual('Test Client');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent client', async () => {
    const result = await getClient(999);
    expect(result).toBeNull();
  });

  it('should return correct client when multiple exist', async () => {
    // Create multiple test clients
    await db.insert(clientsTable)
      .values([
        { name: 'First Client', email: 'first@example.com' },
        { name: 'Second Client', email: 'second@example.com' }
      ])
      .execute();

    // Get all clients to find their IDs
    const allClients = await db.select().from(clientsTable).execute();
    const firstClient = allClients.find(c => c.email === 'first@example.com')!;
    const secondClient = allClients.find(c => c.email === 'second@example.com')!;

    // Test getting specific client
    const result = await getClient(secondClient.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(secondClient.id);
    expect(result!.name).toEqual('Second Client');
    expect(result!.email).toEqual('second@example.com');
    expect(result!.id).not.toEqual(firstClient.id);
  });
});
