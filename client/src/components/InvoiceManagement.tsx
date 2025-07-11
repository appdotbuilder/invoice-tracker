
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, CheckCircle, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { InvoiceForm } from '@/components/InvoiceForm';
import type { Invoice, Client, InvoiceStatus } from '../../../server/src/schema';

interface InvoiceManagementProps {
  invoices: Invoice[];
  clients: Client[];
  onRefresh: () => Promise<void>;
}

export function InvoiceManagement({ invoices, clients, onRefresh }: InvoiceManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clients.find(client => client.id === invoice.client_id)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateInvoice = async () => {
    setIsCreateDialogOpen(false);
    await onRefresh();
  };

  const handleUpdateInvoice = async () => {
    setEditingInvoice(null);
    await onRefresh();
  };

  const handleDeleteInvoice = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteInvoice.mutate({ id });
      await onRefresh();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    setIsLoading(true);
    try {
      await trpc.markInvoiceAsPaid.mutate({ id });
      await onRefresh();
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Invoice Management</h2>
          <p className="text-gray-600">Create and manage your invoices</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <InvoiceForm
              clients={clients}
              onSubmit={handleCreateInvoice}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search invoices or clients..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={(value: InvoiceStatus | 'all') => setStatusFilter(value)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-gray-500">
              {invoices.length === 0 ? (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No invoices yet</p>
                  <p className="text-sm">Create your first invoice to get started</p>
                </>
              ) : (
                <p>No invoices match your current filters</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice: Invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">{invoice.invoice_number}</CardTitle>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Client: {getClientName(invoice.client_id)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold">${invoice.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">
                        Due: {invoice.due_date.toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {invoice.status !== 'Paid' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPaid(invoice.id)}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingInvoice(invoice)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Invoice</DialogTitle>
                          </DialogHeader>
                          {editingInvoice && (
                            <InvoiceForm
                              clients={clients}
                              invoice={editingInvoice}
                              onSubmit={handleUpdateInvoice}
                              isLoading={isLoading}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete invoice {invoice.invoice_number}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Invoice Items */}
                  <div>
                    <h4 className="font-medium mb-2">Items</h4>
                    <div className="space-y-2">
                      {invoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                          <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            <p className="text-gray-500">
                              {item.quantity} × ${item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium">${item.total.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Summary */}
                  <Separator />
                  <div className="flex justify-between items-center text-sm">
                    <div className="space-y-1">
                      <p>Subtotal: ${(invoice.amount - invoice.taxes).toFixed(2)}</p>
                      <p>Taxes: ${invoice.taxes.toFixed(2)}</p>
                      <p className="font-bold">Total: ${invoice.amount.toFixed(2)}</p>
                    </div>
                    <div className="text-right text-gray-500">
                      <p>Created: {invoice.created_at.toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  {invoice.notes && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-1">Notes</h4>
                        <p className="text-sm text-gray-600">{invoice.notes}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
