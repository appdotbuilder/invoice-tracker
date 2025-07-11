
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Users, Mail } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Client, CreateClientInput, UpdateClientInput } from '../../../server/src/schema';

interface ClientManagementProps {
  clients: Client[];
  onRefresh: () => Promise<void>;
}

export function ClientManagement({ clients, onRefresh }: ClientManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<CreateClientInput>({
    name: '',
    email: ''
  });

  const filteredClients = clients.filter((client: Client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createClient.mutate(formData);
      await onRefresh();
      setIsCreateDialogOpen(false);
      setFormData({ name: '', email: '' });
    } catch (error) {
      console.error('Failed to create client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    
    setIsLoading(true);
    
    try {
      await trpc.updateClient.mutate({
        id: editingClient.id,
        name: formData.name,
        email: formData.email
      } as UpdateClientInput);
      await onRefresh();
      setEditingClient(null);
      setFormData({ name: '', email: '' });
    } catch (error) {
      console.error('Failed to update client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClient = async (id: number) => {
    setIsLoading(true);
    
    try {
      await trpc.deleteClient.mutate({ id });
      await onRefresh();
    } catch (error) {
      console.error('Failed to delete client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email
    });
  };

  const closeEditDialog = () => {
    setEditingClient(null);
    setFormData({ name: '', email: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Client Management</h2>
          <p className="text-gray-600">Manage your client information</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateClientInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Client name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateClientInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="client@example.com"
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Client'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-gray-500">
              {clients.length === 0 ? (
                <>
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No clients yet</p>
                  <p className="text-sm">Add your first client to get started</p>
                </>
              ) : (
                <p>No clients match your search</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredClients.map((client: Client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" />
                      {client.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4" />
                      {client.email}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(client)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Client</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUpdateClient} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                              id="edit-name"
                              value={formData.name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateClientInput) => ({ ...prev, name: e.target.value }))
                              }
                              placeholder="Client name"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                              id="edit-email"
                              type="email"
                              value={formData.email}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateClientInput) => ({ ...prev, email: e.target.value }))
                              }
                              placeholder="client@example.com"
                              required
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={closeEditDialog}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                              {isLoading ? 'Updating...' : 'Update Client'}
                            </Button>
                          </div>
                        </form>
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
                          <AlertDialogTitle>Delete Client</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {client.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClient(client.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="text-sm text-gray-500">
                  <p>Client since: {client.created_at.toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
