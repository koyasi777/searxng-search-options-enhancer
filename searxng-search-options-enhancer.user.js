// ==UserScript==
// @name         SearXNG検索オプション強化UI 🔍️
// @namespace    https://github.com/koyasi777/searxng-search-options-enhancer
// @version      3.6.2
// @description  SearXNG検索エンジンに詳細検索オプションサイドバーを追加（言語選択も自動検出と英語と日本語のみにしてすっきり）
// @author       koyasi777
// @match        *://*/searx/search*
// @match        *://*/searxng/search*
// @match        *://searx.*/*
// @match        *://*.searx.*/*
// @match        https://search.charleseroop.com/*
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  /*** 🌐 言語フィルタ処理を先に定義しておく ***/
  function filterLanguageDropdown() {
    const allowedLanguages = [
      "all", "auto",          // デフォルト・自動検出
      "ja", "ja-JP",          // 日本語
      "en"
    ];

    const select = document.getElementById("language");
    if (!select) return;

    for (let i = select.options.length - 1; i >= 0; i--) {
      const opt = select.options[i];
      if (!allowedLanguages.includes(opt.value)) {
        select.remove(i);
      }
    }
  }

  /*** 🧩 以下、検索オプションサイドバー ***/
  const SIDEBAR_ID = 'gso-advanced-sidebar';
  const COLLAPSE_KEY = 'gso_sidebar_collapsed';

  const STYLE = `
    #${SIDEBAR_ID} {
      position: fixed;
      top: 100px;
      right: 20px;
      width: 260px;
      max-height: 90vh;
      overflow-y: auto;
      background: #ffffff;
      border: 1px solid #dadce0;
      border-radius: 12px;
      padding: 16px;
      font-family: Roboto, Arial, sans-serif;
      font-size: 13px;
      z-index: 99999;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      color: #202124;
    }
    #${SIDEBAR_ID}.collapsed {
      width: 180px;
      max-height: 21px;
      overflow: hidden;
      padding: 6px 12px;
      padding-top:10px;
    }
    #${SIDEBAR_ID}.collapsed label,
    #${SIDEBAR_ID}.collapsed input,
    #${SIDEBAR_ID}.collapsed select,
    #${SIDEBAR_ID}.collapsed .gso-body {
      display: none;
    }
    #${SIDEBAR_ID} .gso-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    #${SIDEBAR_ID} .gso-header h3 {
      font-size: 14px;
      font-weight: bold;
      margin: 0;
      padding: 0;
    }
    #${SIDEBAR_ID} .gso-toggle {
      font-size: 12px;
      cursor: pointer;
      color: #3367d6;
      margin: 0;
      user-select: none;
    }
    #${SIDEBAR_ID} label {
      display: block;
      margin-top: 10px;
      font-weight: 500;
    }
    #${SIDEBAR_ID} input,
    #${SIDEBAR_ID} select {
      width: 100%;
      margin-top: 4px;
      padding: 6px;
      border: 1px solid #ccc;
      border-radius: 6px;
      background-color: #fff;
      color: #202124;
      box-sizing: border-box;
    }
    @media (prefers-color-scheme: dark) {
      #${SIDEBAR_ID} {
        background: #202124;
        color: #e8eaed;
        border: 1px solid #5f6368;
      }
      #${SIDEBAR_ID} input,
      #${SIDEBAR_ID} select {
        background-color: #303134;
        color: #e8eaed;
        border: 1px solid #5f6368;
      }
    }
  `;
  GM_addStyle(STYLE);

  const selects = {
    filetype: [['', 'すべて'], ['filetype:pdf', 'PDF'], ['filetype:doc', 'DOC'], ['filetype:xls', 'XLS'], ['filetype:ppt', 'PPT'], ['filetype:txt', 'TXT']],
    region: [['', 'すべて'], ['region:jp', '日本'], ['region:us', 'アメリカ'], ['region:cn', '中国']],
    occt: [['', '全体'], ['intitle:', 'タイトル'], ['inurl:', 'URL'], ['inanchor:', 'リンク先']],
    rights: [['', '制限なし'], ['cc_publicdomain', 'パブリックドメイン'], ['cc_attribute', '帰属'], ['cc_sharealike', '継承'], ['cc_noncommercial', '非営利']],
    date: [['', '指定なし'], ['date:h', '1時間以内'], ['date:d', '1日以内'], ['date:w', '1週間以内'], ['date:m', '1か月以内'], ['date:y', '1年以内']]
  };

  const timeRangeMap = {
    'hour': 'date:h',
    'day': 'date:d',
    'week': 'date:w',
    'month': 'date:m',
    'year': 'date:y'
  };
  const reverseTimeMap = Object.fromEntries(Object.entries(timeRangeMap).map(([k, v]) => [v, k]));

  const fields = [
    ['all', 'すべてのキーワード'],
    ['exact', '完全一致キーワード'],
    ['any', 'いずれかのキーワード'],
    ['none', '含めないキーワード'],
    ['site', 'サイト・ドメイン'],
    ['filetype', 'ファイル形式'],
    ['region', '地域'],
    ['occt', '検索対象の範囲'],
    ['rights', 'ライセンス'],
    ['date', '最終更新']
  ];

  function parseQuery(query) {
    const result = Object.fromEntries(fields.map(([id]) => [id, '']));
    const tokens = query.match(/"[^"]+"|\S+/g) || [];
    const skipIndexes = new Set();
    const orWords = [];

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i + 1] === 'OR') {
        orWords.push(tokens[i]);
        skipIndexes.add(i);
        skipIndexes.add(i + 1);
        i += 1;
      } else if (tokens[i - 1] === 'OR') {
        orWords.push(tokens[i]);
        skipIndexes.add(i);
      }
    }
    result.any = [...new Set(orWords)].join(' ');

    for (let i = 0; i < tokens.length; i++) {
      if (skipIndexes.has(i)) continue;
      const token = tokens[i];

      if (token.startsWith('site:')) result.site = token.slice(5);
      else if (token.startsWith('filetype:')) result.filetype = token;
      else if (token.startsWith('region:')) result.region = token;
      else if (token.startsWith('date:')) result.date = token;
      else if (token.startsWith('cc_')) result.rights = token;
      else if (/^(intitle|inurl|inanchor):/.test(token)) result.occt = token.split(':')[0] + ':';
      else if (token.startsWith('"') && token.endsWith('"')) result.exact += token.slice(1, -1) + ' ';
      else if (token.startsWith('-')) result.none += token.slice(1) + ' ';
      else result.all += token + ' ';
    }

    return Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.trim()]));
  }

  function buildQueryFromUI(base = '') {
    const get = id => document.getElementById(`gso-${id}`)?.value.trim() || '';
    const parts = [];

    const exact = get('exact');
    const any = get('any');
    const none = get('none');
    const site = get('site');
    const filetype = get('filetype');
    const region = get('region');
    const rights = get('rights');
    const occt = get('occt');
    const all = get('all');

    const allWords = all.split(/\s+/).filter(Boolean);
    const anyWords = any.split(/\s+/).filter(Boolean);
    const noneWords = none.split(/\s+/).filter(Boolean);
    const exclusionWords = new Set([...anyWords, ...noneWords]);

    const filteredAll = allWords.filter(w => !exclusionWords.has(w));
    if (filteredAll.length > 0) {
      parts.push(occt ? `${occt}${filteredAll.join(' ')}` : filteredAll.join(' '));
    } else if (occt && allWords.length > 0) {
      parts.push(`${occt}${allWords.join(' ')}`);
    }

    if (exact) parts.push(`"${exact}"`);
    if (anyWords.length > 1) parts.push(anyWords.join(' OR '));
    else if (anyWords.length === 1) parts.push(anyWords[0]);
    noneWords.forEach(w => parts.push(`-${w}`));
    if (site) parts.push(`site:${site}`);
    if (filetype) parts.push(filetype);
    if (region) parts.push(region);
    if (rights) parts.push(rights);

    return parts.join(' ').trim();
  }

  function stripOrClauses(query) {
    const tokens = query.match(/"[^"]+"|\S+/g) || [];
    const result = [];
    let i = 0;

    while (i < tokens.length) {
      // ORグループの開始を検知（例: tok i+1 === 'OR'）
      if (tokens[i + 1] === 'OR') {
        // OR連鎖を全てスキップ
        while (tokens[i + 1] === 'OR') {
          i += 2; // skip current + OR + next
        }
        i += 1; // skip最後の単語
      } else {
        result.push(tokens[i]);
        i += 1;
      }
    }

    return result.join(' ');
  }


  function submitQuery() {
    const form = document.querySelector('form[action="/search"]');
    const input = form?.querySelector('input[name="q"]');
    if (!input) return;

    const gsoAll = document.getElementById('gso-all');
    const activeEl = document.activeElement;
    let base;

    if (activeEl === gsoAll) {
      base = gsoAll.value.trim();
    } else {
      const raw = input.value;

      base = stripOrClauses(raw)
        .replace(/filetype:[^\s]+/g, '')
        .replace(/site:[^\s]+/g, '')
        .replace(/region:[^\s]+/g, '')
        .replace(/date:[^\s]+/g, '')
        .replace(/cc_[^\s]+/g, '')
        .replace(/\b(intitle|inurl|inanchor):/g, '')
        .replace(/"[^"]*"/g, '')  // ★ ダブルクォート内の文字列（完全一致）を除去
        .replace(/-[^\s]+/g, '')  // ★ 除外キーワード（-xxx）も除去
        .trim();


      if (gsoAll) gsoAll.value = base;
    }

    input.value = buildQueryFromUI(base);

    const dateValue = document.getElementById('gso-date')?.value || '';
    const timeRange = reverseTimeMap[dateValue] || '';
    const timeRangeSelect = document.getElementById('time_range');
    if (timeRangeSelect) {
      timeRangeSelect.value = timeRange;
    }

    form.submit();
  }

  function createInput(labelText, id) {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.id = `gso-${id}`;
    input.name = id;
    label.appendChild(input);
    input.addEventListener('change', submitQuery);
    return label;
  }

  function createSelect(labelText, id, options) {
    const label = document.createElement('label');
    label.textContent = labelText;
    const select = document.createElement('select');
    select.id = `gso-${id}`;
    select.name = id;
    options.forEach(([val, text]) => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = text;
      select.appendChild(opt);
    });
    select.addEventListener('change', submitQuery);
    label.appendChild(select);
    return label;
  }

  function createSelectFromNative(labelText, id, nativeSelector) {
    const native = document.querySelector(nativeSelector);
    if (!native) return null;

    const label = document.createElement('label');
    label.textContent = labelText;
    const select = document.createElement('select');
    select.id = `gso-${id}`;
    select.name = id;

    Array.from(native.options).forEach(opt => {
      const clone = opt.cloneNode(true);
      select.appendChild(clone);
    });

    select.value = native.value;
    select.addEventListener('change', () => {
      native.value = select.value;
      native.dispatchEvent(new Event('change'));
    });

    label.appendChild(select);
    return label;
  }

  function insertSidebar() {
    if (document.getElementById(SIDEBAR_ID)) return;

    filterLanguageDropdown();

    const sidebar = document.createElement('div');
    sidebar.id = SIDEBAR_ID;

    const header = document.createElement('div');
    header.className = 'gso-header';
    const title = document.createElement('h3');
    title.textContent = '詳細検索オプション';
    const toggle = document.createElement('div');
    toggle.className = 'gso-toggle';
    toggle.textContent = '▲ 閉じる';
    toggle.onclick = () => {
      const collapsed = sidebar.classList.toggle('collapsed');
      toggle.textContent = collapsed ? '▼ 開く' : '▲ 閉じる';
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    };
    header.appendChild(title);
    header.appendChild(toggle);
    sidebar.appendChild(header);

    const body = document.createElement('div');
    body.className = 'gso-body';
    fields.forEach(([id, label]) => {
      body.appendChild(selects[id] ? createSelect(label, id, selects[id]) : createInput(label, id));
    });

    const languageSyncUI = createSelectFromNative('言語設定', 'uilang', '#language');
    if (languageSyncUI) body.appendChild(languageSyncUI);

    const safeSearchUI = createSelectFromNative('セーフサーチ', 'safesearch', '#safesearch');
    if (safeSearchUI) body.appendChild(safeSearchUI);

    sidebar.appendChild(body);
    document.body.appendChild(sidebar);

    const qInput = document.querySelector('#q');
    if (qInput) {
      const parsed = parseQuery(qInput.value);
      fields.forEach(([id]) => {
        const el = document.getElementById(`gso-${id}`);
        if (el && parsed[id]) el.value = parsed[id];
      });

      const syncSidebarFromQ = () => {
        const updated = parseQuery(qInput.value);
        fields.forEach(([id]) => {
          const el = document.getElementById(`gso-${id}`);
          if (el) el.value = updated[id] || '';
        });
      };
      qInput.addEventListener('input', syncSidebarFromQ);
      qInput.addEventListener('change', syncSidebarFromQ);

      const timeRangeSelect = document.getElementById('time_range');
      if (timeRangeSelect) {
        const trVal = timeRangeSelect.value;
        if (trVal && timeRangeMap[trVal]) {
          const dateSel = document.getElementById('gso-date');
          if (dateSel) dateSel.value = timeRangeMap[trVal];
        }
      }

      const form = document.querySelector('form[action="/search"]');
      if (form) {
        qInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitQuery();
          }
        });
      }
    }

    const saved = localStorage.getItem(COLLAPSE_KEY);
    if (saved === '1') {
      sidebar.classList.add('collapsed');
      toggle.textContent = '▼ 開く';
    }
  }

  window.addEventListener('load', insertSidebar);
})();
