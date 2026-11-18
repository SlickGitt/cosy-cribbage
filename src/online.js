// Friend play: talks to the Supabase project. The server deals, checks every move and
// scores; this file only sends moves and fetches each player's view of a game.
// Supabase's browser library is loaded the first time it's needed, so solo play stays light.

const PROJECTS = {
  live: { url: 'https://qsuupejpxcrynlujxexw.supabase.co', key: 'sb_publishable_fO96Y9DDpQW6RqdlAkEOlw_qmZABzXW' },
  dev: { url: 'https://noaygepklibwsqsrgpic.supabase.co', key: 'sb_publishable_13tpdkdouerppfbV9O9XLA_EXWmFW4W' },
};
// The production address uses the live project. Previews and local copies use dev.
const LIVE_HOSTS = ['lantern-lane-5dw.pages.dev'];
export const ENV = LIVE_HOSTS.includes(location.hostname) ? 'live' : 'dev';

let client = null, booting = null;

function loadLib() {
  if (window.supabase) return Promise.resolve(window.supabase);
  return new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = new URL('./vendor/supabase-2.119.0.js', import.meta.url).href;
    s.onload = () => ok(window.supabase);
    s.onerror = () => fail(new Error("Couldn't load friend play. Check your connection."));
    document.head.append(s);
  });
}

// Signs in quietly the first time (an anonymous player, no account needed) and keeps
// that identity in this browser.
export function ready() {
  if (client) return Promise.resolve(client);
  if (booting) return booting;
  booting = (async () => {
    const lib = await loadLib();
    const P = PROJECTS[ENV];
    const c = lib.createClient(P.url, P.key, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data } = await c.auth.getSession();
    if (!data.session) {
      const { error } = await c.auth.signInAnonymously();
      if (error) throw new Error("Couldn't connect to friend play. Try again in a moment.");
    }
    client = c;
    return c;
  })();
  booting.catch(() => { booting = null; });
  return booting;
}

async function rpc(fn, args = {}) {
  const c = await ready();
  const { data, error } = await c.rpc(fn, args);
  if (error) throw new Error(error.message || 'Something went wrong');
  return data;
}

export const createGame = (name, walker) => rpc('create_game', { p_name: name, p_walker: walker });
export const preview = (code) => rpc('game_preview', { p_code: code });
export const joinGame = (code, name, walker) => rpc('join_game', { p_code: code, p_name: name, p_walker: walker });
export const getGame = (id) => rpc('get_game', { p_game: id });
export const myGames = () => rpc('my_games');
export const cutForDeal = (id, i) => rpc('cut_for_deal', { p_game: id, p_index: i });
export const discard = (id, cards) => rpc('discard_cards', { p_game: id, p_cards: cards });
export const playCard = (id, card) => rpc('play_card', { p_game: id, p_card: card });

export const inviteLink = (code) => `${location.origin}${location.pathname}?g=${code}`;

// Calls back whenever this game changes on the server. Also checks again when the tab
// comes back into view, in case the live connection dropped while the phone was asleep.
export async function watch(id, onChange) {
  const c = await ready();
  const ch = c.channel('game-' + id)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: 'id=eq.' + id }, () => onChange())
    .subscribe();
  const vis = () => { if (document.visibilityState === 'visible') onChange(); };
  document.addEventListener('visibilitychange', vis);
  window.addEventListener('online', vis);
  return () => { c.removeChannel(ch); document.removeEventListener('visibilitychange', vis); window.removeEventListener('online', vis); };
}
