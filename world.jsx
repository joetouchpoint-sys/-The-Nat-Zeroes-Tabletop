/* WORLD MAP — zoom, 3D tilt, parchment border, clouds, custom paths */
(function () {
  const { useState, useContext, useRef, useEffect } = React;

  // Inject cloud animation CSS
  if (!document.getElementById("nz-world-css")) {
    const s = document.createElement("style"); s.id = "nz-world-css";
    s.textContent = "@keyframes wdrift1{0%,100%{transform:translateX(0) scaleX(1)}50%{transform:translateX(4%) scaleX(1.04)}} @keyframes wdrift2{0%,100%{transform:translateX(0) translateY(0)}50%{transform:translateX(-3%) translateY(1%)}} @keyframes wdrift3{0%,100%{transform:translateX(0)}50%{transform:translateX(5%)}}";
    document.head.appendChild(s);
  }

  function compressImage(dataUrl, maxPx, quality, cb) {
    const img = new Image();
    img.onload = function() {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      cv.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(cv.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  }
  const Icon = window.Icon;
  const { Modal } = window.NZUI;

  const TYPES = {
    town:     { label: "Town",    icon: "home",    color: "#e8b54a" },
    dungeon:  { label: "Dungeon", icon: "skull",   color: "#e8412e" },
    wild:     { label: "Wilds",   icon: "hex",     color: "#4fb98a" },
    ruin:     { label: "Ruin",    icon: "layers",  color: "#9170f0" },
    landmark: { label: "Landmark",icon: "pin",     color: "#4ea7e8" },
  };

  const PATH_COLORS = ["#e8b54a", "#4ea7e8", "#e8412e", "#4fb98a", "#9170f0", "#f4eddd"];

  // Ramer-Douglas-Peucker path simplification for freehand drawing
  function rdp(pts, eps) {
    if (pts.length <= 2) return pts;
    var max = 0, idx = 0;
    var a = pts[0], b = pts[pts.length - 1];
    for (var i = 1; i < pts.length - 1; i++) { var d = ptSegDist(pts[i], a, b); if (d > max) { max = d; idx = i; } }
    if (max > eps) { var l = rdp(pts.slice(0, idx + 1), eps); var r = rdp(pts.slice(idx), eps); return l.slice(0, -1).concat(r); }
    return [a, b];
  }
  function ptSegDist(p, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    if (dx === 0 && dy === 0) return Math.sqrt((p.x-a.x)**2 + (p.y-a.y)**2);
    var t = Math.max(0, Math.min(1, ((p.x-a.x)*dx + (p.y-a.y)*dy) / (dx*dx + dy*dy)));
    return Math.sqrt((p.x-(a.x+t*dx))**2 + (p.y-(a.y+t*dy))**2);
  }

  function World({ locations: initLocs, maps, onOpenMap, bgImg, onBgImgChange, customPaths, setCustomPaths, worldMapName, setWorldMapName }) {
    const ctx = useContext(window.NZAuth.RoleContext);
    const canEdit = window.NZAuth.can(ctx.role, "editWorld");
    const [editingName, setEditingName] = useState(false);
    const [hoveredPath, setHoveredPath] = useState(null);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const panDragRef = useRef(null); // {startX, startY, origPanX, origPanY}
    const [locs, setLocs] = useState(initLocs);
    const [sel, setSel] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [editLoc, setEditLoc] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [is3d, setIs3d] = useState(false);
    const [pathingFrom, setPathingFrom] = useState(null);
    const [pathColor, setPathColor] = useState("#e8b54a");
    const [drawingPath, setDrawingPath] = useState(false);
    const [freehand, setFreehand] = useState(false);
    const [previewPts, setPreviewPts] = useState(null);
    const [measuring, setMeasuring] = useState(false);
    const [measureFrom, setMeasureFrom] = useState(null); // loc id
    const [measureResult, setMeasureResult] = useState(null); // {from, to, days}
    const WEATHERS = ["☀️ Clear", "🌤️ Cloudy", "🌧️ Rain", "⛈️ Storm", "❄️ Snow", "🌫️ Fog", "🌕 Full Moon"];
    const [weather, setWeather] = useState(() => { try { return localStorage.getItem("nz_weather") || ""; } catch(e) { return ""; } });
    function cycleWeather() {
      const next = weather ? (WEATHERS[(WEATHERS.indexOf(weather) + 1) % WEATHERS.length]) : WEATHERS[0];
      setWeather(next); try { localStorage.setItem("nz_weather", next); } catch(e) {}
    }
    function clearWeather() { setWeather(""); try { localStorage.removeItem("nz_weather"); } catch(e) {} }
    const freehandActiveRef = useRef(false);
    const freehandPtsRef = useRef([]);
    freehandActiveRef.current = freehand;
    const waypointDragRef = useRef(null); // {pathId, idx, startX, startY, origX, origY, rectW, rectH}
    const segmentDragRef = useRef(null);  // {pathId, segIdx, startX, startY, rectW, rectH} — drag segment to add bend
    const bgInputRef = useRef(null);
    const mapContainerRef = useRef(null);
    const dragRef = useRef(null);

    const discovered = locs.filter((l) => l.discovered);
    const visible = canEdit ? locs : discovered;
    const paths = customPaths || [];

    function toggleDiscovered(id) { setLocs((ls) => ls.map((l) => l.id === id ? { ...l, discovered: !l.discovered } : l)); }
    function saveLoc(loc) {
      setLocs((ls) => ls.some((l) => l.id === loc.id) ? ls.map((l) => l.id === loc.id ? loc : l) : [...ls, loc]);
      setAddOpen(false); setEditLoc(null);
    }
    function deleteLoc(id) { setLocs((ls) => ls.filter((l) => l.id !== id)); setSel(null); }

    function handleBgUpload(e) {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { compressImage(ev.target.result, 1200, 0.82, (c) => { onBgImgChange && onBgImgChange(c); }); };
      reader.readAsDataURL(file);
    }

    // Mouse wheel zoom, pan (with clamping), and freehand path drawing
    useEffect(() => {
      const el = mapContainerRef.current;
      if (!el) return;

      function screenToMapPct(ev, rect) {
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        if (is3d) {
          const scale = zoom * 0.80;
          return { x: Math.max(0, Math.min(100, (ev.clientX - cx - panX) / (rect.width * scale) * 100 + 50)),
                   y: Math.max(0, Math.min(100, (ev.clientY - cy - panY) / (rect.height * scale) * 100 + 50)) };
        }
        return { x: Math.max(0, Math.min(100, (ev.clientX - cx) / (rect.width * zoom) * 100 + 50)),
                 y: Math.max(0, Math.min(100, (ev.clientY - cy) / (rect.height * zoom) * 100 + 50)) };
      }

      function onWheel(e) { e.preventDefault(); setZoom((z) => Math.max(0.4, Math.min(3, z - e.deltaY * 0.001))); }

      function onFreehandMove(ev) {
        const pts = freehandPtsRef.current;
        if (!pts || pts.length === 0) return;
        const rect = el.getBoundingClientRect();
        const np = screenToMapPct(ev, rect);
        const last = pts[pts.length - 1];
        if (Math.sqrt((np.x - last.x)**2 + (np.y - last.y)**2) > 0.35) {
          const newPts = pts.concat([np]);
          freehandPtsRef.current = newPts;
          setPreviewPts(newPts.slice());
        }
      }
      function onFreehandUp() {
        window.removeEventListener("pointermove", onFreehandMove);
        window.removeEventListener("pointerup", onFreehandUp);
        const pts = freehandPtsRef.current;
        if (pts.length >= 4 && setCustomPaths) {
          const simplified = rdp(pts, 1.2);
          if (simplified.length >= 2) {
            setCustomPaths((ps) => [...ps, { id: "p" + Date.now(), freehand: true, color: pathColor, points: simplified }]);
          }
        }
        freehandPtsRef.current = [];
        setPreviewPts(null);
      }

      function onContainerPointerDown(ev) {
        if (ev.button !== 0) return;
        // Freehand check FIRST — can draw starting from a pin or any other element
        if (freehandActiveRef.current && canEdit) {
          ev.preventDefault(); // prevents pin click/drag from firing
          const rect = el.getBoundingClientRect();
          const pt = screenToMapPct(ev, rect);
          freehandPtsRef.current = [pt];
          setPreviewPts([pt]);
          window.addEventListener("pointermove", onFreehandMove);
          window.addEventListener("pointerup", onFreehandUp);
          return;
        }
        const t = ev.target;
        if (t.closest("button") || t.closest(".path-ctrl")) return;
        if (t.tagName === "circle" || t.tagName === "text" || t.tagName === "polyline" || t.tagName === "line") return;
        panDragRef.current = { startX: ev.clientX, startY: ev.clientY, origPanX: panX, origPanY: panY };
        window.addEventListener("pointermove", onContainerPointerMove);
        window.addEventListener("pointerup", onContainerPointerUp);
      }
      function onContainerPointerMove(ev) {
        if (!panDragRef.current) return;
        const d = panDragRef.current;
        const rect = el.getBoundingClientRect();
        const maxX = rect.width * 0.42, maxY = rect.height * 0.42;
        setPanX(Math.max(-maxX, Math.min(maxX, d.origPanX + (ev.clientX - d.startX))));
        setPanY(Math.max(-maxY, Math.min(maxY, d.origPanY + (ev.clientY - d.startY))));
      }
      function onContainerPointerUp() {
        panDragRef.current = null;
        window.removeEventListener("pointermove", onContainerPointerMove);
        window.removeEventListener("pointerup", onContainerPointerUp);
      }
      el.addEventListener("wheel", onWheel, { passive: false });
      el.addEventListener("pointerdown", onContainerPointerDown);
      return () => {
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("pointerdown", onContainerPointerDown);
        // Clean up any in-progress freehand stroke listeners if component unmounts mid-draw
        window.removeEventListener("pointermove", onFreehandMove);
        window.removeEventListener("pointerup", onFreehandUp);
      };
    }, [panX, panY, is3d, zoom, freehand, pathColor]);

    // Pin drag (adjust for zoom)
    function onPinPointerDown(e, loc) {
      if (!canEdit) return;
      e.preventDefault(); e.stopPropagation();
      const rect = mapContainerRef.current.getBoundingClientRect();
      dragRef.current = { id: loc.id, startX: e.clientX, startY: e.clientY, origX: loc.x, origY: loc.y, rectW: rect.width, rectH: rect.height };
      window.addEventListener("pointermove", onMapPointerMove);
      window.addEventListener("pointerup", onMapPointerUp);
    }
    function onMapPointerMove(e) {
      if (!dragRef.current) return;
      const d = dragRef.current;
      // Divide by zoom so drag distance maps correctly to percentage space
      const dx = (e.clientX - d.startX) / (d.rectW * zoom) * 100;
      const dy = (e.clientY - d.startY) / (d.rectH * zoom) * 100;
      const nx = Math.max(2, Math.min(98, d.origX + dx));
      const ny = Math.max(2, Math.min(98, d.origY + dy));
      setLocs((ls) => ls.map((l) => l.id === d.id ? { ...l, x: nx, y: ny } : l));
    }
    function onMapPointerUp() {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMapPointerMove);
      window.removeEventListener("pointerup", onMapPointerUp);
    }

    // Distance calculation: map % coords → approx travel days
    function calcDistance(a, b) {
      const pct = Math.sqrt((b.x-a.x)**2 + (b.y-a.y)**2);
      return { pct: pct.toFixed(1), days: Math.max(1, Math.round(pct * 0.55)) };
    }

    // Path drawing / measuring: click first pin, then second
    function handlePinClick(locId) {
      if (measuring) {
        if (!measureFrom) { setMeasureFrom(locId); return; }
        if (measureFrom === locId) { setMeasureFrom(null); setMeasureResult(null); return; }
        const a = locs.find((l) => l.id === measureFrom), b = locs.find((l) => l.id === locId);
        if (a && b) setMeasureResult({ from: a.name, to: b.name, ...calcDistance(a, b) });
        setMeasureFrom(null); return;
      }
      if (drawingPath && canEdit) {
        if (!pathingFrom) { setPathingFrom(locId); return; }
        if (pathingFrom === locId) { setPathingFrom(null); return; }
        setCustomPaths && setCustomPaths((ps) => [...ps, { id: "p" + Date.now(), from: pathingFrom, to: locId, color: pathColor, waypoints: [] }]);
        setPathingFrom(null); return;
      }
      setSel(locId === sel ? null : locId);
    }

    // Drag an existing WAYPOINT to reposition it
    function onWaypointPointerDown(e, pathId, idx) {
      if (!canEdit) return;
      e.preventDefault(); e.stopPropagation();
      const rect = mapContainerRef.current.getBoundingClientRect();
      const path = paths.find((p) => p.id === pathId);
      const wp = path && path.waypoints && path.waypoints[idx];
      if (!wp) return;
      waypointDragRef.current = { pathId, idx, startX: e.clientX, startY: e.clientY, origX: wp.x, origY: wp.y, rectW: rect.width, rectH: rect.height };
      window.addEventListener("pointermove", onWaypointMove);
      window.addEventListener("pointerup", onWaypointUp);
    }
    function onWaypointMove(e) {
      const d = waypointDragRef.current; if (!d) return;
      const cx = d.rectW / 2, cy = d.rectH / 2;
      const dx = (e.clientX - d.startX) / (d.rectW * zoom) * 100;
      const dy = (e.clientY - d.startY) / (d.rectH * zoom) * 100;
      const nx = Math.max(1, Math.min(99, d.origX + dx));
      const ny = Math.max(1, Math.min(99, d.origY + dy));
      setCustomPaths && setCustomPaths((ps) => ps.map((p) => {
        if (p.id !== d.pathId) return p;
        const wps = [...(p.waypoints || [])]; wps[d.idx] = { x: nx, y: ny };
        return { ...p, waypoints: wps };
      }));
    }
    function onWaypointUp() { waypointDragRef.current = null; window.removeEventListener("pointermove", onWaypointMove); window.removeEventListener("pointerup", onWaypointUp); }

    // Drag a PATH SEGMENT to insert a new waypoint (bend the path)
    function onSegmentPointerDown(e, pathId, segIdx, midX, midY) {
      if (!canEdit) return;
      e.preventDefault(); e.stopPropagation();
      const rect = mapContainerRef.current.getBoundingClientRect();
      // Insert a new waypoint at the midpoint of the dragged segment
      setCustomPaths && setCustomPaths((ps) => ps.map((p) => {
        if (p.id !== pathId) return p;
        const wps = [...(p.waypoints || [])];
        wps.splice(segIdx, 0, { x: midX, y: midY });
        return { ...p, waypoints: wps };
      }));
      // Now drag this new waypoint (it's at segIdx in the updated array)
      waypointDragRef.current = { pathId, idx: segIdx, startX: e.clientX, startY: e.clientY, origX: midX, origY: midY, rectW: rect.width, rectH: rect.height };
      window.addEventListener("pointermove", onWaypointMove);
      window.addEventListener("pointerup", onWaypointUp);
    }

    function deletePath(id) { setCustomPaths && setCustomPaths((ps) => ps.filter((p) => p.id !== id)); }

    const selLoc = locs.find((l) => l.id === sel);

    // Map inner style (zoom + 3D)
    const innerStyle = {
      // In 3D mode: the WHOLE map card (background + content) tilts together as one unit
      // Scaled down to 80% so the tilted card fits within the container
      ...(is3d ? {
        position: "absolute", inset: 0, zIndex: 1,
        transform: `translate(${panX}px, ${panY}px) scale(${zoom * 0.80}) perspective(1000px) rotateX(36deg)`,
        transformOrigin: "center 58%",
        transition: panDragRef.current ? "none" : "transform 0.35s ease",
        border: "10px solid #5c3a1e",
        borderRadius: 8,
        boxShadow: "0 -30px 80px rgba(0,0,0,0.5), 0 0 0 12px #3d2210, 0 30px 60px rgba(0,0,0,0.6)",
        overflow: "hidden",
      } : {
        position: "absolute", inset: 0, zIndex: 1,
        transform: `scale(${zoom})`,
        transformOrigin: "center center",
        transition: "transform 0.35s ease",
      })
    };

    return React.createElement("div", { style: { display: "grid", gridTemplateColumns: selLoc ? "1fr 360px" : "1fr", height: "100%", minHeight: 0 } },
      // ===== Map stage =====
      // Outer container: shows "table" around the tilted map card in 3D
      React.createElement("div", { ref: mapContainerRef, style: { position: "relative", minWidth: 0, overflow: "hidden",
        background: is3d ? "#0d0a14" : "#0c1418",
        cursor: freehand ? "crosshair" : "default" } },
        // Three.js outdoor scene — flat, fills entire container behind the tilted map card
        is3d && React.createElement(WorldScene3D, null),
        // The map card — in 3D mode tilts as one unit (WorldCanvas + content together)
        React.createElement("div", { style: innerStyle },
          // WorldCanvas: background of the map card
          React.createElement(WorldCanvas, { bgImg, is3d }),
          // Ambient cloud layer
          React.createElement(CloudLayer, null),
          // Routes (auto + custom) — viewBox 0-100 coordinate space
          React.createElement("svg", { viewBox: "0 0 100 100", preserveAspectRatio: "none",
            style: { position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, overflow: "visible" } },
            // Auto routes — road-like double stroke
            routePairs(discovered).map(([a, b], i) => React.createElement(React.Fragment, { key: "auto" + i },
              React.createElement("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "#3a2810", strokeWidth: 1.0, vectorEffect: "non-scaling-stroke" }),
              React.createElement("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, stroke: "#c4a060", strokeWidth: 0.45, vectorEffect: "non-scaling-stroke" }))),
            // Preview while selecting second pin
            pathingFrom && (function() {
              const fromLoc = locs.find((l) => l.id === pathingFrom);
              if (!fromLoc) return null;
              return React.createElement("circle", { cx: fromLoc.x, cy: fromLoc.y, r: 2, fill: pathColor, opacity: 0.9, vectorEffect: "non-scaling-stroke" });
            })(),
            // Custom paths — road-like double stroke; freehand paths use p.points, normal paths use from/to/waypoints
            paths.map((p) => {
              var allPts;
              if (p.freehand) {
                allPts = (p.points || []).map((pt) => [pt.x, pt.y]);
                if (allPts.length < 2) return null;
              } else {
                const fromLoc = locs.find((l) => l.id === p.from);
                const toLoc = locs.find((l) => l.id === p.to);
                if (!fromLoc || !toLoc) return null;
                const wps = p.waypoints || [];
                allPts = [[fromLoc.x, fromLoc.y], ...wps.map((w) => [w.x, w.y]), [toLoc.x, toLoc.y]];
              }
              const midIdx = Math.floor(allPts.length / 2);
              const [mx, my] = allPts[midIdx];
              const col = p.color || "#c4a060";
              const ptStr = allPts.map(([x, y]) => x + " " + y).join(" ");
              const wps = p.freehand ? [] : (p.waypoints || []);
              return React.createElement(React.Fragment, { key: p.id },
                canEdit && React.createElement("polyline", { points: ptStr, fill: "none", stroke: "transparent", strokeWidth: 4, style: { cursor: "pointer" },
                  onMouseEnter: () => setHoveredPath(p.id), onMouseLeave: () => setHoveredPath(null) }),
                React.createElement("polyline", { points: ptStr, fill: "none", stroke: "#160a00", strokeWidth: 3.5, strokeLinejoin: "round", vectorEffect: "non-scaling-stroke",
                  onMouseEnter: canEdit ? () => setHoveredPath(p.id) : undefined, onMouseLeave: canEdit ? () => setHoveredPath(null) : undefined }),
                React.createElement("polyline", { points: ptStr, fill: "none", stroke: col, strokeWidth: 1.8, strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" }),
                canEdit && hoveredPath === p.id && React.createElement("circle", { cx: mx, cy: my, r: 2.4, fill: "rgba(20,14,28,0.95)", stroke: col, strokeWidth: 0.5, style: { cursor: "pointer" }, onClick: (e) => { e.stopPropagation(); deletePath(p.id); } }),
                canEdit && hoveredPath === p.id && React.createElement("text", { x: mx, y: my + 0.4, textAnchor: "middle", dominantBaseline: "middle", fontSize: 3.0, fill: "#fff", style: { cursor: "pointer", userSelect: "none" }, onClick: (e) => { e.stopPropagation(); deletePath(p.id); } }, "×"),
                // Bend/waypoint handles only on non-freehand paths
                !p.freehand && canEdit && hoveredPath === p.id && allPts.slice(0, -1).map(([ax, ay], si) => {
                  const [bx, by] = allPts[si + 1];
                  const smx = (ax + bx) / 2, smy = (ay + by) / 2;
                  return React.createElement("circle", { key: "s" + si, cx: smx, cy: smy, r: 0.7, fill: col, stroke: "rgba(255,255,255,0.6)", strokeWidth: 0.25, style: { cursor: "grab" }, onPointerDown: (e) => { e.stopPropagation(); onSegmentPointerDown(e, p.id, si, smx, smy); } });
                }),
                !p.freehand && canEdit && hoveredPath === p.id && wps.map((wp, i) => React.createElement("circle", { key: "w" + i, cx: wp.x, cy: wp.y, r: 1.1, fill: col, stroke: "#fff", strokeWidth: 0.35, style: { cursor: "grab" }, onPointerDown: (e) => { e.stopPropagation(); onWaypointPointerDown(e, p.id, i); } })));
            }).filter(Boolean),
            // Live preview while freehand drawing
            previewPts && previewPts.length >= 2 && React.createElement("polyline", {
              points: previewPts.map((pt) => pt.x + " " + pt.y).join(" "),
              fill: "none", stroke: pathColor, strokeWidth: 1.5, strokeDasharray: "2 1.2",
              vectorEffect: "non-scaling-stroke", opacity: 0.8, pointerEvents: "none" })),
          // Parchment border overlay
          React.createElement(ParchmentBorder, null),
          // Pins
          visible.map((l) => React.createElement(Pin, { key: l.id, loc: l,
            active: sel === l.id || pathingFrom === l.id,
            isPathingFrom: pathingFrom === l.id,
            onClick: () => handlePinClick(l.id),
            onPointerDown: canEdit && !drawingPath && !freehand ? (e) => onPinPointerDown(e, l) : null }))),

        // ===== Top controls bar =====
        React.createElement("div", { style: { position: "absolute", top: 16, left: 20, right: 20, zIndex: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
          React.createElement("div", { className: "col" },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 11, letterSpacing: "0.22em", color: "var(--ink-dim)" } }, "THE REALM OF"),
            editingName && canEdit
              ? React.createElement("input", { autoFocus: true, className: "input", defaultValue: worldMapName || "Aldermoor",
                  style: { fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, height: 34, padding: "0 8px", maxWidth: 200, background: "rgba(13,10,20,0.8)" },
                  onBlur: (e) => { if (setWorldMapName) setWorldMapName(e.target.value || "Aldermoor"); setEditingName(false); },
                  onKeyDown: (e) => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") setEditingName(false); } })
              : React.createElement("div", { onClick: canEdit ? () => setEditingName(true) : undefined,
                  title: canEdit ? "Click to rename" : undefined,
                  style: { fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, background: "linear-gradient(180deg, var(--gold-bright), var(--gold-deep))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", cursor: canEdit ? "text" : "default" } },
                  worldMapName || "Aldermoor")),
          React.createElement("div", { className: "grow" }),
          // Zoom controls
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 4, background: "rgba(13,10,20,0.8)", border: "1px solid var(--hair)", borderRadius: 100, padding: "4px 8px", backdropFilter: "blur(6px)" } },
            React.createElement("button", { onClick: () => setZoom((z) => Math.max(0.4, z - 0.2)), style: { background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" } }, "−"),
            React.createElement("span", { style: { fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-dim)", minWidth: 32, textAlign: "center" } }, Math.round(zoom * 100) + "%"),
            React.createElement("button", { onClick: () => setZoom((z) => Math.min(3, z + 0.2)), style: { background: "none", border: "none", color: "var(--ink-soft)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" } }, "+"),
            React.createElement("button", { onClick: () => setZoom(1), style: { background: "none", border: "none", color: "var(--ink-dim)", cursor: "pointer", fontSize: 10, padding: "0 4px" } }, "↺")),
          // 3D toggle
          React.createElement("button", { className: "btn sm" + (is3d ? " primary" : " ghost"), onClick: () => setIs3d((x) => !x) },
            React.createElement(Icon, { name: "layers", size: 14 }), is3d ? "2D" : "3D"),
          React.createElement("span", { className: "tag gold" }, discovered.length + " / " + locs.length + " discovered"),
          // Weather pill — DM can set, all can see
          (weather || canEdit) && React.createElement("button", {
            className: "btn sm ghost", title: canEdit ? "Click to cycle weather/time conditions" : undefined,
            onClick: canEdit ? cycleWeather : undefined,
            style: { cursor: canEdit ? "pointer" : "default", gap: 5 } },
            weather || "🌍 Set weather",
            canEdit && weather && React.createElement("span", { onClick: (e) => { e.stopPropagation(); clearWeather(); }, style: { marginLeft: 2, opacity: 0.6, fontSize: 11 } }, "✕")),
          // Distance result banner
          measureResult && React.createElement("div", { style: { background: "rgba(145,112,240,0.2)", border: "1px solid rgba(145,112,240,0.4)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "var(--amethyst)", display: "flex", alignItems: "center", gap: 8 } },
            React.createElement("span", null, "📏 " + measureResult.from + " → " + measureResult.to + ": ~" + measureResult.days + " day" + (measureResult.days !== 1 ? "s" : "") + " travel"),
            React.createElement("span", { onClick: () => setMeasureResult(null), style: { cursor: "pointer", opacity: 0.6 } }, "✕")),
          canEdit && React.createElement(React.Fragment, null,
            React.createElement("input", { ref: bgInputRef, type: "file", accept: "image/*", hidden: true, onChange: handleBgUpload }),
            bgImg && React.createElement("button", { className: "btn sm ghost", onClick: () => onBgImgChange && onBgImgChange(null), title: "Clear custom background" },
              React.createElement(Icon, { name: "x", size: 13 }), "Clear bg"),
            React.createElement("button", { className: "btn sm ghost", onClick: () => bgInputRef.current.click() },
              React.createElement(Icon, { name: "upload", size: 14 }), "Map image"),
            // Distance measuring tool
            React.createElement("button", { className: "btn sm" + (measuring ? " primary" : " ghost"),
              title: measuring ? "Click two pins to measure travel distance between them" : "Measure travel time between locations",
              onClick: () => { setMeasuring((x) => !x); setMeasureFrom(null); setMeasureResult(null); setDrawingPath(false); setFreehand(false); } },
              "📏 " + (measuring ? (measureFrom ? "click destination…" : "click origin…") : "Measure")),
            // Pin-to-pin path drawing
            React.createElement("button", { className: "btn sm" + (drawingPath ? " primary" : " ghost"),
              title: drawingPath ? "Click first pin then second pin to draw path." : "Draw a path between two location pins",
              onClick: () => { setDrawingPath((x) => !x); setPathingFrom(null); if (!drawingPath) { setFreehand(false); setMeasuring(false); } } },
              "〜 " + (drawingPath ? (pathingFrom ? "click end pin…" : "click start pin…") : "Draw path")),
            // Freehand path drawing
            React.createElement("button", { className: "btn sm" + (freehand ? " primary" : " ghost"),
              title: freehand ? "Click and drag to sketch a path" : "Sketch a freehand path anywhere",
              onClick: () => { setFreehand((x) => !x); if (!freehand) { setDrawingPath(false); setPathingFrom(null); setMeasuring(false); } } },
              "✏ " + (freehand ? "Sketching…" : "Freehand")),
            (drawingPath || freehand) && React.createElement("div", { style: { display: "flex", gap: 4 } },
              PATH_COLORS.map((c) => React.createElement("button", { key: c, onClick: () => setPathColor(c),
                style: { width: 18, height: 18, borderRadius: "50%", background: c, border: "2px solid " + (pathColor === c ? "#fff" : "transparent"), cursor: "pointer" } }))),
            React.createElement("button", { className: "btn sm primary", onClick: () => setAddOpen(true) },
              React.createElement(Icon, { name: "plus", size: 14 }), "Add location"))),

        // ===== Legend =====
        React.createElement("div", { style: { position: "absolute", bottom: 16, left: 20, zIndex: 10, display: "flex", gap: 12, flexWrap: "wrap", background: "rgba(12,20,24,0.7)", border: "1px solid var(--hair)", borderRadius: 10, padding: "7px 14px", backdropFilter: "blur(6px)" } },
          Object.entries(TYPES).map(([k, t]) => React.createElement("div", { key: k, className: "row", style: { gap: 5, fontSize: 11.5, color: "var(--ink-soft)" } },
            React.createElement("span", { style: { width: 9, height: 9, borderRadius: "50%", background: t.color } }), t.label)))),

      // ===== Detail panel =====
      selLoc && React.createElement(LocationPanel, { loc: selLoc, maps, canEdit, onClose: () => setSel(null), onOpenMap,
        onToggleDiscovered: () => toggleDiscovered(selLoc.id),
        onEdit: () => setEditLoc(selLoc),
        onDelete: () => deleteLoc(selLoc.id),
        onSaveLoc: saveLoc }),

      // Modals
      React.createElement(LocationForm, { open: addOpen || !!editLoc, loc: editLoc, maps, onClose: () => { setAddOpen(false); setEditLoc(null); }, onSave: saveLoc })
    );
  }

  // Parchment border overlay
  function ParchmentBorder() {
    return React.createElement("div", { style: {
      position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none",
      boxShadow: "inset 0 0 0 12px #8a6030, inset 0 0 0 14px #c9a060, inset 0 0 60px rgba(100,65,20,0.85), inset 0 0 140px rgba(80,50,15,0.6)",
      borderRadius: 4,
    } },
      // Torn/rough inner edge using radial gradient
      React.createElement("div", { style: {
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 70%, rgba(100,65,20,0.55) 85%, rgba(70,40,10,0.8) 100%)",
        pointerEvents: "none",
      } }),
      // Corner decorations
      ["top-left","top-right","bottom-left","bottom-right"].map((pos, i) => React.createElement("div", { key: pos, style: {
        position: "absolute",
        top: pos.includes("top") ? 6 : "auto", bottom: pos.includes("bottom") ? 6 : "auto",
        left: pos.includes("left") ? 6 : "auto", right: pos.includes("right") ? 6 : "auto",
        width: 28, height: 28, borderRadius: "50%",
        background: "radial-gradient(circle, #c9a06088 0%, #8a603066 60%, transparent 100%)",
        border: "1px solid #c9a06055",
      } })));
  }

  // Ambient cloud layer
  function CloudLayer() {
    const clouds = [
      { top: "12%", left: "8%",  w: 140, h: 45, op: 0.12, dur: "22s", anim: "wdrift1" },
      { top: "28%", left: "55%", w: 180, h: 55, op: 0.09, dur: "30s", anim: "wdrift2" },
      { top: "65%", left: "20%", w: 120, h: 38, op: 0.1,  dur: "18s", anim: "wdrift3" },
      { top: "72%", left: "68%", w: 160, h: 50, op: 0.08, dur: "25s", anim: "wdrift1" },
      { top: "45%", left: "3%",  w: 100, h: 35, op: 0.11, dur: "20s", anim: "wdrift2" },
      { top: "15%", left: "75%", w: 130, h: 42, op: 0.09, dur: "28s", anim: "wdrift3" },
    ];
    return React.createElement("div", { style: { position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" } },
      clouds.map((c, i) => React.createElement("div", { key: i, style: {
        position: "absolute", top: c.top, left: c.left,
        width: c.w, height: c.h, borderRadius: "50%",
        background: "rgba(255,255,255," + c.op + ")",
        filter: "blur(18px)",
        animation: c.anim + " " + c.dur + " ease-in-out infinite",
        animationDelay: (i * 3) + "s",
      } })));
  }

  // Three.js dungeon room scene — same dark-room aesthetic as the battle map (behind the tilted world map card)
  function WorldScene3D() {
    const mountRef = useRef(null);
    useEffect(function() {
      const T = window.THREE; if (!T || !mountRef.current) return;
      const cont = mountRef.current;
      const w = cont.clientWidth, h = cont.clientHeight;
      const scene = new T.Scene();
      scene.fog = new T.FogExp2(0x0d0a14, 0.010);
      const renderer = new T.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      renderer.setClearColor(0x0d0a14, 1);
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      cont.appendChild(renderer.domElement);
      const camera = new T.PerspectiveCamera(50, w / h, 0.1, 200);
      camera.position.set(0, 7, 15); camera.lookAt(0, 0, 0);

      // Lighting — warm torchlight dungeon
      scene.add(new T.HemisphereLight(0x9a8aaa, 0x1a1020, 0.45));
      var key = new T.DirectionalLight(0xfff0d8, 0.9); key.position.set(8, 18, 10); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024); scene.add(key);
      var fill = new T.DirectionalLight(0x9170f0, 0.22); fill.position.set(-10, 6, -8); scene.add(fill);

      // Stone floor
      var floorCv = document.createElement("canvas"); floorCv.width = 512; floorCv.height = 512;
      var fc = floorCv.getContext("2d");
      fc.fillStyle = "#1e1828"; fc.fillRect(0, 0, 512, 512);
      for (var i = 0; i < 600; i++) {
        fc.fillStyle = "rgba(" + (20 + Math.floor(Math.random()*15)) + "," + (14 + Math.floor(Math.random()*10)) + "," + (28 + Math.floor(Math.random()*10)) + ",0.4)";
        var rr = 4 + Math.random()*20; fc.beginPath(); fc.arc(Math.random()*512, Math.random()*512, rr, 0, 7); fc.fill();
      }
      fc.strokeStyle = "rgba(255,255,255,0.05)"; fc.lineWidth = 2;
      for (var i = 0; i < 512; i += 64) { fc.beginPath(); fc.moveTo(i,0); fc.lineTo(i,512); fc.stroke(); fc.beginPath(); fc.moveTo(0,i); fc.lineTo(512,i); fc.stroke(); }
      var floorTex = new T.CanvasTexture(floorCv); floorTex.wrapS = T.RepeatWrapping; floorTex.wrapT = T.RepeatWrapping; floorTex.repeat.set(8, 8);
      var floor = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshStandardMaterial({ map: floorTex, roughness: 0.95 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -5; floor.receiveShadow = true; scene.add(floor);

      // Stone brick walls
      var wallCv = document.createElement("canvas"); wallCv.width = 512; wallCv.height = 512;
      var wc = wallCv.getContext("2d");
      wc.fillStyle = "#1a1520"; wc.fillRect(0, 0, 512, 512);
      var bH = 40, bW = 90, mort = 4;
      for (var row = 0; row < 14; row++) {
        var off = (row % 2) * (bW / 2);
        for (var col = -1; col < 7; col++) {
          var bx = col*bW + off, by = row*bH, sh = 0.85 + Math.random()*0.15;
          wc.fillStyle = "rgb(" + Math.floor(38*sh) + "," + Math.floor(30*sh) + "," + Math.floor(48*sh) + ")";
          wc.fillRect(bx+mort, by+mort, bW-mort*2, bH-mort*2);
        }
      }
      var wallTex = new T.CanvasTexture(wallCv); wallTex.wrapS = T.RepeatWrapping; wallTex.wrapT = T.RepeatWrapping; wallTex.repeat.set(3, 2);
      var wallMat = new T.MeshStandardMaterial({ map: wallTex, roughness: 0.92, metalness: 0 });
      var wDist = 22, wH = 14, wY = -5 + wH/2;
      [[0, wDist, 50, wH, 0.5],[0, -wDist, 50, wH, 0.5],[wDist, 0, 0.5, wH, 50],[-wDist, 0, 0.5, wH, 50]].forEach(function(p) {
        var wall = new T.Mesh(new T.BoxGeometry(p[2], p[3], p[4]), wallMat);
        wall.position.set(p[0], wY, p[1]); wall.receiveShadow = true; scene.add(wall);
      });
      // Ceiling
      var ceil = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshStandardMaterial({ color: 0x120e1a, roughness: 1.0 }));
      ceil.rotation.x = Math.PI/2; ceil.position.y = -5 + wH; scene.add(ceil);

      // Wooden table — the world map card rests on this
      var woodCv = document.createElement("canvas"); woodCv.width = 256; woodCv.height = 256;
      var woc = woodCv.getContext("2d");
      woc.fillStyle = "#4a2e12"; woc.fillRect(0, 0, 256, 256);
      for (var i = 0; i < 40; i++) {
        woc.strokeStyle = "rgba(" + (30+Math.floor(Math.random()*20)) + "," + (18+Math.floor(Math.random()*10)) + ",8," + (0.18+Math.random()*0.22) + ")";
        woc.lineWidth = 1 + Math.random()*2;
        woc.beginPath(); woc.moveTo(Math.random()*256, 0); woc.lineTo(Math.random()*256, 256); woc.stroke();
      }
      var woodTex = new T.CanvasTexture(woodCv); woodTex.wrapS = T.RepeatWrapping; woodTex.wrapT = T.RepeatWrapping; woodTex.repeat.set(4, 2);
      var tableMat = new T.MeshStandardMaterial({ map: woodTex, roughness: 0.82, metalness: 0.02 });
      var legMat = new T.MeshStandardMaterial({ color: 0x3d2210, roughness: 0.88 });
      // Table top — wide enough to hold the world map card
      var tableTop = new T.Mesh(new T.BoxGeometry(20, 0.45, 13), tableMat);
      tableTop.position.set(0, -1.6, 0); tableTop.receiveShadow = true; tableTop.castShadow = true; scene.add(tableTop);
      // Table edge trim
      var trimMat = new T.MeshStandardMaterial({ color: 0x6b4020, roughness: 0.9 });
      [[20.4, 0.5, 0.35, 0, 0, 6.3],[20.4, 0.5, 0.35, 0, 0, -6.3],[0.35, 0.5, 13, 9.8, 0, 0],[-9.8, 0, 0]].forEach(function(p, pi) {
        if (pi < 3) { var trim = new T.Mesh(new T.BoxGeometry(p[0],p[1],p[2]), trimMat); trim.position.set(p[3], -1.6, p[5]); scene.add(trim); }
      });
      // 4 legs
      var legH = 4.2, legY = -1.6 - 0.22 - legH/2;
      [[8.8, -5.7],[- 8.8, -5.7],[8.8, 5.7],[-8.8, 5.7]].forEach(function(p) {
        var leg = new T.Mesh(new T.BoxGeometry(0.6, legH, 0.6), legMat);
        leg.position.set(p[0], legY, p[1]); leg.castShadow = true; leg.receiveShadow = true; scene.add(leg);
        var foot = new T.Mesh(new T.BoxGeometry(0.85, 0.14, 0.85), legMat);
        foot.position.set(p[0], legY - legH/2 + 0.07, p[1]); scene.add(foot);
      });
      // Remove the small plinth (table replaces it)

      // Wall torches with flickering point lights
      var torchMat = new T.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.88 });
      var flameMat = new T.MeshStandardMaterial({ color: 0xff9030, emissive: 0xff5010, emissiveIntensity: 1.4, roughness: 0.5 });
      var torchLights = [], torchFlames = [];
      [[-wDist+0.6, 2.5, 0],[wDist-0.6, 2.5, 0],[0, 2.5, wDist-0.6],[0, 2.5, -wDist+0.6]].forEach(function(pos) {
        var stick = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.5, 8), torchMat);
        stick.position.set(pos[0], pos[1], pos[2]); scene.add(stick);
        var flame = new T.Mesh(new T.SphereGeometry(0.14, 10, 10), flameMat);
        flame.position.set(pos[0], pos[1]+0.32, pos[2]); flame.scale.set(1, 1.3, 1); scene.add(flame); torchFlames.push(flame);
        var pl = new T.PointLight(0xff7020, 2.5, 22);
        pl.position.set(pos[0], pos[1]+0.4, pos[2]); scene.add(pl); torchLights.push(pl);
      });

      var raf, t = 0;
      function loop() {
        raf = requestAnimationFrame(loop);
        t += 0.004;
        camera.position.x = Math.sin(t*0.22)*0.9;
        camera.position.y = 7 + Math.sin(t*0.16)*0.25;
        camera.lookAt(0, 0, 0);
        torchLights.forEach(function(pl, i) { pl.intensity = 2.2 + Math.sin(t*8+i*1.5)*0.45 + Math.sin(t*13+i*2.3)*0.22; });
        torchFlames.forEach(function(f, i) { f.scale.y = 1.3 + Math.sin(t*9+i*1.7)*0.13; });
        renderer.render(scene, camera);
      }
      loop();
      function resize() { renderer.setSize(cont.clientWidth, cont.clientHeight); camera.aspect = cont.clientWidth / cont.clientHeight; camera.updateProjectionMatrix(); }
      const ro = new ResizeObserver(resize); ro.observe(cont); setTimeout(resize, 0);
      return function() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement); };
    }, []);
    return React.createElement("div", { ref: mountRef, style: { position: "absolute", inset: 0 } });
  }

  // World background canvas
  function WorldCanvas({ bgImg, is3d }) {
    // Map card background (same in 2D and 3D — the dungeon room is the surrounding scene)
    const outdoorBg = "radial-gradient(60% 50% at 38% 64%, rgba(58,74,46,0.95), transparent 70%), radial-gradient(45% 42% at 64% 42%, rgba(74,66,44,0.9), transparent 72%), radial-gradient(120% 120% at 50% 50%, #16323a, #0b171c)";
    return React.createElement("div", { style: { position: "absolute", inset: 0, zIndex: 1,
      background: bgImg
        ? "url(" + bgImg + ") center/cover no-repeat"
        : (is3d ? outdoorBg : "radial-gradient(60% 50% at 38% 64%, rgba(58,74,46,0.95), transparent 70%), radial-gradient(45% 42% at 64% 42%, rgba(74,66,44,0.9), transparent 72%), radial-gradient(120% 120% at 50% 50%, #16323a, #0b171c)") } },
      !bgImg && React.createElement("div", { style: { position: "absolute", inset: 0, opacity: 0.45,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "64px 64px" } }),
      React.createElement("div", { style: { position: "absolute", inset: 0, boxShadow: "inset 0 0 120px rgba(0,0,0,0.5)" } }));
  }

  function Pin({ loc, active, isPathingFrom, onClick, onPointerDown }) {
    const t = TYPES[loc.type] || TYPES.landmark;
    const undiscovered = !loc.discovered;
    return React.createElement("button", { onClick, onPointerDown,
      style: { position: "absolute", left: loc.x + "%", top: loc.y + "%", transform: "translate(-50%,-100%)", zIndex: active ? 8 : 6,
        background: "none", border: "none", cursor: onPointerDown ? "grab" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        touchAction: "none", filter: isPathingFrom ? "drop-shadow(0 0 8px " + t.color + ")" : "none" } },
      React.createElement("div", { style: { display: "grid", placeItems: "center", width: 28, height: 28, borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)",
        background: undiscovered ? "rgba(40,40,50,0.85)" : "radial-gradient(circle at 40% 35%, " + t.color + ", " + t.color + "99)",
        border: "2px solid " + (undiscovered ? "var(--ink-faint)" : "#fff8"),
        boxShadow: active ? "0 0 0 4px " + t.color + "55, 0 4px 14px rgba(0,0,0,0.6)" : "0 4px 14px rgba(0,0,0,0.6)" } },
        React.createElement("div", { style: { transform: "rotate(45deg)", color: undiscovered ? "var(--ink-dim)" : "#fff", display: "grid", placeItems: "center" } },
          React.createElement(Icon, { name: undiscovered ? "search" : t.icon, size: 18 }))),
      React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 12.5, fontWeight: 600, color: undiscovered ? "var(--ink-dim)" : "var(--ink)", background: "rgba(12,20,24,0.75)", padding: "2px 9px", borderRadius: 100, whiteSpace: "nowrap", border: "1px solid var(--hair)" } },
        undiscovered ? "Undiscovered" : loc.name));
  }

  function LocationPanel({ loc, maps, canEdit, onClose, onOpenMap, onToggleDiscovered, onEdit, onDelete, onSaveLoc }) {
    const t = TYPES[loc.type] || TYPES.landmark;
    const allMapsForPanel = maps.concat((function() { try { return JSON.parse(localStorage.getItem("nz_custommaps") || "[]"); } catch(e) { return []; } })());
    const locMaps = loc.maps.map((id) => allMapsForPanel.find((m) => m.id === id)).filter(Boolean);
    const [newNote, setNewNote] = useState("");
    const notes = loc.notes || [];
    function addNote() {
      if (!newNote.trim()) return;
      onSaveLoc && onSaveLoc({ ...loc, notes: [...notes, { id: "n" + Date.now(), text: newNote.trim(), date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }] });
      setNewNote("");
    }
    function deleteNote(id) { onSaveLoc && onSaveLoc({ ...loc, notes: notes.filter((n) => n.id !== id) }); }
    return React.createElement("div", { style: { borderLeft: "1px solid var(--hair)", background: "var(--bg-2)", display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto" } },
      React.createElement("div", { className: "panel-h", style: { borderRadius: 0 } },
        React.createElement("span", { style: { color: t.color } }, React.createElement(Icon, { name: t.icon, size: 18 })),
        React.createElement("h3", { style: { color: t.color } }, t.label),
        React.createElement("div", { className: "spacer" }),
        React.createElement("button", { className: "icon-btn", style: { width: 30, height: 30 }, onClick: onClose }, React.createElement(Icon, { name: "x", size: 15 }))),
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 16 } },
        React.createElement("h2", { style: { fontSize: 22, color: "var(--ink)" } }, loc.name),
        !loc.discovered && React.createElement("span", { className: "tag", style: { alignSelf: "flex-start" } }, "Undiscovered · hidden from players"),
        React.createElement("p", { className: "muted", style: { margin: 0, fontSize: 14, lineHeight: 1.6 } }, loc.desc),
        // Location news feed (DM notes)
        canEdit && React.createElement(React.Fragment, null,
          React.createElement("div", { className: "section-title", style: { margin: "4px 0 0" } }, "DM Notes"),
          notes.length === 0 && React.createElement("div", { className: "muted", style: { fontSize: 12 } }, "No notes yet. Add one below."),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
            notes.map((n) => React.createElement("div", { key: n.id, style: { display: "flex", alignItems: "flex-start", gap: 8, background: "var(--surface)", borderRadius: 8, padding: "8px 10px", fontSize: 13 } },
              React.createElement("div", { style: { flex: 1, color: "var(--ink-soft)", lineHeight: 1.45 } },
                n.date && React.createElement("span", { style: { color: "var(--gold-deep)", fontSize: 11, fontFamily: "var(--mono)", marginRight: 6 } }, n.date),
                n.text),
              React.createElement("button", { onClick: () => deleteNote(n.id), style: { background: "none", border: "none", color: "var(--red-bright)", cursor: "pointer", fontSize: 13, opacity: 0.7, padding: "0 2px", flexShrink: 0 } }, "✕")))),
          React.createElement("div", { style: { display: "flex", gap: 6 } },
            React.createElement("input", { className: "input", value: newNote, onChange: (e) => setNewNote(e.target.value),
              placeholder: "Add a note… (e.g. 'Goblins spotted - Session 8')",
              onKeyDown: (e) => e.key === "Enter" && addNote(),
              style: { flex: 1, fontSize: 13 } }),
            React.createElement("button", { className: "btn sm primary", onClick: addNote, disabled: !newNote.trim() }, "+"))),
        React.createElement("div", { className: "section-title", style: { margin: "4px 0 0" } }, "Saved maps · " + locMaps.length),
        locMaps.length === 0 && React.createElement("div", { className: "muted", style: { fontSize: 13 } }, "No maps saved here yet."),
        locMaps.map((m) => React.createElement("div", { key: m.id, className: "panel", style: { overflow: "hidden" } },
          React.createElement("div", { style: { height: 80, background: m.img ? "url(" + m.img + ") center/cover" : "#1b1820", borderBottom: "1px solid var(--hair)" } }),
          React.createElement("div", { style: { padding: 12 } },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 600, fontSize: 14.5 } }, m.name),
            React.createElement("div", { className: "muted", style: { fontSize: 12, marginTop: 2 } }, m.cols + "×" + m.rows + " grid"),
            React.createElement("div", { className: "row", style: { gap: 8, marginTop: 12 } },
              React.createElement("button", { className: "btn primary sm grow", onClick: () => onOpenMap && onOpenMap(m.id) }, React.createElement(Icon, { name: "play", size: 14 }), "Open at table"))))),
        canEdit && React.createElement("div", { className: "row", style: { gap: 8, marginTop: 4, flexWrap: "wrap" } },
          React.createElement("button", { className: "btn grow", onClick: onEdit }, React.createElement(Icon, { name: "settings", size: 15 }), "Edit"),
          React.createElement("button", { className: "btn", onClick: onToggleDiscovered }, React.createElement(Icon, { name: loc.discovered ? "eyeOff" : "eye", size: 15 }), loc.discovered ? "Hide" : "Reveal"),
          React.createElement("button", { className: "btn ghost", onClick: () => confirm("Delete this location?") && onDelete(), style: { color: "var(--red-bright)" } }, React.createElement(Icon, { name: "skull", size: 15 }), "Delete")))
    );
  }

  function LocationForm({ open, loc, maps, onClose, onSave }) {
    const allMaps = maps.concat((function() { try { return JSON.parse(localStorage.getItem("nz_custommaps") || "[]"); } catch(e) { return []; } })());
    const blank = { id: "loc" + Date.now(), name: "", type: "town", discovered: true, x: 50, y: 50, maps: [], desc: "" };
    const [f, setF] = useState(blank);
    React.useEffect(() => { if (open) setF(loc ? { ...loc } : { ...blank, id: "loc" + Date.now() }); }, [open]);
    function up(k, v) { setF((s) => ({ ...s, [k]: v })); }
    function toggleMap(id) { setF((s) => ({ ...s, maps: s.maps.includes(id) ? s.maps.filter((m) => m !== id) : [...s.maps, id] })); }
    return React.createElement(Modal, { open, onClose, title: loc ? "Edit Location" : "Add a Location", sub: "Pin appears at map centre — drag it into position after saving.", w: 520 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 16 } },
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Name"),
          React.createElement("input", { className: "input", value: f.name, onChange: (e) => up("name", e.target.value), placeholder: "e.g. Port Marrow", autoFocus: true })),
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Type"),
          React.createElement("div", { className: "row", style: { gap: 6, flexWrap: "wrap" } },
            Object.entries(TYPES).map(([k, t]) => React.createElement("button", { key: k, onClick: () => up("type", k), style: typeChip(f.type === k, t.color) }, React.createElement(Icon, { name: t.icon, size: 14 }), t.label)))),
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Linked battle maps"),
          React.createElement("div", { className: "row", style: { gap: 6, flexWrap: "wrap" } },
            allMaps.map((m) => React.createElement("button", { key: m.id, onClick: () => toggleMap(m.id), style: typeChip(f.maps.includes(m.id), "var(--gold)") }, m.name)))),
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Description"),
          React.createElement("textarea", { className: "input", rows: 3, value: f.desc, onChange: (e) => up("desc", e.target.value) })),
        React.createElement("label", { className: "row", style: { gap: 8, cursor: "pointer", fontSize: 14 } },
          React.createElement("input", { type: "checkbox", checked: f.discovered, onChange: (e) => up("discovered", e.target.checked) }), "Discovered (visible to players)"),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", disabled: !f.name, onClick: () => onSave(f) }, React.createElement(Icon, { name: "check", size: 16 }), loc ? "Save changes" : "Add location")))
    );
  }

  function routePairs(locs) {
    const pairs = [];
    for (let i = 0; i < locs.length - 1; i++) pairs.push([locs[i], locs[i + 1]]);
    return pairs;
  }
  function typeChip(active, color) {
    return { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
      border: "1px solid " + (active ? color : "var(--hair)"), background: active ? color + "1e" : "var(--surface-2)", color: active ? color : "var(--ink-soft)" };
  }

  window.World = World;
})();
