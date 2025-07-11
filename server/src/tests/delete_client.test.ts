
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable, invoicesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteClient } from '../handlers/delete_client';

describe('deleteClient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a client successfully', async () => {
    // Create a test client
    const clientResult = await db.insert(clientsTable)
      .values({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const clientId = clientResult[0].id;

    // Delete the client
    const result = await deleteClient(clientId);

    expect(result).toBe(true);

    // Verify client was deleted
    const clients = await db.select()
      .from(clientsTable)
      .where(eq(clientsTable.id, clientId))
      .execute();

    expect(clients).toHaveLength(0);
  });

  it('should return false when client does not exist', async () => {
    const result = await deleteClient(999);

    expect(result).toBe(false);
  });

  it('should return false when client has invoices', async () => {
    // Create a test client
    const clientResult = await db.insert(clientsTable)
      .values({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const clientId = clientResult[0].id;

    // Create an invoice for the client
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        client_id: clientId,
        amount: '100.00',
        due_date: new Date(),
        status: 'Pending',
        items: [{ description: 'Test Item', quantity: 1, unit_price: 100.00, total: 100.00 }],
        taxes: '0.00',
        notes: null
      })
      .execute();

    // Attempt to delete the client
    const result = await deleteClient(clientId);

    expect(result).toBe(false);

    // Verify client still exists
    const clients = await db.select()
      .from(clientsTable)
      .where(eq(clientsTable.id, clientId))
      .execute();

    expect(clients).toHaveLength(1);
    expect(clients[0].name).toBe('Test Client');
  });

  it('should not delete invoices when client deletion fails', async () => {
    // Create a test client
    const clientResult = await db.insert(clientsTable)
      .values({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const clientId = clientResult[0].id;

    // Create an invoice for the client
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        client_id: clientId,
        amount: '100.00',
        due_date: new Date(),
        status: 'Pending',
        items: [{ description: 'Test Item', quantity: 1, unit_price: 100.00, total: 100.00 }],
        taxes: '0.00',
        notes: null
      })
      .execute();

    // Attempt to delete the client
    await deleteClient(clientId);

    // Verify invoice still exists
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.client_id, clientId))
      .execute();

    expect(invoices).toHaveLength(1);
    expect(invoices[0].invoice_number).toBe('INV-001');
  });
});
