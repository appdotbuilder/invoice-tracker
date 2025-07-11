
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable } from '../db/schema';
import { getClients } from '../handlers/get_clients';

describe('getClients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no clients exist', async () => {
    const result = await getClients();
    expect(result).toEqual([]);
  });

  it('should return all clients', async () => {
    // Create test clients
    await db.insert(clientsTable)
      .values([
        {
          name: 'Test Client 1',
          email: 'test1@example.com'
        },
        {
          name: 'Test Client 2',
          email: 'test2@example.com'
        }
      ])
      .execute();

    const result = await getClients();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Test Client 1');
    expect(result[0].email).toEqual('test1@example.com');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    expect(result[1].name).toEqual('Test Client 2');
    expect(result[1].email).toEqual('test2@example.com');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return clients in correct order', async () => {
    // Create test clients
    await db.insert(clientsTable)
      .values([
        {
          name: 'Alpha Client',
          email: 'alpha@example.com'
        },
        {
          name: 'Beta Client',
          email: 'beta@example.com'
        }
      ])
      .execute();

    const result = await getClients();

    expect(result).toHaveLength(2);
    // Verify all required fields are present
    result.forEach(client => {
      expect(client.id).toBeDefined();
      expect(client.name).toBeDefined();
      expect(client.email).toBeDefined();
      expect(client.created_at).toBeInstanceOf(Date);
    });
  });
});
