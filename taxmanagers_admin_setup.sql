-- 1. Ver meu usuário
SELECT id, email
FROM auth.users
WHERE email = 'alexandre.florio@hotmail.com';

-- 2. Criar ou atualizar meu perfil como master admin
INSERT INTO public.taxmanagers_partners (
  id,
  nome,
  faixa,
  is_admin
)
SELECT
  id,
  'Alexandre Florio',
  'Preta',
  TRUE
FROM auth.users
WHERE email = 'alexandre.florio@hotmail.com'
ON CONFLICT (id) DO UPDATE
SET
  nome = EXCLUDED.nome,
  faixa = 'Preta',
  is_admin = TRUE;

-- 3. Conferir se a atualização funcionou
SELECT p.id, u.email, p.nome, p.faixa, p.is_admin
FROM public.taxmanagers_partners p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'alexandre.florio@hotmail.com';
