
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable } from '../db/schema';
import { type CreateClientInput } from '../schema';
import { createClient } from '../handlers/create_client';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateClientInput = {
  name: 'Test Client',
  email: 'test@example.com'
};

describe('createClient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a client', async () => {
    const result = await createClient(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Client');
    expect(result.email).toEqual('test@example.com');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save client to database', async () => {
    const result = await createClient(testInput);

    // Query using proper drizzle syntax
    const clients = await db.select()
      .from(clientsTable)
      .where(eq(clientsTable.id, result.id))
      .execute();

    expect(clients).toHaveLength(1);
    expect(clients[0].name).toEqual('Test Client');
    expect(clients[0].email).toEqual('test@example.com');
    expect(clients[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Create first client
    await createClient(testInput);

    // Try to create another client with same email
    await expect(createClient(testInput)).rejects.toThrow(/unique/i);
  });

  it('should handle different valid email formats', async () => {
    const emailFormats = [
      'user@domain.com',
      'user.name@domain.co.uk',
      'user+tag@domain.org'
    ];

    for (let i = 0; i < emailFormats.length; i++) {
      const input = {
        name: `Client ${i + 1}`,
        email: emailFormats[i]
      };
      
      const result = await createClient(input);
      expect(result.email).toEqual(emailFormats[i]);
      expect(result.name).toEqual(`Client ${i + 1}`);
    }
  });
});
