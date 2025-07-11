
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createClientInputSchema, 
  updateClientInputSchema, 
  createInvoiceInputSchema, 
  updateInvoiceInputSchema,
  invoiceFilterSchema,
  markInvoiceAsPaidInputSchema
} from './schema';

import { createClient } from './handlers/create_client';
import { getClients } from './handlers/get_clients';
import { getClient } from './handlers/get_client';
import { updateClient } from './handlers/update_client';
import { deleteClient } from './handlers/delete_client';
import { createInvoice } from './handlers/create_invoice';
import { getInvoices } from './handlers/get_invoices';
import { getInvoice } from './handlers/get_invoice';
import { updateInvoice } from './handlers/update_invoice';
import { deleteInvoice } from './handlers/delete_invoice';
import { markInvoiceAsPaid } from './handlers/mark_invoice_as_paid';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Client Management
  createClient: publicProcedure
    .input(createClientInputSchema)
    .mutation(({ input }) => createClient(input)),
  
  getClients: publicProcedure
    .query(() => getClients()),
  
  getClient: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getClient(input.id)),
  
  updateClient: publicProcedure
    .input(updateClientInputSchema)
    .mutation(({ input }) => updateClient(input)),
  
  deleteClient: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteClient(input.id)),
  
  // Invoice Management
  createInvoice: publicProcedure
    .input(createInvoiceInputSchema)
    .mutation(({ input }) => createInvoice(input)),
  
  getInvoices: publicProcedure
    .input(invoiceFilterSchema.optional())
    .query(({ input }) => getInvoices(input)),
  
  getInvoice: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getInvoice(input.id)),
  
  updateInvoice: publicProcedure
    .input(updateInvoiceInputSchema)
    .mutation(({ input }) => updateInvoice(input)),
  
  deleteInvoice: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteInvoice(input.id)),
  
  markInvoiceAsPaid: publicProcedure
    .input(markInvoiceAsPaidInputSchema)
    .mutation(({ input }) => markInvoiceAsPaid(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
