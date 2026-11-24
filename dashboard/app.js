// Token Radar's dashboard. It reads window.RADAR (written beside dashboard/
// by main.ts) and renders the ranked board, the farm-next heroes, the
// filterable tables, a per-protocol detail dialog and the model panel.
// No network: every byte it shows is in data.js.
(function () {
  'use strict';

  var DATA = window.RADAR;
  var app = document.getElementById('board');
  if (!DATA || !app) return;
  var dialog = document.getElementById('detail');
  var state = { q: '', category: 'all', chain: 'all', tab: 'ranked', sort: 'rank', dir: 1, selected: null };

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function compact(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    var abs = Math.abs(n);
    var trim = function (x) { return x.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1'); };
    if (abs >= 1e9) return '$' + trim(n / 1e9) + 'B';
    if (abs >= 1e6) return '$' + trim(n / 1e6) + 'M';
    if (abs >= 1e3) return '$' + trim(n / 1e3) + 'K';
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function money(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return '$' + Math.round(n).toLocaleString('en-US');
  }
  function fmtChange(n) {
    if (n === null || n === undefined || !isFinite(n)) return { text: '—', cls: '' };
    return { text: (n > 0 ? '+' : '') + n.toFixed(1) + '%', cls: n >= 0 ? 'pos' : 'neg' };
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return 'unknown';
    if (days >= 365) return (days / 365).toFixed(1) + ' years';
    return days + ' days';
  }
  function peerCounts(basis) {
    var m = /(\d+) of (\d+) peers/.exec(basis || '');
    return m ? m[1] + ' of ' + m[2] + ' peers' : '';
  }
  function chainsOf(r) { return (r.chains || []).length; }
  function categoryOf(r) { return r.category || 'Other'; }

  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    var params = new URLSearchParams(hash);
    if (params.get('q')) state.q = params.get('q');
    if (params.get('category')) state.category = params.get('category');
    if (params.get('chain')) state.chain = params.get('chain');
    if (params.get('tab')) state.tab = params.get('tab');
    if (params.get('p')) state.selected = params.get('p');
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.chain !== 'all') params.set('chain', state.chain);
    if (state.tab !== 'ranked') params.set('tab', state.tab);
    if (state.selected) params.set('p', state.selected);
    var next = params.toString();
    if (next) window.history.replaceState(null, '', '#' + next);
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  // ------------------------------------------------------------- data access

  function tabRows() {
    if (state.tab === 'live') return DATA.live;
    if (state.tab === 'set-aside') return DATA.set_aside;
    if (state.tab === 'recorded') return DATA.recorded;
    return DATA.rows;
  }
  function filteredRows() {
    var q = state.q.trim().toLowerCase();
    return tabRows().filter(function (r) {
      if (state.category !== 'all' && categoryOf(r) !== state.category) return false;
      if (state.chain !== 'all' && (r.chains || []).indexOf(state.chain) < 0) return false;
      if (!q) return true;
      var hay = [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }
  function sortValue(r, key) {
    if (key === 'name') return (r.name || '').toLowerCase();
    if (key === 'tvl') return r.tvl_usd;
    if (key === 'change') return r.change_7d === null || r.change_7d === undefined ? -Infinity : r.change_7d;
    if (key === 'age') return r.age_days === null || r.age_days === undefined ? Infinity : r.age_days;
    if (key === 'implied') return r.implied_value_usd;
    if (key === 'odds') return r.launch_odds === undefined ? -Infinity : r.launch_odds;
    if (key === 'mcap') return r.mcap_usd === null || r.mcap_usd === undefined ? -Infinity : r.mcap_usd;
    return r.rank === undefined ? Infinity : r.rank;
  }
  function sortedRows(list) {
    var key = state.sort;
    return list.slice().sort(function (a, b) {
      var av = sortValue(a, key);
      var bv = sortValue(b, key);
      if (av < bv) return -state.dir;
      if (av > bv) return state.dir;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }

  // ------------------------------------------------------------- static shell

  function headerHtml() {
    return '<header class="top"><div class="brand"><span class="mark"></span><span>Token <span class="amber">Radar</span></span></div>' +
      '<div class="top-meta"><span>Snapshot ' + esc(DATA.as_of) + '</span><span>DefiLlama protocol index</span><span>' + esc(DATA.model_version) + ' model</span></div></header>';
  }
  function stripHtml() {
    var v = DATA.validation;
    var a = DATA.accounting;
    return '<section class="strip" aria-label="Integrity checks">' +
      '<span><b>' + a.total + ' protocols accounted for:</b> ' + a.ranked + ' ranked, ' + a.set_aside + ' set aside, ' + a.live_tab + ' live-token, ' + a.recorded + ' recorded.</span>' +
      '<span><b>Leave-one-out, n = ' + v.n + ':</b> median miss &times;' + v.median_miss.toFixed(2) + '.</span>' +
      '<span><b>Conformal 90% interval factor:</b> &times;' + v.conformal_factor_q90.toFixed(2) + '.</span>' +
      '<span><b>0 slugs invented.</b> Two runs produce the same bytes.</span></section>';
  }
  function ledeHtml() {
    return '<section class="lede"><h1>Which pre-token protocol is worth farming next?</h1>' +
      '<p>One global multiple prices every row: the median market-cap-to-TVL ratio of the live tokens, ' +
      'the held-out winner over thirty-two tested variants. Each row also shows its launch odds from its ' +
      'peer group, a 90% range, and a farm plan costed in dollars per hour.</p></section>';
  }
  function statsHtml() {
    var v = DATA.validation;
    var cards = [
      [String(DATA.accounting.total), 'Total protocols'],
      [String(DATA.board_size), 'Ranked rows'],
      [String(DATA.watchlist_size), 'Watchlist'],
      [String(DATA.set_aside_size), 'Set aside'],
      [String(DATA.live_size), 'Live-token'],
      [(DATA.median_launch_odds * 100).toFixed(1) + '%', 'Median launch odds'],
      ['\u00d7' + v.median_miss.toFixed(1), 'Median miss'],
    ];
    return '<section class="stats" aria-label="Key numbers">' + cards.map(function (c) {
      return '<div class="stat"><b>' + esc(c[0]) + '</b><span>' + esc(c[1]) + '</span></div>';
    }).join('') + '</section>';
  }
  function heroHtml() {
    var top = DATA.rows.slice(0, 5);
    return '<section class="hero" aria-label="Farm next"><h2>Farm next</h2>' + top.map(function (r) {
      var ch = fmtChange(r.change_7d);
      return '<button type="button" class="pick" data-slug="' + esc(r.slug) + '">' +
        '<span class="rank-badge">#' + r.rank + '</span>' +
        '<b class="name">' + esc(r.name) + '</b>' +
        '<span class="value">' + esc(compact(r.implied_value_usd)) + ' implied</span>' +
        '<span class="meta">TVL ' + esc(compact(r.tvl_usd)) + ' &middot; <span class="' + ch.cls + '">' + esc(ch.text) + '</span> 7d &middot; ' + esc(fmtAge(r.age_days)) + '</span>' +
        '<span class="why">' + esc(r.reason) + '</span>' +
        '<span class="farmline">' + (r.launch_odds * 100).toFixed(1) + '% launch odds &middot; $' + r.farm_cost.gas_usd + ' gas &middot; $' + r.farm_cost.usd_per_hour.toFixed(2) + '/h</span>' +
        '</button>';
    }).join('') + '</section>';
  }
  function controlsHtml() {
    var categories = Array.from(new Set([].concat(DATA.rows, DATA.live, DATA.set_aside, DATA.recorded).map(categoryOf))).sort();
    var chains = Array.from(new Set([].concat(DATA.rows, DATA.live, DATA.set_aside, DATA.recorded).reduce(function (acc, r) { return acc.concat(r.chains || []); }, []))).sort();
    var tabs = [['ranked', 'Ranked'], ['live', 'Live-token'], ['set-aside', 'Set aside'], ['recorded', 'Token recorded']];
    return '<div class="controls">' +
      '<div class="field"><label for="q">Search by name, slug or category</label>' +
      '<input type="search" id="q" placeholder="Search name, slug or category" value="' + esc(state.q) + '" aria-label="Search by name, slug or category"></div>' +
      '<div class="field"><label for="category">Category</label><select id="category" aria-label="Filter by category">' +
      '<option value="all">All categories</option>' +
      categories.map(function (c) { return '<option value="' + esc(c) + '"' + (c === state.category ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><label for="chain">Chain</label><select id="chain" aria-label="Filter by chain">' +
      '<option value="all">All chains</option>' +
      chains.map(function (c) { return '<option value="' + esc(c) + '"' + (c === state.chain ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="field"><span class="sub">Token status</span><div class="tabs" role="group" aria-label="Protocol class">' +
      tabs.map(function (t) { return '<button type="button" data-tab="' + t[0] + '" aria-pressed="' + (state.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') +
      '</div></div>' +
      '<span class="count" id="count"></span></div>';
  }

  // ------------------------------------------------------------- the table

  function sortButton(key, label) {
    var arrow = state.sort === key ? (state.dir < 0 ? ' \u25bc' : ' \u25b2') : '';
    return '<button type="button" data-sort="' + key + '">' + label + esc(arrow) + '</button>';
  }
  function protocolCell(r) {
    return '<div class="name"><b>' + esc(r.name) + '</b><span class="sub">' + esc(categoryOf(r)) + ' &middot; ' + chainsOf(r) + ' chain' + (chainsOf(r) === 1 ? '' : 's') + '</span></div>';
  }
  function tableHtml() {
    var list = sortedRows(filteredRows());
    var total = state.tab === 'ranked' ? DATA.board_size : state.tab === 'live' ? DATA.live_size : state.tab === 'set-aside' ? DATA.set_aside_size : DATA.recorded_size;
    var noun = state.tab === 'ranked' ? 'ranked protocols' : state.tab === 'live' ? 'live-token protocols' : state.tab === 'set-aside' ? 'set-aside protocols' : 'recorded protocols';
    var countEl = document.getElementById('count');
    if (countEl) countEl.textContent = list.length + ' of ' + total + ' ' + noun;
    if (list.length === 0) {
      return '<div class="panel"><div class="empty"><h2>No protocol matches that filter</h2>' +
        '<p>Clear the search or pick another category to see the board again.</p>' +
        '<button class="button primary" type="button" id="clear-filters">Clear filters</button></div></div>';
    }
    if (state.tab === 'ranked') return rankedTable(list);
    if (state.tab === 'live') return liveTable(list);
    return asideTable(list);
  }
  function rankedTable(list) {
    var rows = list.map(function (r) {
      var ch = fmtChange(r.change_7d);
      return '<tr data-slug="' + esc(r.slug) + '" tabindex="0">' +
        '<td class="num">' + r.rank + '</td>' +
        '<td>' + protocolCell(r) + '</td>' +
        '<td class="num">' + esc(compact(r.tvl_usd)) + '</td>' +
        '<td class="num ' + ch.cls + '">' + esc(ch.text) + '</td>' +
        '<td class="num">' + esc(fmtAge(r.age_days)) + '</td>' +
        '<td class="num">' + esc(compact(r.implied_value_usd)) + '</td>' +
        '<td class="num">' + (r.launch_odds * 100).toFixed(1) + '%<div class="sub">' + esc(peerCounts(r.odds_basis)) + '</div></td>' +
        '<td class="num">' + esc(compact(r.interval_lo_usd)) + ' &ndash; ' + esc(compact(r.interval_hi_usd)) + '</td>' +
        '<td class="reason">' + esc(r.reason) + '</td>' +
        '<td><span class="pill">pre-token</span></td></tr>';
    }).join('');
    return '<div class="panel"><div class="table-wrap"><table>' +
      '<caption class="sub">Pre-token protocols, strongest implied value first. Select a row for its model and farm plan.</caption>' +
      '<thead><tr><th scope="col">' + sortButton('rank', 'Rank') + '</th><th scope="col">' + sortButton('name', 'Protocol') + '</th>' +
      '<th scope="col">' + sortButton('tvl', 'TVL') + '</th><th scope="col">' + sortButton('change', '7d') + '</th>' +
      '<th scope="col">' + sortButton('age', 'Age') + '</th><th scope="col">' + sortButton('implied', 'Implied value') + '</th>' +
      '<th scope="col">' + sortButton('odds', 'Launch odds') + '</th><th scope="col">90% range</th>' +
      '<th scope="col">Why here</th><th scope="col">Token</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function liveTable(list) {
    var rows = list.map(function (r) {
      var ch = fmtChange(r.change_7d);
      return '<tr><td>' + protocolCell(r) + '</td>' +
        '<td class="num">' + esc(compact(r.tvl_usd)) + '</td>' +
        '<td class="num ' + ch.cls + '">' + esc(ch.text) + '</td>' +
        '<td class="num">' + esc(compact(r.mcap_usd)) + '</td>' +
        '<td><span class="pill">already trades</span></td></tr>';
    }).join('');
    return '<div class="panel"><div class="table-wrap"><table>' +
      '<caption class="sub">Token live: these protocols already trade, so their market cap is a fact, not a model. They are set aside from the pre-token ranking.</caption>' +
      '<thead><tr><th scope="col">' + sortButton('name', 'Protocol') + '</th><th scope="col">' + sortButton('tvl', 'TVL') + '</th>' +
      '<th scope="col">' + sortButton('change', '7d') + '</th><th scope="col">' + sortButton('mcap', 'Market cap') + '</th><th scope="col">Token</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function asideTable(list) {
    var rows = list.map(function (r) {
      return '<tr><td>' + protocolCell(r) + '</td>' +
        '<td class="num">' + esc(compact(r.tvl_usd)) + '</td>' +
        '<td class="reason">' + esc(r.reason) + '</td></tr>';
    }).join('');
    var caption = state.tab === 'set-aside'
      ? 'Pre-token protocols set aside by the launch-candidate rule, with the reason for each.'
      : 'Token protocols recorded only: they carry a token id or symbol but no usable market cap.';
    return '<div class="panel"><div class="table-wrap"><table>' +
      '<caption class="sub">' + caption + '</caption>' +
      '<thead><tr><th scope="col">' + sortButton('name', 'Protocol') + '</th><th scope="col">' + sortButton('tvl', 'TVL') + '</th>' +
      '<th scope="col">Why here</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  // ------------------------------------------------------------- model panel

  function modelPanelHtml() {
    var v = DATA.validation;
    var a = DATA.accounting;
    var ablations = v.ablations.map(function (r) {
      return '<tr><td>' + esc(r.name) + '</td><td class="num">' + r.median_abs_log_error.toFixed(4) + '</td><td class="num">' + (r.within_2x * 100).toFixed(2) + '%</td></tr>';
    }).join('');
    var walk = v.walk_forward.map(function (r) {
      return '<tr><td class="num">' + esc(r.cutoff) + '</td><td class="num">' + r.n + '</td><td class="num">' + r.median_abs_log_error.toFixed(4) + '</td><td class="num">' + (r.within_2x * 100).toFixed(2) + '%</td></tr>';
    }).join('');
    var oddsRows = DATA.odds_table.map(function (r) {
      return '<tr><td>' + esc(r.category) + '</td><td class="num">' + r.live + '</td><td class="num">' + r.total + '</td><td class="num">' + (r.odds * 100).toFixed(1) + '%</td></tr>';
    }).join('');
    var ci = v.bootstrap_ci;
    var ciText = (ci.lo < 0 ? '' : '+') + ci.lo.toFixed(3) + ' to ' + (ci.hi < 0 ? '' : '+') + ci.hi.toFixed(3);
    return '<section class="panel model" aria-label="How the radar prices a token">' +
      '<h2>How the radar prices a token</h2>' +
      '<div class="formula">implied = min(TVL &times; ' + DATA.global_multiple.toFixed(3) + 'x global multiple, 20 &times; TVL)</div>' +
      '<p>One global multiple prices every row: the median market-cap-to-TVL ratio of the 119 live tokens that are not exchanges, ' +
      'clamped between 0.02x and 2.0x. Thirty-two combinations were tested &mdash; global or category multiple, crossed with growth, ' +
      'maturity, early and breadth adjustments &mdash; and the best category variant scored ' + v.best_category_median.toFixed(4) + ' against the worst ' +
      'global variant at ' + v.worst_global_median.toFixed(4) + '. No name was special-cased, and the multiple is computed from the ' +
      'snapshot at run time, never written in by hand.</p>' +
      '<p><b>Held-out validation.</b> Leave-one-out over the 119 live non-exchange tokens: median absolute log error ' +
      v.median_abs_log_error.toFixed(3) + ', median miss &times;' + v.median_miss.toFixed(2) + ', ' +
      (v.within_2x * 100).toFixed(2) + '% of errors within a factor of two.</p>' +
      '<table><caption class="sub">Ablations: each variant priced leave-one-out over the same 119 tokens.</caption>' +
      '<thead><tr><th scope="col">Variant</th><th scope="col">Median abs log error</th><th scope="col">Within 2&times;</th></tr></thead><tbody>' + ablations + '</tbody></table>' +
      '<table><caption class="sub">Walk-forward: trained on tokens listed before the cutoff, tested on tokens listed on or after it.</caption>' +
      '<thead><tr><th scope="col">Cutoff</th><th scope="col">Test n</th><th scope="col">Median abs log error</th><th scope="col">Within 2&times;</th></tr></thead><tbody>' + walk + '</tbody></table>' +
      '<p><b>Ratio and correlation.</b> At the ratio level, predicting log market-cap-to-TVL directly, the category multiple scores ' +
      v.ratio_category_median.toFixed(4) + ' against ' + v.ratio_global_median.toFixed(4) + ' for the global multiple. Spearman correlation ' +
      'between leave-one-out predictions and actual market caps is ' + v.spearman.model.toFixed(3) + ' for the winner, ' +
      v.spearman.tvl_only.toFixed(3) + ' for TVL only, and ' + v.spearman.category_model.toFixed(3) + ' for the old category model.</p>' +
      '<div class="callout"><h3>Read this before trusting a row</h3>' +
      '<p>The board is ordered by TVL: every row uses the same multiple, so rank follows size. The value of this entry is in the ' +
      'candidate rule, the odds, the intervals and the costed farm plans &mdash; not in the ordering.</p>' +
      '<p>The best point estimate was the winner-plus-growth variant at ' + v.ablations[1].median_abs_log_error.toFixed(3) + ', within noise of ' +
      'the bare multiple, with a paired-bootstrap 95% interval of ' + ciText + '. It was worse on walk-forward at all three cutoffs, ' +
      'so the bare multiple ships.</p>' +
      '<p>The conformal 90% interval is about &times;' + v.conformal_factor_q90.toFixed(2) + ' wide, with a q90 of ' +
      v.conformal_q90.toFixed(3) + ' and a coverage of about ' + Math.round(v.conformal_q90_coverage * 100) + '% of held-out tokens.</p></div>' +
      '<h3>Launch odds: the share of peers that already have a token</h3>' +
      '<p>Peers are grouped by category and by age band &mdash; under 1 year, 1&ndash;2 years, 2&ndash;3 years, 3+ years, and unknown. ' +
      'A row uses its cell when the cell holds at least eight peers, otherwise its category rate when the category holds at least eight, ' +
      'otherwise the global rate. Every rate uses Laplace smoothing, plus one over plus two, and the raw counts are shown beside each row. ' +
      'Odds came from a cell for ' + DATA.odds_sources.cell + ' rows, a category for ' + DATA.odds_sources.category + ' rows, and the global rate for ' +
      DATA.odds_sources.global + ' rows.</p>' +
      '<table><caption class="sub">Odds by category, for categories with at least eight peers.</caption>' +
      '<thead><tr><th scope="col">Category</th><th scope="col">Peers with a token</th><th scope="col">Total peers</th><th scope="col">Odds</th></tr></thead><tbody>' + oddsRows + '</tbody></table>' +
      '<p><b>Completeness.</b> All ' + a.total + ' protocols are accounted for: ' + a.ranked + ' ranked, ' + a.set_aside + ' set aside with reasons, ' +
      a.live_tab + ' live-token (including ' + a.live_cex + ' exchanges), and ' + a.recorded + ' recorded only. The ranking covers the watchlist fully: ' +
      'all ' + DATA.watchlist_size + ' watchlist protocols are on the board.</p>' +
      '<div class="footer"><span>Source: ' + esc(DATA.source) + ' &middot; snapshot ' + esc(DATA.as_of) + '.</span>' +
      '<span>Implied values are this entry&rsquo;s own claim, not financial advice.</span>' +
      '<span>A record carrying no token is not proof it has none.</span></div>' +
      '</section>';
  }

  // ------------------------------------------------------------- detail dialog

  function openDetail(slug) {
    var row = null;
    for (var i = 0; i < DATA.rows.length; i++) if (DATA.rows[i].slug === slug) { row = DATA.rows[i]; break; }
    if (!row || !dialog) return;
    state.selected = slug;
    writeHash();
    var recompute = Math.min(Math.round(row.tvl_usd * row.global_multiple), 20 * row.tvl_usd);
    var matches = recompute === row.implied_value_usd;
    var ch = fmtChange(row.change_7d);
    var steps = row.farm_steps.map(function (s) {
      var at = s.indexOf(' Cost: ');
      var action = at >= 0 ? s.slice(0, at) : s;
      var tail = at >= 0 ? s.slice(at + 1) : '';
      return '<li><b>' + esc(action) + '</b><span class="cost">' + esc(tail) + '</span></li>';
    }).join('');
    var hours = (row.farm_cost.active_minutes / 60).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    dialog.innerHTML =
      '<div class="detail-head"><div>' +
      '<span class="pill">Rank ' + row.rank + ' of ' + DATA.board_size + ' &middot; pre-token</span>' +
      '<h2 id="detail-title">' + esc(row.name) + '</h2>' +
      '<p class="sub">' + esc(categoryOf(row)) + ' &middot; ' + chainsOf(row) + ' chain' + (chainsOf(row) === 1 ? '' : 's') + ' &middot; TVL ' + esc(compact(row.tvl_usd)) + ' &middot; ' + esc(fmtAge(row.age_days)) + '</p>' +
      '</div><button class="close" type="button" aria-label="Close details" id="detail-close">Close</button></div>' +
      '<section class="detail-section"><h3>Implied value</h3>' +
      '<div class="equation">' +
      '<div><span>TVL</span><b>' + esc(money(row.tvl_usd)) + '</b></div>' +
      '<div><span>Global multiple</span><b>' + row.global_multiple.toFixed(4) + 'x</b></div>' +
      '<div><span>Cap</span><b>20x TVL</b></div>' +
      '<div><span>Seven-day change</span><b class="' + ch.cls + '">' + esc(ch.text) + '</b></div>' +
      '<div><span>Implied value</span><b>' + esc(money(row.implied_value_usd)) + '</b></div></div>' +
      '<p>The page recomputes this row as ' + esc(money(recompute)) + (matches ? ', the same number the board carries.' : ', which differs from the board: the data would be stale.') + ' This is an estimate, not a price.</p></section>' +
      '<section class="detail-section"><h3>Launch odds</h3>' +
      '<p><b>' + (row.launch_odds * 100).toFixed(1) + '%</b> &mdash; ' + esc(row.odds_basis) + '.</p>' +
      '<p>That is the share of peers that already have a token, not a launch date.</p></section>' +
      '<section class="detail-section"><h3>90% range</h3>' +
      '<p><b>' + esc(compact(row.interval_lo_usd)) + ' &ndash; ' + esc(compact(row.interval_hi_usd)) + '</b></p>' +
      '<p>The 90% range is a conformal interval from the held-out tokens: it covers about ' + Math.round(DATA.validation.conformal_q90_coverage * 100) + '% of them, and it is about &times;' + DATA.validation.conformal_factor_q90.toFixed(2) + ' wide.</p></section>' +
      '<section class="detail-section"><h3>Farm verdict</h3>' +
      '<p><b>' + esc(row.farm_cost.verdict) + '</b></p>' +
      '<p>Rule: farm first when launch odds are at least 30% and implied value per dollar of capital is at least $1,000,000; ' +
      'farm if you use it when odds are at least 15% or implied value per dollar is at least $100,000; otherwise skip unless you already farm it.</p>' +
      '<div class="statboxes">' +
      '<div class="statbox"><b>' + money(row.farm_cost.capital_usd) + '</b><span>Capital locked</span></div>' +
      '<div class="statbox"><b>$' + row.farm_cost.gas_usd + '</b><span>Gas total</span></div>' +
      '<div class="statbox"><b>' + hours + ' h</b><span>Active time</span></div>' +
      '<div class="statbox"><b>$' + row.farm_cost.usd_per_hour.toFixed(2) + '/h</b><span>Cost per hour</span></div>' +
      '</div></section>' +
      '<section class="detail-section"><h3>Farm plan</h3><ol class="steps">' + steps + '</ol></section>';
    var closeBtn = document.getElementById('detail-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close(); });
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  // ------------------------------------------------------------- render + wire

  function renderTable() {
    var holder = document.getElementById('table-holder');
    if (!holder) return;
    holder.innerHTML = tableHtml();
    var clear = document.getElementById('clear-filters');
    if (clear) clear.addEventListener('click', function () {
      state.q = ''; state.category = 'all'; state.chain = 'all';
      var q = document.getElementById('q'); if (q) q.value = '';
      var c = document.getElementById('category'); if (c) c.value = 'all';
      var h = document.getElementById('chain'); if (h) h.value = 'all';
      writeHash(); renderTable();
    });
  }
  function render() {
    app.innerHTML = '<div class="shell">' + headerHtml() + stripHtml() + ledeHtml() + statsHtml() + heroHtml() + controlsHtml() +
      '<div id="table-holder"></div>' + modelPanelHtml() + '</div>';
    app.setAttribute('aria-busy', 'false');
    var search = document.getElementById('q');
    if (search) search.addEventListener('input', function () { state.q = search.value; writeHash(); renderTable(); });
    var cat = document.getElementById('category');
    if (cat) cat.addEventListener('change', function () { state.category = cat.value; writeHash(); renderTable(); });
    var chain = document.getElementById('chain');
    if (chain) chain.addEventListener('change', function () { state.chain = chain.value; writeHash(); renderTable(); });
    var tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        state.tab = b.getAttribute('data-tab');
        state.sort = state.tab === 'ranked' ? 'rank' : 'tvl';
        state.dir = state.tab === 'ranked' ? 1 : -1;
        tabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t === b)); });
        writeHash(); renderTable();
      });
    });
    var picks = document.querySelectorAll('.pick');
    picks.forEach(function (b) { b.addEventListener('click', function () { openDetail(b.getAttribute('data-slug')); }); });
    document.getElementById('table-holder').addEventListener('click', function (e) {
      var sortBtn = e.target.closest('[data-sort]');
      if (sortBtn) {
        var key = sortBtn.getAttribute('data-sort');
        if (state.sort === key) state.dir = -state.dir;
        else { state.sort = key; state.dir = key === 'name' ? 1 : -1; }
        renderTable();
        return;
      }
      var row = e.target.closest('tr[data-slug]');
      if (row) openDetail(row.getAttribute('data-slug'));
    });
    document.getElementById('table-holder').addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-slug]')) {
        e.preventDefault();
        openDetail(e.target.getAttribute('data-slug'));
      }
    });
    renderTable();
    if (state.selected) openDetail(state.selected);
  }

  if (dialog) dialog.addEventListener('close', function () { state.selected = null; writeHash(); });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dialog && dialog.open) dialog.close();
  });
  readHash();
  render();
})();
