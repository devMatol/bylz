-- Allow negative unit prices on invoice_lines for credit notes
alter table invoice_lines drop constraint if exists invoice_lines_unit_price_check;
alter table invoice_lines add constraint invoice_lines_unit_price_check
  check (unit_price >= -999999.99);

-- quantity stays > 0; negativity is carried by the price only
