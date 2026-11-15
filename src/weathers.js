// Weather for each rest stop. Each kind is a set of dials the scene eases between:
// clouds (shadow cover), wind, rain, fog, dark (how gloomy), sun and storm (lightning).
export const WEATHER = {
  sunny: { name: 'Sunny spells', clouds: 0.6, wind: 0.15, rain: 0, fog: 0, dark: 0, sun: 1, storm: 0, weight: 18, say: ['Lovely bit of sun.', 'Ooh, the sun’s out.'] },
  fair: { name: 'Fair', clouds: 1, wind: 0.25, rain: 0, fog: 0, dark: 0, sun: 0.4, storm: 0, weight: 22, say: null },
  overcast: { name: 'Overcast', clouds: 1.7, wind: 0.2, rain: 0, fog: 0.1, dark: 0.4, sun: 0, storm: 0, weight: 15, say: ['Bit grey today.', 'Dull old day, isn’t it?'] },
  windy: { name: 'Blustery', clouds: 1.3, wind: 1, rain: 0, fog: 0, dark: 0.15, sun: 0.2, storm: 0, weight: 14, say: ['Bit blowy, isn’t it?', 'Hold on to your hat!'] },
  drizzle: { name: 'Drizzle', clouds: 1.6, wind: 0.3, rain: 0.45, fog: 0.15, dark: 0.4, sun: 0, storm: 0, weight: 12, say: ['Spot of drizzle.', 'Just a bit of drizzle, dear.'] },
  rain: { name: 'Rain', clouds: 1.9, wind: 0.5, rain: 1, fog: 0.1, dark: 0.6, sun: 0, storm: 0, weight: 8, say: ['Proper brolly weather.', 'It’s chucking it down!'] },
  storm: { name: 'Thunderstorm', clouds: 2, wind: 0.9, rain: 1, fog: 0, dark: 0.85, sun: 0, storm: 1, weight: 4, say: ['Ooh, hear that thunder?', 'Goodness, what a storm!'] },
  fog: { name: 'Fog', clouds: 0.4, wind: 0, rain: 0, fog: 1, dark: 0.2, sun: 0, storm: 0, weight: 7, say: ['Can’t see a thing in this fog.', 'Proper pea-souper, this.'] },
};
export const DIALS = ['clouds', 'wind', 'rain', 'fog', 'dark', 'sun', 'storm'];

// Weather tends to hang about: often it stays as it was, otherwise it changes to
// something likely. Storms only follow rain or wind.
export function pickWeather(prev) {
  if (!prev) return Math.random() < 0.6 ? 'fair' : 'sunny';
  if (Math.random() < 0.45) return prev;
  const options = Object.entries(WEATHER).filter(([k]) => k !== 'storm' || prev === 'rain' || prev === 'windy');
  let r = Math.random() * options.reduce((a, [, w]) => a + w.weight, 0);
  for (const [k, w] of options) { r -= w.weight; if (r <= 0) return k; }
  return 'fair';
}
