import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bylz Monetization',
    version: '1.0.0',
  },
});

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Authorization header required' }, 401);
    }
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError || !user) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    const { invoiceId } = await req.json();
    if (!invoiceId) {
      return corsResponse({ error: 'invoiceId is required' }, 400);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile || !company) {
      return corsResponse({ error: 'Company or Profile not found' }, 404);
    }

    // Server-side plan limit check for Starter
    if (profile.plan === 'starter') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .neq('status', 'draft')
        .gte('created_at', startOfMonth)
        .lte('created_at', endOfMonth);

      if ((count ?? 0) >= 10) {
        return corsResponse(
          { error: 'Limite de 10 factures mensuelles atteinte sur le plan Starter.' },
          402
        );
      }
    }

    // Fetch invoice to emit
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('company_id', company.id)
      .single();

    if (invError || !invoice) {
      return corsResponse({ error: 'Invoice not found or unauthorized' }, 404);
    }

    // Generate number if draft
    let number = invoice.number;
    if (!number || number.startsWith('DRAFT-')) {
      const prefix = invoice.type === 'credit_note' ? 'AV' : 'FC';
      const year = new Date().getFullYear();
      
      const { count: seqCount } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)
        .neq('status', 'draft');

      const nextNum = (seqCount ?? 0) + 1;
      number = `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
    }

    let paymentLinkUrl: string | null = null;

    // Generate Stripe Connect Payment Link if Pro & Connect account charges_enabled
    if (
      company.stripe_connect_account_id &&
      invoice.type !== 'credit_note' &&
      Number(invoice.total_amount) > 0
    ) {
      try {
        const account = await stripe.accounts.retrieve(company.stripe_connect_account_id);
        if (account.charges_enabled) {
          const unitAmount = Math.round(Number(invoice.total_amount) * 100);
          const link = await stripe.paymentLinks.create(
            {
              line_items: [
                {
                  price_data: {
                    currency: 'eur',
                    product_data: {
                      name: `Facture ${number}`,
                    },
                    unit_amount: unitAmount,
                  },
                  quantity: 1,
                },
              ],
              metadata: {
                invoice_id: invoice.id,
              },
            },
            {
              stripeAccount: company.stripe_connect_account_id,
            }
          );
          paymentLinkUrl = link.url;
        }
      } catch (e) {
        console.error('Error generating Stripe Connect payment link during emission:', e);
      }
    }

    // Update invoice status to pending (or emitted)
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .update({
        number,
        status: 'pending',
        issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
        ...(paymentLinkUrl ? { stripe_payment_link: paymentLinkUrl } : {}),
      })
      .eq('id', invoice.id)
      .select('*')
      .single();

    if (updateError) {
      return corsResponse({ error: updateError.message }, 500);
    }

    return corsResponse({ invoice: updatedInvoice });
  } catch (error: any) {
    console.error(`Emit invoice error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});
