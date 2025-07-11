
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable, invoicesTable } from '../db/schema';
import { type CreateClientInput, type CreateInvoiceInput, type InvoiceFilter } from '../schema';
import { getInvoices } from '../handlers/get_invoices';

// Test data setup
const testClient: CreateClientInput = {
  name: 'Test Client',
  email: 'test@example.com'
};

const testInvoiceItems = [
  {
    description: 'Test service',
    quantity: 1,
    unit_price: 100,
    total: 100
  }
];

const testInvoice: CreateInvoiceInput = {
  invoice_number: 'INV-001',
  client_id: 1, // Will be set after client creation
  amount: 100,
  due_date: new Date('2024-12-31'),
  status: 'Pending',
  items: testInvoiceItems,
  taxes: 10,
  notes: 'Test invoice'
};

describe('getInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all invoices when no filter is provided', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values({
        name: testClient.name,
        email: testClient.email
      })
      .returning()
      .execute();

    const client = clientResult[0];

    // Create test invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: testInvoice.invoice_number,
        client_id: client.id,
        amount: testInvoice.amount.toString(),
        due_date: testInvoice.due_date,
        status: testInvoice.status,
        items: JSON.stringify(testInvoice.items),
        taxes: testInvoice.taxes.toString(),
        notes: testInvoice.notes
      })
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].client_id).toEqual(client.id);
    expect(result[0].amount).toEqual(100);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].taxes).toEqual(10);
    expect(typeof result[0].taxes).toBe('number');
    expect(result[0].status).toEqual('Pending');
    expect(result[0].items).toEqual(testInvoiceItems);
    expect(result[0].notes).toEqual('Test invoice');
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter invoices by status', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values({
        name: testClient.name,
        email: testClient.email
      })
      .returning()
      .execute();

    const client = clientResult[0];

    // Create pending invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        client_id: client.id,
        amount: '100',
        due_date: new Date('2024-12-31'),
        status: 'Pending',
        items: JSON.stringify(testInvoiceItems),
        taxes: '10'
      })
      .execute();

    // Create paid invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        client_id: client.id,
        amount: '200',
        due_date: new Date('2024-12-31'),
        status: 'Paid',
        items: JSON.stringify(testInvoiceItems),
        taxes: '20'
      })
      .execute();

    const filter: InvoiceFilter = {
      status: 'Pending'
    };

    const result = await getInvoices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].status).toEqual('Pending');
  });

  it('should filter invoices by due date', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values({
        name: testClient.name,
        email: testClient.email
      })
      .returning()
      .execute();

    const client = clientResult[0];

    // Create invoice due soon
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        client_id: client.id,
        amount: '100',
        due_date: new Date('2024-01-15'),
        status: 'Pending',
        items: JSON.stringify(testInvoiceItems),
        taxes: '10'
      })
      .execute();

    // Create invoice due later
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        client_id: client.id,
        amount: '200',
        due_date: new Date('2024-12-31'),
        status: 'Pending',
        items: JSON.stringify(testInvoiceItems),
        taxes: '20'
      })
      .execute();

    const filter: InvoiceFilter = {
      due_date: new Date('2024-06-01')
    };

    const result = await getInvoices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].due_date <= new Date('2024-06-01')).toBe(true);
  });

  it('should filter invoices by both status and due date', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values({
        name: testClient.name,
        email: testClient.email
      })
      .returning()
      .execute();

    const client = clientResult[0];

    // Create pending invoice due soon
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        client_id: client.id,
        amount: '100',
        due_date: new Date('2024-01-15'),
        status: 'Pending',
        items: JSON.stringify(testInvoiceItems),
        taxes: '10'
      })
      .execute();

    // Create paid invoice due soon
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-002',
        client_id: client.id,
        amount: '200',
        due_date: new Date('2024-01-20'),
        status: 'Paid',
        items: JSON.stringify(testInvoiceItems),
        taxes: '20'
      })
      .execute();

    // Create pending invoice due later
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-003',
        client_id: client.id,
        amount: '300',
        due_date: new Date('2024-12-31'),
        status: 'Pending',
        items: JSON.stringify(testInvoiceItems),
        taxes: '30'
      })
      .execute();

    const filter: InvoiceFilter = {
      status: 'Pending',
      due_date: new Date('2024-06-01')
    };

    const result = await getInvoices(filter);

    expect(result).toHaveLength(1);
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].status).toEqual('Pending');
    expect(result[0].due_date <= new Date('2024-06-01')).toBe(true);
  });

  it('should return empty array when no invoices match filter', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values({
        name: testClient.name,
        email: testClient.email
      })
      .returning()
      .execute();

    const client = clientResult[0];

    // Create paid invoice
    await db.insert(invoicesTable)
      .values({
        invoice_number: 'INV-001',
        client_id: client.id,
        amount: '100',
        due_date: new Date('2024-12-31'),
        status: 'Paid',
        items: JSON.stringify(testInvoiceItems),
        taxes: '10'
      })
      .execute();

    const filter: InvoiceFilter = {
      status: 'Overdue'
    };

    const result = await getInvoices(filter);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when no invoices exist', async () => {
    const result = await getInvoices();

    expect(result).toHaveLength(0);
  });
});
