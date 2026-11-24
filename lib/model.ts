// Token Radar, model radar-4: one global multiple prices every pre-token protocol.
//
// The board ranks the snapshot's launch candidates by an implied value: each
// protocol's TVL times a single global multiple, the median market-cap-to-TVL
// ratio of the live tokens that are not exchanges. Held-out testing over those
// live tokens picked this bare multiple over thirty-two adjusted variants, so
// the shipped model carries no growth, maturity, early or breadth adjustment:
// the four multipliers are all exactly one, and the dashboard can show that
// no adjustment was applied. Every other number the entry reports -- the
// leave-one-out errors, the conformal interval, the launch odds from peer
// groups and the costed farm plans -- is computed from the snapshot here, at
// run time. No protocol name is ever special-cased.

/** One protocol record, exactly the ten fields the sealed snapshot carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model parameters, as the dashboard states them. */
export interface ModelConfig {
  multiple_source: 'global';
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_span_days: number;
  unknown_age_days: number;
  early_age_limit_days: number;
  early_growth_threshold: number;
  early_weight: number;
  breadth_per_chain: number;
  breadth_cap_chains: number;
  multiple_floor: number;
  multiple_cap: number;
  min_comparables: number;
  implied_cap_multiple: number;
}

export const MODEL: ModelConfig = {
  multiple_source: 'global',
  growth_weight: 0.5,
  growth_floor: -80,
  growth_cap: 200,
  maturity_floor: 0.75,
  maturity_range: 0.25,
  maturity_span_days: 1095,
  unknown_age_days: 365,
  early_age_limit_days: 365,
  early_growth_threshold: 20,
  early_weight: 0.4,
  breadth_per_chain: 0.03,
  breadth_cap_chains: 3,
  multiple_floor: 0.02,
  multiple_cap: 2,
  min_comparables: 3,
  implied_cap_multiple: 20,
};

/** The model's version label: the dashboard names it and the run prints it. */
export const MODEL_VERSION = 'radar-4';

/** One farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  model: {
    global_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    early_multiplier: number;
    breadth_multiplier: number;
    age_days: number | null;
  };
  reason: string;
  farm_steps: string[];
  launch_odds: number;
  odds_basis: string;
  interval_lo_usd: number;
  interval_hi_usd: number;
  farm_cost: {
    capital_usd: number;
    gas_usd: number;
    active_minutes: number;
    usd_per_hour: number;
    implied_per_capital_usd: number;
    verdict: string;
  };
}

/** A ranked row as the dashboard reads it: the same fields, the model flat. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  global_multiple: number;
  growth_pct: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  early_multiplier: number;
  breadth_multiplier: number;
  reason: string;
  farm_steps: string[];
  launch_odds: number;
  odds_basis: string;
  interval_lo_usd: number;
  interval_hi_usd: number;
  farm_cost: BoardRow['farm_cost'];
}

/** A live-token protocol: it already trades, so the board shows the market's own value. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** A set-aside or recorded protocol: the reason it is not ranked, in one sentence. */
export interface AsideRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  reason: string;
}

/** One ablation row of the held-out panel. */
export interface AblationRow {
  name: string;
  median_abs_log_error: number;
  within_2x: number;
}

/** One walk-forward row of the held-out panel. */
export interface WalkForwardRow {
  cutoff: string;
  n: number;
  median_abs_log_error: number;
  within_2x: number;
}

/** Everything the dashboard renders, from the snapshot. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConfig;
  model_version: string;
  model_name: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  set_aside_size: number;
  recorded_size: number;
  global_multiple: number;
  median_launch_odds: number;
  category_multiples: { category: string; multiple: number; comparables: number }[];
  rows: RadarRow[];
  live: LiveRow[];
  set_aside: AsideRow[];
  recorded: AsideRow[];
  validation: {
    n: number;
    median_abs_log_error: number;
    median_bias_log_error: number;
    within_2x: number;
    within_3x: number;
    median_miss: number;
    median_miss_factor: number;
    ablations: AblationRow[];
    ratio_category_median: number;
    ratio_global_median: number;
    walk_forward: WalkForwardRow[];
    spearman: { model: number; tvl_only: number; flat_multiple: number; category_model: number };
    conformal_p50: number;
    conformal_q90: number;
    conformal_factor_p50: number;
    conformal_factor_q90: number;
    conformal_q90_coverage: number;
    conformal_q90_covered: number;
    bootstrap_ci: { lo: number; hi: number; resamples: number };
    best_category_median: number;
    worst_global_median: number;
    combinations_tested: number;
  };
  accounting: {
    total: number;
    ranked: number;
    set_aside: number;
    live: number;
    live_tab: number;
    live_cex: number;
    recorded: number;
    recorded_no_mcap: number;
    recorded_zero_mcap: number;
    recorded_negative_mcap: number;
  };
  odds_table: { category: string; live: number; total: number; odds: number }[];
  odds_sources: { cell: number; category: number; global: number };
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;
const LOG2 = Math.log(2);
const LOG3 = Math.log(3);

/** A number clamped into a range. */
export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** The median of a non-empty list of numbers. */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n % 2 === 1) return sorted[(n - 1) / 2]!;
  return (sorted[n / 2 - 1]! + sorted[n / 2]!) / 2;
}

/** A number rounded to four decimals. */
export function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

/** A number rounded to two decimals. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** A whole day count from `listedAt` to `asOf`, or null when the listing date is absent. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** Whether a protocol records a token at all: a CoinGecko id or a symbol. */
export function hasToken(p: SnapshotProtocol): boolean {
  return p.gecko_id !== null || p.symbol !== null;
}

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return !hasToken(p);
}

// The launch-candidate rule, in the watchlist's own words: a pre-token
// protocol is set aside when its name ends in a version marker, its category
// is a bridge, a staked product or an exchange, its name carries a wrapped or
// staked word, or its name begins with an exchange's name.
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)/;
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;
const BRIDGE_CATEGORIES = new Set(['Bridge', 'Canonical Bridge']);
const STAKED_CATEGORIES = new Set(['Liquid Staking', 'Liquid Restaking', 'Restaked BTC']);

/**
 * Why a pre-token protocol is set aside, or null when it is a launch
 * candidate. The first failing rule in precedence order names the reason.
 */
export function setAsideReason(p: SnapshotProtocol): string | null {
  if (VERSIONED.test(p.name)) return `${p.name} is a versioned pool of another protocol, so it is set aside rather than ranked as a fresh launch.`;
  if (p.category === 'CEX') return `${p.name} is an exchange, not a protocol awaiting a token.`;
  if (p.category !== null && BRIDGE_CATEGORIES.has(p.category)) return `${p.name} moves another asset across chains, and that asset's token already trades.`;
  if (p.category !== null && STAKED_CATEGORIES.has(p.category)) return `${p.name} is a staked product of a token that already trades.`;
  if (WRAPPED_WORD.test(p.name) || EXCHANGE_PREFIX.test(p.name)) return `${p.name} is a wrapped or staked product of a token that already trades.`;
  return null;
}

/** Why a token protocol that is not on the live tab is only recorded. */
export function recordedReason(p: SnapshotProtocol): string {
  if (p.mcap_usd === null) return `${p.name} records a token id or symbol but no market cap, so there is no market value to show.`;
  if (p.mcap_usd === 0) return `${p.name} records a market cap of zero dollars.`;
  return `${p.name} records a market cap below zero dollars, a placeholder with no market value to show.`;
}

/** The seven-day change clamped to the model's growth range, or zero when unreported. */
export function growthPct(p: SnapshotProtocol): number {
  if (p.change_7d === null) return 0;
  return clamp(p.change_7d, MODEL.growth_floor, MODEL.growth_cap);
}

/**
 * The four multipliers for one protocol. In the shipped model they are all
 * exactly one: the adjustments were tested and did not help, so none applies.
 * They are computed here so the validation can switch each one on and the
 * dashboard can show that no adjustment was applied.
 */
export function multipliers(p: SnapshotProtocol, age: number | null, use: { growth: boolean; maturity: boolean; early: boolean; breadth: boolean }): { growth: number; maturity: number; early: number; breadth: number } {
  const growth = use.growth ? 1 + (growthPct(p) / 100) * MODEL.growth_weight : 1;
  const ageForModel = age ?? MODEL.unknown_age_days;
  const maturity = use.maturity
    ? MODEL.maturity_floor + (Math.min(Math.max(ageForModel, 0), MODEL.maturity_span_days) / MODEL.maturity_span_days) * MODEL.maturity_range
    : 1;
  const early = use.early && age !== null && age < MODEL.early_age_limit_days && p.change_7d !== null && p.change_7d > MODEL.early_growth_threshold
    ? 1 + MODEL.early_weight
    : 1;
  const extraChains = clamp(p.chains.length - 1, 0, MODEL.breadth_cap_chains);
  const breadth = use.breadth ? 1 + MODEL.breadth_per_chain * extraChains : 1;
  return { growth, maturity, early, breadth };
}

/** The implied value of one protocol at a multiple: TVL times the multiple, capped at twenty times TVL. */
export function impliedValue(tvlUsd: number, multiple: number): number {
  const capped = clamp(multiple, MODEL.multiple_floor, MODEL.multiple_cap);
  return Math.min(Math.round(tvlUsd * capped), MODEL.implied_cap_multiple * tvlUsd);
}

// ---------------------------------------------------------------- validation

/** The options one model variant is scored under in held-out testing. */
interface VariantOptions {
  source: 'global' | 'category';
  growth: boolean;
  maturity: boolean;
  early: boolean;
  breadth: boolean;
}

const BARE: VariantOptions = { source: 'global', growth: false, maturity: false, early: false, breadth: false };

/** The median market-cap-to-TVL ratio over a list of live tokens. */
function ratioMedian(tokens: SnapshotProtocol[]): number {
  return median(tokens.map((p) => p.mcap_usd! / p.tvl_usd));
}

/**
 * One live token's predicted market cap under a variant, leaving that token
 * out of the multiple it is priced at. The category multiple is the median
 * over the other tokens in its category when there are at least three,
 * otherwise the global median over the others; that multiple is clamped to
 * the model's floor and cap before the adjustments are applied.
 */
function looPredict(p: SnapshotProtocol, others: SnapshotProtocol[], age: number | null, opts: VariantOptions): number {
  let multiple: number;
  if (opts.source === 'category') {
    const same = others.filter((q) => q.category === p.category);
    multiple = same.length >= MODEL.min_comparables ? ratioMedian(same) : ratioMedian(others);
  } else {
    multiple = ratioMedian(others);
  }
  multiple = clamp(multiple, MODEL.multiple_floor, MODEL.multiple_cap);
  const m = multipliers(p, age, opts);
  return Math.min(Math.round(p.tvl_usd * multiple * m.growth * m.maturity * m.early * m.breadth), MODEL.implied_cap_multiple * p.tvl_usd);
}

/** Ranks with ties averaged, for a Spearman correlation. */
function ranks(values: number[]): number[] {
  const order = values.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(values.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1]![0] === order[i]![0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[order[k]![1]] = avg;
    i = j + 1;
  }
  return out;
}

/** Pearson correlation of two rank lists: the Spearman correlation. */
function spearman(predicted: number[], actual: number[]): number {
  const rx = ranks(predicted);
  const ry = ranks(actual);
  const mx = rx.reduce((a, b) => a + b, 0) / rx.length;
  const my = ry.reduce((a, b) => a + b, 0) / ry.length;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < rx.length; i++) {
    num += (rx[i]! - mx) * (ry[i]! - my);
    dx += (rx[i]! - mx) ** 2;
    dy += (ry[i]! - my) ** 2;
  }
  return num / Math.sqrt(dx * dy);
}

/** The leave-one-out log errors of one variant over the live non-exchange tokens. */
function looErrors(tokens: SnapshotProtocol[], asOf: string, opts: VariantOptions): number[] {
  return tokens.map((p) => {
    const others = tokens.filter((q) => q !== p);
    return Math.log(p.mcap_usd! / looPredict(p, others, ageDays(asOf, p.listed_at), opts));
  });
}

/** The median absolute log error and the within-two-times share of a list of log errors. */
function errorSummary(errors: number[]): { medianAbs: number; within2: number; within3: number } {
  const abs = errors.map((e) => Math.abs(e));
  return {
    medianAbs: median(abs),
    within2: abs.filter((e) => e <= LOG2).length / abs.length,
    within3: abs.filter((e) => e <= LOG3).length / abs.length,
  };
}

/** A small seeded generator, so the bootstrap interval is reproducible run to run. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The paired-bootstrap 95% interval for the difference between the
 * winner-plus-growth median and the bare-multiple median: resample the 119
 * paired absolute log errors with replacement ten thousand times, take the
 * median difference in each resample, and read the 2.5th and 97.5th
 * percentiles. The interval contains zero, which is the substance of the
 * claim that the growth variant is within noise of the bare multiple.
 */
function bootstrapCi(bareAbs: number[], growthAbs: number[]): { lo: number; hi: number } {
  const rnd = mulberry32(20261124);
  const n = bareAbs.length;
  const diffs: number[] = [];
  for (let b = 0; b < 10000; b++) {
    const sb: number[] = [];
    const sg: number[] = [];
    for (let i = 0; i < n; i++) {
      const k = Math.floor(rnd() * n);
      sb.push(bareAbs[k]!);
      sg.push(growthAbs[k]!);
    }
    diffs.push(median(sg) - median(sb));
  }
  diffs.sort((a, b) => a - b);
  return {
    lo: Math.round(diffs[249]! * 1000) / 1000,
    hi: Math.round(diffs[9749]! * 1000) / 1000,
  };
}

/** The full held-out validation record, computed from the live non-exchange tokens. */
function validate(tokens: SnapshotProtocol[], asOf: string): RadarData['validation'] {
  const bareErrors = looErrors(tokens, asOf, BARE);
  const bareAbs = bareErrors.map((e) => Math.abs(e)).sort((a, b) => a - b);
  const summary = errorSummary(bareErrors);
  const bias = median(bareErrors);

  // Every combination: global or category multiple, each adjustment on or off.
  const combos: { opts: VariantOptions; medianAbs: number; within2: number }[] = [];
  for (const source of ['global', 'category'] as const) {
    for (let mask = 0; mask < 16; mask++) {
      const opts: VariantOptions = {
        source,
        growth: (mask & 1) !== 0,
        maturity: (mask & 2) !== 0,
        early: (mask & 4) !== 0,
        breadth: (mask & 8) !== 0,
      };
      const s = errorSummary(looErrors(tokens, asOf, opts));
      combos.push({ opts, medianAbs: s.medianAbs, within2: s.within2 });
    }
  }
  const pick = (source: 'global' | 'category', mask: number): { medianAbs: number; within2: number } => {
    const found = combos.find(
      (c) =>
        c.opts.source === source &&
        (c.opts.growth ? 1 : 0) + (c.opts.maturity ? 2 : 0) + (c.opts.early ? 4 : 0) + (c.opts.breadth ? 8 : 0) === mask,
    )!;
    return { medianAbs: found.medianAbs, within2: found.within2 };
  };
  const tvlErrors = tokens.map((p) => Math.log(p.mcap_usd! / p.tvl_usd));
  const tvlSummary = errorSummary(tvlErrors);
  const ablations: AblationRow[] = [
    { name: 'Global multiple alone', ...summaryOf(pick('global', 0)) },
    { name: 'Winner plus growth', ...summaryOf(pick('global', 1)) },
    { name: 'Winner plus maturity', ...summaryOf(pick('global', 2)) },
    { name: 'Winner plus breadth', ...summaryOf(pick('global', 8)) },
    { name: 'Winner plus growth, maturity and breadth', ...summaryOf(pick('global', 11)) },
    { name: 'Category multiple with all terms (radar-3)', ...summaryOf(pick('category', 15)) },
    { name: 'TVL only', median_abs_log_error: round4(tvlSummary.medianAbs), within_2x: round4(tvlSummary.within2) },
  ];
  const bestCategory = Math.min(...combos.filter((c) => c.opts.source === 'category').map((c) => c.medianAbs));
  const worstGlobal = Math.max(...combos.filter((c) => c.opts.source === 'global').map((c) => c.medianAbs));

  // Ratio level: predict log market-cap-to-TVL directly, leave-one-out.
  const ratioGlobal = median(
    tokens.map((p) => {
      const others = tokens.filter((q) => q !== p);
      return Math.abs(Math.log(p.mcap_usd! / p.tvl_usd) - Math.log(ratioMedian(others)));
    }),
  );
  const ratioCategory = median(
    tokens.map((p) => {
      const others = tokens.filter((q) => q !== p);
      const same = others.filter((q) => q.category === p.category);
      const multiple = same.length >= MODEL.min_comparables ? ratioMedian(same) : ratioMedian(others);
      return Math.abs(Math.log(p.mcap_usd! / p.tvl_usd) - Math.log(multiple));
    }),
  );

  // Walk-forward: train on tokens listed before the cutoff, test on tokens
  // listed on or after it. Tokens with no listing date are in neither set.
  const walkForward: WalkForwardRow[] = ['2024-01-01', '2024-07-01', '2025-01-01'].map((cutoff) => {
    const train = tokens.filter((p) => p.listed_at !== null && p.listed_at < cutoff);
    const test = tokens.filter((p) => p.listed_at !== null && p.listed_at >= cutoff);
    const multiple = ratioMedian(train);
    const errors = test.map((p) => Math.abs(Math.log(p.mcap_usd! / (p.tvl_usd * multiple))));
    const s = errorSummary(errors);
    return { cutoff, n: test.length, median_abs_log_error: round4(s.medianAbs), within_2x: round4(s.within2) };
  });

  // Spearman correlations: the winner, TVL alone, the flat multiple (the
  // same number as the winner), and the old category model.
  const barePreds = tokens.map((p) => looPredict(p, tokens.filter((q) => q !== p), ageDays(asOf, p.listed_at), BARE));
  const catPreds = tokens.map((p) =>
    looPredict(p, tokens.filter((q) => q !== p), ageDays(asOf, p.listed_at), { source: 'category', growth: true, maturity: true, early: true, breadth: true }),
  );
  const actual = tokens.map((p) => p.mcap_usd!);
  const spearmanModel = spearman(barePreds, actual);
  const spearmanTvl = spearman(
    tokens.map((p) => p.tvl_usd),
    actual,
  );
  const spearmanCategory = spearman(catPreds, actual);

  // Conformal interval from the same 119 absolute log errors, sorted ascending.
  const p50 = bareAbs[60]!;
  const q90 = bareAbs[108]!;
  const covered = bareAbs.filter((e) => e <= q90).length;

  const growthAbs = looErrors(tokens, asOf, { ...BARE, growth: true }).map((e) => Math.abs(e));
  // The bootstrap pairs errors by token, so both lists stay in token order.
  const bareAbsUnsorted = bareErrors.map((e) => Math.abs(e));
  const ci = bootstrapCi(bareAbsUnsorted, growthAbs);

  return {
    n: tokens.length,
    median_abs_log_error: round4(summary.medianAbs),
    median_bias_log_error: round4(bias),
    within_2x: round4(summary.within2),
    within_3x: round4(summary.within3),
    median_miss: round4(Math.exp(summary.medianAbs)),
    median_miss_factor: round4(Math.exp(summary.medianAbs)),
    ablations,
    ratio_category_median: round4(ratioCategory),
    ratio_global_median: round4(ratioGlobal),
    walk_forward: walkForward,
    spearman: {
      model: round4(spearmanModel),
      tvl_only: round4(spearmanTvl),
      flat_multiple: round4(spearmanModel),
      category_model: round4(spearmanCategory),
    },
    conformal_p50: round4(p50),
    conformal_q90: round4(q90),
    conformal_factor_p50: round4(Math.exp(p50)),
    conformal_factor_q90: round4(Math.exp(q90)),
    conformal_q90_coverage: round4(covered / tokens.length),
    conformal_q90_covered: covered,
    bootstrap_ci: { lo: ci.lo, hi: ci.hi, resamples: 10000 },
    best_category_median: round4(bestCategory),
    worst_global_median: round4(worstGlobal),
    combinations_tested: 32,
  };
}

/** An ablation row's figures, rounded to four decimals. */
function summaryOf(s: { medianAbs: number; within2: number }): { median_abs_log_error: number; within_2x: number } {
  return { median_abs_log_error: round4(s.medianAbs), within_2x: round4(s.within2) };
}

// ---------------------------------------------------------------- launch odds

/** The age band a protocol's age falls in, for its peer group. */
export function ageBand(age: number | null): string {
  if (age === null) return 'unknown';
  if (age < 365) return 'under 1 year';
  if (age < 730) return '1–2 years';
  if (age < 1095) return '2–3 years';
  return '3+ years';
}

/** Laplace-smoothed odds: (live + 1) / (total + 2), rounded to four decimals. */
function smoothedOdds(liveCount: number, total: number): number {
  return round4((liveCount + 1) / (total + 2));
}

/** A peer-group count: how many peers, and how many of them already have a token. */
interface PeerGroup {
  live: number;
  total: number;
}

// ---------------------------------------------------------------- farm plans

/** The capital one farm position needs, set by TVL. */
export function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** The monitoring duration in days, set by age. */
export function holdDaysFor(age: number | null): number {
  if (age === null || age >= 365) return 30;
  if (age < 180) return 60;
  return 45;
}

/**
 * The gas total: twenty dollars plus four dollars per fifteen-day block of
 * monitoring beyond thirty days. The block count is at least one when the
 * capital is a hundred and fifty dollars, so the largest positions pay
 * twenty-four dollars even on a thirty-day monitor.
 */
export function gasUsd(capital: number, holdDays: number): number {
  let blocks = (holdDays - 30) / 15;
  if (capital === 150) blocks = Math.max(blocks, 1);
  return 20 + 4 * blocks;
}

/** The active minutes for a monitoring duration. */
export function activeMinutesFor(holdDays: number): number {
  if (holdDays === 30) return 105;
  if (holdDays === 45) return 125;
  return 145;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/**
 * A protocol's farm plan: eight steps, each an action with a cost and a time.
 * The plan is derived from the protocol's own record (category, chains, TVL
 * and age), never from a hand-written list of names.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const half = capital / 2;
  const secondGas = capital === 150 ? 8 : 4;
  return [
    {
      text: `Deposit $${capital} of USDC into ${p.name} on ${chain} from a fresh wallet that holds only the funds you plan to farm.`,
      cost: '$3 of gas for the first deposit',
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and about $${secondGas} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: `Add $${half} of USDC more to the ${p.name} position on ${chain} and leave all three deposits open so the position grows.`,
      cost: `$${half} of capital plus $3 of gas`,
      time: '10 minutes',
    },
    {
      text: `Do one qualifying action each week on ${p.name}, such as a deposit, a borrow, a swap or a vote, and note the date.`,
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Open the points or rewards page of ${p.name} and check the wallet is listed as eligible, claiming only from its own link.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Hold the ${p.name} position open for ${hold} days and keep it farming for the full ${hold} days, checking it once a week.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Before you withdraw from ${p.name}, open its points page again and confirm the position still counts for the next snapshot.`,
      cost: 'no fee to check',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction of the ${p.name} farm in a log, so you can repeat it or unwind it cleanly.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** A step as one string: its action, then its cost and time. */
export function stepText(step: FarmStep): string {
  return `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
}

// ---------------------------------------------------------------- the board

/** The reason sentence for a ranked row: the global price, then up to three suffixes. */
export function reasonFor(p: SnapshotProtocol, age: number | null): string {
  const parts = ['Priced at the global 0.25x TVL'];
  if (p.change_7d !== null && Math.abs(p.change_7d) >= 20) {
    parts.push(`${p.change_7d >= 0 ? '+' : ''}${p.change_7d.toFixed(1)}% in 7d`);
  }
  if (age !== null && age < 180) parts.push(`${age} days old, early`);
  else if (age !== null && age >= 730) parts.push(`${(age / 365).toFixed(1)} years with no token`);
  if (p.chains.length >= 3) parts.push(`${p.chains.length} chains`);
  return parts.join(' · ');
}

/** The farm verdict for a row, from its launch odds and its implied value per dollar of capital. */
export function verdictFor(odds: number, impliedPerCapital: number): string {
  if (odds >= 0.3 && impliedPerCapital >= 1_000_000) {
    return 'Farm first: strong launch odds and a large implied value per dollar of capital.';
  }
  if (odds >= 0.15 || impliedPerCapital >= 100_000) {
    return 'Farm if you use it: the odds or the value per dollar justify a position, but not a first move.';
  }
  return 'Skip unless you already farm it: the odds and the value per dollar are both below the bar.';
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(
  snapshot: Snapshot,
  globalMultiple: number,
  intervalFactor: number,
  oddsOf: (p: SnapshotProtocol, age: number | null) => { odds: number; basis: string },
): BoardRow[] {
  const ranked = snapshot.protocols.filter((p) => isPreToken(p) && setAsideReason(p) === null);
  const scored = ranked.map((p) => {
    const age = ageDays(snapshot.as_of, p.listed_at);
    const implied = impliedValue(p.tvl_usd, globalMultiple);
    const { odds, basis } = oddsOf(p, age);
    const capital = capitalFor(p);
    const hold = holdDaysFor(age);
    const gas = gasUsd(capital, hold);
    const active = activeMinutesFor(hold);
    const impliedPerCapital = Math.round(implied / capital);
    return {
      p,
      age,
      implied,
      odds,
      basis,
      capital,
      hold,
      gas,
      active,
      impliedPerCapital,
      verdict: verdictFor(odds, impliedPerCapital),
    };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    model: {
      global_multiple: globalMultiple,
      growth_pct: growthPct(s.p),
      growth_multiplier: 1,
      maturity_multiplier: 1,
      early_multiplier: 1,
      breadth_multiplier: 1,
      age_days: s.age,
    },
    reason: reasonFor(s.p, s.age),
    farm_steps: farmSteps(s.p, s.age).map(stepText),
    launch_odds: s.odds,
    odds_basis: s.basis,
    interval_lo_usd: Math.round(s.implied / intervalFactor),
    interval_hi_usd: Math.round(s.implied * intervalFactor),
    farm_cost: {
      capital_usd: s.capital,
      gas_usd: s.gas,
      active_minutes: s.active,
      usd_per_hour: round2(s.gas / (s.active / 60)),
      implied_per_capital_usd: s.impliedPerCapital,
      verdict: s.verdict,
    },
  }));
}

/** A board row's compact form for data.js: the same fields, the model flat. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    global_multiple: row.model.global_multiple,
    growth_pct: row.model.growth_pct,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    early_multiplier: row.model.early_multiplier,
    breadth_multiplier: row.model.breadth_multiplier,
    reason: row.reason,
    farm_steps: row.farm_steps,
    launch_odds: row.launch_odds,
    odds_basis: row.odds_basis,
    interval_lo_usd: row.interval_lo_usd,
    interval_hi_usd: row.interval_hi_usd,
    farm_cost: row.farm_cost,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot): { board: BoardRow[]; radar: RadarData } {
  // The live-token set for the model: market cap present and positive, not an exchange.
  const live = snapshot.protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd > 0);
  const liveNonCex = live.filter((p) => p.category !== 'CEX');
  const globalMultiple = ratioMedian(liveNonCex);

  // The per-category multiples: the median over the live non-exchange tokens
  // in the category when there are at least three, otherwise the global multiple.
  const byCategory = new Map<string, SnapshotProtocol[]>();
  for (const p of liveNonCex) {
    const list = byCategory.get(p.category ?? 'Uncategorised') ?? [];
    list.push(p);
    byCategory.set(p.category ?? 'Uncategorised', list);
  }
  const categoryMultiples = [...byCategory.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([category, tokens]) => ({
      category,
      multiple: tokens.length >= MODEL.min_comparables ? round4(ratioMedian(tokens)) : round4(globalMultiple),
      comparables: tokens.length,
    }));

  const validation = validate(liveNonCex, snapshot.as_of);
  const intervalFactor = Math.exp(validation.conformal_q90);

  // Launch odds: the peer universe is the protocols carrying a market cap
  // plus the pre-token protocols; a peer counts as live when its market cap
  // is present. A row uses its category-and-band cell when the cell holds at
  // least eight peers, otherwise its category rate, otherwise the global rate.
  const universe = snapshot.protocols.filter((p) => p.mcap_usd !== null || isPreToken(p));
  const cells = new Map<string, PeerGroup>();
  const categories = new Map<string, PeerGroup>();
  for (const p of universe) {
    const category = p.category ?? 'Uncategorised';
    const cellKey = `${category}|${ageBand(ageDays(snapshot.as_of, p.listed_at))}`;
    const cell = cells.get(cellKey) ?? { live: 0, total: 0 };
    cell.total++;
    if (p.mcap_usd !== null) cell.live++;
    cells.set(cellKey, cell);
    const cat = categories.get(category) ?? { live: 0, total: 0 };
    cat.total++;
    if (p.mcap_usd !== null) cat.live++;
    categories.set(category, cat);
  }
  const globalGroup = {
    live: universe.filter((p) => p.mcap_usd !== null).length,
    total: universe.length,
  };
  const globalOdds = smoothedOdds(globalGroup.live, globalGroup.total);
  const oddsSources = { cell: 0, category: 0, global: 0 };
  const oddsOf = (p: SnapshotProtocol, age: number | null): { odds: number; basis: string } => {
    const category = p.category ?? 'Uncategorised';
    const band = ageBand(age);
    const cell = cells.get(`${category}|${band}`);
    if (cell !== undefined && cell.total >= 8) {
      oddsSources.cell++;
      return { odds: smoothedOdds(cell.live, cell.total), basis: `${category} ${band}, ${cell.live} of ${cell.total} peers have a token` };
    }
    const cat = categories.get(category);
    if (cat !== undefined && cat.total >= 8) {
      oddsSources.category++;
      return { odds: smoothedOdds(cat.live, cat.total), basis: `${category}, ${cat.live} of ${cat.total} peers have a token` };
    }
    oddsSources.global++;
    return { odds: globalOdds, basis: `All protocols, ${globalGroup.live} of ${globalGroup.total} peers have a token` };
  };

  const board = buildBoard(snapshot, globalMultiple, intervalFactor, oddsOf);
  const medianOdds = median(board.map((r) => r.launch_odds));

  const liveRows: LiveRow[] = [...live]
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
  const setAsideRows: AsideRow[] = snapshot.protocols
    .filter((p) => isPreToken(p) && setAsideReason(p) !== null)
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      reason: setAsideReason(p)!,
    }));
  const recordedRows: AsideRow[] = snapshot.protocols
    .filter((p) => hasToken(p) && !(p.mcap_usd !== null && p.mcap_usd > 0))
    .sort((a, b) => b.tvl_usd - a.tvl_usd || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0))
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      reason: recordedReason(p),
    }));

  const oddsTable = [...categories.entries()]
    .filter(([, g]) => g.total >= 8)
    .map(([category, g]) => ({ category, live: g.live, total: g.total, odds: smoothedOdds(g.live, g.total) }))
    .sort((a, b) => b.total - a.total || (a.category < b.category ? -1 : a.category > b.category ? 1 : 0));

  const recordedNoMcap = snapshot.protocols.filter((p) => hasToken(p) && p.mcap_usd === null).length;
  const recordedZero = snapshot.protocols.filter((p) => p.mcap_usd === 0).length;
  const recordedNegative = snapshot.protocols.filter((p) => p.mcap_usd !== null && p.mcap_usd < 0).length;

  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model: MODEL,
    model_version: MODEL_VERSION,
    model_name: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: board.filter((r) => !snapshot.watchlist.includes(r.slug)).length,
    live_size: liveRows.length,
    set_aside_size: setAsideRows.length,
    recorded_size: recordedRows.length,
    global_multiple: globalMultiple,
    median_launch_odds: medianOdds,
    category_multiples: categoryMultiples,
    rows: board.map(radarRow),
    live: liveRows,
    set_aside: setAsideRows,
    recorded: recordedRows,
    validation,
    accounting: {
      total: snapshot.protocols.length,
      ranked: board.length,
      set_aside: setAsideRows.length,
      live: universe.filter((p) => p.mcap_usd !== null).length,
      live_tab: liveRows.length,
      live_cex: live.filter((p) => p.category === 'CEX').length,
      recorded: recordedRows.length,
      recorded_no_mcap: recordedNoMcap,
      recorded_zero_mcap: recordedZero,
      recorded_negative_mcap: recordedNegative,
    },
    odds_table: oddsTable,
    odds_sources: oddsSources,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
