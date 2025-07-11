
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateInvoiceInput, UpdateInvoiceInput, Invoice, Client, InvoiceItem, InvoiceStatus } from '../../../server/src/schema';

interface InvoiceFormProps {
  clients: Client[];
  invoice?: Invoice;
  onSubmit: () => Promise<void>;
  isLoading?: boolean;
}

export function InvoiceForm({ clients, invoice, onSubmit, isLoading = false }: InvoiceFormProps) {
  const [formData, setFormData] = useState<CreateInvoiceInput>({
    invoice_number: '',
    client_id: 0,
    amount: 0,
    due_date: new Date(),
    status: 'Pending',
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    taxes: 0,
    notes: null
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        amount: invoice.amount,
        due_date: invoice.due_date,
        status: invoice.status,
        items: invoice.items,
        taxes: invoice.taxes,
        notes: invoice.notes
      });
    }
  }, [invoice]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    
    // Recalculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setFormData((prev: CreateInvoiceInput) => ({
      ...prev,
      items: newItems
    }));
    
    // Recalculate total amount
    calculateTotal(newItems, formData.taxes);
  };

  const addItem = () => {
    setFormData((prev: CreateInvoiceInput) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData((prev: CreateInvoiceInput) => ({
        ...prev,
        items: newItems
      }));
      calculateTotal(newItems, formData.taxes);
    }
  };

  const calculateTotal = (items: InvoiceItem[], taxes: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + taxes;
    setFormData((prev: CreateInvoiceInput) => ({
      ...prev,
      amount: total
    }));
  };

  const handleTaxesChange = (taxes: number) => {
    setFormData((prev: CreateInvoiceInput) => ({
      ...prev,
      taxes
    }));
    calculateTotal(formData.items, taxes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (invoice) {
        await trpc.updateInvoice.mutate({
          id: invoice.id,
          ...formData
        } as UpdateInvoiceInput);
      } else {
        await trpc.createInvoice.mutate(formData);
      }
      
      await onSubmit();
      
      // Reset form if creating new invoice
      if (!invoice) {
        setFormData({
          invoice_number: '',
          client_id: 0,
          amount: 0,
          due_date: new Date(),
          status: 'Pending',
          items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
          taxes: 0,
          notes: null
        });
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="invoice_number">Invoice Number</Label>
          <Input
            id="invoice_number"
            value={formData.invoice_number}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvoiceInput) => ({ ...prev, invoice_number: e.target.value }))
            }
            placeholder="INV-001"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="client_id">Client</Label>
          <Select
            value={formData.client_id > 0 ? formData.client_id.toString() : ''}
            onValueChange={(value: string) =>
              setFormData((prev: CreateInvoiceInput) => ({ ...prev, client_id: parseInt(value) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client: Client) => (
                <SelectItem key={client.id} value={client.id.toString()}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            value={formData.due_date.toISOString().split('T')[0]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInvoiceInput) => ({ ...prev, due_date: new Date(e.target.value) }))
            }
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: InvoiceStatus) =>
              setFormData((prev: CreateInvoiceInput) => ({ ...prev, status: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Invoice Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg">
              <div className="md:col-span-5">
                <Label htmlFor={`description-${index}`}>Description</Label>
                <Input
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateItem(index, 'description', e.target.value)
                  }
                  placeholder="Item description"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  value={item.quantity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor={`unit_price-${index}`}>Unit Price</Label>
                <Input
                  id={`unit_price-${index}`}
                  type="number"
                  value={item.unit_price}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                  }
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Total</Label>
                <div className="flex items-center h-10 px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                  ${item.total.toFixed(2)}
                </div>
              </div>
              
              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(index)}
                  disabled={formData.items.length === 1}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Totals and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData((prev: CreateInvoiceInput) => ({ ...prev, notes: e.target.value || null }))
              }
              placeholder="Additional notes or terms..."
              rows={4}
            />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taxes">Taxes</Label>
              <Input
                id="taxes"
                type="number"
                value={formData.taxes}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleTaxesChange(parseFloat(e.target.value) || 0)
                }
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes:</span>
                <span>${formData.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${formData.amount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={submitting || isLoading || formData.client_id === 0}
          className="min-w-32"
        >
          {submitting ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );
}
