
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable, invoicesTable } from '../db/schema';
import { deleteInvoice } from '../handlers/delete_invoice';
import { eq } from 'drizzle-orm';

describe('deleteInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing invoice', async () => {
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
        due_date: new Date('2024-01-01'),
        status: 'Pending',
        items: [
          {
            description: 'Test item',
            quantity: 1,
            unit_price: 100.00,
            total: 100.00
          }
        ],
        taxes: '0.00',
        notes: 'Test invoice'
      })
      .returning()
      .execute();

    const invoice = invoiceResult[0];

    // Delete the invoice
    const result = await deleteInvoice(invoice.id);

    // Should return true
    expect(result).toBe(true);

    // Verify invoice is deleted from database
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoice.id))
      .execute();

    expect(invoices).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent invoice', async () => {
    // Try to delete an invoice that doesn't exist
    const result = await deleteInvoice(999);

    // Should return false
    expect(result).toBe(false);
  });

  it('should not affect other invoices when deleting one', async () => {
    // Create a client first
    const clientResult = await db.insert(clientsTable)
      .values({
        name: 'Test Client',
        email: 'test@example.com'
      })
      .returning()
      .execute();

    const client = clientResult[0];

    // Create two invoices
    const invoiceResults = await db.insert(invoicesTable)
      .values([
        {
          invoice_number: 'INV-001',
          client_id: client.id,
          amount: '100.00',
          due_date: new Date('2024-01-01'),
          status: 'Pending',
          items: [
            {
              description: 'Test item 1',
              quantity: 1,
              unit_price: 100.00,
              total: 100.00
            }
          ],
          taxes: '0.00',
          notes: 'Test invoice 1'
        },
        {
          invoice_number: 'INV-002',
          client_id: client.id,
          amount: '200.00',
          due_date: new Date('2024-01-02'),
          status: 'Paid',
          items: [
            {
              description: 'Test item 2',
              quantity: 2,
              unit_price: 100.00,
              total: 200.00
            }
          ],
          taxes: '0.00',
          notes: 'Test invoice 2'
        }
      ])
      .returning()
      .execute();

    const [invoice1, invoice2] = invoiceResults;

    // Delete the first invoice
    const result = await deleteInvoice(invoice1.id);

    // Should return true
    expect(result).toBe(true);

    // Verify first invoice is deleted
    const deletedInvoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoice1.id))
      .execute();

    expect(deletedInvoices).toHaveLength(0);

    // Verify second invoice still exists
    const remainingInvoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoice2.id))
      .execute();

    expect(remainingInvoices).toHaveLength(1);
    expect(remainingInvoices[0].invoice_number).toBe('INV-002');
  });
});
