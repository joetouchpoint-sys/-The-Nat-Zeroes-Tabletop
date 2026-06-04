/* CAMPAIGN LOG — horizontal timeline + session recaps merged */
(function () {
  var useState = React.useState;
  var useContext = React.useContext;
  var useEffect = React.useEffect;
  var useRef = React.useRef;
  var Icon = window.Icon;
  var Modal = window.NZUI.Modal;

  // ── Colours ──────────────────────────────────────────────────────────────
  var GOLD  = "var(--gold)";
  var GOLD2 = "var(--gold-bright)";
  var DIM   = "var(--ink-dim)";
  var SOFT  = "var(--ink-soft)";

  // ── Helper: blank gap template ────────────────────────────────────────────
  function blankGap() { return { time: "", events: [] }; }

  // ── RecapModal (add/edit a session) ──────────────────────────────────────
  function RecapModal(props) {
    var open = props.open, initial = props.initial, onClose = props.onClose, onSave = props.onSave;
    var fState = useState(initial || { title: "", date: "", body: "", tags: "" });
    var f = fState[0], setF = fState[1];
    useEffect(function() { if (open) setF(initial ? Object.assign({}, initial, { tags: (initial.tags || []).join(", ") }) : { title: "", date: "", body: "", tags: "" }); }, [open]);
    function up(k, v) { setF(function(x) { return Object.assign({}, x, { [k]: v }); }); }
    var isEdit = initial && initial.id;
    return React.createElement(Modal, { open: open, onClose: onClose, title: isEdit ? "Edit Session" : "Add Session", w: 560 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Session title"), React.createElement("input", { className: "input", value: f.title, onChange: function(e) { up("title", e.target.value); }, placeholder: "e.g. The Counting House Heist", autoFocus: true })),
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Date"), React.createElement("input", { className: "input", value: f.date, onChange: function(e) { up("date", e.target.value); }, placeholder: "e.g. 13 Jun 2026" })),
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Recap"), React.createElement("textarea", { className: "input", rows: 5, value: f.body, onChange: function(e) { up("body", e.target.value); }, style: { resize: "vertical" }, placeholder: "What happened this session..." })),
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Tags (comma-separated)"), React.createElement("input", { className: "input", value: f.tags, onChange: function(e) { up("tags", e.target.value); }, placeholder: "Combat, TPK avoided, Nat 1 of the night" })),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", disabled: !f.title, onClick: function() { onSave(Object.assign({}, initial, { title: f.title, date: f.date, body: f.body, tags: (f.tags || "").split(",").map(function(t) { return t.trim(); }).filter(Boolean) })); } }, isEdit ? "Save" : "Add session"))));
  }

  // ── GapModal (add/edit gap between two sessions) ─────────────────────────
  function GapModal(props) {
    var open = props.open, initial = props.initial, onClose = props.onClose, onSave = props.onSave;
    var timeState = useState(initial && initial.time ? initial.time : "");
    var time = timeState[0], setTime = timeState[1];
    var evtsState = useState(initial && initial.events ? initial.events : []);
    var evts = evtsState[0], setEvts = evtsState[1];
    var newEvtState = useState(""); var newEvt = newEvtState[0], setNewEvt = newEvtState[1];
    useEffect(function() { if (open) { setTime(initial && initial.time ? initial.time : ""); setEvts(initial && initial.events ? initial.events : []); setNewEvt(""); } }, [open]);
    function addEvt() { if (!newEvt.trim()) return; setEvts(function(e) { return e.concat([{ id: "ev" + Date.now(), title: newEvt.trim() }]); }); setNewEvt(""); }
    function delEvt(id) { setEvts(function(e) { return e.filter(function(x) { return x.id !== id; }); }); }
    return React.createElement(Modal, { open: open, onClose: onClose, title: "Time Gap & Events", sub: "What happened between sessions?", w: 480 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Time elapsed"), React.createElement("input", { className: "input", value: time, onChange: function(e) { setTime(e.target.value); }, placeholder: "e.g. 3 days · 1 week · same evening", autoFocus: true })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Events between sessions"),
          React.createElement("div", { style: { display: "flex", gap: 6, marginBottom: 8 } },
            React.createElement("input", { className: "input", value: newEvt, onChange: function(e) { setNewEvt(e.target.value); }, placeholder: "Travel to Counting House…", onKeyDown: function(e) { if (e.key === "Enter") addEvt(); }, style: { flex: 1 } }),
            React.createElement("button", { className: "btn primary sm", onClick: addEvt }, "+")),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5 } },
            evts.map(function(ev) { return React.createElement("div", { key: ev.id, style: { display: "flex", alignItems: "center", gap: 8, background: "var(--surface)", borderRadius: 7, padding: "6px 10px" } },
              React.createElement("span", { style: { fontSize: 12, color: SOFT, flex: 1 } }, ev.title),
              React.createElement("button", { onClick: function() { delEvt(ev.id); }, style: { background: "none", border: "none", color: "var(--red-bright)", cursor: "pointer", fontSize: 13 } }, "✕")); }))),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", onClick: function() { onSave({ time: time, events: evts }); } }, "Save"))));
  }

  // ── SessionNode (individual session on the timeline) ─────────────────────
  var CIRCLE = 52; // circle diameter
  var PAD_TOP = 68; // space above circle — keeps circle visually centred on the line

  function SessionNode(props) {
    var recap = props.recap, num = props.num, isDM = props.isDM;
    var onEdit = props.onEdit, onDelete = props.onDelete, onEditGap = props.onEditGap;
    var gap = props.gap;
    var expandState = useState(false); var expanded = expandState[0], setExpanded = expandState[1];
    var isFirst = props.isFirst;
    return React.createElement("div", { style: { display: "flex", alignItems: "flex-start", flex: "none" } },
      // Gap connector — always rendered; first = short |---- cap, others = full connector with labels
      React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: isFirst ? 44 : 90, paddingTop: PAD_TOP + CIRCLE/2 - 1, flex: "none" } },
        isFirst
          // |---- start cap: vertical tick + horizontal line
          ? React.createElement("div", { style: { position: "relative", width: "100%", height: 3 } },
              React.createElement("div", { style: { position: "absolute", left: 0, top: -7, width: 3, height: 17, background: "var(--gold-deep)", borderRadius: "2px 2px 0 0" } }),
              React.createElement("div", { style: { position: "absolute", left: 0, top: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--gold-deep), var(--gold-bright))" } }))
          : React.createElement("div", { style: { width: "100%", height: 3, background: "linear-gradient(90deg, var(--gold-deep), var(--gold-bright), var(--gold-deep))", flexShrink: 0 } }),
        !isFirst && React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 8, zIndex: 2 } },
          gap && gap.time && React.createElement("div", { style: { fontSize: 10, fontFamily: "var(--mono)", color: DIM, background: "var(--bg-2)", border: "1px solid var(--hair)", borderRadius: 100, padding: "2px 9px", whiteSpace: "nowrap", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" } }, gap.time),
          gap && (gap.events || []).map(function(ev) { return React.createElement("div", { key: ev.id, style: { fontSize: 10, color: SOFT, background: "var(--surface)", borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap", maxWidth: 95, overflow: "hidden", textOverflow: "ellipsis" } }, "· " + ev.title); }),
          isDM && React.createElement("button", { onClick: onEditGap, title: "Edit gap/events", style: { background: "none", border: "none", cursor: "pointer", color: DIM, fontSize: 13, marginTop: 2, opacity: 0.7 } }, "✎"))),
      // Session node
      React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", width: 220, flex: "none", paddingTop: PAD_TOP } },
        // Circle
        React.createElement("div", { style: { position: "relative", zIndex: 2 } },
          React.createElement("button", { onClick: function() { setExpanded(function(x) { return !x; }); },
            style: { width: CIRCLE, height: CIRCLE, borderRadius: "50%",
              border: "3px solid var(--gold)",
              background: expanded
                ? "radial-gradient(circle at 32% 28%, var(--gold-bright), #b8820a)"
                : "radial-gradient(circle at 32% 28%, var(--gold-bright), var(--gold-deep))",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: expanded
                ? "0 0 0 6px rgba(232,181,74,0.28), 0 0 0 10px rgba(232,181,74,0.1), 0 8px 24px rgba(0,0,0,0.5)"
                : "0 0 0 3px rgba(232,181,74,0.18), 0 6px 20px rgba(0,0,0,0.38)",
              fontFamily: "var(--display)", fontWeight: 900, fontSize: 17, color: "#2a1d05",
              transition: "box-shadow 0.2s ease, background 0.2s ease" } },
            num),
          isDM && React.createElement("div", { style: { position: "absolute", top: -10, right: -10, display: "flex", gap: 3 } },
            React.createElement("button", { onClick: onEdit, title: "Edit session", style: { width: 22, height: 22, borderRadius: "50%", border: "1px solid var(--hair)", background: "var(--surface-2)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", color: DIM, boxShadow: "0 2px 6px rgba(0,0,0,0.3)" } }, "✏"),
            React.createElement("button", { onClick: onDelete, title: "Delete session", style: { width: 22, height: 22, borderRadius: "50%", border: "1px solid var(--hair)", background: "var(--surface-2)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red-bright)", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" } }, "✕"))),
        // Session info below circle
        React.createElement("div", { style: { padding: "13px 8px 0", textAlign: "center", width: "100%" } },
          React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 14.5, color: GOLD2, lineHeight: 1.22, marginBottom: 5, cursor: "pointer" },
            onClick: function() { setExpanded(function(x) { return !x; }); } }, recap.title || "Untitled"),
          recap.date && React.createElement("div", { style: { fontSize: 11, color: DIM, marginBottom: 6, fontFamily: "var(--mono)" } }, recap.date),
          React.createElement("div", { style: { display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" } },
            (recap.tags || []).slice(0, 2).map(function(t) { return React.createElement("span", { key: t, style: { fontSize: 10, background: "rgba(232,181,74,0.14)", border: "1px solid rgba(232,181,74,0.3)", borderRadius: 100, padding: "2px 7px", color: "var(--gold-deep)", whiteSpace: "nowrap" } }, t); }))),
        // Expanded recap body
        expanded && recap.body && React.createElement("div", { style: { margin: "12px 8px 0", padding: 14, background: "var(--surface)", borderRadius: 12, fontSize: 13, color: SOFT, lineHeight: 1.65, textAlign: "left", maxWidth: 200, border: "1px solid var(--hair)", boxShadow: "0 4px 16px rgba(0,0,0,0.28)" } }, recap.body)));
  }

  // Inject CSS to hide native scrollbar on the timeline scroll container
  if (typeof document !== "undefined" && !document.getElementById("nz-tl-css")) {
    var tlStyle = document.createElement("style"); tlStyle.id = "nz-tl-css";
    tlStyle.textContent = ".nz-tl-scroll::-webkit-scrollbar{display:none}.nz-tl-scroll{-ms-overflow-style:none;scrollbar-width:none}";
    document.head.appendChild(tlStyle);
  }

  // ── Main CampaignLog component ────────────────────────────────────────────
  function CampaignLog(props) {
    var recaps = props.recaps || [];
    var setRecaps = props.setRecaps;
    var timeline = props.timeline || []; // gap data per recap id: { [recapId]: { time, events } }
    var setTimeline = props.setTimeline;
    var stats = props.stats || {};
    var ctx = useContext(window.NZAuth.RoleContext);
    var isDM = ctx.role === "dm";
    var canEdit = window.NZAuth.can(ctx.role, "editWorld");

    var editingRecap = useState(null); var editR = editingRecap[0], setEditR = editingRecap[1];
    var editingGap = useState(null);
    var editG = editingGap[0], setEditG = editingGap[1];

    // Custom scroll state
    var scrollRef = useRef(null);
    var isDragScrollRef = useRef(false);
    var dragScrollStartRef = useRef({ x: 0, sl: 0 });
    var thumbLeftState = useState(0); var thumbLeft = thumbLeftState[0], setThumbLeft = thumbLeftState[1];
    var thumbWidthState = useState(50); var thumbWidth = thumbWidthState[0], setThumbWidth = thumbWidthState[1];

    useEffect(function() {
      var el = scrollRef.current; if (!el) return;
      function updateThumb() {
        var sw = el.scrollWidth, cw = el.clientWidth, sl = el.scrollLeft;
        if (sw <= cw) { setThumbWidth(100); setThumbLeft(0); return; }
        var tw = Math.max(8, cw / sw * 100);
        setThumbWidth(tw);
        setThumbLeft(sl / (sw - cw) * (100 - tw));
      }
      function onDown(e) {
        if (e.target.closest && e.target.closest("button")) return;
        isDragScrollRef.current = true;
        dragScrollStartRef.current = { x: e.clientX, sl: el.scrollLeft };
        el.style.cursor = "grabbing"; el.style.userSelect = "none";
        e.preventDefault();
      }
      function onMove(e) {
        if (!isDragScrollRef.current) return;
        el.scrollLeft = dragScrollStartRef.current.sl - (e.clientX - dragScrollStartRef.current.x);
      }
      function onUp() {
        if (!isDragScrollRef.current) return;
        isDragScrollRef.current = false;
        if (el) { el.style.cursor = "grab"; el.style.userSelect = ""; }
      }
      el.addEventListener("scroll", updateThumb, { passive: true });
      el.addEventListener("pointerdown", onDown);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      var ro = new ResizeObserver(updateThumb); ro.observe(el); updateThumb();
      return function() {
        el.removeEventListener("scroll", updateThumb); el.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp);
        ro.disconnect();
      };
    }, []);

    // Sort recaps by num ascending
    var sorted = recaps.slice().sort(function(a, b) { return (a.num || 0) - (b.num || 0); });

    function getGap(recapId) {
      var entry = timeline.find(function(t) { return t.id === recapId; });
      return entry ? { time: entry.gapBefore || "", events: entry.eventsBefore || [] } : null;
    }
    function saveGap(recapId, gapData) {
      setTimeline(function(tl) {
        var existing = tl.find(function(t) { return t.id === recapId; });
        if (existing) return tl.map(function(t) { return t.id === recapId ? Object.assign({}, t, { gapBefore: gapData.time, eventsBefore: gapData.events }) : t; });
        return tl.concat([{ id: recapId, gapBefore: gapData.time, eventsBefore: gapData.events }]);
      });
      setEditG(null);
    }
    function saveRecap(r) {
      if (r.id) { setRecaps(function(rs) { return rs.map(function(x) { return x.id === r.id ? r : x; }); }); }
      else {
        setRecaps(function(rs) {
          var maxNum = rs.reduce(function(m, x) { return Math.max(m, x.num || 0); }, 0);
          return rs.concat([Object.assign({}, r, { id: "r" + Date.now(), num: maxNum + 1 })]);
        });
      }
      setEditR(null);
    }
    function deleteRecap(id) { if (confirm("Delete this session?")) { setRecaps(function(rs) { return rs.filter(function(r) { return r.id !== id; }); }); } }

    function downloadRecaps() {
      var text = sorted.map(function(r) { return "=== Ep " + r.num + ": " + r.title + " (" + (r.date || "") + ") ===\n" + (r.body || "") + "\nTags: " + (r.tags || []).join(", "); }).join("\n\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = "campaign-log.txt"; a.click();
    }

    var currentGap = editG ? getGap(editG) || blankGap() : null;

    return React.createElement("div", { style: { height: "100%", minHeight: 0, display: "flex", flexDirection: "column" } },
      // Header bar
      React.createElement("div", { style: { padding: "16px 24px 12px", borderBottom: "1px solid var(--hair)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: "var(--bg-2)" } },
        React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 16, fontWeight: 700, color: GOLD2 } }, "Campaign Log"),
        React.createElement("div", { className: "muted", style: { fontSize: 13 } }, sorted.length + " sessions recorded"),
        React.createElement("div", { className: "spacer" }),
        React.createElement("button", { className: "btn ghost sm", onClick: downloadRecaps }, React.createElement(Icon, { name: "upload", size: 14 }), "Export"),
        canEdit && React.createElement("button", { className: "btn primary sm", onClick: function() { setEditR(false); } }, React.createElement(Icon, { name: "plus", size: 14 }), "Add session")),

      // Quick stats
      React.createElement("div", { style: { padding: "10px 24px", borderBottom: "1px solid var(--hair)", display: "flex", gap: 20, flexShrink: 0 } },
        [["Sessions", sorted.length, "recap", GOLD], ["Nat 20s", stats.nat20s, "sparkle", "var(--emerald)"], ["Nat 1s", stats.nat1s, "dice", "var(--red)"], ["In-jokes", stats.inJokes, "flame", "var(--amethyst)"]].map(function(item) {
          return React.createElement("div", { key: item[0], className: "row", style: { gap: 6 } },
            React.createElement(Icon, { name: item[2], size: 14, style: { color: item[3] } }),
            React.createElement("span", { style: { fontFamily: "var(--mono)", fontWeight: 700, fontSize: 14, color: item[3] } }, item[1]),
            React.createElement("span", { className: "muted", style: { fontSize: 11 } }, item[0]));
        })),

      // Timeline area — custom drag-scroll with gold scrollbar track + arrow buttons
      React.createElement("div", { style: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" } },
        // Left arrow
        React.createElement("button", { onClick: function() { scrollRef.current && scrollRef.current.scrollBy({ left: -320, behavior: "smooth" }); },
          style: { position: "absolute", left: 0, top: 0, bottom: 28, zIndex: 6, width: 50, border: "none",
            background: "linear-gradient(90deg, rgba(19,15,28,0.92) 0%, rgba(19,15,28,0.4) 70%, transparent 100%)",
            color: "var(--gold)", cursor: "pointer", fontSize: 28, display: "flex", alignItems: "center",
            paddingLeft: 10, pointerEvents: "all", transition: "opacity .2s" } }, "‹"),
        // Right arrow
        React.createElement("button", { onClick: function() { scrollRef.current && scrollRef.current.scrollBy({ left: 320, behavior: "smooth" }); },
          style: { position: "absolute", right: 0, top: 0, bottom: 28, zIndex: 6, width: 50, border: "none",
            background: "linear-gradient(-90deg, rgba(19,15,28,0.92) 0%, rgba(19,15,28,0.4) 70%, transparent 100%)",
            color: "var(--gold)", cursor: "pointer", fontSize: 28, display: "flex", alignItems: "center",
            justifyContent: "flex-end", paddingRight: 10, pointerEvents: "all", transition: "opacity .2s" } }, "›"),
        // Scroll container (native scrollbar hidden, drag-to-scroll active)
        React.createElement("div", { ref: scrollRef, className: "nz-tl-scroll",
          style: { flex: 1, overflowX: "auto", overflowY: "hidden", minHeight: 0, cursor: "grab",
            background: "linear-gradient(180deg, var(--bg) 0%, rgba(232,181,74,0.03) 50%, var(--bg) 100%)" } },
          sorted.length === 0
            ? React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: 220, gap: 14 } },
                React.createElement(Icon, { name: "recap", size: 40, style: { color: DIM } }),
                React.createElement("div", { className: "muted", style: { fontStyle: "italic" } }, "No sessions logged yet."),
                canEdit && React.createElement("button", { className: "btn primary", onClick: function() { setEditR(false); } }, React.createElement(Icon, { name: "plus", size: 15 }), "Add first session"))
            : React.createElement("div", { style: { display: "flex", alignItems: "center", minHeight: "100%", minWidth: "max-content", padding: "32px 56px" } },
                React.createElement("div", { style: { display: "flex", alignItems: "flex-start", minWidth: "max-content", position: "relative" } },
                  React.createElement("div", { style: { position: "absolute", height: 3, top: PAD_TOP + CIRCLE/2 - 1,
                    left: 0, right: 0, pointerEvents: "none", zIndex: 0,
                    background: "linear-gradient(90deg, transparent 0%, var(--gold-deep) 2%, var(--gold-bright) 20%, var(--gold-bright) 80%, var(--gold-deep) 98%, transparent 100%)" } }),
                  sorted.map(function(recap, i) {
                    return React.createElement(SessionNode, { key: recap.id, recap: recap, num: recap.num || (i + 1), isDM: isDM,
                      gap: getGap(recap.id), isFirst: i === 0,
                      onEdit: function() { setEditR(recap); },
                      onDelete: function() { deleteRecap(recap.id); },
                      onEditGap: function() { setEditG(recap.id); } });
                  }),
                  canEdit && React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", width: 100, paddingTop: PAD_TOP + CIRCLE/2 - 1, flex: "none" } },
                    React.createElement("div", { style: { width: "50%", height: 3, background: "linear-gradient(90deg, var(--gold-deep), transparent)", marginBottom: 6, flexShrink: 0 } }),
                    React.createElement("button", { onClick: function() { setEditR(false); },
                      style: { width: 40, height: 40, borderRadius: "50%", border: "2px dashed var(--gold-deep)", background: "var(--bg-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold-deep)", fontSize: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" } }, "+"))))),
        // Custom gold scrollbar track
        React.createElement("div", {
          style: { height: 28, display: "flex", alignItems: "center", padding: "0 58px",
            borderTop: "1px solid var(--hair)", background: "var(--bg-2)", flexShrink: 0, cursor: "pointer" },
          onClick: function(e) {
            var el = scrollRef.current; if (!el || el.scrollWidth <= el.clientWidth) return;
            var rect = e.currentTarget.getBoundingClientRect();
            var ratio = Math.max(0, Math.min(1, (e.clientX - rect.left - 58) / (rect.width - 116)));
            el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
          }
        },
          React.createElement("div", { style: { position: "relative", flex: 1, height: 10, background: "var(--surface-2)", borderRadius: 5, border: "1px solid var(--hair)", overflow: "hidden" } },
            React.createElement("div", {
              style: { position: "absolute", top: 0, bottom: 0,
                left: thumbLeft + "%", width: thumbWidth + "%",
                background: "linear-gradient(90deg, var(--gold-deep), var(--gold-bright), var(--gold-deep))",
                borderRadius: 5, cursor: "grab", boxShadow: "0 0 10px rgba(232,181,74,0.35)" },
              onPointerDown: function(e) {
                e.stopPropagation();
                var el = scrollRef.current; if (!el) return;
                var startX = e.clientX, startScroll = el.scrollLeft;
                var trackW = e.currentTarget.parentElement.clientWidth;
                function mv(ev) {
                  var ratio = (ev.clientX - startX) / trackW;
                  el.scrollLeft = startScroll + ratio * (el.scrollWidth - el.clientWidth);
                }
                function up() { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", up); }
                window.addEventListener("pointermove", mv); window.addEventListener("pointerup", up);
              }
            })))),

      // Modals
      React.createElement(RecapModal, { open: editR !== null, initial: editR || null, onClose: function() { setEditR(null); }, onSave: saveRecap }),
      React.createElement(GapModal, { open: !!editG, initial: currentGap, onClose: function() { setEditG(null); }, onSave: function(gd) { saveGap(editG, gd); } })));
  }

  window.CampaignLog = CampaignLog;
})();
