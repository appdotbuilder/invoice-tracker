
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { ClientManagement } from '@/components/ClientManagement';
import { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import type { Invoice, Client } from '../../server/src/schema';
import { Calendar, DollarSign, Users, FileText } from 'lucide-react';

function App() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalAmount: 0,
    pendingInvoices: 0,
    totalClients: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoicesData, clientsData] = await Promise.all([
          trpc.getInvoices.query(),
          trpc.getClients.query()
        ]);
        
        setInvoices(invoicesData);
        setClients(clientsData);
        
        // Calculate stats
        const totalAmount = invoicesData.reduce((sum, inv) => sum + inv.amount, 0);
        const pendingInvoices = invoicesData.filter(inv => inv.status === 'Pending').length;
        
        setStats({
          totalInvoices: invoicesData.length,
          totalAmount,
          pendingInvoices,
          totalClients: clientsData.length
        });
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);

  const refreshData = async () => {
    try {
      const [invoicesData, clientsData] = await Promise.all([
        trpc.getInvoices.query(),
        trpc.getClients.query()
      ]);
      
      setInvoices(invoicesData);
      setClients(clientsData);
      
      // Update stats
      const totalAmount = invoicesData.reduce((sum, inv) => sum + inv.amount, 0);
      const pendingInvoices = invoicesData.filter(inv => inv.status === 'Pending').length;
      
      setStats({
        totalInvoices: invoicesData.length,
        totalAmount,
        pendingInvoices,
        totalClients: clientsData.length
      });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Invoice Tracker</h1>
          <p className="text-gray-600">Manage your invoices and clients efficiently</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingInvoices}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoices">📄 Invoices</TabsTrigger>
            <TabsTrigger value="clients">👥 Clients</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invoices" className="space-y-4">
            <InvoiceManagement 
              invoices={invoices}
              clients={clients}
              onRefresh={refreshData}
            />
          </TabsContent>
          
          <TabsContent value="clients" className="space-y-4">
            <ClientManagement 
              clients={clients}
              onRefresh={refreshData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
