
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { clientsTable, invoicesTable } from '../db/schema';
import { type CreateInvoiceInput, type InvoiceItem } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { eq } from 'drizzle-orm';

// Test data
const testClient = {
  name: 'Test Client',
  email: 'test@example.com'
};

const testItems: InvoiceItem[] = [
  {
    description: 'Web Development',
    quantity: 10,
    unit_price: 100,
    total: 1000
  },
  {
    description: 'Database Setup',
    quantity: 5,
    unit_price: 200,
    total: 1000
  }
];

const testInput: CreateInvoiceInput = {
  invoice_number: 'INV-2024-001',
  client_id: 1, // Will be set dynamically in tests
  amount: 2000,
  due_date: new Date('2024-12-31'),
  status: 'Pending',
  items: testItems,
  taxes: 200,
  notes: 'Test invoice notes'
};

describe('createInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an invoice', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values(testClient)
      .returning()
      .execute();
    
    const client = clientResult[0];
    const inputWithClientId = { ...testInput, client_id: client.id };

    const result = await createInvoice(inputWithClientId);

    // Basic field validation
    expect(result.invoice_number).toEqual('INV-2024-001');
    expect(result.client_id).toEqual(client.id);
    expect(result.amount).toEqual(2000);
    expect(typeof result.amount).toBe('number');
    expect(result.due_date).toEqual(new Date('2024-12-31'));
    expect(result.status).toEqual('Pending');
    expect(result.items).toEqual(testItems);
    expect(result.taxes).toEqual(200);
    expect(typeof result.taxes).toBe('number');
    expect(result.notes).toEqual('Test invoice notes');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save invoice to database', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values(testClient)
      .returning()
      .execute();
    
    const client = clientResult[0];
    const inputWithClientId = { ...testInput, client_id: client.id };

    const result = await createInvoice(inputWithClientId);

    // Query database to verify invoice was saved
    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(invoices).toHaveLength(1);
    const savedInvoice = invoices[0];
    
    expect(savedInvoice.invoice_number).toEqual('INV-2024-001');
    expect(savedInvoice.client_id).toEqual(client.id);
    expect(parseFloat(savedInvoice.amount)).toEqual(2000);
    expect(savedInvoice.due_date).toEqual(new Date('2024-12-31'));
    expect(savedInvoice.status).toEqual('Pending');
    expect(savedInvoice.items).toEqual(testItems); // jsonb returns objects directly
    expect(parseFloat(savedInvoice.taxes)).toEqual(200);
    expect(savedInvoice.notes).toEqual('Test invoice notes');
    expect(savedInvoice.created_at).toBeInstanceOf(Date);
  });

  it('should handle default values correctly', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values(testClient)
      .returning()
      .execute();
    
    const client = clientResult[0];
    
    // Test input with defaults
    const inputWithDefaults: CreateInvoiceInput = {
      invoice_number: 'INV-2024-002',
      client_id: client.id,
      amount: 1500,
      due_date: new Date('2024-12-25'),
      status: 'Pending', // Default from Zod
      items: testItems,
      taxes: 0, // Default from Zod
      notes: undefined // Optional field
    };

    const result = await createInvoice(inputWithDefaults);

    expect(result.status).toEqual('Pending');
    expect(result.taxes).toEqual(0);
    expect(typeof result.taxes).toBe('number');
    expect(result.notes).toBeNull();
  });

  it('should throw error when client does not exist', async () => {
    const inputWithInvalidClient = { ...testInput, client_id: 999 };

    await expect(createInvoice(inputWithInvalidClient))
      .rejects
      .toThrow(/Client with ID 999 not found/i);
  });

  it('should handle complex invoice items correctly', async () => {
    // Create client first
    const clientResult = await db.insert(clientsTable)
      .values(testClient)
      .returning()
      .execute();
    
    const client = clientResult[0];
    
    const complexItems: InvoiceItem[] = [
      {
        description: 'Consulting Services',
        quantity: 1,
        unit_price: 2500.50,
        total: 2500.50
      },
      {
        description: 'Software License',
        quantity: 3,
        unit_price: 99.99,
        total: 299.97
      }
    ];

    const inputWithComplexItems: CreateInvoiceInput = {
      invoice_number: 'INV-2024-003',
      client_id: client.id,
      amount: 2800.47,
      due_date: new Date('2024-12-30'),
      status: 'Pending',
      items: complexItems,
      taxes: 280.05,
      notes: 'Complex invoice with decimal amounts'
    };

    const result = await createInvoice(inputWithComplexItems);

    expect(result.items).toEqual(complexItems);
    expect(result.amount).toEqual(2800.47);
    expect(result.taxes).toEqual(280.05);
    expect(typeof result.amount).toBe('number');
    expect(typeof result.taxes).toBe('number');
  });
});
