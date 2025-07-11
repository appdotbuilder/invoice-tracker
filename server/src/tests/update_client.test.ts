
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable } from '../db/schema';
import { type UpdateClientInput, type CreateClientInput } from '../schema';
import { updateClient } from '../handlers/update_client';
import { eq } from 'drizzle-orm';

// Helper to create a test client
const createTestClient = async (clientData: CreateClientInput) => {
  const result = await db.insert(clientsTable)
    .values(clientData)
    .returning()
    .execute();
  return result[0];
};

describe('updateClient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update client name', async () => {
    // Create test client
    const testClient = await createTestClient({
      name: 'Original Name',
      email: 'original@example.com'
    });

    const updateInput: UpdateClientInput = {
      id: testClient.id,
      name: 'Updated Name'
    };

    const result = await updateClient(updateInput);

    expect(result.id).toEqual(testClient.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('original@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update client email', async () => {
    // Create test client
    const testClient = await createTestClient({
      name: 'Test Client',
      email: 'original@example.com'
    });

    const updateInput: UpdateClientInput = {
      id: testClient.id,
      email: 'updated@example.com'
    };

    const result = await updateClient(updateInput);

    expect(result.id).toEqual(testClient.id);
    expect(result.name).toEqual('Test Client');
    expect(result.email).toEqual('updated@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and email', async () => {
    // Create test client
    const testClient = await createTestClient({
      name: 'Original Name',
      email: 'original@example.com'
    });

    const updateInput: UpdateClientInput = {
      id: testClient.id,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    const result = await updateClient(updateInput);

    expect(result.id).toEqual(testClient.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should return unchanged client when no fields provided', async () => {
    // Create test client
    const testClient = await createTestClient({
      name: 'Test Client',
      email: 'test@example.com'
    });

    const updateInput: UpdateClientInput = {
      id: testClient.id
    };

    const result = await updateClient(updateInput);

    expect(result.id).toEqual(testClient.id);
    expect(result.name).toEqual('Test Client');
    expect(result.email).toEqual('test@example.com');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated client to database', async () => {
    // Create test client
    const testClient = await createTestClient({
      name: 'Original Name',
      email: 'original@example.com'
    });

    const updateInput: UpdateClientInput = {
      id: testClient.id,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    await updateClient(updateInput);

    // Verify changes were saved to database
    const clients = await db.select()
      .from(clientsTable)
      .where(eq(clientsTable.id, testClient.id))
      .execute();

    expect(clients).toHaveLength(1);
    expect(clients[0].name).toEqual('Updated Name');
    expect(clients[0].email).toEqual('updated@example.com');
  });

  it('should throw error when client not found', async () => {
    const updateInput: UpdateClientInput = {
      id: 999,
      name: 'Updated Name'
    };

    expect(updateClient(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should throw error when client not found with no update fields', async () => {
    const updateInput: UpdateClientInput = {
      id: 999
    };

    expect(updateClient(updateInput)).rejects.toThrow(/not found/i);
  });
});
