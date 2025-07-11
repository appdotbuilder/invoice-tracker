
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable, invoicesTable } from '../db/schema';
import { getInvoice } from '../handlers/get_invoice';

describe('getInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an invoice when found', async () => {
    // Create a client first
    const clientResult = await db.insert(clientsTable)
      .values({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const client = clientResult[0];

    // Create an invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        client_id: client.id,
        amount: '150.75',
        due_date: new Date('2024-12-31'),
        status: 'Pending',
        items: JSON.stringify([
          {
            description: 'Test Item',
            quantity: 2,
            unit_price: 75.375,
            total: 150.75
          }
        ]),
        taxes: '15.50',
        notes: 'Test invoice notes'
      })
      .returning()
      .execute();

    const createdInvoice = invoiceResult[0];

    // Test the handler
    const result = await getInvoice(createdInvoice.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdInvoice.id);
    expect(result!.invoice_number).toEqual('INV-001');
    expect(result!.client_id).toEqual(client.id);
    expect(result!.amount).toEqual(150.75);
    expect(typeof result!.amount).toEqual('number');
    expect(result!.due_date).toBeInstanceOf(Date);
    expect(result!.status).toEqual('Pending');
    expect(result!.items).toEqual([
      {
        description: 'Test Item',
        quantity: 2,
        unit_price: 75.375,
        total: 150.75
      }
    ]);
    expect(result!.taxes).toEqual(15.50);
    expect(typeof result!.taxes).toEqual('number');
    expect(result!.notes).toEqual('Test invoice notes');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when invoice not found', async () => {
    const result = await getInvoice(999);
    expect(result).toBeNull();
  });

  it('should handle invoice with null notes', async () => {
    // Create a client first
    const clientResult = await db.insert(clientsTable)
      .values({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const client = clientResult[0];

    // Create an invoice with null notes
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        client_id: client.id,
        amount: '100.00',
        due_date: new Date('2024-12-31'),
        status: 'Paid',
        items: JSON.stringify([]),
        taxes: '0.00',
        notes: null
      })
      .returning()
      .execute();

    const createdInvoice = invoiceResult[0];

    // Test the handler
    const result = await getInvoice(createdInvoice.id);

    expect(result).not.toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.items).toEqual([]);
    expect(result!.taxes).toEqual(0);
  });
});
