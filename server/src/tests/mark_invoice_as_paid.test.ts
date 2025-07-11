
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable, invoicesTable } from '../db/schema';
import { type MarkInvoiceAsPaidInput } from '../schema';
import { markInvoiceAsPaid } from '../handlers/mark_invoice_as_paid';
import { eq } from 'drizzle-orm';

describe('markInvoiceAsPaid', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark an invoice as paid', async () => {
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
        amount: '100.00',
        due_date: new Date('2024-12-31'),
        status: 'Pending',
        items: JSON.stringify([
          { description: 'Service', quantity: 1, unit_price: 100, total: 100 }
        ]),
        taxes: '0.00',
        notes: 'Test invoice'
      })
      .returning()
      .execute();

    const invoice = invoiceResult[0];

    const input: MarkInvoiceAsPaidInput = {
      id: invoice.id
    };

    const result = await markInvoiceAsPaid(input);

    // Verify the result
    expect(result.id).toEqual(invoice.id);
    expect(result.status).toEqual('Paid');
    expect(result.amount).toEqual(100.00);
    expect(typeof result.amount).toEqual('number');
    expect(result.taxes).toEqual(0);
    expect(typeof result.taxes).toEqual('number');
    expect(result.items).toEqual([
      { description: 'Service', quantity: 1, unit_price: 100, total: 100 }
    ]);
  });

  it('should update invoice status in database', async () => {
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
        invoice_number: 'INV-002',
        client_id: client.id,
        amount: '250.50',
        due_date: new Date('2024-12-31'),
        status: 'Pending',
        items: JSON.stringify([
          { description: 'Consultation', quantity: 2, unit_price: 125.25, total: 250.50 }
        ]),
        taxes: '25.05'
      })
      .returning()
      .execute();

    const invoice = invoiceResult[0];

    const input: MarkInvoiceAsPaidInput = {
      id: invoice.id
    };

    await markInvoiceAsPaid(input);

    // Verify the database was updated
    const updatedInvoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoice.id))
      .execute();

    expect(updatedInvoices).toHaveLength(1);
    expect(updatedInvoices[0].status).toEqual('Paid');
    expect(updatedInvoices[0].invoice_number).toEqual('INV-002');
    expect(parseFloat(updatedInvoices[0].amount)).toEqual(250.50);
    expect(parseFloat(updatedInvoices[0].taxes)).toEqual(25.05);
  });

  it('should throw error for non-existent invoice', async () => {
    const input: MarkInvoiceAsPaidInput = {
      id: 999999
    };

    await expect(markInvoiceAsPaid(input)).rejects.toThrow(/Invoice with id 999999 not found/i);
  });
});
