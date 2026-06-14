// Reemplaza las lecturas/escrituras de la colección 'b2b_invoices' de Firestore
// por la tabla 'b2b_invoices' de Supabase. Las facturas B2B agrupan los paquetes
// enviados por un partner en un mes y su importe total.

import { supabase } from '../supabase';

interface B2BInvoiceItem {
  tracking: string;
  peso: number;
  precio: number;
  subtotal: number;
}

interface B2BInvoiceRow {
  id: string;
  partner_id: string | null;
  partner_name: string | null;
  month: string | null;
  items: B2BInvoiceItem[] | null;
  total_amount: number | null;
  status: string;
  pdf_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export type FlatB2BInvoice = {
  id: string;
  partnerId: string | null;
  partnerName: string | null;
  month: string | null;
  items: B2BInvoiceItem[];
  totalAmount: number;
  // totalPeso no es una columna; se calcula sumando el peso de los items para
  // preservar la línea "X Kg totales" que mostraba la UI.
  totalPeso: number;
  status: string;
  pdfUrl: string | null;
  createdAt?: { toDate: () => Date; toMillis: () => number };
};

function uuidOrNull(value: string | null | undefined): string | null {
  if (!value || value === 'unknown' || value === 'self' || value === '') return null;
  return value;
}

function rowToInvoice(row: B2BInvoiceRow): FlatB2BInvoice {
  const items = row.items || [];
  const createdAt = row.created_at
    ? { toDate: () => new Date(row.created_at as string), toMillis: () => new Date(row.created_at as string).getTime() }
    : undefined;
  return {
    id: row.id,
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    month: row.month,
    items,
    totalAmount: row.total_amount || 0,
    totalPeso: items.reduce((sum, item) => sum + (item.peso || 0), 0),
    status: row.status,
    pdfUrl: row.pdf_url,
    createdAt,
  };
}

export interface ListInvoicesOptions {
  partnerId?: string;
  limit?: number;
}

// Equivalente a onSnapshot ordenado por fecha desc. Carga inicial + canal realtime.
export function subscribeInvoices(
  opts: ListInvoicesOptions,
  cb: (invoices: FlatB2BInvoice[]) => void,
  onError?: (error: Error) => void,
): () => void {
  let active = true;
  const load = () => {
    let q = supabase.from('b2b_invoices').select('*').order('created_at', { ascending: false });
    if (opts.partnerId) q = q.eq('partner_id', opts.partnerId);
    if (opts.limit) q = q.limit(opts.limit);
    q.then(({ data, error }) => {
      if (error) {
        console.error('Error cargando facturas B2B:', error.message);
        onError?.(new Error(error.message));
        return;
      }
      if (active) cb((data as B2BInvoiceRow[]).map(rowToInvoice));
    });
  };
  load();
  const channel = supabase
    .channel(`b2b_invoices-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'b2b_invoices' }, load)
    .subscribe();
  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

export interface NuevaFacturaInput {
  partnerId: string;
  partnerName: string;
  month: string;
  items: B2BInvoiceItem[];
  totalAmount: number;
  status?: string;
}

export async function crearFacturaB2B(input: NuevaFacturaInput): Promise<string> {
  const { data, error } = await supabase.from('b2b_invoices').insert({
    partner_id: uuidOrNull(input.partnerId),
    partner_name: input.partnerName,
    month: input.month,
    items: input.items,
    total_amount: input.totalAmount,
    status: input.status || 'Pendiente',
  }).select('id').single();
  if (error) throw error;
  return (data as { id: string }).id;
}
