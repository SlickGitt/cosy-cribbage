-- Lantern Lane: friend play, database setup (rules version 1)
--
-- Paste the whole file into the Supabase SQL Editor and click Run.
-- Run it once on a fresh project (dev first, then live).
--
-- How it works
-- - public.games holds what both players may see: scores, phase, the pegging pile,
--   the starter, and the last show. Each player can read only their own games.
-- - Everything secret lives in the private ll schema, which the browser can't reach:
--   each player's hand, the deck, the crib, and a record of every deal and move.
-- - Players never write to tables. They call the functions at the bottom of this
--   file, which check every move, deal from a properly shuffled deck, score, and
--   move the game on. Go is called automatically when a player can't play.

create schema if not exists ll;
revoke all on schema ll from public;

-- ---------- cards ----------
-- A card is 'rank-suit': rank 1 (ace) to 13 (king), suit 0 to 3. Same ids as the game code.
create or replace function ll.r(c text) returns int language sql immutable set search_path = '' as $$ select split_part(c, '-', 1)::int $$;
create or replace function ll.s(c text) returns int language sql immutable set search_path = '' as $$ select split_part(c, '-', 2)::int $$;
create or replace function ll.v(c text) returns int language sql immutable set search_path = '' as $$ select least(split_part(c, '-', 1)::int, 10) $$;
create or replace function ll.other(w text) returns text language sql immutable set search_path = '' as $$ select case when w = 'a' then 'b' else 'a' end $$;

-- A freshly shuffled 52-card deck. gen_random_uuid() draws from the server's strong random source.
create or replace function ll.shuffled() returns text[] language sql volatile set search_path = '' as $$
  select array_agg(c order by gen_random_uuid())
  from (select r || '-' || s as c from generate_series(1, 13) r, generate_series(0, 3) s) t
$$;

-- ---------- tables ----------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- the invite code in the share link
  seed int not null,                         -- lane seed, so both players walk the same lane
  rules int not null default 1,
  player_a uuid not null,                    -- the player who created the game
  player_b uuid,                             -- the friend who joined
  name_a text not null,
  name_b text,
  walker_a text,
  walker_b text,
  status text not null default 'waiting',    -- waiting, active, over
  phase text,                                -- discard, peg, done
  round int not null default 0,
  dealer text,                               -- 'a' or 'b'
  score_a int not null default 0,
  score_b int not null default 0,
  from_a int not null default 0,             -- scores at the start of this round
  from_b int not null default 0,
  cut jsonb,                                 -- the cut for first deal
  discarded jsonb not null default '{"a":false,"b":false}',
  crib_n int not null default 0,
  starter text,
  peg jsonb,                                 -- count, pile, turn, go, last, spent
  show jsonb,                                -- the most recent show: hands, crib and their scores
  winner text,
  version int not null default 0,            -- goes up by one on every move
  events jsonb not null default '[]',        -- what happened in the latest move, for animations
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists games_player_a on public.games (player_a);
create index if not exists games_player_b on public.games (player_b);

create table if not exists ll.hands (
  game uuid not null references public.games on delete cascade,
  side text not null,
  cards text[] not null,                     -- cards still in hand
  kept text[],                               -- the four kept for the show
  primary key (game, side)
);
create table if not exists ll.secrets (
  game uuid primary key references public.games on delete cascade,
  deck text[] not null default '{}',
  crib text[] not null default '{}'
);
-- Every deal, kept for the honest deck record.
create table if not exists ll.deals (
  game uuid not null references public.games on delete cascade,
  round int not null,
  hand_a text[] not null,
  hand_b text[] not null,
  starter text,
  primary key (game, round)
);
-- Every move, for replays and checking.
create table if not exists ll.moves (
  id bigserial primary key,
  game uuid not null references public.games on delete cascade,
  round int not null,
  side text,
  kind text not null,
  data jsonb,
  at timestamptz not null default now()
);

alter table public.games enable row level security;
alter table ll.hands enable row level security;
alter table ll.secrets enable row level security;
alter table ll.deals enable row level security;
alter table ll.moves enable row level security;

revoke all on public.games from public, anon, authenticated;
grant select on public.games to authenticated;
drop policy if exists "players read their own games" on public.games;
create policy "players read their own games" on public.games
  for select to authenticated
  using ((select auth.uid()) in (player_a, player_b));

-- Live updates: each player's browser is told when their game changes.
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'games') then
    alter publication supabase_realtime add table public.games;
  end if;
end $$;

-- ---------- scoring (matches src/scoring.js) ----------
create or replace function ll.score_hand(hand text[], starter text, is_crib boolean)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  allc text[] := hand || starter;
  items jsonb := '[]';
  m int; i int; j int; k int; sm int; n int; cs text[]; rs int[]; ok boolean; found boolean; nob text;
begin
  -- fifteens
  for m in 1..31 loop
    sm := 0; cs := '{}';
    for i in 0..4 loop
      if (m & (1 << i)) <> 0 then sm := sm + ll.v(allc[i + 1]); cs := cs || allc[i + 1]; end if;
    end loop;
    if sm = 15 and cardinality(cs) > 1 then
      items := items || jsonb_build_object('label', 'Fifteen', 'cards', to_jsonb(cs), 'pts', 2);
    end if;
  end loop;
  -- pairs
  for i in 1..5 loop
    for j in i + 1..5 loop
      if ll.r(allc[i]) = ll.r(allc[j]) then
        items := items || jsonb_build_object('label', 'Pair', 'cards', jsonb_build_array(allc[i], allc[j]), 'pts', 2);
      end if;
    end loop;
  end loop;
  -- runs: the longest length only, every combination of it
  for n in reverse 5..3 loop
    found := false;
    for m in 1..31 loop
      cs := '{}';
      for i in 0..4 loop
        if (m & (1 << i)) <> 0 then cs := cs || allc[i + 1]; end if;
      end loop;
      continue when cardinality(cs) <> n;
      select array_agg(ll.r(x) order by ll.r(x)) into rs from unnest(cs) x;
      ok := true;
      for k in 2..n loop
        if rs[k] <> rs[k - 1] + 1 then ok := false; exit; end if;
      end loop;
      if ok then
        found := true;
        select array_agg(x order by ll.r(x), ll.s(x)) into cs from unnest(cs) x;
        items := items || jsonb_build_object('label', 'Run of ' || n, 'cards', to_jsonb(cs), 'pts', n);
      end if;
    end loop;
    exit when found;
  end loop;
  -- flush
  if (select count(distinct ll.s(x)) from unnest(hand) x) = 1 then
    if ll.s(starter) = ll.s(hand[1]) then
      items := items || jsonb_build_object('label', 'Flush of 5', 'cards', to_jsonb(allc), 'pts', 5);
    elsif not is_crib then
      items := items || jsonb_build_object('label', 'Flush of 4', 'cards', to_jsonb(hand), 'pts', 4);
    end if;
  end if;
  -- his nobs
  select x into nob from unnest(hand) with ordinality u(x, o) where ll.r(x) = 11 and ll.s(x) = ll.s(starter) order by o limit 1;
  if nob is not null then
    items := items || jsonb_build_object('label', 'His nobs', 'cards', jsonb_build_array(nob), 'pts', 1);
  end if;
  return jsonb_build_object('items', items, 'total', coalesce((select sum((e->>'pts')::int) from jsonb_array_elements(items) e), 0));
end $$;

create or replace function ll.peg_score(seq text[], cnt int)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  items jsonb := '[]';
  n int := cardinality(seq);
  k int := 1; l int; i int; rs int[]; ok boolean;
begin
  if n = 0 then return items; end if;
  if cnt = 15 then items := items || jsonb_build_object('label', 'Fifteen', 'pts', 2); end if;
  if cnt = 31 then items := items || jsonb_build_object('label', '31', 'pts', 2); end if;
  while k < n and ll.r(seq[n - k]) = ll.r(seq[n]) loop k := k + 1; end loop;
  if k = 2 then items := items || jsonb_build_object('label', 'Pair', 'pts', 2);
  elsif k = 3 then items := items || jsonb_build_object('label', 'Pair royal', 'pts', 6);
  elsif k = 4 then items := items || jsonb_build_object('label', 'Double pair royal', 'pts', 12);
  end if;
  for l in reverse n..3 loop
    select array_agg(ll.r(x) order by ll.r(x)) into rs from unnest(seq[n - l + 1:n]) x;
    ok := true;
    for i in 2..l loop
      if rs[i] <> rs[i - 1] + 1 then ok := false; exit; end if;
    end loop;
    if ok then items := items || jsonb_build_object('label', 'Run of ' || l, 'pts', l); exit; end if;
  end loop;
  return items;
end $$;

-- ---------- game engine (internal) ----------
create or replace function ll.ev(gid uuid, e jsonb) returns void language sql set search_path = '' as $$
  update public.games set events = events || e where id = gid
$$;

create or replace function ll.log_move(gid uuid, p_side text, p_kind text, p_data jsonb) returns void language sql set search_path = '' as $$
  insert into ll.moves (game, round, side, kind, data)
  select gid, round, p_side, p_kind, p_data from public.games where id = gid
$$;

-- Start a new move: bump the version and clear last move's events.
create or replace function ll.begin_move(gid uuid) returns void language sql set search_path = '' as $$
  update public.games set version = version + 1, events = '[]', updated_at = now() where id = gid
$$;

-- Add points. Returns true if that wins the game.
create or replace function ll.add_pts(gid uuid, w text, pts int, label text, quiet boolean default false)
returns boolean language plpgsql set search_path = '' as $$
declare sc int;
begin
  if pts <= 0 then return false; end if;
  update public.games set
    score_a = case when w = 'a' then least(121, score_a + pts) else score_a end,
    score_b = case when w = 'b' then least(121, score_b + pts) else score_b end
  where id = gid
  returning case when w = 'a' then score_a else score_b end into sc;
  if not quiet then perform ll.ev(gid, jsonb_build_object('kind', 'pts', 'who', w, 'pts', pts, 'label', label)); end if;
  if sc >= 121 then
    update public.games set status = 'over', phase = 'done', winner = w where id = gid;
    perform ll.ev(gid, jsonb_build_object('kind', 'won', 'who', w));
    return true;
  end if;
  return false;
end $$;

create or replace function ll.deal_round(gid uuid) returns void language plpgsql set search_path = '' as $$
declare d text[] := ll.shuffled(); ha text[]; hb text[]; rnd int;
begin
  select array_agg(x order by ll.r(x), ll.s(x)) into ha from unnest(d[1:6]) x;
  select array_agg(x order by ll.r(x), ll.s(x)) into hb from unnest(d[7:12]) x;
  update public.games set round = round + 1, phase = 'discard', starter = null, peg = null, crib_n = 0,
    discarded = '{"a":false,"b":false}', from_a = score_a, from_b = score_b
  where id = gid returning round into rnd;
  insert into ll.hands (game, side, cards, kept) values (gid, 'a', ha, null), (gid, 'b', hb, null)
    on conflict (game, side) do update set cards = excluded.cards, kept = null;
  insert into ll.secrets (game, deck, crib) values (gid, d[13:52], '{}')
    on conflict (game) do update set deck = excluded.deck, crib = '{}';
  insert into ll.deals (game, round, hand_a, hand_b) values (gid, rnd, ha, hb);
  perform ll.ev(gid, jsonb_build_object('kind', 'deal', 'round', rnd));
end $$;

create or replace function ll.can_play(gid uuid, w text, cnt int) returns boolean language sql stable set search_path = '' as $$
  select exists (select 1 from ll.hands h, unnest(h.cards) x where h.game = gid and h.side = w and cnt + ll.v(x) <= 31)
$$;
create or replace function ll.left_n(gid uuid, w text) returns int language sql stable set search_path = '' as $$
  select coalesce(cardinality(cards), 0) from ll.hands where game = gid and side = w
$$;

-- Score the hands and crib, then deal the next round (unless someone has won).
create or replace function ll.do_show(gid uuid) returns void language plpgsql set search_path = '' as $$
declare g public.games; nd text; ka text[]; kd text[]; cr text[]; steps jsonb := '[]'; st jsonb; it jsonb; res jsonb;
begin
  select * into g from public.games where id = gid;
  nd := ll.other(g.dealer);
  select kept into ka from ll.hands where game = gid and side = nd;
  select kept into kd from ll.hands where game = gid and side = g.dealer;
  select crib into cr from ll.secrets where game = gid;
  res := ll.score_hand(ka, g.starter, false);
  steps := steps || jsonb_build_object('who', nd, 'crib', false, 'cards', to_jsonb(ka), 'items', res->'items', 'total', res->'total');
  res := ll.score_hand(kd, g.starter, false);
  steps := steps || jsonb_build_object('who', g.dealer, 'crib', false, 'cards', to_jsonb(kd), 'items', res->'items', 'total', res->'total');
  res := ll.score_hand(cr, g.starter, true);
  steps := steps || jsonb_build_object('who', g.dealer, 'crib', true, 'cards', to_jsonb(cr), 'items', res->'items', 'total', res->'total');
  update public.games set show = jsonb_build_object('round', g.round, 'starter', g.starter, 'dealer', g.dealer,
    'before', jsonb_build_object('a', g.score_a, 'b', g.score_b),
    'from', jsonb_build_object('a', g.from_a, 'b', g.from_b), 'steps', steps)
  where id = gid;
  perform ll.ev(gid, jsonb_build_object('kind', 'show', 'round', g.round));
  for st in select * from jsonb_array_elements(steps) loop
    for it in select * from jsonb_array_elements(st->'items') loop
      if ll.add_pts(gid, st->>'who', (it->>'pts')::int,
           case when (st->>'crib')::boolean then 'Crib: ' else '' end || (it->>'label'), true) then
        return;
      end if;
    end loop;
  end loop;
  update public.games set dealer = ll.other(dealer) where id = gid;
  perform ll.deal_round(gid);
end $$;

-- Move the pegging on until a player has a card they can play, calling Go when they can't.
create or replace function ll.advance(gid uuid) returns void language plpgsql set search_path = '' as $$
declare p jsonb; t text; o text; cnt int; la int; lb int; lst text; lbl text;
begin
  loop
    select peg into p from public.games where id = gid;
    cnt := (p->>'count')::int; t := p->>'turn'; o := ll.other(t); lst := p->>'last';
    la := ll.left_n(gid, 'a'); lb := ll.left_n(gid, 'b');
    if la = 0 and lb = 0 then
      if cnt > 0 and cnt <> 31 then
        if ll.add_pts(gid, lst, 1, 'Last card') then return; end if;
      end if;
      perform ll.do_show(gid);
      return;
    end if;
    if ll.can_play(gid, t, cnt) then return; end if;
    if ll.left_n(gid, t) > 0 and not (p->'go'->>t)::boolean then
      update public.games set peg = jsonb_set(peg, array['go', t], 'true') where id = gid;
      perform ll.ev(gid, jsonb_build_object('kind', 'go', 'who', t));
    end if;
    if ll.can_play(gid, o, cnt) then
      update public.games set peg = jsonb_set(peg, '{turn}', to_jsonb(o)) where id = gid;
      return;
    end if;
    if cnt <> 31 and lst is not null then
      lbl := case when la + lb > 0 then 'Go' else 'Last card' end;
      if ll.add_pts(gid, lst, 1, lbl) then return; end if;
    end if;
    update public.games set peg = peg
      || jsonb_build_object('count', 0, 'pile', '[]'::jsonb, 'go', jsonb_build_object('a', false, 'b', false),
           'spent', (peg->>'spent')::int + jsonb_array_length(peg->'pile'), 'turn', ll.other(coalesce(lst, t)))
    where id = gid;
    perform ll.ev(gid, jsonb_build_object('kind', 'reset'));
  end loop;
end $$;

-- What one player is allowed to see of a game.
create or replace function ll.state(gid uuid, uid uuid) returns jsonb language plpgsql stable set search_path = '' as $$
declare g public.games; me text; h ll.hands; opp int;
begin
  select * into g from public.games where id = gid;
  if not found then return null; end if;
  me := case when uid = g.player_a then 'a' when uid = g.player_b then 'b' end;
  if me is null then return null; end if;
  select * into h from ll.hands where game = gid and side = me;
  opp := ll.left_n(gid, ll.other(me));
  return (to_jsonb(g) - 'player_a' - 'player_b')
    || jsonb_build_object('me', me, 'hand', coalesce(to_jsonb(h.cards), '[]'), 'kept', to_jsonb(h.kept), 'opp_n', opp);
end $$;

create or replace function ll.side_of(g public.games) returns text language sql stable set search_path = '' as $$
  select case when auth.uid() = g.player_a then 'a' when auth.uid() = g.player_b then 'b' end
$$;

create or replace function ll.clean_name(n text) returns text language sql immutable set search_path = '' as $$
  -- letters, numbers, spaces, apostrophes, full stops and hyphens only, up to 20 characters
  select coalesce(nullif(trim(left(regexp_replace(regexp_replace(coalesce(n, ''), '[^[:alnum:] ''.-]', '', 'g'), '\s+', ' ', 'g'), 20)), ''), 'A friend')
$$;
create or replace function ll.clean_walker(w text) returns text language sql immutable set search_path = '' as $$
  select case when w ~ '^[a-z]{1,20}$' then w else 'bobble' end
$$;

-- ---------- what the game calls ----------
create or replace function public.create_game(p_name text, p_walker text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); alpha text := 'abcdefghjkmnpqrstuvwxyz23456789'; c text; b bytea; i int; gid uuid;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  if (select count(*) from public.games where (player_a = uid or player_b = uid) and status <> 'over') >= 30 then
    raise exception 'You have 30 games on the go. Finish some first.';
  end if;
  loop
    b := uuid_send(gen_random_uuid()); c := '';
    for i in 0..7 loop c := c || substr(alpha, 1 + get_byte(b, i) % length(alpha), 1); end loop;
    exit when not exists (select 1 from public.games where code = c);
  end loop;
  insert into public.games (code, seed, player_a, name_a, walker_a)
  values (c, 1000 + floor(random() * 9000)::int, uid, ll.clean_name(p_name), ll.clean_walker(p_walker))
  returning id into gid;
  return jsonb_build_object('id', gid, 'code', c);
end $$;

-- What a link shows before you join: who invited you, and whether there's a seat.
create or replace function public.game_preview(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare g public.games; uid uuid := auth.uid();
begin
  select * into g from public.games where code = lower(trim(p_code));
  if not found then return null; end if;
  return jsonb_build_object('id', case when uid in (g.player_a, g.player_b) then g.id end,
    'host', g.name_a, 'walker', g.walker_a, 'status', g.status,
    'seat', case when uid in (g.player_a, g.player_b) then 'yours' when g.player_b is null then 'open' else 'full' end);
end $$;

create or replace function public.join_game(p_code text, p_name text, p_walker text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare g public.games; uid uuid := auth.uid(); d text[]; ca text; cb text;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  select * into g from public.games where code = lower(trim(p_code)) for update;
  if not found then raise exception 'That game link doesn''t work'; end if;
  if uid in (g.player_a, g.player_b) then return ll.state(g.id, uid); end if;
  if g.player_b is not null then raise exception 'This game already has two players'; end if;
  perform ll.begin_move(g.id);
  -- cut for deal: low card deals, cut again on a tie
  loop
    d := ll.shuffled(); ca := d[1]; cb := d[2];
    exit when ll.r(ca) <> ll.r(cb);
  end loop;
  update public.games set player_b = uid, name_b = ll.clean_name(p_name), walker_b = ll.clean_walker(p_walker),
    status = 'active', cut = jsonb_build_object('a', ca, 'b', cb), dealer = case when ll.r(ca) < ll.r(cb) then 'a' else 'b' end
  where id = g.id;
  perform ll.ev(g.id, jsonb_build_object('kind', 'joined'));
  perform ll.log_move(g.id, 'b', 'join', jsonb_build_object('cut', jsonb_build_object('a', ca, 'b', cb)));
  perform ll.deal_round(g.id);
  return ll.state(g.id, uid);
end $$;

create or replace function public.get_game(p_game uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select ll.state(p_game, auth.uid())
$$;

create or replace function public.my_games()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(x order by (x->>'updated_at') desc), '[]') from (
    select jsonb_build_object('id', g.id, 'code', g.code, 'status', g.status, 'phase', g.phase, 'round', g.round,
      'me', s.me, 'opp', case when s.me = 'a' then g.name_b else g.name_a end,
      'mine', case when s.me = 'a' then g.score_a else g.score_b end,
      'theirs', case when s.me = 'a' then g.score_b else g.score_a end,
      'winner', g.winner, 'updated_at', g.updated_at,
      'turn', case
        when g.status = 'waiting' then 'join'
        when g.status = 'over' then 'over'
        when g.phase = 'discard' then case when (g.discarded->>s.me)::boolean then 'them' else 'you' end
        when g.phase = 'peg' then case when g.peg->>'turn' = s.me then 'you' else 'them' end
        else 'them' end) x
    from public.games g
    cross join lateral (select case when auth.uid() = g.player_a then 'a' else 'b' end me) s
    where auth.uid() in (g.player_a, g.player_b)
    order by g.updated_at desc
    limit 50
  ) t
$$;

create or replace function public.discard_cards(p_game uuid, p_cards text[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare g public.games; me text; hand text[]; keep text[]; st text;
begin
  select * into g from public.games where id = p_game for update;
  if not found then raise exception 'Game not found'; end if;
  me := ll.side_of(g);
  if me is null then raise exception 'Not your game'; end if;
  if g.status <> 'active' or g.phase <> 'discard' then raise exception 'Not time to discard'; end if;
  if (g.discarded->>me)::boolean then raise exception 'You have already sent your cards to the crib'; end if;
  if cardinality(p_cards) <> 2 or p_cards[1] = p_cards[2] then raise exception 'Pick two cards'; end if;
  select cards into hand from ll.hands where game = p_game and side = me;
  if not (p_cards <@ hand) then raise exception 'Those cards aren''t in your hand'; end if;
  keep := array(select x from unnest(hand) with ordinality u(x, o) where x <> all (p_cards) order by o);
  perform ll.begin_move(p_game);
  update ll.hands set cards = keep, kept = keep where game = p_game and side = me;
  update ll.secrets set crib = crib || p_cards where game = p_game;
  update public.games set discarded = jsonb_set(discarded, array[me], 'true'), crib_n = crib_n + 2
    where id = p_game returning * into g;
  perform ll.log_move(p_game, me, 'discard', jsonb_build_object('cards', to_jsonb(p_cards)));
  perform ll.ev(p_game, jsonb_build_object('kind', 'discard', 'who', me));
  if (g.discarded->>'a')::boolean and (g.discarded->>'b')::boolean then
    -- turn the starter
    select deck[1] into st from ll.secrets where game = p_game;
    update ll.secrets set deck = deck[2:] where game = p_game;
    update ll.deals set starter = st where game = p_game and round = g.round;
    update public.games set starter = st, phase = 'peg',
      peg = jsonb_build_object('count', 0, 'pile', '[]'::jsonb, 'spent', 0, 'turn', ll.other(g.dealer),
        'go', jsonb_build_object('a', false, 'b', false), 'last', null)
    where id = p_game;
    perform ll.ev(p_game, jsonb_build_object('kind', 'starter', 'card', st));
    if ll.r(st) = 11 then
      if ll.add_pts(p_game, g.dealer, 2, 'His heels') then return ll.state(p_game, auth.uid()); end if;
    end if;
    perform ll.advance(p_game);
  end if;
  return ll.state(p_game, auth.uid());
end $$;

create or replace function public.play_card(p_game uuid, p_card text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare g public.games; me text; hand text[]; cnt int; pile jsonb; seq text[]; it jsonb;
begin
  select * into g from public.games where id = p_game for update;
  if not found then raise exception 'Game not found'; end if;
  me := ll.side_of(g);
  if me is null then raise exception 'Not your game'; end if;
  if g.status <> 'active' or g.phase <> 'peg' then raise exception 'Not time to play a card'; end if;
  if g.peg->>'turn' <> me then raise exception 'It isn''t your turn'; end if;
  select cards into hand from ll.hands where game = p_game and side = me;
  if not (p_card = any (hand)) then raise exception 'That card isn''t in your hand'; end if;
  cnt := (g.peg->>'count')::int + ll.v(p_card);
  if cnt > 31 then raise exception 'That would take the count over 31'; end if;
  perform ll.begin_move(p_game);
  update ll.hands set cards = array_remove(cards, p_card) where game = p_game and side = me;
  pile := (g.peg->'pile') || jsonb_build_object('c', p_card, 'w', me);
  update public.games set peg = peg || jsonb_build_object('count', cnt, 'pile', pile, 'last', me, 'turn', ll.other(me))
    where id = p_game;
  perform ll.log_move(p_game, me, 'play', jsonb_build_object('card', p_card, 'count', cnt));
  perform ll.ev(p_game, jsonb_build_object('kind', 'play', 'who', me, 'card', p_card, 'count', cnt));
  select array_agg(e->>'c' order by o) into seq from jsonb_array_elements(pile) with ordinality u(e, o);
  for it in select * from jsonb_array_elements(ll.peg_score(seq, cnt)) loop
    if ll.add_pts(p_game, me, (it->>'pts')::int, it->>'label') then return ll.state(p_game, auth.uid()); end if;
  end loop;
  if cnt = 31 then
    update public.games set peg = peg
      || jsonb_build_object('count', 0, 'pile', '[]'::jsonb, 'go', jsonb_build_object('a', false, 'b', false),
           'spent', (peg->>'spent')::int + jsonb_array_length(peg->'pile'))
    where id = p_game;
    perform ll.ev(p_game, jsonb_build_object('kind', 'reset'));
  end if;
  perform ll.advance(p_game);
  return ll.state(p_game, auth.uid());
end $$;

-- Only signed-in players (including anonymous ones) can call these. Nothing else is reachable.
revoke all on all functions in schema ll from public, anon, authenticated;
revoke all on function public.create_game(text, text) from public, anon;
revoke all on function public.game_preview(text) from public, anon;
revoke all on function public.join_game(text, text, text) from public, anon;
revoke all on function public.get_game(uuid) from public, anon;
revoke all on function public.my_games() from public, anon;
revoke all on function public.discard_cards(uuid, text[]) from public, anon;
revoke all on function public.play_card(uuid, text) from public, anon;
grant execute on function public.create_game(text, text) to authenticated;
grant execute on function public.game_preview(text) to authenticated;
grant execute on function public.join_game(text, text, text) to authenticated;
grant execute on function public.get_game(uuid) to authenticated;
grant execute on function public.my_games() to authenticated;
grant execute on function public.discard_cards(uuid, text[]) to authenticated;
grant execute on function public.play_card(uuid, text) to authenticated;
