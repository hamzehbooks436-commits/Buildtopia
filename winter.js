// A shared clock gives local and online winter worlds the same day and weather.
export const WINTER_CYCLE_MS = 12 * 60 * 1000;
const PALETTES = [[145, 195, 275], [190, 260, 320], [275, 325, 175], [165, 225, 300], [310, 185, 245]];
function randomAt(index) {
  const n = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}
export function winterWeather(now = Date.now()) {
  const cycle = Math.floor(now / WINTER_CYCLE_MS);
  const phase = (now % WINTER_CYCLE_MS) / WINTER_CYCLE_MS;
  // Eight minutes of daylight, four of night, with soft dusk and dawn.
  const night = phase >= 2 / 3;
  const nightAmount = night ? Math.min(1, (phase - 2 / 3) / .04, (1 - phase) / .04) : 0;
  const period = Math.floor(now / 90000);
  const snowPhase = (now % 90000) / 90000;
  const snowIntensity = randomAt(period) > .42 ? Math.min(1, snowPhase * 8, (1 - snowPhase) * 8) : 0;
  const colors = PALETTES[((cycle % PALETTES.length) + PALETTES.length) % PALETTES.length];
  return { night, nightAmount, snowIntensity, colors };
}
