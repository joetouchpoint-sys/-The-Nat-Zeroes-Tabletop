/* THE TABLE — battle map with draggable tokens, fog of war, measure, ping */
(function () {
  const { useState, useRef, useEffect, useCallback, useContext } = React;
  const Icon = window.Icon;
  const { Token, HPBar } = window.NZUI;

  // ---- procedural map backgrounds (no external art needed) ----
  function bgFor(type) {
    switch (type) {
      case "tavern": return {
        background: `
          repeating-linear-gradient(90deg, rgba(60,38,20,0.5) 0 3px, transparent 3px 64px),
          repeating-linear-gradient(0deg, rgba(30,18,8,0.45) 0 64px, rgba(70,44,22,0.25) 64px 67px),
          radial-gradient(120% 90% at 50% 30%, #6a4424, #2e1c0d)` };
      case "dungeon": return {
        background: `
          repeating-linear-gradient(90deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 56px),
          repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 56px),
          radial-gradient(120% 100% at 50% 20%, #3a3540, #1b1820)` };
      case "forest": return {
        background: `
          radial-gradient(40px 40px at 20% 30%, rgba(40,80,40,0.5), transparent 70%),
          radial-gradient(60px 60px at 70% 60%, rgba(30,70,40,0.5), transparent 70%),
          radial-gradient(50px 50px at 85% 20%, rgba(40,90,50,0.4), transparent 70%),
          radial-gradient(120% 100% at 50% 50%, #243a22, #11200f)` };
      case "cave": return {
        background: `
          radial-gradient(80px 80px at 30% 40%, rgba(50,60,80,0.4), transparent 70%),
          radial-gradient(120px 90px at 75% 65%, rgba(30,40,60,0.5), transparent 70%),
          radial-gradient(120% 110% at 50% 30%, #2a2f3c, #12141c)` };
      default: return { background: "#1b1820" };
    }
  }

  function BattleMap({ maps, party, bestiary, dm, initialMapId }) {
    const ctx = useContext(window.NZAuth.RoleContext);
    const canEdit = ctx.can("fog");        // DM / admin
    const canMove = ctx.can("moveTokens"); // DM / admin / player
    const [mapList, setMapList] = useState(maps);
    const [activeMapId, setActiveMapId] = useState(initialMapId || maps[0].id);
    const map = mapList.find((m) => m.id === activeMapId) || mapList[0];
    useEffect(() => { if (initialMapId && mapList.some((m) => m.id === initialMapId)) setActiveMapId(initialMapId); }, [initialMapId]);

    const [tool, setTool] = useState("select"); // select | fog | measure | ping
    const [cell, setCell] = useState(46);
    const [showGrid, setShowGrid] = useState(true);

    // tokens keyed by map
    const [tokensByMap, setTokensByMap] = useState(() => {
      const init = {};
      maps.forEach((m) => { init[m.id] = []; });
      // seed active map
      init[maps[0].id] = [
        mkTok(party[0], 6, 7, "pc"), mkTok(party[1], 7, 8, "pc"),
        mkTok(party[2], 5, 9, "pc"), mkTok(party[3], 8, 6, "pc"),
        mkTok(party[4], 6, 9, "pc"),
        mkTok(bestiary[3], 15, 7, "enemy"), mkTok(bestiary[3], 16, 9, "enemy", "2"),
        mkTok(bestiary[1], 18, 8, "enemy"),
      ];
      init[maps[1].id] = [
        mkTok(party[0], 5, 8, "pc"), mkTok(party[1], 6, 9, "pc"),
        mkTok(bestiary[0], 20, 9, "enemy"),
      ];
      return init;
    });
    const tokens = tokensByMap[activeMapId] || [];
    const setTokens = (updater) => setTokensByMap((s) => ({ ...s, [activeMapId]: typeof updater === "function" ? updater(s[activeMapId] || []) : updater }));

    // fog: Set of "c,r" revealed cells, per map
    const [fogByMap, setFogByMap] = useState(() => {
      const reveal = (cols, rows, c0, c1, r0, r1) => {
        const s = new Set();
        for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) if (c >= 0 && c < cols && r >= 0 && r < rows) s.add(`${c},${r}`);
        return s;
      };
      return {
        [maps[0].id]: reveal(maps[0].cols, maps[0].rows, 2, 21, 3, 12),
        [maps[1].id]: reveal(maps[1].cols, maps[1].rows, 2, 9, 5, 12),
      };
    });
    const [fogEnabled, setFogEnabled] = useState(true);
    const revealed = fogByMap[activeMapId] || new Set();
    const setRevealed = (next) => setFogByMap((s) => ({ ...s, [activeMapId]: next }));

    const [selected, setSelected] = useState(null);
    const [pings, setPings] = useState([]);
    const [measure, setMeasure] = useState(null); // {from:{x,y}, to:{x,y}}
    const [diceOpen, setDiceOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [view3d, setView3d] = useState(false);
    const [hexMode, setHexMode] = useState(false);
    const [mapDice, setMapDice] = useState(null); // {result, die, theme, crit, pos:{x,y}}

    // listen for nz:dice events to show dice on map
    React.useEffect(() => {
      function handleDice(e) {
        const { result, die, theme, crit } = e.detail;
        const stage = stageRef.current;
        const rect = stage ? stage.getBoundingClientRect() : { width: 400, height: 300 };
        const margin = 80;
        const px = margin + Math.random() * Math.max(0, rect.width - margin * 2);
        const py = margin + Math.random() * Math.max(0, rect.height - margin * 2);
        setMapDice({ result, die, theme, crit, pos: { x: px, y: py }, id: Date.now() });
        setTimeout(() => setMapDice(null), 3200);
      }
      window.addEventListener("nz:dice", handleDice);
      return () => window.removeEventListener("nz:dice", handleDice);
    }, []);

    const stageRef = useRef(null);
    const drag = useRef(null);

    // ---- pointer handling on the grid ----
    function cellFromEvent(e) {
      const r = stageRef.current.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      return { c: Math.floor(x / cell), r: Math.floor(y / cell), x, y };
    }

    function onStagePointerDown(e) {
      if (e.target.closest(".tok")) return; // token handles its own
      const pos = cellFromEvent(e);
      if (tool === "fog") { paintFog(pos, e.shiftKey); }
      else if (tool === "ping") { dropPing(pos); }
      else if (tool === "measure") { setMeasure({ from: { x: pos.x, y: pos.y }, to: { x: pos.x, y: pos.y } }); drag.current = { kind: "measure" }; }
      else if (tool === "select") { setSelected(null); }
    }
    function onStagePointerMove(e) {
      const pos = cellFromEvent(e);
      if (drag.current?.kind === "measure") setMeasure((m) => m && ({ ...m, to: { x: pos.x, y: pos.y } }));
      else if (drag.current?.kind === "token") {
        setTokens((ts) => ts.map((t) => t.uid === drag.current.uid ? { ...t, c: clamp(pos.c, 0, map.cols - 1), r: clamp(pos.r, 0, map.rows - 1) } : t));
      }
      else if (tool === "fog" && (e.buttons & 1)) paintFog(pos, e.shiftKey);
    }
    function onStagePointerUp() { drag.current = null; }

    function paintFog(pos, hide) {
      const key = `${pos.c},${pos.r}`;
      const next = new Set(revealed);
      // brush 1-cell radius
      for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
        const k = `${pos.c + dc},${pos.r + dr}`;
        if (hide) next.delete(k); else next.add(k);
      }
      setRevealed(next);
    }
    function dropPing(pos) {
      const id = Date.now();
      setPings((p) => [...p, { id, x: pos.x, y: pos.y }]);
      setTimeout(() => setPings((p) => p.filter((x) => x.id !== id)), 1600);
    }
    function startTokenDrag(e, t) {
      if (tool !== "select" || !canMove) return;
      e.stopPropagation();
      setSelected(t.uid);
      drag.current = { kind: "token", uid: t.uid };
    }

    // ---- initiative ----
    const [round, setRound] = useState(1);
    const [turnIdx, setTurnIdx] = useState(0);
    const order = [...tokens].sort((a, b) => b.init - a.init);
    const activeUid = order[turnIdx % Math.max(1, order.length)]?.uid;
    function nextTurn() {
      const ni = turnIdx + 1;
      if (ni >= order.length) { setTurnIdx(0); setRound((r) => r + 1); }
      else setTurnIdx(ni);
    }
    function rollInitiative() {
      setTokens((ts) => ts.map((t) => ({ ...t, init: 1 + Math.floor(Math.random() * 20) + t.initMod })));
      setTurnIdx(0); setRound(1);
    }

    function damage(uid, amt) {
      setTokens((ts) => ts.map((t) => {
        if (t.uid !== uid) return t;
        const hp = clamp(t.hp + amt, 0, t.hpMax);
        return { ...t, hp, bloodied: hp <= t.hpMax / 2 && hp > 0, dead: hp === 0 };
      }));
    }
    function removeToken(uid) { setTokens((ts) => ts.filter((t) => t.uid !== uid)); if (selected === uid) setSelected(null); }

    function addToken(src, kind) {
      const spot = freeSpot(tokens, map);
      setTokens((ts) => [...ts, mkTok(src, spot.c, spot.r, kind, undefined, true)]);
      setAddOpen(false);
    }

    function handleUpload(newMap) {
      setMapList((l) => [...l, newMap]);
      setTokensByMap((s) => ({ ...s, [newMap.id]: [] }));
      setActiveMapId(newMap.id);
      setUploadOpen(false);
    }

    const stageW = map.cols * cell, stageH = map.rows * cell;
    const sel = tokens.find((t) => t.uid === selected);

    return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 312px", height: "100%", minHeight: 0 } },
      // ===== LEFT: stage area =====
      React.createElement("div", { style: { position: "relative", minWidth: 0, display: "flex", flexDirection: "column", background: "#0d0a14" } },
        // map tabs
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderBottom: "1px solid var(--hair)", background: "var(--bg-2)", overflowX: "auto", flex: "none" } },
          mapList.map((m) => React.createElement("button", {
            key: m.id, onClick: () => setActiveMapId(m.id),
            style: mapTab(m.id === activeMapId),
          },
            React.createElement(Icon, { name: m.bg === "forest" ? "hex" : "map", size: 15 }),
            m.name
          )),
          canEdit && React.createElement("button", { className: "btn sm ghost", style: { flex: "none" }, onClick: () => setUploadOpen(true) },
            React.createElement(Icon, { name: "upload", size: 15 }), "Upload map"),
          React.createElement("div", { style: { flex: "none", display: "flex", gap: 4, marginLeft: 4, background: "var(--surface)", border: "1px solid var(--hair)", borderRadius: 100, padding: 3 } },
            React.createElement("button", { onClick: () => setView3d(false), style: dimToggle(!view3d) }, "2D"),
            React.createElement("button", { onClick: () => { setView3d(false); setHexMode((h) => !h); }, style: dimToggle(hexMode && !view3d) }, React.createElement(Icon, { name: "hex", size: 14 }), "Hex"),
            React.createElement("button", { onClick: () => setView3d(true), style: dimToggle(view3d) }, React.createElement(Icon, { name: "layers", size: 14 }), "3D"))
        ),
        // toolbar + viewport
        React.createElement("div", { style: { position: "relative", flex: 1, minHeight: 0, overflow: "hidden" } },
          // floating toolbar
          !view3d && canMove && React.createElement(Toolbar, { tool, setTool, cell, setCell, showGrid, setShowGrid, fogEnabled, setFogEnabled, canEdit,
            onReveal: () => { const all = new Set(); for (let c = 0; c < map.cols; c++) for (let r = 0; r < map.rows; r++) all.add(`${c},${r}`); setRevealed(all); },
            onResetFog: () => setRevealed(new Set()), onAdd: () => setAddOpen(true) }),
          // 3D board
          view3d && React.createElement(window.Table3D, { map, tokens, party, bestiary, activeUid, hexMode,
            onMoveToken: canMove ? (uid, c, r) => setTokens((ts) => ts.map((t) => t.uid === uid ? { ...t, c: clamp(c, 0, map.cols - 1), r: clamp(r, 0, map.rows - 1) } : t)) : null }),
          view3d && React.createElement("div", { style: { position: "absolute", top: 14, left: 16, zIndex: 12, fontSize: 12, color: "var(--ink-dim)", background: "rgba(13,10,20,0.7)", border: "1px solid var(--hair)", borderRadius: 8, padding: "6px 12px", backdropFilter: "blur(6px)" } }, "Orbit: drag \u00b7 Zoom: scroll \u00b7 Move token: click figure then click destination"),
          // map note
          React.createElement("div", { style: { position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 12, background: "rgba(13,10,20,0.8)", border: "1px solid var(--hair)", borderRadius: 100, padding: "6px 16px", fontSize: 13, color: "var(--ink-soft)", backdropFilter: "blur(6px)" } },
            React.createElement("span", { style: { color: "var(--gold)", fontFamily: "var(--display)", marginRight: 8 } }, "\u2727"),
            map.note),
          // scrollable stage
          !view3d && React.createElement("div", { style: { position: "absolute", inset: 0, overflow: "auto", display: "grid", placeItems: "center", padding: 30 } },
            React.createElement("div", {
              ref: stageRef,
              onPointerDown: onStagePointerDown, onPointerMove: onStagePointerMove, onPointerUp: onStagePointerUp, onPointerLeave: onStagePointerUp,
              style: Object.assign({
                position: "relative", width: stageW, height: stageH, flex: "none",
                borderRadius: 10, boxShadow: "var(--shadow-3), 0 0 0 1px rgba(232,181,74,0.15)",
                cursor: tool === "fog" ? "cell" : tool === "measure" ? "crosshair" : tool === "ping" ? "pointer" : "default",
                overflow: "hidden",
              }, map.img ? { backgroundImage: `url(${map.img})`, backgroundSize: "cover", backgroundPosition: "center" } : bgFor(map.bg)),
            },
              // grid lines (square or hex)
              showGrid && !hexMode && React.createElement("div", { style: { position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: `linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)`,
                backgroundSize: `${cell}px ${cell}px` } }),
              showGrid && hexMode && React.createElement(HexGridOverlay, { cols: map.cols, rows: map.rows, cell }),
              // tokens
              tokens.map((t) => React.createElement("div", {
                key: t.uid, className: "tok",
                onPointerDown: (e) => startTokenDrag(e, t),
                onClick: (e) => { e.stopPropagation(); setSelected(t.uid); },
                style: { position: "absolute", left: t.c * cell, top: t.r * cell, width: cell, height: cell, display: "grid", placeItems: "center",
                  zIndex: selected === t.uid ? 20 : 10, cursor: tool === "select" ? "grab" : "inherit",
                  outline: selected === t.uid ? "2px solid var(--gold)" : "none", outlineOffset: -2, borderRadius: 8,
                  transition: drag.current?.uid === t.uid ? "none" : "left .18s ease, top .18s ease" },
              },
                t.uid === activeUid && React.createElement("div", { style: { position: "absolute", inset: 1, borderRadius: "50%", boxShadow: "0 0 0 3px var(--gold), 0 0 18px var(--gold)", animation: "glowpulse 1.6s ease-in-out infinite" } }),
                React.createElement(Token, { name: t.name, ring: t.ring, size: cell - 8, bloodied: t.bloodied, dead: t.dead, condition: t.condition }),
                React.createElement("div", { style: { position: "absolute", bottom: -3, left: 4, right: 4, height: 4, borderRadius: 4, background: "rgba(0,0,0,0.5)", overflow: "hidden" } },
                  React.createElement("div", { style: { width: `${(t.hp / t.hpMax) * 100}%`, height: "100%", background: t.hp > t.hpMax / 2 ? "var(--emerald)" : t.hp > t.hpMax / 4 ? "var(--gold)" : "var(--red)" } }))
              )),
              // fog overlay
              fogEnabled && React.createElement("div", { style: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 15,
                display: "grid", gridTemplateColumns: `repeat(${map.cols}, ${cell}px)`, gridTemplateRows: `repeat(${map.rows}, ${cell}px)` } },
                Array.from({ length: map.cols * map.rows }).map((_, i) => {
                  const c = i % map.cols, r = Math.floor(i / map.cols);
                  const vis = revealed.has(`${c},${r}`);
                  return React.createElement("div", { key: i, style: { background: vis ? "transparent" : "rgba(7,5,12,0.93)", transition: "background .3s", boxShadow: vis ? "none" : "inset 0 0 0 0.5px rgba(0,0,0,0.3)" } });
                })),
              // measure line
              measure && React.createElement(MeasureOverlay, { measure, cell }),
              // pings
              pings.map((p) => React.createElement("div", { key: p.id, style: { position: "absolute", left: p.x, top: p.y, zIndex: 30, pointerEvents: "none", transform: "translate(-50%,-50%)" } },
                React.createElement("div", { style: { width: 8, height: 8, borderRadius: "50%", background: "var(--gold-bright)", boxShadow: "0 0 12px var(--gold)" } }),
                [0, 1, 2].map((k) => React.createElement("div", { key: k, style: { position: "absolute", inset: 0, margin: "auto", width: 8, height: 8, borderRadius: "50%", border: "2px solid var(--gold-bright)", animation: `pingRipple 1.5s ease-out ${k * 0.25}s infinite` } }))
              ))
            )
          ),
          // selected token quick-actions
          !view3d && sel && React.createElement(TokenHUD, { sel, damage, removeToken, addCondition: (c) => setTokens((ts) => ts.map((t) => t.uid === sel.uid ? { ...t, condition: t.condition === c ? null : c } : t)), onClose: () => setSelected(null) }),
          // CSS 3D dice overlay on map
          mapDice && !view3d && React.createElement(MapDiceOverlay, { key: mapDice.id, dice: mapDice }),
          // dice toggle button
          React.createElement("button", { className: "btn primary", style: { position: "absolute", right: 18, bottom: 18, zIndex: 35, padding: "11px 16px", display: diceOpen ? "none" : "inline-flex" }, onClick: () => setDiceOpen(true) },
            React.createElement(Icon, { name: "dice", size: 18 }), "Roll dice"),
          React.createElement(window.DiceTray, { open: diceOpen, onClose: () => setDiceOpen(false) })
        )
      ),
      // ===== RIGHT: initiative panel =====
      React.createElement(InitiativePanel, { order, activeUid, round, turnIdx, nextTurn, rollInitiative, selected, setSelected, damage, cell }),
      // modals
      React.createElement(UploadMapModal, { open: uploadOpen, onClose: () => setUploadOpen(false), onUpload: handleUpload }),
      React.createElement(AddTokenModal, { open: addOpen, onClose: () => setAddOpen(false), party, bestiary, onAdd: addToken })
    );
  }

  // ---------- Toolbar ----------
  function Toolbar({ tool, setTool, cell, setCell, showGrid, setShowGrid, fogEnabled, setFogEnabled, onReveal, onResetFog, onAdd, canEdit }) {
    const tools = [
      { id: "select", icon: "move", label: "Select & move" },
      { id: "fog", icon: "fog", label: "Fog of war (drag to reveal, Shift to hide)", dm: true },
      { id: "measure", icon: "ruler", label: "Measure distance" },
      { id: "ping", icon: "ping", label: "Ping location" },
    ].filter((t) => canEdit || !t.dm);
    return React.createElement("div", { style: { position: "absolute", top: 14, left: 14, zIndex: 14, display: "flex", flexDirection: "column", gap: 8 } },
      React.createElement("div", { className: "panel", style: { padding: 6, display: "flex", flexDirection: "column", gap: 4, background: "rgba(24,18,34,0.92)", backdropFilter: "blur(8px)" } },
        tools.map((t) => React.createElement("button", { key: t.id, title: t.label, onClick: () => setTool(t.id), style: toolBtn(tool === t.id) },
          React.createElement(Icon, { name: t.icon, size: 19 }))),
        canEdit && React.createElement("div", { style: { height: 1, background: "var(--hair)", margin: "2px 4px" } }),
        canEdit && React.createElement("button", { title: "Add token", onClick: onAdd, style: toolBtn(false) }, React.createElement(Icon, { name: "plus", size: 19 }))
      ),
      React.createElement("div", { className: "panel", style: { padding: 6, display: "flex", flexDirection: "column", gap: 4, background: "rgba(24,18,34,0.92)", backdropFilter: "blur(8px)" } },
        React.createElement("button", { title: "Toggle grid", onClick: () => setShowGrid((s) => !s), style: toolBtn(showGrid) }, React.createElement(Icon, { name: "grid", size: 19 })),
        canEdit && React.createElement("button", { title: fogEnabled ? "Fog on" : "Fog off", onClick: () => setFogEnabled((s) => !s), style: toolBtn(fogEnabled) }, React.createElement(Icon, { name: fogEnabled ? "eyeOff" : "eye", size: 19 })),
        canEdit && React.createElement("button", { title: "Reveal all", onClick: onReveal, style: toolBtn(false) }, React.createElement(Icon, { name: "eye", size: 19 })),
        canEdit && React.createElement("button", { title: "Reset fog", onClick: onResetFog, style: toolBtn(false) }, React.createElement(Icon, { name: "x", size: 19 }))
      ),
      React.createElement("div", { className: "panel", style: { padding: 6, display: "flex", flexDirection: "column", gap: 4, background: "rgba(24,18,34,0.92)", backdropFilter: "blur(8px)", alignItems: "center" } },
        React.createElement("button", { title: "Zoom in", onClick: () => setCell((c) => Math.min(72, c + 8)), style: toolBtn(false) }, React.createElement(Icon, { name: "plus", size: 18 })),
        React.createElement("div", { className: "mono", style: { fontSize: 10, color: "var(--ink-dim)" } }, Math.round((cell / 46) * 100) + "%"),
        React.createElement("button", { title: "Zoom out", onClick: () => setCell((c) => Math.max(28, c - 8)), style: toolBtn(false) }, React.createElement("div", { style: { width: 14, height: 2, background: "currentColor", borderRadius: 2 } }))
      )
    );
  }

  // ---------- Token HUD ----------
  function TokenHUD({ sel, damage, removeToken, addCondition, onClose }) {
    const conds = [["P", "Prone"], ["S", "Stunned"], ["G", "Grappled"], ["F", "Frightened"], ["X", "Poisoned"]];
    return React.createElement("div", { className: "panel rise", style: { position: "absolute", bottom: 18, left: 14, zIndex: 35, width: 290, background: "rgba(24,18,34,0.96)", backdropFilter: "blur(8px)" } },
      React.createElement("div", { className: "panel-h", style: { padding: "11px 14px" } },
        React.createElement(window.NZUI.Token, { name: sel.name, ring: sel.ring, size: 30 }),
        React.createElement("div", { className: "col", style: { minWidth: 0 } },
          React.createElement("h3", { style: { fontSize: 13, color: "var(--ink)", textTransform: "none", letterSpacing: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170 } }, sel.name),
          React.createElement("span", { className: "muted", style: { fontSize: 11 } }, sel.kind === "pc" ? "Player Character" : "Enemy")),
        React.createElement("div", { className: "spacer" }),
        React.createElement("button", { className: "icon-btn", style: { width: 28, height: 28 }, onClick: onClose }, React.createElement(Icon, { name: "x", size: 15 }))),
      React.createElement("div", { style: { padding: 14, display: "flex", flexDirection: "column", gap: 12 } },
        React.createElement(HPBar, { hp: sel.hp, max: sel.hpMax }),
        React.createElement("div", { className: "row", style: { gap: 6 } },
          React.createElement("button", { className: "btn danger sm", style: { flex: 1 }, onClick: () => damage(sel.uid, -5) }, "\u22125"),
          React.createElement("button", { className: "btn danger sm", style: { flex: 1 }, onClick: () => damage(sel.uid, -1) }, "\u22121"),
          React.createElement("button", { className: "btn sm", style: { flex: 1, color: "var(--emerald)" }, onClick: () => damage(sel.uid, 1) }, "+1"),
          React.createElement("button", { className: "btn sm", style: { flex: 1, color: "var(--emerald)" }, onClick: () => damage(sel.uid, 5) }, "+5")),
        React.createElement("div", { className: "row", style: { gap: 5, flexWrap: "wrap" } },
          conds.map(([k, label]) => React.createElement("button", { key: k, title: label, onClick: () => addCondition(k), style: condBtn(sel.condition === k) }, label))),
        React.createElement("button", { className: "btn ghost sm", style: { color: "var(--red-bright)" }, onClick: () => removeToken(sel.uid) },
          React.createElement(Icon, { name: "trash", size: 15 }), "Remove from map"))
    );
  }

  // ---------- Initiative panel ----------
  function InitiativePanel({ order, activeUid, round, turnIdx, nextTurn, rollInitiative, selected, setSelected, damage }) {
    return React.createElement("div", { style: { borderLeft: "1px solid var(--hair)", background: "var(--bg-2)", display: "flex", flexDirection: "column", minHeight: 0 } },
      React.createElement("div", { className: "panel-h", style: { borderRadius: 0, borderBottom: "1px solid var(--hair)" } },
        React.createElement(Icon, { name: "swords", size: 18, style: { color: "var(--gold-bright)" } }),
        React.createElement("h3", null, "Initiative"),
        React.createElement("div", { className: "spacer" }),
        React.createElement("span", { className: "tag gold" }, "Round " + round)),
      React.createElement("div", { style: { padding: 12, display: "flex", gap: 8, borderBottom: "1px solid var(--hair)" } },
        React.createElement("button", { className: "btn primary", style: { flex: 1 }, onClick: nextTurn }, React.createElement(Icon, { name: "play", size: 16 }), "Next turn"),
        React.createElement("button", { className: "btn", title: "Roll initiative for all", onClick: rollInitiative }, React.createElement(Icon, { name: "dice", size: 16 }))),
      React.createElement("div", { style: { flex: 1, overflow: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 } },
        order.length === 0 && React.createElement("div", { className: "muted", style: { textAlign: "center", padding: 30, fontSize: 13 } }, "No combatants on this map yet."),
        order.map((t, i) => React.createElement("div", {
          key: t.uid, onClick: () => setSelected(t.uid),
          style: initRow(t.uid === activeUid, t.uid === selected),
        },
          React.createElement("div", { className: "mono", style: { width: 26, textAlign: "center", fontSize: 16, fontWeight: 700, color: t.uid === activeUid ? "var(--gold-bright)" : "var(--ink-dim)" } }, t.init),
          React.createElement(window.NZUI.Token, { name: t.name, ring: t.ring, size: 34, bloodied: t.bloodied, dead: t.dead }),
          React.createElement("div", { className: "col", style: { flex: 1, minWidth: 0 } },
            React.createElement("div", { style: { fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: t.dead ? "var(--ink-faint)" : "var(--ink)", textDecoration: t.dead ? "line-through" : "none" } }, t.name),
            React.createElement("div", { style: { height: 5, borderRadius: 4, background: "rgba(0,0,0,0.4)", overflow: "hidden", marginTop: 4 } },
              React.createElement("div", { style: { width: `${(t.hp / t.hpMax) * 100}%`, height: "100%", background: t.hp > t.hpMax / 2 ? "var(--emerald)" : t.hp > t.hpMax / 4 ? "var(--gold)" : "var(--red)" } }))),
          React.createElement("span", { className: "tag", style: { fontSize: 10, padding: "2px 7px", color: t.kind === "enemy" ? "var(--red-bright)" : "var(--emerald)", borderColor: "transparent", background: "transparent" } }, t.kind === "pc" ? "PC" : t.kind === "ally" ? "ALLY" : "NPC")
        )))
    );
  }

  // ---- Map dice overlay (CSS 3D die flying onto the map) ----
  function MapDiceOverlay({ dice }) {
    const t = (window.NZDICE_THEMES || {})[dice.theme] || { bg: "linear-gradient(145deg,#2e2448,#16112a)", border: "#e8b54a", text: "#f7d278", shadow: "0 0 18px rgba(232,181,74,0.35)", emoji: "🎲" };
    const [phase, setPhase] = React.useState("roll");
    React.useEffect(() => {
      const t1 = setTimeout(() => setPhase("settle"), 1100);
      const t2 = setTimeout(() => setPhase("fade"), 2200);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);
    if (phase === "fade") return null;
    const faceNums = [1, 6, 2, 5, 3, 4];
    const faceStyle = { position: "absolute", width: 72, height: 72, display: "grid", placeItems: "center", borderRadius: 12,
      background: t.bg, border: `2px solid ${t.border}`, color: t.text,
      fontFamily: "var(--display)", fontWeight: 900, fontSize: 22,
      boxShadow: `inset 0 0 20px rgba(0,0,0,0.4)` };
    const faceT = ["translateZ(36px)", "rotateY(180deg) translateZ(36px)", "rotateY(90deg) translateZ(36px)", "rotateY(-90deg) translateZ(36px)", "rotateX(-90deg) translateZ(36px)", "rotateX(90deg) translateZ(36px)"];
    const result = dice.result;
    const faceIdx = ((result - 1) % 6);
    const offsets = [[0,0],[0,180],[0,-90],[0,90],[90,0],[-90,0]];
    const [rx, ry] = offsets[faceIdx] || [0,0];
    const wrapStyle = {
      position: "absolute", left: dice.pos.x - 36, top: dice.pos.y - 36,
      width: 72, height: 72, zIndex: 55, perspective: 500, pointerEvents: "none",
    };
    const dieStyle = {
      width: 72, height: 72, transformStyle: "preserve-3d", position: "relative",
      "--dx": "-100px", "--dy": "-80px",
      "--ex": `${900 + rx}deg`, "--ey": `${600 + ry}deg`, "--ez": "300deg",
      animation: phase === "roll" ? "diceThrow 1.1s cubic-bezier(0.2,1,0.35,1) forwards" : "none",
      transform: phase === "settle" ? `rotateX(${900 + rx}deg) rotateY(${600 + ry}deg) rotateZ(300deg)` : undefined,
      boxShadow: t.shadow, borderRadius: 12,
    };
    // nat20/nat1 label
    const labelStyle = {
      position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)",
      fontFamily: "var(--display)", fontWeight: 700, fontSize: 14,
      color: dice.crit === "nat20" ? "var(--gold-bright)" : dice.crit === "nat1" ? "var(--red-bright)" : "var(--ink)",
      textShadow: dice.crit ? `0 0 12px currentColor` : "none",
      whiteSpace: "nowrap", pointerEvents: "none",
      background: "rgba(13,10,20,0.82)", padding: "2px 8px", borderRadius: 100, border: "1px solid var(--hair)",
    };
    return React.createElement("div", { style: wrapStyle },
      dice.crit && phase === "settle" && React.createElement("div", { style: labelStyle }, dice.crit === "nat20" ? "NAT 20!" : "NAT 1…"),
      React.createElement("div", { style: dieStyle },
        faceT.map((tf, i) => React.createElement("div", { key: i, style: Object.assign({}, faceStyle, { transform: tf }) }, faceNums[i]))));
  }

  // ---- Hex grid overlay (SVG hexagons) ----
  function HexGridOverlay({ cols, rows, cell }) {
    const hexH = cell, hexW = cell;
    const hexPoints = (cx, cy) => {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        pts.push(`${cx + hexW * 0.5 * Math.cos(angle)},${cy + hexH * 0.5 * Math.sin(angle)}`);
      }
      return pts.join(" ");
    };
    const hexes = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = (c + 0.5) * hexW + (r % 2 === 0 ? 0 : hexW * 0.5);
        const cy = (r + 0.5) * hexH * 0.866;
        hexes.push(React.createElement("polygon", { key: `${c},${r}`, points: hexPoints(cx, cy), fill: "none", stroke: "rgba(255,255,255,0.09)", strokeWidth: 1 }));
      }
    }
    return React.createElement("svg", { style: { position: "absolute", inset: 0, pointerEvents: "none", width: "100%", height: "100%", overflow: "visible" } }, ...hexes);
  }

  function MeasureOverlay({ measure, cell }) {
    const { from, to } = measure;
    const dx = to.x - from.x, dy = to.y - from.y;
    const dist = Math.round(Math.max(Math.abs(dx), Math.abs(dy)) / cell) * 5; // D&D 5ft chebyshev
    const len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    return React.createElement("div", { style: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 25 } },
      React.createElement("div", { style: { position: "absolute", left: from.x, top: from.y, width: len, height: 2, background: "var(--gold-bright)", transformOrigin: "0 50%", transform: `rotate(${ang}deg)`, boxShadow: "0 0 8px var(--gold)" } }),
      React.createElement("div", { style: { position: "absolute", left: to.x + 8, top: to.y - 10, background: "rgba(13,10,20,0.9)", border: "1px solid var(--gold-deep)", borderRadius: 6, padding: "2px 8px", fontFamily: "var(--mono)", fontSize: 12, color: "var(--gold-bright)" } }, dist + " ft"));
  }

  // ---------- Upload map modal ----------
  function UploadMapModal({ open, onClose, onUpload }) {
    const [name, setName] = useState("");
    const [preset, setPreset] = useState("dungeon");
    const [img, setImg] = useState(null);
    const [cols, setCols] = useState(26), [rows, setRows] = useState(16);
    const fileRef = useRef();
    useEffect(() => { if (open) { setName(""); setImg(null); setPreset("dungeon"); } }, [open]);
    function pickFile(e) {
      const f = e.target.files?.[0]; if (!f) return;
      const url = URL.createObjectURL(f); setImg(url);
      if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
    }
    function create() {
      onUpload({ id: "m" + Date.now(), name: name || "Untitled Map", bg: preset, img, cols, rows, grid: 28, note: "Freshly conjured" });
    }
    return React.createElement(window.NZUI.Modal, { open, onClose, title: "Upload a Battle Map", sub: "Drop in your own map art, or start from a preset texture.", w: 560 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 16 } },
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Map name"),
          React.createElement("input", { className: "input", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. The Drowned Crypt" })),
        // dropzone
        React.createElement("div", { onClick: () => fileRef.current.click(), style: dropzone(img) },
          React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", hidden: true, onChange: pickFile }),
          img
            ? React.createElement("img", { src: img, style: { maxWidth: "100%", maxHeight: 180, borderRadius: 8, objectFit: "cover" } })
            : React.createElement(React.Fragment, null,
              React.createElement(Icon, { name: "upload", size: 30, style: { color: "var(--gold)" } }),
              React.createElement("div", { style: { color: "var(--ink-soft)", fontWeight: 600, marginTop: 8 } }, "Click to upload map image"),
              React.createElement("div", { className: "muted", style: { fontSize: 12.5, marginTop: 2 } }, "PNG / JPG \u2014 or pick a preset below"))),
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Or start from a preset"),
          React.createElement("div", { className: "row", style: { gap: 8 } },
            [["tavern", "Tavern"], ["dungeon", "Dungeon"], ["forest", "Forest"], ["cave", "Cavern"]].map(([k, l]) =>
              React.createElement("button", { key: k, onClick: () => { setPreset(k); setImg(null); }, style: presetBtn(preset === k && !img, k) }, l)))),
        React.createElement("div", { className: "row", style: { gap: 12 } },
          React.createElement("div", { className: "field", style: { flex: 1 } }, React.createElement("label", null, "Grid columns"),
            React.createElement("input", { className: "input", type: "number", value: cols, onChange: (e) => setCols(+e.target.value || 1) })),
          React.createElement("div", { className: "field", style: { flex: 1 } }, React.createElement("label", null, "Grid rows"),
            React.createElement("input", { className: "input", type: "number", value: rows, onChange: (e) => setRows(+e.target.value || 1) }))),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10, marginTop: 4 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", onClick: create }, React.createElement(Icon, { name: "check", size: 16 }), "Add map")))
    );
  }

  // ---------- Add token modal ----------
  function AddTokenModal({ open, onClose, party, bestiary, onAdd }) {
    const [tab, setTab] = useState("party");
    const enemies = bestiary.filter((e) => (e.side || "enemy") === "enemy");
    const allies = bestiary.filter((e) => e.side === "ally");
    const list = tab === "party" ? party : tab === "ally" ? allies : enemies;
    const kindFor = tab === "party" ? "pc" : tab === "ally" ? "ally" : "enemy";
    return React.createElement(window.NZUI.Modal, { open, onClose, title: "Add a Token", sub: "Drop a hero, an ally, or a horror onto the table.", w: 520 },
      React.createElement("div", { style: { padding: 20 } },
        React.createElement("div", { className: "row", style: { gap: 8, marginBottom: 16 } },
          React.createElement("button", { className: "btn sm" + (tab === "party" ? " primary" : " ghost"), onClick: () => setTab("party") }, React.createElement(Icon, { name: "party", size: 15 }), "Party"),
          React.createElement("button", { className: "btn sm" + (tab === "ally" ? " primary" : " ghost"), onClick: () => setTab("ally") }, React.createElement(Icon, { name: "shield", size: 15 }), "Allies"),
          React.createElement("button", { className: "btn sm" + (tab === "enemy" ? " primary" : " ghost"), onClick: () => setTab("enemy") }, React.createElement(Icon, { name: "skull", size: 15 }), "Enemies")),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 340, overflow: "auto" } },
          list.map((m) => React.createElement("button", { key: m.id, onClick: () => onAdd(m, kindFor), style: addCard },
            React.createElement(window.NZUI.Token, { name: m.name, ring: m.ring, size: 38 }),
            React.createElement("div", { className: "col", style: { minWidth: 0, alignItems: "flex-start" } },
              React.createElement("div", { style: { fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 150 } }, m.name),
              React.createElement("div", { className: "muted", style: { fontSize: 11.5 } }, tab === "party" ? `${m.cls} \u00b7 Lv ${m.level}` : `CR ${m.cr} \u00b7 ${m.type}`))))))
    );
  }

  // ---- helpers / styles ----
  let UIDC = 0;
  function mkTok(src, c, r, kind, suffix, fresh) {
    return { uid: "t" + (++UIDC), id: src.id, name: src.name + (suffix ? " " + suffix : ""), ring: src.ring,
      c, r, hp: src.hp, hpMax: src.hpMax, init: src.init ?? (1 + Math.floor(Math.random() * 20)), initMod: src.init ?? 0,
      kind, bloodied: src.hp <= src.hpMax / 2, dead: false, condition: null };
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function freeSpot(tokens, map) {
    for (let r = 1; r < map.rows; r++) for (let c = 1; c < map.cols; c++) {
      if (!tokens.some((t) => t.c === c && t.r === r)) return { c, r };
    }
    return { c: 1, r: 1 };
  }
  function mapTab(active) {
    return { display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 100, cursor: "pointer", flex: "none", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
      border: `1px solid ${active ? "var(--gold-deep)" : "var(--hair)"}`, background: active ? "linear-gradient(180deg, rgba(232,181,74,0.18), rgba(232,181,74,0.05))" : "var(--surface)", color: active ? "var(--gold-bright)" : "var(--ink-soft)" };
  }
  function toolBtn(active) {
    return { width: 38, height: 38, borderRadius: 8, display: "grid", placeItems: "center", cursor: "pointer",
      border: `1px solid ${active ? "var(--gold-deep)" : "transparent"}`, background: active ? "rgba(232,181,74,0.16)" : "transparent", color: active ? "var(--gold-bright)" : "var(--ink-soft)" };
  }
  function dimToggle(active) {
    return { display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 13px", borderRadius: 100, cursor: "pointer", fontSize: 12.5, fontWeight: 700, border: "none",
      background: active ? "linear-gradient(180deg, var(--gold-bright), var(--gold-deep))" : "transparent", color: active ? "#2a1d05" : "var(--ink-dim)" };
  }
  function initRow(active, sel) {
    return { display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", borderRadius: 10, cursor: "pointer",
      border: `1px solid ${active ? "var(--gold-deep)" : sel ? "var(--hair-2)" : "transparent"}`,
      background: active ? "linear-gradient(90deg, rgba(232,181,74,0.16), rgba(232,181,74,0.03))" : sel ? "var(--surface)" : "transparent" };
  }
  function condBtn(active) {
    return { width: 30, height: 30, borderRadius: 8, cursor: "pointer", fontFamily: "var(--display)", fontWeight: 700, fontSize: 13,
      border: `1px solid ${active ? "var(--amethyst)" : "var(--hair)"}`, background: active ? "rgba(145,112,240,0.2)" : "var(--surface-2)", color: active ? "#b59dff" : "var(--ink-dim)" };
  }
  function dropzone(has) {
    return { border: `1.5px dashed ${has ? "var(--gold-deep)" : "var(--hair-2)"}`, borderRadius: 12, padding: 24, textAlign: "center", cursor: "pointer", background: "var(--bg)", transition: "border-color .15s" };
  }
  function presetBtn(active, k) {
    return { flex: 1, padding: "10px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
      border: `1px solid ${active ? "var(--gold-deep)" : "var(--hair)"}`, background: active ? "rgba(232,181,74,0.14)" : "var(--surface-2)", color: active ? "var(--gold-bright)" : "var(--ink-soft)" };
  }
  const addCard = { display: "flex", alignItems: "center", gap: 11, padding: 11, borderRadius: 10, cursor: "pointer", textAlign: "left",
    border: "1px solid var(--hair)", background: "var(--surface)", color: "var(--ink)" };

  window.BattleMap = BattleMap;
})();
