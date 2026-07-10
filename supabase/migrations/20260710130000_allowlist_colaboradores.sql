-- Allowlist de colaboradores autorizados a usar o app via login Google.
-- O Google OAuth cria automaticamente um usuário em auth.users no primeiro
-- login de qualquer conta Gmail — sem essa allowlist, qualquer pessoa com
-- conta Google ganharia acesso. O trigger abaixo bloqueia (deleta) qualquer
-- usuário recém-criado cujo e-mail não esteja na lista.

create table public.colaboradores_autorizados (
  email text primary key,
  nome text,
  created_at timestamptz not null default now()
);

alter table public.colaboradores_autorizados enable row level security;
-- Apenas leitura por usuários autenticados; escrita só via SQL editor/painel
-- (gestão da allowlist é manual, feita pela pessoa responsável, não pelo app).
create policy "authenticated_read_only" on public.colaboradores_autorizados
  for select using (auth.uid() is not null);

-- ============================================================
-- Trigger: bloqueia signup de e-mails fora da allowlist
-- ============================================================
create or replace function public.bloquear_colaborador_nao_autorizado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.colaboradores_autorizados
    where lower(email) = lower(new.email)
  ) then
    -- Remove o usuário recém-criado pelo provider OAuth antes que ele
    -- consiga logar. Levantar exceção também funcionaria, mas deletar
    -- evita deixar "usuários fantasma" acumulados em auth.users.
    delete from auth.users where id = new.id;
    raise exception 'E-mail % não autorizado a acessar o BetCosturas.', new.email;
  end if;
  return new;
end;
$$;

create trigger trg_bloquear_colaborador_nao_autorizado
  after insert on auth.users
  for each row execute function public.bloquear_colaborador_nao_autorizado();

-- ============================================================
-- Cadastre aqui (ou depois, manualmente) os e-mails autorizados:
-- insert into public.colaboradores_autorizados (email, nome) values
--   ('exemplo@gmail.com', 'Nome do Colaborador');
-- ============================================================
