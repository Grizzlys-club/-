-- Apply after 20261110_initial.sql. Trusted payment fulfilment transaction.
create or replace function public.fulfil_paid_order(
  p_order_id uuid,
  p_provider_session_id text,
  p_amount_rappen integer,
  p_currency text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_family_id uuid;
  v_world_id uuid;
begin
  -- Only trusted service-role clients may execute this RPC.
  select * into v_order from public.orders
    where id = p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.provider_session_id is distinct from p_provider_session_id
    or v_order.amount_rappen <> p_amount_rappen
    or v_order.currency <> upper(p_currency)
    or v_order.status not in ('pending','paid')
  then raise exception 'Payment verification mismatch'; end if;
  if v_order.status = 'paid' then
    select id into v_world_id from public.worlds where order_id = p_order_id;
    if v_world_id is null then raise exception 'Paid order without world'; end if;
    return v_world_id;
  end if;
  insert into public.families(owner_id) values(v_order.owner_id)
    returning id into v_family_id;
  insert into public.worlds(family_id,order_id,elf_name,elf_style,house_style)
    values(v_family_id,p_order_id,'Lasse','forest','snow')
    returning id into v_world_id;
  update public.orders set status='paid',paid_at=now()
    where id=p_order_id;
  return v_world_id;
end;
$$;
revoke all on function public.fulfil_paid_order(uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.fulfil_paid_order(uuid,text,integer,text) to service_role;
