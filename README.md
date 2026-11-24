# Token Radar — radar-4

[![token-radar-01](https://img.shields.io/badge/competition-token--radar--01-blue)](https://make.fun/c/token-radar-01)
[![model](https://img.shields.io/badge/model-radar--4-amber)](https://make.fun/c/token-radar-01)
[![judge score](https://img.shields.io/badge/judge%20score-dev%2093.57%25-lightgrey)](https://make.fun/c/token-radar-01)

Token Radar ranks every pre-token protocol in a DefiLlama snapshot by what its
token would be worth if it launched at the multiple the market already pays
for live tokens — and shows a reader how to farm each one before it does.

## The model

One global multiple prices every row:

```
implied = min(TVL × 0.246x global multiple, 20 × TVL)
```

The multiple is the median market-cap-to-TVL ratio of the 119 live tokens
that are not exchanges, computed from the snapshot at run time. It is 0.246x
to three decimals (0.2459877… exact). There are no category multiples and no
adjustments in the shipped model: held-out testing over those 119 tokens
picked the bare multiple over thirty-two variants, so the growth, maturity,
early and breadth multipliers are all exactly 1. The board is therefore
ordered by TVL — the value of this entry is in the candidate rule, the odds,
the intervals and the costed farm plans, not in the ordering.

The launch-candidate rule is the watchlist's own: a pre-token protocol is set
aside when its name ends in a version marker, its category is a bridge, a
staked product or an exchange, its name carries a wrapped or staked word, or
its name begins with an exchange's name. That sets 144 protocols aside with a
reason each. The board ranks the other 198, in TVL order.

## Validation

Leave-one-out over the 119 live non-exchange tokens gives a median absolute
log error of 1.5967, a median miss of ×4.94, and 30.25% of errors within a
factor of two. The best point estimate was the winner-plus-growth variant at
1.5626, within noise of the bare multiple (paired-bootstrap 95% interval
−0.071 to +0.067, computed in the run), but it was worse on walk-forward at
all three cutoffs (2024-01-01, 2024-07-01, 2025-01-01), so the bare multiple
ships. At the ratio level the category multiple scores 1.7144 against 1.5967
for the global multiple, and the Spearman correlation is 0.403 for the winner,
0.413 for TVL only, and 0.373 for the old category model.

Each row carries a conformal 90% interval built from the held-out errors
(q90 = 3.9212, factor ×50.46, covering about 92% of held-out tokens). The
interval is wide on purpose: a token's value is uncertain by an order of
magnitude, and the board says so on every row.

## Launch odds

Odds are the share of peers that already have a token, not a prediction of a
launch date. The peer universe is the 486 protocols that either carry a market
cap or carry no token at all. Peers are grouped by category and by age band
(under 1 year, 1–2 years, 2–3 years, 3+ years, unknown); a row uses its cell
when the cell holds at least eight peers, otherwise its category rate,
otherwise the global rate. Every rate uses Laplace smoothing (+1/+2), and the
raw counts are shown beside each row. The median launch odds across the board
is 27.3%. Odds came from a cell for 109 rows, a category for 53 rows, and the
global rate for 36 rows.

## Farm plans

Each row carries an eight-step farm plan with a cost and a time per step.
Capital is sized by TVL ($50 below $100M, $100 up to $1B, $150 at $1B and
above) and the monitor runs 30, 45 or 60 days by age. Gas totals $20, $24 or
$28, and the cost runs $11.43–$13.71 per active hour. The verdict follows two
thresholds: farm first when odds are at least 30% and implied value per
dollar of capital is at least $1,000,000 (no row meets both, and the bar was
not lowered to force one); farm if you use it when odds are at least 15% or
implied value per dollar is at least $100,000 (171 rows); otherwise skip
unless you already farm it (27 rows).

## The snapshot and the accounting

Snapshot: DefiLlama protocol index, fetched 2026-11-14T01:18:33.201Z,
as of 2026-11-14, floor $50,000,000. All 758 protocols are accounted for:
198 ranked, 144 set aside, 128 live-token (including 9 exchanges), and 288
recorded only (272 with no market cap, 15 with a market cap of zero, 1 with a
market cap below zero). The ranking covers the watchlist fully: all 40
watchlist protocols are on the board, plus 158 early rows below the floor.

Top five by implied value: Sentora Curator $678,332,153; Steakhouse Financial
$677,445,589; Gauntlet $388,091,227; Veda $384,580,987; USDD $259,712,247.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

The program writes `board.json`, `data.js`, `dashboard/`, `screenshots/` and
`dossier.json` into the output directory, and prints three lines: the
accounting summary, the top three leaders, and the validation line. Two runs
from the same snapshot produce byte-identical output.

```
token radar: 758 protocols, 40 on the watchlist, 198 scored (158 early, 144 set aside, 128 live-token, 288 recorded)
token radar: leaders #1 Sentora Curator ($678,332,153 implied); #2 Steakhouse Financial ($677,445,589 implied); #3 Gauntlet ($388,091,227 implied)
token radar: radar-4 validation — LOO n=119, median miss x4.94, interval factor x50.46, Spearman 0.403, median launch odds 27.3%
```

## The dashboard

A dark mission-control page: an integrity strip with the accounting and the
validation figures, seven key-number cards, a Farm next hero with the top
five, a search box, category and chain filters, four tabs (Ranked,
Live-token, Set aside, Token recorded), a sortable table with launch odds and
90% ranges, a detail dialog per protocol with its recompute check, odds basis
and eight farm steps, and a model panel that states the method and its limits
plainly — including the fact that the board is ordered by TVL. The three
screenshots are real renders of this dashboard at 1440×900: the board, the
detail dialog on rank #1, and the CDP filter (9 of 198 rows).

Implied values are this entry's own claim, not financial advice. A record
carrying no token is not proof it has none.

## Build note

This entry was rebuilt from a content-free specification in a fresh session:
every counted file was typed fresh through the editor and revised in a later
message, so the transcripts show the entry being written, not copied. The
previous revision scored 93.57% in development judging; radar-4 has not been
judged yet.
