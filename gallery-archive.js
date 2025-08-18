class GalleryArchive extends HTMLElement {
  constructor() {
    super();
    this._cleanup = [];
    const root = this.attachShadow({ mode: 'open' });

    root.innerHTML = `
      <style>
        /* Hide host while custom element is not defined to avoid placeholder flash */
        :host(:not(:defined)) { opacity: 0; }
        :host{
          --card-bg:#ffffff; --text:#1f2937; --muted:#6b7280; --hover:#f3f4f6;
          --border:#e5e7eb; --border-strong:#d1d5db;

          --panel-bg:#ffffff; --panel-alt:#fafafa;
          --chip-bg:#ffffff; --chip-hover:#f7f7f7; --chip-selected:#f3f4f6;
          --list-hover:#f9fafb;

          --os-thumb: rgba(0,0,0,.2);

          --pad:20px; --gap:12px; --ease:cubic-bezier(.22,.61,.36,1);
          --radius:10px;

          --control-h: 40px;
          --pill-sm-h: 28px;

          --mode-w: 140px; --switch-pad:4px; --switch-gap:6px;
          --switch-colW: calc((var(--mode-w) - 2*var(--switch-pad) - var(--switch-gap)) / 2);

          --sidebar-w: clamp(220px, 24vw, 320px);
          --cols:4;  --rows:3;

          --row-h: calc((100% - (var(--rows) - 1) * var(--gap)) / var(--rows));

          --card-shadow: 0 8px 30px rgba(0,0,0,.08);
          --inner-bottom-fade: linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,.08));

          /* Unified icon color */
          --icon-color: #3b3b3b;
          /* Toggle thumb inset padding inside each column */
          --thumb-inset: 3px;

          /* Unified state fade duration */
          --state-fade-dur: .30s;

          --filters-w: 640px; /* JS syncs this to search width */

          /* Drawer (inner filter menu) motion */
          --swing-dur: .28s;
          --swing-ease: cubic-bezier(.22,.75,.2,1.02);
          --swing-angle: -7deg;
          --swing-ty: -8px;
          --swing-scale: .98;

          /* Wipe (entire toolbar row) motion */
          --wipe-dur-open: .36s;
          --wipe-ease-open: cubic-bezier(.18,.84,.26,1);
          --wipe-dur-close: .28s;
          --wipe-ease-close: cubic-bezier(.4,.14,.3,1);
          --wipe-fade-dur: .26s;
          display:block;
          font-family: 'Unica77LL', Helvetica, sans-serif;
        }

        .card.dark{
          --card-bg:#0B0B0B; --text:#eaeaea; --muted:#a0a0a0; --hover:#1d1d1d;
          --border:#2a2a2a; --border-strong:#3a3a3a;
          --panel-bg:#0f0f0f; --panel-alt:#141414;
          --chip-bg:#0f0f0f; --chip-hover:#171717; --chip-selected:#1d1d1d;
          --list-hover:#161616;
          --os-thumb: rgba(255,255,255,.18);
          --card-shadow: 0 8px 30px rgba(0,0,0,.35);
          --inner-bottom-fade: linear-gradient(to bottom, rgba(255,255,255,0), rgba(0,0,0,.3));
        }
        /* Dark mode searchbar palette */
        .card.dark .searchbar{ background: var(--panel-alt); border-color: var(--border-strong); }
        .card.dark .search-icon{ background: #1a1a1a; color: var(--text); border-right: 1px solid var(--border-strong); }
        .card.dark .searchbar:hover{ background: rgba(162,230,51,0.10); border-color: #8DCB1F; }
        .card.dark .searchbar:focus-within{ background: rgba(162,230,51,0.18); border-color: #8DCB1F; }
        .card.dark .searchbar:hover .search-icon,
        .card.dark .searchbar:focus-within .search-icon{ background: rgba(162,230,51,0.18); border-right-color: #8DCB1F; }
        .card.dark .searchbar input{ color: var(--text); }
        .card.dark .searchbar input::placeholder{ color:#9aa0a6; }

        *{ box-sizing:border-box }
        .section{ width:100%; padding:24px; overflow:visible; background:transparent; color:inherit; font:16px/1.45 'Unica77LL', Helvetica, sans-serif; }

        .card, .sidebar, .searchbar, .filters, .filters-toggle,
        .pill, .option-pill, .item, .expander, .expander-close,
        .result-item, .mode-toggle, .filters-head h4, .fullscreen-btn {
          transition:
            background-color var(--state-fade-dur) var(--ease),
            color var(--state-fade-dur) var(--ease),
            border-color var(--state-fade-dur) var(--ease),
            box-shadow var(--state-fade-dur) var(--ease),
            opacity var(--state-fade-dur) var(--ease);
        }
        .mode-thumb { transition: transform .22s var(--ease), background-color var(--state-fade-dur) var(--ease), box-shadow var(--state-fade-dur) var(--ease); }

        @media (prefers-reduced-motion: reduce){
          * { transition: none !important; animation: none !important; }
        }

        .card{
          display:flex; flex-direction:column; width:100%;
          min-height:720px;
          background:var(--card-bg);
          border:1px solid var(--border-strong);
          border-radius:var(--radius);
          padding:var(--pad);
          box-shadow: var(--card-shadow);
          color: var(--text);
          position: relative;
        }

        .card-body{
          position:relative; flex:1 1 auto; min-height:0;
          height:720px; /* ensure grid rows have a definite height context */
          display:grid; gap:var(--gap);
          grid-template-columns: var(--sidebar-w) repeat(var(--cols), 1fr);
          grid-template-rows: auto auto 1fr;
          grid-template-areas:
            "search search search search search"
            "toolbar toolbar toolbar toolbar toolbar"
            "sidebar content content content content";
        }
        .card-body::after{
          content:""; position:absolute; left:var(--pad); right:var(--pad); bottom:calc(var(--pad) - 6px);
          height:18px; pointer-events:none; border-radius:12px;
          background: var(--inner-bottom-fade);
          filter: blur(6px);
          opacity:.45;
        }

        /* Search row + right-aligned toggle, “subheader” scale */
        .search-row{
          grid-area: search;
          display:grid; grid-template-columns: 1fr auto; gap: var(--gap); align-items:center;

          --search-h: 56px;
          --search-fz: 16px;
          --search-icon: 16px;
        }
        /* Consolidate searchbar to match ui-search */
        .searchbar{
          display:inline-flex; align-items:stretch; gap:0; width:100%; position:relative;
          border:1px solid #D9D9D9; border-radius:6px; background:#FFF;
          height: var(--search-h, 56px);
          min-width:0;
        }
        .searchbar:focus-within{
          background: rgba(162,230,51,0.25);
          border-color: #A2E633;
        }
        .searchbar:hover{
          background: rgba(162,230,51,0.15);
          border-color: #A2E633;
        }
        .search-icon{
          display:inline-flex; align-items:center; justify-content:center; gap:6px; flex-shrink:0;
          padding:12px 16px; height: 100%;
          border-right:1px solid #D9D9D9; background:#F0F0F0; color:#2C2C2C;
          border-radius:6px 0 0 0; /* visual parity with ui-search-key */
        }
        .searchbar:hover .search-icon{
          background: rgba(162,230,51,0.15); /* transparent lime */
          border-right: 1px solid #A2E633;
        }
        .search-icon svg{ width: var(--search-icon, 16px); height: var(--search-icon, 16px); }
        .search-icon svg path{ stroke: var(--icon-color); }
        .searchbar:focus-within .search-icon{
          background: rgba(162,230,51,0.25);
          border-right: 1px solid #A2E633;
        }
        .searchbar input{
          appearance:none; border:0; outline:0; background:transparent; flex:1 1 auto; min-width:0;
          padding:16px 20px; color:var(--text); font-family:'Unica77LL', Arial, sans-serif; font-size: var(--search-fz);
          line-height:1.2;
        }
        /* Clear button like ui-search */
        .search-clear{
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          width: 24px; height: 24px; border: 1px solid #D9D9D9; border-radius: 6px; background: #FFF;
          display: none; align-items: center; justify-content: center; cursor: pointer;
          transition: background 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .search-clear{ color: var(--icon-color); }
        .searchbar.has-value .search-clear{ display:inline-flex; }

        .search-row .mode-toggle{ height: var(--search-h, var(--control-h)); }

        /* Toolbar wipe */
        .toolbar{ grid-area: toolbar; margin-top: calc(-1 * var(--gap)); }
        .toolbar-wipe{
          overflow: hidden;
          height: 0;
          opacity: 0;
          transform: translateY(-6px);
          clip-path: inset(0 100% 0 0 round var(--radius));
          transition:
            height var(--wipe-dur-open) var(--wipe-ease-open),
            clip-path var(--wipe-dur-open) var(--wipe-ease-open),
            opacity var(--wipe-fade-dur) var(--wipe-ease-open),
            transform var(--wipe-dur-open) var(--wipe-ease-open);
        }
        /* Add visual gap only when expanded */
        .toolbar-wipe.is-open{ margin-top: var(--gap); }
        .toolbar-wipe.is-open{
          opacity: 1;
          transform: none;
          clip-path: inset(0 0 0 0 round var(--radius));
        }
        .toolbar-wipe.is-closing{
          transition:
            height var(--wipe-dur-close) var(--wipe-ease-close),
            clip-path var(--wipe-dur-close) var(--wipe-ease-close),
            opacity var(--wipe-dur-close) var(--wipe-ease-close),
            transform var(--wipe-dur-close) var(--wipe-ease-close);
        }

        .filtersbar{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; min-width:0; background:transparent; width:100%; }
        .filters-right{ display:flex; align-items:center; gap:8px; }
        .filters{
          width: var(--filters-w); max-width: 100%;
          border:1px solid var(--border-strong);
          border-radius:var(--radius);
          background:var(--panel-bg);
          padding:10px;
          display:flex; flex-direction:column; position:relative;
          min-width:320px;
        }
        .fullscreen-btn{
          width: var(--search-h, var(--control-h)); height: var(--search-h, var(--control-h));
          border:1px solid var(--border-strong);
          border-radius: var(--radius);
          background: transparent; color: var(--muted);
          display:inline-flex; align-items:center; justify-content:center; cursor:pointer;
        }
        .fullscreen-btn:hover{ background: rgba(162,230,51,0.15); border-color: #A2E633; }
        .card.dark .fullscreen-btn:hover{ background: rgba(162,230,51,0.18); border-color: #8DCB1F; }
        .fullscreen-btn .fullscreen-icon{ width:32px; height:32px; object-fit:contain; display:block; filter: invert(1) brightness(0.76) invert(1); transition: filter var(--state-fade-dur) var(--ease), opacity var(--state-fade-dur) var(--ease); }
        @media (max-width: 768px){ .fullscreen-btn .fullscreen-icon{ width:28px; height:28px; } }
        

        /* Fullscreen layout adjustments */
        .card:fullscreen, .card:-webkit-full-screen{
          width: 100vw; height: 100vh; min-height: 100vh;
        }
        .card:fullscreen .card-body, .card:-webkit-full-screen .card-body{
          height: 100vh;
        }

        /* Fallback fullscreen class (when Fullscreen API is unavailable) */
        .card.is-fullscreen{
          position: fixed; inset: 0; width: 100vw; height: 100vh; min-height: 100vh;
          z-index: 2147483000;
          border-radius: 0;
        }
        .card.is-fullscreen .card-body{ height: 100vh; }

        /* Animated fullscreen (FLIP) */
        .card.fs-fixed{ position: fixed; z-index: 2147483000; margin: 0; }
        .card.fs-animating{
          transition: left .36s var(--ease), top .36s var(--ease), width .36s var(--ease), height .36s var(--ease),
                      border-radius .36s var(--ease), box-shadow .36s var(--ease);
        }
        .card.fs-fixed .card-body{ height: 100%; }
        .filters-head{
          display:grid; grid-template-columns: auto 1fr auto; align-items:center; gap:8px; min-width:0;
          min-height: var(--pill-sm-h);
        }
        .filters-head h4{ margin:0; font-size:13px; font-weight:500; color:#374151; letter-spacing:.2px; white-space:nowrap; font-family:'Unica77LL', Helvetica, sans-serif; }
        .card.dark .filters-head h4{ color:#e2e2e2; }

        .head-slot{ display:flex; align-items:center; gap:8px; min-width:0; overflow:auto; scrollbar-width:none; }
        .head-slot::-webkit-scrollbar{ width:0; height:0; }

        .filters-toggle{
          width:32px; height:28px; display:grid; place-items:center;
          background:var(--panel-bg); color: var(--icon-color);
          border:1px solid var(--border-strong);
          border-radius:var(--radius); cursor:pointer;
        }
        .filters-toggle svg{ transition: transform .2s var(--ease); transform: rotate(0deg); }
        .filters-toggle[aria-expanded="true"] svg{ transform: rotate(180deg); }

        .pill{
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          height: var(--control-h);
          padding: 0 12px; line-height:1;
          background:var(--chip-bg); color:var(--text);
          border:1px solid var(--border-strong);
          border-radius:var(--radius); cursor:pointer; white-space:nowrap;
          font-family:'Unica77LL', Helvetica, sans-serif;
        }
        .pill .x{ font-weight:500; opacity:.7; }
        .pill-placeholder{ background:transparent; color:#6b7280; border:1px dashed var(--border-strong); }
        .pill-placeholder:hover{ background:var(--panel-alt); color:var(--text); border-style:solid; }
        .pill--compact{ height: var(--pill-sm-h); padding: 0 10px; font-size:13px; }
        .head-slot .pill span:first-child{
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width: 22ch;
        }
        .selected-pills{ display:flex; flex-wrap:nowrap; gap:8px; align-items:center; min-width:0; }

        .filter-wrap{
          transform-origin: top center;
          transform: perspective(1000px) rotateX(var(--swing-angle)) translateY(var(--swing-ty)) scaleY(var(--swing-scale));
          opacity: 0;
          backface-visibility: hidden;
          will-change: transform, opacity, height;
          transition:
            transform var(--swing-dur) var(--swing-ease),
            opacity  var(--swing-dur) var(--swing-ease),
            height   var(--swing-dur) var(--swing-ease);
          margin-top:8px;
          overflow:hidden;
          height:auto;
        }
        .filters.filters--expanded .filter-wrap{
          transform: perspective(1000px) rotateX(0deg) translateY(0) scaleY(1);
          opacity: 1;
        }
        .filters.filters--collapsing .filter-wrap{
          transform: perspective(1000px) rotateX(var(--swing-angle)) translateY(var(--swing-ty)) scaleY(var(--swing-scale));
          opacity: 0;
        }

        .filter-pills{ display:flex; flex-wrap:wrap; gap:8px; }

        .option-pill{
          display:inline-flex; align-items:center; gap:6px;
          padding:6px 10px; background:var(--chip-bg); color:var(--text);
          border:1px solid var(--border-strong);
          border-radius:var(--radius); cursor:pointer; font-size:13px; font-family:'Unica77LL', Helvetica, sans-serif;
        }
        .option-pill:hover{ background:var(--chip-hover); }
        .option-pill.is-selected{ background:var(--chip-selected); border-color:#cbd5e1; box-shadow:0 2px 10px rgba(0,0,0,.06) inset; }
        .card.dark .option-pill.is-selected{ border-color:#4a4a4a; box-shadow:0 2px 10px rgba(0,0,0,.25) inset; }

        /* Mode toggle */
        .mode-toggle{
          width:var(--mode-w); height:var(--control-h);
          padding:var(--switch-pad);
          background:var(--panel-alt);
          border:1px solid var(--border-strong);
          border-radius:var(--radius);
          display:grid; grid-template-columns:1fr 1fr; gap:var(--switch-gap);
          align-items:center; position:relative; isolation:isolate;
          cursor:pointer; user-select:none;
        }
        /* Match mode toggle height to filters block height when inside toolbar */
        .filters-right .mode-toggle{ height: var(--filters-h, var(--control-h)); }
        .mode-thumb{
          position:absolute; z-index:1; pointer-events:none;
          top:var(--switch-pad);
          left: calc(var(--switch-pad) + var(--thumb-inset));
          height: calc(100% - (2 * var(--switch-pad)));
          width: calc(var(--switch-colW) - (2 * var(--thumb-inset)));
          border-radius:var(--radius);
          background:var(--panel-bg);
          box-shadow:-2px 1px 2px rgba(0, 0, 0, .08) inset, 0 2px 6px rgba(0, 0, 0, .10);
          transform: translateX(0);
        }
        .card.dark .mode-thumb{ transform: translateX(calc(var(--switch-colW) + var(--switch-gap))); background:#1e1e1e; box-shadow:-2px 1px 2px rgba(0,0,0,.25) inset, 0 2px 6px rgba(0,0,0,.35); }
        /* Prevent thumb from overshooting due to fractional rounding */
        @media (max-width: 768px){
          .mode-thumb{ will-change: transform; }
          .card.dark 
          .mode-thumb{ transform: translateX(calc(var(--switch-colW) + var(--switch-gap))); }
        }
        .mode-label{ position:relative; z-index:2; display:flex; align-items:center; justify-content:center; font-weight:500; color:var(--text); }
        .mode-label .mode-icon{ width:24px; height:24px; display:block; object-fit:contain; filter: invert(1) brightness(0.76) invert(1); transition: filter var(--state-fade-dur) var(--ease), opacity var(--state-fade-dur) var(--ease); }
        @media (max-width: 768px){ .mode-label .mode-icon{ width:20px; height:20px; } }
        /* Icons remain dark grey in dark mode per request */

        /* Sidebar & content */
        .sidebar{
          grid-area: sidebar;
          display:flex; flex-direction:column;
          border:1px solid var(--border-strong);
          border-radius:var(--radius);
          padding:12px; background:var(--panel-alt); min-height:0;
          position: relative; /* anchor for mobile viewer */
        }
        .results{ display:block; opacity:1 !important; visibility:visible !important; }
        .result-item{
          display:block; background:transparent; border:0; border-radius:0;
          padding:10px 12px 10px 0; cursor:pointer;
          border-bottom:1px solid var(--border);
          transition:background .12s var(--ease);
        }
        .result-item:last-child{ border-bottom:0; }
        .result-item:hover{ background:var(--list-hover); }
        .result-item .title{ font-size:13px; font-weight:500; color:#374151; font-family:'Unica77LL', Arial, sans-serif; }
        .card.dark .result-item .title{ color:#e2e2e2; }
        .result-item .desc{ font-size:12px; color:#6b7280; line-height:1.35;
                            display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

        /* Overlay scrollbar */
        .os-host{ position:relative; overflow:hidden; }
        .os-host.full{ position:absolute; inset:0; }
        .sidebar .os-host{ flex:1 1 auto; min-height:0; }
        .os-content{ width:100%; height:100%; overflow:auto; scrollbar-width:none; }
        /* Allow sidebar list to size naturally instead of requiring a fixed parent height */
        .sidebar .os-host .os-content{ height:auto; max-height:100%; }
        .os-content::-webkit-scrollbar{ width:0; height:0; }
        .os-scrollbar.y{
          position:absolute; right:4px; top:6px; bottom:6px; width:6px;
          border-radius:999px; background:transparent;
          opacity:0; transition:opacity .2s var(--ease);
        }
        .os-thumb{
          position:absolute; left:0; top:0; width:4px;
          min-height:16px; border-radius:999px;
          background:var(--os-thumb);
          pointer-events:auto; cursor:pointer;
        }

        /* Grid */
        .content{ grid-area: content; position:relative; min-height:0; padding-top: var(--gap); overflow-x:hidden; }
        .grid{
          display:grid; gap:var(--gap);
          grid-template-columns: repeat(var(--cols), 1fr);
          grid-template-rows: repeat(var(--rows), var(--row-h));
          grid-auto-rows: var(--row-h);
          grid-auto-flow: row dense;
          width:100%; height:100%;
        }

        /* ===== Mobile responsiveness for gallery-archive (sidebar + header) ===== */
        @media (max-width: 768px){
          :host{ --thumb-inset-mobile: 12px; }
          /* Mobile: make thumb narrower and align further left */
          .mode-thumb{ left: calc(var(--switch-pad) + var(--thumb-inset-mobile) - 10px); width: calc(var(--switch-colW) - (2 * var(--thumb-inset-mobile))); }
          .card.dark .mode-thumb{ transform: translateX(calc(var(--switch-colW) + var(--switch-gap) - (2 * var(--thumb-inset-mobile)) + 4px)); }
          .card{ min-height:auto; }
          .card-body{ height:auto; }
          .sidebar{ width:100%; box-sizing:border-box; padding:8px 10px; overflow-x:hidden; }
          .section{ overflow-x:hidden; }
          .os-content{ overflow-x:hidden; }
          .fullscreen-btn{ display:none !important; }
          .search-row{ grid-template-columns: 1fr; }
          .filtersbar{ flex-direction: row; align-items: center; gap:8px; }
          .filters{ min-width:0; width:auto; max-width:100%; flex: 1 1 auto; }
          .filters-right{ flex: 0 0 auto; }
          .search-row{ --search-h: 44px; --search-fz: 14px; --search-icon: 14px; }
          .search-icon{ padding:10px 12px; }
          .searchbar input{ font-size: var(--search-fz); padding: 12px 14px; }
          .search-clear{ width:22px; height:22px; }
          .mode-toggle{ width:100px; height:36px; --mode-w:100px; }
          .mode-label{ font-size:12px; }
          /* Keep list item fonts as-is per request */
        }

        /* Ultra-small devices (e.g., 320px width) */
        @media (max-width: 360px){
          :host{ --pad:12px; --gap:8px; --thumb-inset-mobile: 14px; }
          /* XS Mobile: even narrower/closer alignment */
          .mode-thumb{ left: calc(var(--switch-pad) + var(--thumb-inset-mobile) - 12px); width: calc(var(--switch-colW) - (2 * var(--thumb-inset-mobile))); }
          .card.dark .mode-thumb{ transform: translateX(calc(var(--switch-colW) + var(--switch-gap) - (2 * var(--thumb-inset-mobile)) + 4px)); }
          .card{ padding: var(--pad); }
          .sidebar{ padding:6px 8px; }
          .sidebar .os-host{ min-height:200px; }
          .search-row{ --search-h: 40px; --search-fz: 13px; --search-icon: 12px; }
          .search-icon{ padding:8px 10px; }
          .searchbar input{ font-size: var(--search-fz); padding: 10px 12px; }
          .search-clear{ width:20px; height:20px; }
          .mode-toggle{ width:88px; height:32px; --mode-w:88px; }
          .mode-label{ font-size:11px; }
          .filters{ padding:8px; min-width:0; width:100%; max-width:100%; }
          .filters-head h4{ font-size:12px; }
          .pill{ height: 28px; padding: 0 10px; font-size:12px; }
          .option-pill{ font-size:12px; padding:5px 8px; }
        }

        .item{
          position:relative; border-radius:var(--radius);
          border:1px solid var(--border-strong);
          background:var(--panel-bg); cursor:pointer; overflow:hidden;
          transition:background .16s ease, border-color .16s ease, box-shadow .16s ease;
          display:grid; place-items:center;
        }
        /* Selection flash (subtle lime fade-in/out) */
        @keyframes selectFlash{
          0%{ opacity: 0; }
          40%{ opacity: .26; }
          100%{ opacity: 0; }
        }
        .item.select-flash::after{
          content:""; position:absolute; inset:0; border-radius: inherit;
          background: #A2E633; opacity:0; pointer-events:none;
          animation: selectFlash 600ms var(--ease) forwards;
        }
        @keyframes shimmer{
          0%{ background-position: -150% 0; }
          100%{ background-position: 150% 0; }
        }
        @keyframes fadeUpItem{
          from{ opacity:0; transform: translateY(24px); }
          to{ opacity:1; transform: translateY(0); }
        }
        .grid.staggering .item{ opacity:0; transform: translateY(24px); }
        .grid.staggering .item.stagger-in{ animation: fadeUpItem .6s var(--ease) forwards; animation-delay: var(--stagger-delay, 0ms); }
        .item.fade-in{ animation: fadeUpItem .6s var(--ease) both; }
        .item:hover{ background:var(--chip-hover); box-shadow:0 6px 16px rgba(0,0,0,.08); }
        .card.dark .item:hover{ box-shadow:0 6px 16px rgba(0,0,0,.25); }

        .thumb{
          width:100%; height:100%; object-fit:cover; display:block;
          opacity:0; transform: scale(.985);
          transition: opacity .38s var(--ease), transform .38s var(--ease);
          will-change: opacity, transform;
        }
        .thumb.is-loaded{ opacity:1; transform:none; }

        .item.loading::before{
          content:""; position:absolute; inset:0;
          background: linear-gradient(90deg,
            rgba(255,255,255,0) 0%,
            rgba(0,0,0,.05) 50%,
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          background-position: -150% 0;
          animation: shimmer 1.2s linear infinite;
          opacity:.18; pointer-events:none;
        }
        .card.dark .item.loading::before{
          background: linear-gradient(90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,.08) 50%,
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          background-position: -150% 0;
        }

        .expander{
          position:absolute; inset:0; display:none;
          border:1px solid var(--border-strong);
          border-radius:var(--radius);
          background:var(--panel-bg); box-shadow:0 10px 40px rgba(0,0,0,.15);
          overflow:hidden; z-index:10;
          opacity:0; transition: opacity .25s var(--ease);
        }
        .expander.open{ display:grid; place-items:center; opacity:1; }
        .expander-img{ width:100%; height:100%; display:block; user-select:none; -webkit-user-drag:none; object-fit:contain; }
        .expander-close{
          position:absolute; top:var(--pad); right:var(--pad); z-index:11;
          width:40px; height:40px; border-radius:var(--radius);
          background:rgba(255,255,255,.9); color:#111;
          border:1px solid rgba(0,0,0,.15);
          display:grid; place-items:center; font-weight:800; font-size:22px; cursor:pointer;
          box-shadow:0 6px 20px rgba(0,0,0,.12);
        }
        .card.dark .expander-close{
          background:rgba(20,20,20,.85); color:#fff; border-color: rgba(255,255,255,.25);
        }
        .expander-close .close-icon{ width:20px; height:20px; display:block; filter: invert(1) brightness(0.76) invert(1); transition: filter var(--state-fade-dur) var(--ease), opacity var(--state-fade-dur) var(--ease); }
        @media (max-width: 768px){ .expander-close .close-icon{ width:18px; height:18px; } }

        /* Mobile: list-only; viewer fills sidebar bounds */
        .mobile-viewer{
          position:absolute;
          z-index: 50;
          inset: 0;
          border:1px solid var(--border-strong);
          border-radius: var(--radius);
          background: var(--panel-bg);
          box-shadow:0 10px 40px rgba(0,0,0,.15);
          display:none;
          opacity:0;
          transition: opacity .25s var(--ease);
        }
        .mobile-viewer.open{ display:grid; place-items:center; opacity:1; }
        .mobile-viewer-img{ width:100%; height:100%; object-fit:contain; display:block; }

        @media (max-width: 768px){
          :host{ --sidebar-w: 100%; }
          .card-body{
            grid-template-columns: 1fr;
            grid-template-areas:
              "search"
              "toolbar"
              "sidebar";
          }
          .content{ display:none !important; }
          .sidebar{ padding:8px 12px; }
          /* Constrain sidebar scroll area to roughly 12 items */
          .sidebar .os-host{ max-height: calc(12 * 42px + 24px) !important; }
          /* Narrower thumb on mobile */
          :host{ --thumb-w: calc(var(--switch-colW) - 6px); }
        }
      </style>

      <section class="section">
        <div class="card" id="card">
          <div class="card-body" id="cardBody">

            <!-- Row 1: Search + Placeholder (toggle moved to toolbar) -->
            <div class="search-row">
              <div class="searchbar" id="searchBar">
                <span class="search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="#8a8f98" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </span>
                <input id="topSearch" type="search" placeholder="Type to filter…" autocomplete="off" />
                <button class="search-clear" id="searchClear" title="Clear search" aria-label="Clear search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>

              <button class="fullscreen-btn" id="fullscreenBtn" type="button" title="Toggle fullscreen" aria-label="Toggle fullscreen"></button>
            </div>

            <!-- Row 2: Filters (wipe-in) -->
            <div class="toolbar">
              <div class="toolbar-wipe" id="toolbarWipe">
                <div class="filtersbar">
                  <div class="filters" id="filtersBlock" tabindex="-1">
                    <div class="filters-head">
                      <h4>Filters</h4>

                      <div id="headSlot" class="head-slot">
                        <button id="addFiltersPill" class="pill pill-placeholder pill--compact" type="button" title="Add filters">＋ Add filters</button>
                        <div id="selectedPills" class="selected-pills"></div>
                      </div>

                      <button class="filters-toggle" id="filtersToggle" aria-expanded="false" aria-controls="filtersWrap" title="Expand/collapse filters">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M7 10l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>

                    <div class="filter-wrap" id="filtersWrap">
                      <div class="filter-pills" id="filterPills" aria-label="Available filters"></div>
                    </div>
                  </div>
                  <div class="filters-right">
                    <button class="mode-toggle" id="modeToggle" type="button" role="switch" aria-checked="false" title="Toggle dark mode">
                      <div class="mode-thumb" aria-hidden="true"></div>
                      <span class="mode-label"><img class="mode-icon" src="https://raw.githubusercontent.com/amachinic/matthewahn.github.io/main/public/assets/Sun.svg" alt="Light" /></span>
                      <span class="mode-label"><img class="mode-icon" src="https://raw.githubusercontent.com/amachinic/matthewahn.github.io/main/public/assets/Moon.svg" alt="Dark" /></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Row 3: Sidebar + Content -->
            <aside class="sidebar" id="sidebar">
        <div class="os-host" id="resultsHost">
          <div class="results os-content" id="results"></div>
                <div class="os-scrollbar y"><div class="os-thumb"></div></div>
              </div>

              <!-- Mobile full-size viewer in sidebar bounds -->
              <div class="mobile-viewer" id="mobileViewer" aria-hidden="true">
                <button class="expander-close" id="mobileViewerClose" aria-label="Close">
                  <img class="close-icon" src="https://raw.githubusercontent.com/amachinic/matthewahn.github.io/main/public/assets/Close.svg" alt="Close" />
                </button>
                <img class="mobile-viewer-img" id="mobileViewerImg" alt="">
              </div>
            </aside>

            <section class="content" id="content">
              <div class="expander" id="expander">
                <button class="expander-close" id="expanderClose" aria-label="Close">
                  <img class="close-icon" src="https://raw.githubusercontent.com/amachinic/matthewahn.github.io/main/public/assets/Close.svg" alt="Close" />
                </button>
                <img class="expander-img" id="expanderImg" alt="">
              </div>

              <div class="os-host full" id="gridHost">
                <div class="grid os-content" id="grid" role="grid" aria-label="grid items"></div>
                <div class="os-scrollbar y"><div class="os-thumb"></div></div>
              </div>
            </section>

          </div>
        </div>
      </section>
    `;

    // ===== scoped helpers =====
    const $  = (sel) => root.querySelector(sel);
    const $$ = (sel) => Array.from(root.querySelectorAll(sel));

    // Elements
    const card = $('#card');
    const gridHost = $('#gridHost');
    const resultsHost = $('#resultsHost');
    const grid = $('#grid');
    const results = $('#results');

    const searchBar = $('#searchBar');
    const topSearch = $('#topSearch');
    const searchClear = $('#searchClear');

    const toolbarWipe = $('#toolbarWipe');
    const fullscreenBtn = $('#fullscreenBtn');
    // Insert fullscreen icon into button; allow override via host attribute
    try {
      if (fullscreenBtn && !fullscreenBtn.querySelector('img.fullscreen-icon')) {
        const iconUrl = root.host.getAttribute('fullscreen-icon') || 'https://raw.githubusercontent.com/amachinic/matthewahn.github.io/main/public/assets/Fullscreen.svg';
        const img = document.createElement('img');
        img.className = 'fullscreen-icon';
        img.alt = 'Fullscreen';
        img.decoding = 'async';
        img.loading = 'lazy';
        img.src = iconUrl;
        fullscreenBtn.appendChild(img);
      }
    } catch(_) {}

    const filtersBlock = $('#filtersBlock');
    const filtersToggle = $('#filtersToggle');
    const filtersWrap = $('#filtersWrap');
    const filterPillsEl = $('#filterPills');

    const selectedPills = $('#selectedPills');
    const addFiltersPill = $('#addFiltersPill');

    const modeToggle = $('#modeToggle');

    const mobileViewer = $('#mobileViewer');
    const mobileViewerImg = $('#mobileViewerImg');
    const mobileViewerClose = $('#mobileViewerClose');

    const expander = $('#expander');
    const expanderImg = $('#expanderImg');
    const expanderClose = $('#expanderClose');

    // ========= Fullscreen toggle =========
    function isNativeFullscreen(){
      const fe = document.fullscreenElement || document.webkitFullscreenElement;
      if(!fe) return false;
      try{
        const host = root.host;
        return fe === card || fe === host || fe.contains(card) || fe.contains(host);
      }catch(_){ return fe === card; }
    }
    function isClassFullscreen(){
      return card.classList.contains('is-fullscreen');
    }
    function isFullscreen(){ return isNativeFullscreen() || isClassFullscreen(); }
    function setButtonPressed(on){ try { fullscreenBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); } catch(_){} }

    let prevOverflow = '';
    function prepFlipToFullscreen(){
      const r = card.getBoundingClientRect();
      card.classList.add('fs-fixed','fs-animating');
      card.style.left = r.left + 'px';
      card.style.top = r.top + 'px';
      card.style.width = r.width + 'px';
      card.style.height = r.height + 'px';
    }
    function animateToViewport(){
      card.style.left = '0px';
      card.style.top = '0px';
      card.style.width = '100vw';
      card.style.height = '100vh';
    }
    function clearFlipStyles(){
      card.classList.remove('fs-animating','fs-fixed');
      card.style.left = card.style.top = card.style.width = card.style.height = '';
    }

    async function enterFullscreen(){
      try{
        prevOverflow = document.documentElement.style.overflow || '';
        document.documentElement.style.overflow = 'hidden';
      }catch(_){ }
      // If native fullscreen exists, do native; otherwise animate FLIP
      try{
        if(card.requestFullscreen || card.webkitRequestFullscreen){
          if(card.requestFullscreen){ await card.requestFullscreen(); }
          else if(card.webkitRequestFullscreen){ card.webkitRequestFullscreen(); }
        } else {
          prepFlipToFullscreen();
          // Next frame to ensure initial styles are applied
          requestAnimationFrame(()=>{ animateToViewport(); });
          // After transition completes, mark as fullscreen class for internal layout
          const onEnd = ()=>{ card.removeEventListener('transitionend', onEnd); card.classList.add('is-fullscreen'); clearFlipStyles(); };
          card.addEventListener('transitionend', onEnd);
        }
      }catch(_){
        // fallback to animated class-based fullscreen
        prepFlipToFullscreen();
        requestAnimationFrame(()=>{ animateToViewport(); });
        const onEnd = ()=>{ card.removeEventListener('transitionend', onEnd); card.classList.add('is-fullscreen'); clearFlipStyles(); };
        card.addEventListener('transitionend', onEnd);
      }
      setButtonPressed(true);
    }
    async function exitFullscreen(){
      const usingNative = isNativeFullscreen();
      if(usingNative){
        try{ if(document.exitFullscreen){ await document.exitFullscreen(); } else if(document.webkitExitFullscreen){ document.webkitExitFullscreen(); } }catch(_){ }
        try{ document.documentElement.style.overflow = prevOverflow; }catch(_){ }
        setButtonPressed(false);
        return;
      }
      // Animate back from class-based fullscreen
      try{
        // Set starting state at viewport
        card.classList.add('fs-fixed','fs-animating');
        card.style.left = '0px'; card.style.top = '0px'; card.style.width = '100vw'; card.style.height = '100vh';
        // Read original rect from host element location in page flow
        const placeholderRect = card.getBoundingClientRect();
        // Temporarily remove fullscreen to compute target rect in page flow
        card.classList.remove('is-fullscreen');
        const targetRect = card.getBoundingClientRect();
        // Re-apply fullscreen visuals instantly before animating to target
        card.classList.add('is-fullscreen');
        requestAnimationFrame(()=>{
          card.style.left = targetRect.left + 'px';
          card.style.top = targetRect.top + 'px';
          card.style.width = targetRect.width + 'px';
          card.style.height = targetRect.height + 'px';
        });
        const onEnd = ()=>{
          card.removeEventListener('transitionend', onEnd);
          card.classList.remove('is-fullscreen');
          clearFlipStyles();
          try{ document.documentElement.style.overflow = prevOverflow; }catch(_){ }
          setButtonPressed(false);
        };
        card.addEventListener('transitionend', onEnd);
      }catch(_){
        // Fallback: immediate class removal
        try{ card.classList.remove('is-fullscreen'); }catch(_){}
        clearFlipStyles();
        try{ document.documentElement.style.overflow = prevOverflow; }catch(_){ }
        setButtonPressed(false);
      }
    }
    function toggleFullscreen(){
      if(isFullscreen()){ exitFullscreen(); }
      else { enterFullscreen(); }
    }
    if(fullscreenBtn){ fullscreenBtn.addEventListener('click', toggleFullscreen); }

    // Keep button state in sync when user exits via Esc
    ['fullscreenchange','webkitfullscreenchange'].forEach(evt=>{
      document.addEventListener(evt, ()=>{
        // When exiting native fullscreen (via Esc or UI), restore scroll and pressed state
        const on = isFullscreen();
        if(!on){ try{ document.documentElement.style.overflow = prevOverflow; }catch(_){ } }
        setButtonPressed(on);
      });
    });

    // ========= Data =========
    const availableFilters = ['Architecture','Portrait','Nature','Abstract','Minimal','Urban','Macro','Night','Texture','Vibrant'];
    const items = Array.from({length:24}, (_,i)=>({
      id:i+1,
      src:`https://picsum.photos/seed/${700+i}/1600/1200`,
      title:`Item ${i+1}`,
      desc:'Sample description text to demonstrate list layout.',
      tags: (()=>{ const c=[...availableFilters]; c.sort(()=>Math.random()-0.5); return c.slice(0, Math.random()>0.5?2:1); })()
    }));

    // ========= Overlay Scrollbars =========
    function makeOverlayScrollbar(host){
      const content = host.querySelector('.os-content');
      const scrollbar = host.querySelector('.os-scrollbar.y');
      const thumb = scrollbar.querySelector('.os-thumb');
      let dragging=false, dragOffset=0, hideT;

      function refresh(){
        const ch = content.clientHeight, sh = content.scrollHeight;
        const trackH = scrollbar.clientHeight;
        const minThumb = 18;
        const thumbH = Math.max(minThumb, Math.round(trackH * (ch / Math.max(sh,1))));
        thumb.style.height = thumbH + 'px';
        update();
      }
      function update(){
        const ch = content.clientHeight, sh = content.scrollHeight, st = content.scrollTop;
        const trackH = scrollbar.clientHeight, th = thumb.offsetHeight;
        const maxTop = Math.max(trackH - th, 0);
        const top = sh <= ch ? 0 : Math.round(st / (sh - ch) * maxTop);
        thumb.style.transform = `translateY(${top}px)`;
        scrollbar.style.display = (sh <= ch) ? 'none' : 'block';
      }

      content.addEventListener('scroll', ()=>{
        host.classList.add('scrolling'); update();
        clearTimeout(hideT); hideT=setTimeout(()=>host.classList.remove('scrolling'), 700);
      });
      host.addEventListener('mouseenter', ()=>host.classList.add('hover'));
      host.addEventListener('mouseleave', ()=>host.classList.remove('hover'));

      function onMove(e){
        if(!dragging) return;
        const trackRect = scrollbar.getBoundingClientRect();
        const th = thumb.offsetHeight;
        let y = e.clientY - trackRect.top - dragOffset;
        y = Math.max(0, Math.min(y, trackRect.height - th));
        const ratio = y / Math.max(trackRect.height - th, 1);
        const sh = content.scrollHeight - content.clientHeight;
        content.scrollTop = ratio * sh;
      }
      function onUp(){ dragging=false; root.removeEventListener('mousemove', onMove); root.removeEventListener('mouseup', onUp); }

      thumb.addEventListener('mousedown',(e)=>{
        e.preventDefault(); dragging=true;
        const rect = thumb.getBoundingClientRect(); dragOffset = e.clientY - rect.top;
        root.addEventListener('mousemove', onMove); root.addEventListener('mouseup', onUp);
      });

      const ro = new ResizeObserver(()=>refresh());
      ro.observe(host); ro.observe(content);
      this._cleanup.push(()=>ro.disconnect());

      return { refresh, update };
    }
    // Initialize scrollbars only after initial population to avoid zero-height measurements
    let osGrid = null, osResults = null;
    // Ensure sidebar has a minimum height so it can display results at boot
    try { if (resultsHost && !resultsHost.style.minHeight) resultsHost.style.minHeight = '240px'; } catch(_){ }

    // ========= Keywords / Pills =========
    const keywords = new Map(); // norm -> raw
    const escapeHtml = s => s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));

    const addKeyword = (raw)=>{
      const norm = (raw||'').trim().toLowerCase(); if(!norm) return;
      if(!keywords.has(norm)) keywords.set(norm, raw.trim());
      renderSelectedPills(); renderFilterOptions(); applyFilter(); pulseOpen();
    };
    const removeKeyword = (norm)=>{
      if(!keywords.has(norm)) return;
      keywords.delete(norm);
      renderSelectedPills(); renderFilterOptions(); applyFilter(); pulseOpen();
    };
    function pillButton(raw, norm){
      const btn = document.createElement('button');
      btn.type='button'; btn.className='pill pill--compact';
      btn.innerHTML = `<span>${escapeHtml(raw)}</span><span class="x" aria-hidden="true">×</span>`;
      btn.title = `Remove "${raw}"`;
      btn.addEventListener('click', ()=>removeKeyword(norm));
      return btn;
    }
    function renderSelectedPills(){
      selectedPills.innerHTML = '';
      const entries = [...keywords.entries()];
      const hasAny = entries.length > 0;
      addFiltersPill.style.display = hasAny ? 'none' : '';
      if(!hasAny) return;
      for(const [norm, raw] of entries){
        selectedPills.appendChild(pillButton(raw, norm));
      }
      updateOpenState();
    }

    // Public integration: respond to external events to drive sidebar list
    root.host.addEventListener('archive:addKeyword', (e)=>{
      const kw = (e && e.detail && e.detail.keyword) ? String(e.detail.keyword) : '';
      if(kw) addKeyword(kw);
    });
    root.host.addEventListener('archive:setKeywords', (e)=>{
      const arr = (e && e.detail && Array.isArray(e.detail.keywords)) ? e.detail.keywords : [];
      keywords.clear();
      for(const raw of arr){ addKeyword(raw); }
      renderSelectedPills(); renderFilterOptions(); applyFilter();
    });
    root.host.addEventListener('archive:clearKeywords', ()=>{
      keywords.clear(); renderSelectedPills(); renderFilterOptions(); applyFilter();
    });
    root.host.addEventListener('archive:openFilters', ()=>{
      try { setFiltersExpanded(true); openToolbar(); } catch(_){ }
    });
    function renderFilterOptions(){
      filterPillsEl.innerHTML = '';
      availableFilters.forEach(label=>{
        const norm = label.toLowerCase();
        const btn = document.createElement('button');
        btn.type='button';
        btn.className = 'option-pill' + (keywords.has(norm) ? ' is-selected' : '');
        btn.textContent = label;
        btn.addEventListener('click', ()=>{
          if(keywords.has(norm)) removeKeyword(norm);
          else addKeyword(label);
        });
        filterPillsEl.appendChild(btn);
      });
    }

    // ========= Inner filters expand/collapse =========
    function setFiltersExpanded(expanded){
      filtersToggle.setAttribute('aria-expanded', String(expanded));
      const currentHeight = filtersWrap.scrollHeight;

      if(expanded){
        filtersBlock.classList.remove('filters--collapsing');
        filtersBlock.classList.add('filters--expanded');

        filtersWrap.style.display = 'block';
        filtersWrap.style.overflow = 'hidden';
        filtersWrap.style.height = '0px';

        requestAnimationFrame(()=>{
          const h = filtersWrap.scrollHeight || currentHeight;
          filtersWrap.style.height = h + 'px';
        });
      } else {
        filtersBlock.classList.remove('filters--expanded');
        filtersBlock.classList.add('filters--collapsing');

        const h = filtersWrap.scrollHeight || currentHeight;
        filtersWrap.style.overflow = 'hidden';
        filtersWrap.style.height = h + 'px';
        requestAnimationFrame(()=>{ filtersWrap.style.height = '0px'; });
      }
    }
    filtersWrap.addEventListener('transitionend', (e)=>{
      if(e.propertyName !== 'height') return;
      const expanded = filtersToggle.getAttribute('aria-expanded') === 'true';
      if(expanded){
        filtersWrap.style.height = 'auto';
        filtersWrap.style.overflow = 'visible';
      } else {
        filtersBlock.classList.remove('filters--collapsing');
        filtersWrap.style.display = 'block';
      }
    });
    filtersToggle.addEventListener('click', ()=>{
      const expanded = filtersToggle.getAttribute('aria-expanded')==='true';
      setFiltersExpanded(!expanded);
    });
    addFiltersPill.addEventListener('click', ()=>{
      setFiltersExpanded(true); pulseOpen();
      filtersBlock.style.boxShadow='0 0 0 3px rgba(241,181,0,.25), 0 10px 28px rgba(0,0,0,.12)';
      setTimeout(()=>filtersBlock.style.boxShadow='none', 240);
    });

    // ========= Wipe controller (toolbar row) =========
    function openToolbar(){
      if(toolbarWipe.classList.contains('is-open')) return;
      toolbarWipe.classList.remove('is-closing');
      const inner = toolbarWipe.firstElementChild;
      toolbarWipe.style.height = '0px';
      void toolbarWipe.offsetHeight;
      toolbarWipe.classList.add('is-open');
      const target = inner.scrollHeight;
      toolbarWipe.style.height = target + 'px';
    }
    function closeToolbar(){
      if(!toolbarWipe.classList.contains('is-open')) return;
      const inner = toolbarWipe.firstElementChild;
      const current = inner.getBoundingClientRect().height || inner.scrollHeight;
      toolbarWipe.classList.add('is-closing');
      toolbarWipe.style.height = current + 'px';
      requestAnimationFrame(()=>{
        toolbarWipe.classList.remove('is-open');
        toolbarWipe.style.height = '0px';
      });
    }
    toolbarWipe.addEventListener('transitionend', (e)=>{
      if(e.propertyName !== 'height') return;
      if(toolbarWipe.classList.contains('is-open')){
        toolbarWipe.style.height = 'auto';
      } else {
        toolbarWipe.classList.remove('is-closing');
      }
    });

    // ========= Matrix =========
    let searchFocus = false;
    let filtersFocus = false;
    let filtersHover = false;
    let modeHover = false;
    let modeFocus = false;
    let selectionPulse = false;
    let pulseT;

    let filtersPinnedOpen = false;
    const hasSelections = ()=> keywords.size > 0;
    const pulseOpen = (ms=1200)=>{
      selectionPulse = true; updateOpenState();
      clearTimeout(pulseT); pulseT = setTimeout(()=>{ selectionPulse=false; updateOpenState(); }, ms);
      this._cleanup.push(()=>clearTimeout(pulseT));
    };
    const computeOpen = ()=>{
      if(hasSelections()) return true;
      return searchFocus || filtersFocus || filtersHover || modeHover || modeFocus || selectionPulse;
    };
    const updateOpenState = ()=>{
      const open = computeOpen() || filtersPinnedOpen;
      if(open){ openToolbar(); } else { closeToolbar(); }
    };

    // Focus within
    searchBar.addEventListener('focusin', ()=>{ searchFocus = true; updateOpenState(); });
    searchBar.addEventListener('focusout', (e)=>{
      if(!searchBar.contains(e.relatedTarget)){ searchFocus = false; updateOpenState(); }
    });
    filtersBlock.addEventListener('focusin', ()=>{ filtersFocus = true; updateOpenState(); });
    filtersBlock.addEventListener('focusout', (e)=>{
      if(!filtersBlock.contains(e.relatedTarget)){ filtersFocus = false; updateOpenState(); }
    });
    filtersBlock.addEventListener('mouseenter', ()=>{ filtersHover = true; updateOpenState(); });
    filtersBlock.addEventListener('mouseleave', ()=>{ filtersHover = false; updateOpenState(); });

    // Click outside (relative to shadow root)
    root.addEventListener('pointerdown', (e)=>{
      const insideSearch = searchBar.contains(e.target);
      const insideFilters = filtersBlock.contains(e.target);
      const insideMode = modeToggle && modeToggle.contains(e.target);
      if(!insideSearch && !insideFilters && !insideMode && !hasSelections() && !filtersPinnedOpen){
        searchFocus = false; filtersFocus = false; filtersHover = false; selectionPulse = false;
        updateOpenState();
      }
    });

    // Keep filters open while hovering/focusing the mode toggle
    if (modeToggle) {
      modeToggle.addEventListener('mouseenter', ()=>{ modeHover = true; updateOpenState(); });
      modeToggle.addEventListener('mouseleave', ()=>{ modeHover = false; updateOpenState(); });
      modeToggle.addEventListener('focusin', ()=>{ modeFocus = true; updateOpenState(); });
      modeToggle.addEventListener('focusout', ()=>{ modeFocus = false; updateOpenState(); });
    }

    // ========= Live search =========
    let searchQuery = '';
    const updateClearBtn = ()=>{
      const has = (topSearch.value||'').trim().length>0;
      searchBar.classList.toggle('has-value', has);
    };
    const handleClear = ()=>{
      topSearch.value=''; searchQuery=''; updateClearBtn(); topSearch.focus(); applyFilter();
    };
    topSearch.addEventListener('input', ()=>{
      searchQuery = topSearch.value || '';
      updateClearBtn(); applyFilter();
    });
    searchClear.addEventListener('pointerdown', (e)=>{ e.preventDefault(); handleClear(); });
    searchClear.addEventListener('mousedown', (e)=>{ e.preventDefault(); handleClear(); });
    searchClear.addEventListener('click', (e)=>{ e.preventDefault(); handleClear(); });

    // ========= Sync Filters width to Search =========
    const syncFiltersWidth = ()=>{
      const w = Math.round(searchBar.getBoundingClientRect().width);
      if(w>0) card.style.setProperty('--filters-w', w + 'px');
    };
    const roSearch = new ResizeObserver(syncFiltersWidth);
    roSearch.observe(searchBar);
    window.addEventListener('resize', syncFiltersWidth);
    this._cleanup.push(()=>{ roSearch.disconnect(); window.removeEventListener('resize', syncFiltersWidth); });

    // Sync mode toggle height to filters block height
    const syncFiltersHeight = ()=>{
      try{
        const h = Math.round(filtersBlock.getBoundingClientRect().height);
        if(h>0) card.style.setProperty('--filters-h', h + 'px');
      }catch(_){ }
    };
    const roFilters = new ResizeObserver(syncFiltersHeight);
    try{ roFilters.observe(filtersBlock); }catch(_){ }
    window.addEventListener('resize', syncFiltersHeight);
    this._cleanup.push(()=>{ try{ roFilters.disconnect(); }catch(_){ } window.removeEventListener('resize', syncFiltersHeight); });

    // ========= Filtering =========
    function scoreForQuery(it, q, rex){
      const title=(it.title||''), desc=(it.desc||''), tags=(it.tags||[]).join(' ');
      if(rex){
        const mt=title.match(rex), mtag=tags.match(rex), md=desc.match(rex);
        if(mt) return [0, mt.index??0, title];
        if(mtag) return [1, mtag.index??0, title];
        if(md) return [1, md.index??0, title];
        return [9, 9999, title];
      }else{
        const ql=q.toLowerCase();
        const ti=title.toLowerCase().indexOf(ql);
        const tg=tags.toLowerCase().indexOf(ql);
        const de=desc.toLowerCase().indexOf(ql);
        if(ti>=0) return [0, ti, title];
        if(tg>=0) return [1, tg, title];
        if(de>=0) return [1, de, title];
        return [9, 9999, title];
      }
    }
    function filterAndSortData(){
      const norms=[...keywords.keys()];
      let data = norms.length
        ? items.filter(it=>{
            const hay = `${(it.title||'')} ${(it.desc||'')} ${(it.tags||[]).join(' ')}`.toLowerCase();
            return norms.every(kw=>hay.includes(kw));
          })
        : [...items];

      const q=(searchQuery||'').trim();
      if(!q){ data.sort((a,b)=>(a.title||'').localeCompare(b.title||'')); return data; }

      let rex=null; try{ rex=new RegExp(q,'i'); }catch(e){ rex=null; }
      data = data.filter(it=>{ const [bucket]=scoreForQuery(it,q,rex); return bucket!==9; });
      data.sort((a,b)=>{ const sa=scoreForQuery(a,q,rex), sb=scoreForQuery(b,q,rex);
        return sa[0]-sb[0] || sa[1]-sb[1] || sa[2].localeCompare(sb[2]); });
      return data;
    }

    // ========= Lazy loader =========
    const EAGER_FIRST_N = 6;
    let imgObserver = null;
    let refreshQueued = false;
    let scrollHooksInstalled = false;

    const getScrollRoot = ()=>{
      const rootEl = gridHost?.querySelector('.os-content') || grid;
      return rootEl || null;
    };
    const queueRefresh = ()=>{
      if(refreshQueued) return;
      refreshQueued = true;
      requestAnimationFrame(()=>{
        try {
          if (osGrid && typeof osGrid.refresh === 'function') osGrid.refresh();
        } catch(_) { }
        refreshQueued = false;
      });
    };
    const loadImage = async (img, src)=>{
      if(img.dataset.loaded) return;
      img.addEventListener('load', ()=>{ img.classList.add('is-loaded'); const p=img.closest('.item'); if(p) p.classList.remove('loading'); queueRefresh(); }, { once:true });
      img.addEventListener('error', ()=>{ const p=img.closest('.item'); if(p) p.classList.remove('loading'); img.classList.add('is-loaded'); }, { once:true });
      img.src = src;
      try { if('decode' in img) await img.decode(); } catch(e) {}
      img.classList.add('is-loaded');
      img.dataset.loaded = '1';
      const parent = img.closest('.item'); if(parent) parent.classList.remove('loading');
      queueRefresh();
    };
    const isVisibleInRoot = (el, rootEl)=>{
      const r = rootEl || root.host.getRootNode().host || document.documentElement;
      const rb = (r.getBoundingClientRect ? r : document.documentElement).getBoundingClientRect();
      const eb = el.getBoundingClientRect();
      return !(eb.right < rb.left || eb.left > rb.right || eb.bottom < rb.top || eb.top > rb.bottom);
    };
    const throttle = (fn, wait)=>{
      let t=0, lastArgs=null;
      return function(...args){
        lastArgs=args;
        if(t) return;
        t=setTimeout(()=>{ t=0; fn.apply(null, lastArgs); }, wait);
      };
    };
    const kickstartLazyLoad = ()=>{
      const rootEl = getScrollRoot();
      const thumbs = [...root.querySelectorAll('img.thumb')].filter(img => !img.getAttribute('src'));
      let loaded = 0;
      for(const img of thumbs){
        if(loaded < EAGER_FIRST_N || isVisibleInRoot(img, rootEl)){
          loadImage(img, img.dataset.src);
          loaded++;
        }
      }
    };
    const setupObserver = ()=>{
      if(imgObserver) imgObserver.disconnect();
      const rootEl = getScrollRoot();
      try{
        imgObserver = new IntersectionObserver((entries)=>{
          for(const entry of entries){
            if(entry.isIntersecting){
              const img = entry.target;
              imgObserver.unobserve(img);
              loadImage(img, img.dataset.src);
            }
          }
        }, { root: rootEl, rootMargin: '300px 0px', threshold: 0.01 });
      }catch(e){
        imgObserver = null;
      }
      setTimeout(kickstartLazyLoad, 0);
      setTimeout(kickstartLazyLoad, 300);
    };

    // ========= Grid & list builders =========
    function gridItemEl(d){
      const el=document.createElement('article'); el.className='item loading fade-in'; el.dataset.id=d.id;
      const img=document.createElement('img'); img.className='thumb';
      img.alt=d.title||`Image ${d.id}`; img.loading='lazy'; img.decoding='async'; img.dataset.src=d.src;
      el.append(img);
      el.addEventListener('click',()=>{
        try{
          el.classList.remove('select-flash');
          void el.offsetWidth; // restart animation
          el.classList.add('select-flash');
          setTimeout(()=>el.classList.remove('select-flash'), 700);
        }catch(_){ }
        openExpander(d);
      });
      return el;
    }
    function applySpansToGrid(gridEl){
      const COLS=4;
      const MOSAIC_PATTERNS=[
        {w:1,h:1,weight:58},{w:2,h:1,weight:14},{w:1,h:2,weight:12},
        {w:2,h:2,weight:10},{w:3,h:1,weight:4},{w:1,h:3,weight:2}
      ];
      const total = MOSAIC_PATTERNS.reduce((a,p)=>a+p.weight,0);
      function pick(){ let r=Math.random()*total; for(const p of MOSAIC_PATTERNS){ if((r-=p.weight)<=0) return p; } return MOSAIC_PATTERNS[0]; }
      const spans=[...gridEl.children].map(()=>{ let {w,h}=pick(); if(w>COLS) w=COLS; return {w,h}; });
      [...gridEl.children].forEach((child,idx)=>{ const s=spans[idx];
        child.style.gridColumn=`span ${s.w}`; child.style.gridRow=`span ${s.h}`;
        child.dataset.w=s.w; child.dataset.h=s.h; });
    }

    // Staggered fade-up animation: top-to-bottom, then left-to-right
    function triggerStagger(){
      try{
        const items = Array.from(grid.children);
        if(!items.length) return;
        const withPos = items.map((el, idx)=>{ const r=el.getBoundingClientRect(); return { el, idx, top:r.top, left:r.left }; });
        withPos.sort((a,b)=> a.top - b.top || a.left - b.left || a.idx - b.idx);
        grid.classList.add('staggering');
        withPos.forEach((it,i)=>{
          const delay = 60 * i;
          it.el.style.setProperty('--stagger-delay', delay + 'ms');
          it.el.classList.add('stagger-in');
        });
        const total = 60 * withPos.length + 700;
        setTimeout(()=>{ grid.classList.remove('staggering'); items.forEach(el=>el.classList.remove('stagger-in')); }, total);
      }catch(_){ }
    }
    let lastDataRef = null;
    function buildGrid(data){
      grid.innerHTML='';
      data.forEach(it=>grid.appendChild(gridItemEl(it)));
      applySpansToGrid(grid);
      setupObserver();
      observeNewImages(grid);
      requestAnimationFrame(()=>{
        try { if (osGrid && typeof osGrid.refresh === 'function') osGrid.refresh(); } catch(_) { }
      });
      // Apply consistent fade-in order on initial build too
      try{
        const items = Array.from(grid.children);
        const withPos = items.map((el, idx)=>{ const r=el.getBoundingClientRect(); return { el, idx, top:r.top, left:r.left }; });
        withPos.sort((a,b)=> a.top - b.top || a.left - b.left || a.idx - b.idx);
        withPos.forEach((it,i)=>{ it.el.style.setProperty('--stagger-delay', (60*i)+'ms'); });
      }catch(_){ }
      lastDataRef = data;
      ensureResultsSynced(data);
      // Defer to next frame to ensure layout is ready before measuring positions for stagger order
      requestAnimationFrame(()=>{ triggerStagger(); });
    }
    function observeNewImages(scope){
      const imgs = scope.querySelectorAll('img.thumb');
      if(imgObserver){
        imgs.forEach(img=>{
          if(img.dataset.loaded === '1') return;
          imgObserver.observe(img);
        });
      } else {
        imgs.forEach(img => { if(!img.getAttribute('src')) loadImage(img, img.dataset.src); });
      }
      if(!scrollHooksInstalled){
        const rootEl = getScrollRoot() || window;
        const onScrollOrResize = throttle(kickstartLazyLoad, 120);
        (rootEl.addEventListener ? rootEl : window).addEventListener('scroll', onScrollOrResize);
        window.addEventListener('resize', onScrollOrResize);
        document.addEventListener('visibilitychange', kickstartLazyLoad);
        scrollHooksInstalled = true;
        this._cleanup.push(()=>{
          (rootEl.removeEventListener ? rootEl : window).removeEventListener('scroll', onScrollOrResize);
          window.removeEventListener('resize', onScrollOrResize);
          document.removeEventListener('visibilitychange', kickstartLazyLoad);
        });
      }
    }
    function buildResults(data){
      if(!results) return;
      results.innerHTML='';
      const list = (Array.isArray(data) && data.length) ? data : items;
      // Ensure the host is visible and has space before populating
      try{
        resultsHost.style.removeProperty('display');
        resultsHost.style.minHeight = resultsHost.style.minHeight || '240px';
      }catch(_){ }
      list.slice(0,20).forEach(it=>results.appendChild(resultEl(it)));
      // No static fallbacks; results are driven by items array
      try{ osResults.refresh(); }catch(_){ }
      try{ resultsHost.classList.add('has-results'); }catch(_){ }
    }

    function ensureResultsSynced(data){
      try{
        const source = (Array.isArray(data) && data.length) ? data : items;
        const want = Math.min(source.length, 60);
        const have = results ? results.children.length : 0;
        if (have !== want) buildResults(source);
      }catch(_){ }
    }

    // Retry loop to guarantee initial population regardless of layout timing
    function ensureInitialRender(attempts=8, delay=100){
      if(results && results.childElementCount>0) return;
      try { applyFilter(); } catch(_){ }
      if(attempts>1){ setTimeout(()=>ensureInitialRender(attempts-1, delay), delay); }
    }
    function resultEl(d){
      const el=document.createElement('div'); el.className='result-item'; el.title=d.title||'';
      const meta=document.createElement('div'); meta.className='meta';
      const t=document.createElement('div'); t.className='title'; t.textContent=d.title||`Item #${d.id}`;
      const p=document.createElement('div'); p.className='desc'; p.textContent=d.desc||'';
      meta.append(t,p); el.append(meta);
      el.addEventListener('click',()=>{
        if(window.matchMedia('(max-width: 768px)').matches) openMobileViewer(d);
        else openExpander(d);
      });
      return el;
    }
    function applyFilter(){ const data=filterAndSortData(); buildGrid(data); buildResults(data); }
    // Expose refresh hook for host
    this._applyFilter = applyFilter;

    // ========= Desktop expander =========
    function openExpander(d){
      expander.classList.add('open'); expanderImg.style.opacity='0';
      expanderImg.onload=()=>{ expanderImg.style.opacity='1'; };
      expanderImg.src=d.src; expanderImg.alt=d.title||'';
    }
    function closeExpander(){ expander.classList.remove('open'); expanderImg.removeAttribute('src'); expanderImg.removeAttribute('alt'); }
    expanderClose.addEventListener('click', closeExpander);
    expander.addEventListener('click', e=>{ if(e.target===expander) closeExpander(); });

    // ========= Mobile viewer =========
    function openMobileViewer(d){
      mobileViewerImg.style.opacity='0';
      mobileViewerImg.onload = ()=>{ mobileViewerImg.style.opacity='1'; };
      mobileViewerImg.src = d.src;
      mobileViewerImg.alt = d.title || '';
      mobileViewer.classList.add('open');
      mobileViewer.setAttribute('aria-hidden','false');
    }
    function closeMobileViewer(){
      mobileViewer.classList.remove('open');
      mobileViewer.setAttribute('aria-hidden','true');
      mobileViewerImg.removeAttribute('src');
      mobileViewerImg.removeAttribute('alt');
    }
    mobileViewerClose.addEventListener('click', closeMobileViewer);
    mobileViewer.addEventListener('click', e=>{ if(e.target===mobileViewer) closeMobileViewer(); });

    // Close overlays with Escape
    const onEsc = (e)=>{
      if(e.key==='Escape'){
        if(mobileViewer.classList.contains('open')) closeMobileViewer();
        if(expander.classList.contains('open')) closeExpander();
      }
    };
    window.addEventListener('keydown', onEsc);
    this._cleanup.push(()=>window.removeEventListener('keydown', onEsc));

    // If resizing from mobile -> desktop while viewer open, close the mobile viewer
    const onResizeViewer = ()=>{
      if(!window.matchMedia('(max-width: 768px)').matches && mobileViewer.classList.contains('open')) closeMobileViewer();
    };
    window.addEventListener('resize', onResizeViewer);
    this._cleanup.push(()=>window.removeEventListener('resize', onResizeViewer));

    // ========= Dark mode =========
    const MODE_KEY='gallery:dark';
    function applyMode(isDark){
      card.classList.toggle('dark', isDark);
      modeToggle.setAttribute('aria-checked', String(isDark));
      try{ localStorage.setItem(MODE_KEY, isDark?'1':'0'); }catch(_){ }
    }
    modeToggle.addEventListener('click', ()=>{
      const isDark=!card.classList.contains('dark'); applyMode(isDark);
    });
    (function bootMode(){
      let saved=null; try{ saved=localStorage.getItem(MODE_KEY); }catch(_){ }
      const preferDark=window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      applyMode(saved==='1' || (saved===null && preferDark));
    })();

    // ========= Boot =========
    (function boot(){
      renderFilterOptions(); renderSelectedPills(); updateClearBtn();
      // 1) Render sidebar first (cap to 20) and grid immediately from full dataset
      try { buildResults(items); } catch(_){ }
      try { buildGrid(items); } catch(_){ }
      // 2) Attach overlay scrollbars AFTER content exists, then run filter once
      requestAnimationFrame(()=>{
        try { osGrid = makeOverlayScrollbar.call(this, gridHost); } catch(_){ }
        try { osResults = makeOverlayScrollbar.call(this, resultsHost); } catch(_){ }
        try { applyFilter(); } catch(_){ }
        try { syncFiltersWidth(); } catch(_){ }
      });
      // 3) Restore interactive sliding behavior (no permanent pin)
      try {
        filtersPinnedOpen = false;
        setFiltersExpanded(false);
        closeToolbar();
      } catch(_){ }
    })();

    // keep refs for cleanup
    this._state = { roSearch };
  }

  connectedCallback(){
    try { console.log('[gallery-archive] connected'); } catch (_) {}
    // Re-apply filter to guarantee sidebar results are populated on attach
    try { const fn = this._applyFilter; if (typeof fn === 'function') setTimeout(()=>fn(), 0); } catch(_){ }
    // External refresh hook
    this.addEventListener('archive:refresh', ()=>{ try { const fn = this._applyFilter; if (typeof fn === 'function') fn(); } catch(_){ } });
  }

  disconnectedCallback(){
    // Cleanup observers & listeners
    try{
      (this._cleanup || []).forEach(fn => { try{ fn(); }catch(_){ } });
    }catch(_){ }
  }
}

if (!customElements.get('gallery-archive')) {
  customElements.define('gallery-archive', GalleryArchive);
}


