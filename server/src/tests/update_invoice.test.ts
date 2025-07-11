
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable, invoicesTable } from '../db/schema';
import { type UpdateInvoiceInput, type CreateClientInput } from '../schema';
import { updateInvoice } from '../handlers/update_invoice';
import { eq } from 'drizzle-orm';

describe('updateInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testClientId: number;
  let testInvoiceId: number;

  beforeEach(async () => {
    // Create test client
    const client = await db.insert(clientsTable)
      .values({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .returning()
      .execute();
    testClientId = client[0].id;

    // Create test invoice
    const invoice = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        client_id: testClientId,
        amount: '100.00',
        due_date: new Date('2024-12-31'),
        status: 'Pending',
        items: [
          {
            description: 'Test Item',
            quantity: 1,
            unit_price: 100,
            total: 100
          }
        ],
        taxes: '0.00',
        notes: 'Test notes'
      })
      .returning()
      .execute();
    testInvoiceId = invoice[0].id;
  });

  it('should update invoice fields', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: testInvoiceId,
      invoice_number: 'INV-002',
      amount: 200.00,
      status: 'Paid',
      taxes: 20.00,
      notes: 'Updated notes'
    };

    const result = await updateInvoice(updateInput);

    expect(result.id).toEqual(testInvoiceId);
    expect(result.invoice_number).toEqual('INV-002');
    expect(result.amount).toEqual(200.00);
    expect(typeof result.amount).toEqual('number');
    expect(result.status).toEqual('Paid');
    expect(result.taxes).toEqual(20.00);
    expect(typeof result.taxes).toEqual('number');
    expect(result.notes).toEqual('Updated notes');
    expect(result.client_id).toEqual(testClientId); // Should remain unchanged
  });

  it('should update only provided fields', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: testInvoiceId,
      status: 'Paid'
    };

    const result = await updateInvoice(updateInput);

    expect(result.id).toEqual(testInvoiceId);
    expect(result.status).toEqual('Paid');
    expect(result.invoice_number).toEqual('INV-001'); // Should remain unchanged
    expect(result.amount).toEqual(100.00); // Should remain unchanged
    expect(result.notes).toEqual('Test notes'); // Should remain unchanged
  });

  it('should update invoice items', async () => {
    const newItems = [
      {
        description: 'Updated Item 1',
        quantity: 2,
        unit_price: 50,
        total: 100
      },
      {
        description: 'Updated Item 2',
        quantity: 1,
        unit_price: 75,
        total: 75
      }
    ];

    const updateInput: UpdateInvoiceInput = {
      id: testInvoiceId,
      items: newItems,
      amount: 175.00
    };

    const result = await updateInvoice(updateInput);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].description).toEqual('Updated Item 1');
    expect(result.items[1].description).toEqual('Updated Item 2');
    expect(result.amount).toEqual(175.00);
  });

  it('should update client_id when valid client exists', async () => {
    // Create another client
    const newClient = await db.insert(clientsTable)
      .values({
        name: 'New Client',
        email: 'new@example.com'
      })
      .returning()
      .execute();
    const newClientId = newClient[0].id;

    const updateInput: UpdateInvoiceInput = {
      id: testInvoiceId,
      client_id: newClientId
    };

    const result = await updateInvoice(updateInput);

    expect(result.client_id).toEqual(newClientId);
  });

  it('should save updated invoice to database', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: testInvoiceId,
      invoice_number: 'INV-UPDATED',
      amount: 250.00,
      status: 'Overdue'
    };

    await updateInvoice(updateInput);

    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, testInvoiceId))
      .execute();

    expect(invoices).toHaveLength(1);
    expect(invoices[0].invoice_number).toEqual('INV-UPDATED');
    expect(parseFloat(invoices[0].amount)).toEqual(250.00);
    expect(invoices[0].status).toEqual('Overdue');
  });

  it('should throw error when invoice not found', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: 99999,
      status: 'Paid'
    };

    expect(updateInvoice(updateInput)).rejects.toThrow(/invoice not found/i);
  });

  it('should throw error when client_id references non-existent client', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: testInvoiceId,
      client_id: 99999
    };

    expect(updateInvoice(updateInput)).rejects.toThrow(/client not found/i);
  });

  it('should handle null notes update', async () => {
    const updateInput: UpdateInvoiceInput = {
      id: testInvoiceId,
      notes: null
    };

    const result = await updateInvoice(updateInput);

    expect(result.notes).toBeNull();
  });

  it('should update due_date correctly', async () => {
    const newDueDate = new Date('2025-01-15');
    const updateInput: UpdateInvoiceInput = {
      id: testInvoiceId,
      due_date: newDueDate
    };

    const result = await updateInvoice(updateInput);

    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date.toISOString()).toEqual(newDueDate.toISOString());
  });
});
