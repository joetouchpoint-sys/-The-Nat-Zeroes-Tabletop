/* Shared UI primitives for The Nat Zeroes */
(function () {
  const { useState, useEffect } = React;

  function initials(name) {
    const parts = String(name).replace(/\(.*?\)/g, "").trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  function hashHue(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }

  // Gradient portrait disc with initials
  function Avatar({ name, ring, size = 40, glow = false }) {
    const hue = hashHue(name);
    const bg = `radial-gradient(circle at 32% 28%, hsl(${hue} 42% 34%), hsl(${(hue + 40) % 360} 45% 18%))`;
    return React.createElement("div", {
      style: {
        width: size, height: size, borderRadius: "50%", flex: "none",
        background: bg,
        border: `2px solid ${ring || "var(--gold-deep)"}`,
        boxShadow: glow ? `0 0 14px ${ring}66` : "var(--shadow-1)",
        display: "grid", placeItems: "center",
        fontFamily: "var(--display)", fontWeight: 700,
        fontSize: size * 0.36, color: "rgba(255,255,255,0.92)",
        letterSpacing: "0.02em", textShadow: "0 1px 2px rgba(0,0,0,0.5)",
      },
    }, initials(name));
  }

  // HP bar
  function HPBar({ hp, max, w = "100%", showText = true, height = 8 }) {
    const pct = Math.max(0, Math.min(1, hp / max));
    const col = pct > 0.5 ? "var(--emerald)" : pct > 0.25 ? "var(--gold)" : "var(--red)";
    return React.createElement("div", { style: { width: w } },
      showText && React.createElement("div", { className: "row mono", style: { justifyContent: "space-between", fontSize: 11, color: "var(--ink-dim)", marginBottom: 4 } },
        React.createElement("span", null, "HP"),
        React.createElement("span", { style: { color: col, fontWeight: 700 } }, `${hp} / ${max}`)
      ),
      React.createElement("div", { style: { height, borderRadius: 100, background: "rgba(0,0,0,0.4)", overflow: "hidden", border: "1px solid var(--hair)" } },
        React.createElement("div", { style: { width: `${pct * 100}%`, height: "100%", background: col, borderRadius: 100, transition: "width .35s ease, background .35s" } })
      )
    );
  }

  // Map token (round, draggable-looking)
  function Token({ name, ring, size = 44, bloodied = false, dead = false, condition }) {
    const hue = hashHue(name);
    const bg = `radial-gradient(circle at 32% 28%, hsl(${hue} 42% 36%), hsl(${(hue + 40) % 360} 48% 16%))`;
    return React.createElement("div", {
      style: {
        width: size, height: size, borderRadius: "50%", position: "relative",
        background: bg, border: `2.5px solid ${ring}`,
        boxShadow: `0 3px 10px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.4)${bloodied ? `, 0 0 16px var(--red)` : ""}`,
        display: "grid", placeItems: "center",
        fontFamily: "var(--display)", fontWeight: 700, fontSize: size * 0.34,
        color: "rgba(255,255,255,0.95)", textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        filter: dead ? "grayscale(1) brightness(0.6)" : "none",
        userSelect: "none",
      },
    },
      initials(name),
      dead && React.createElement("div", { style: { position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "var(--red)", fontSize: size * 0.7, fontWeight: 900 } }, "\u00d7"),
      condition && React.createElement("div", { style: { position: "absolute", bottom: -3, right: -3, width: size * 0.34, height: size * 0.34, borderRadius: "50%", background: "var(--amethyst)", border: "2px solid var(--bg)", display: "grid", placeItems: "center", fontSize: size * 0.18, color: "#fff" } }, condition)
    );
  }

  // Modal
  function Modal({ open, onClose, children, w = 540, title, sub }) {
    useEffect(() => {
      if (!open) return;
      const h = (e) => e.key === "Escape" && onClose();
      window.addEventListener("keydown", h);
      return () => window.removeEventListener("keydown", h);
    }, [open, onClose]);
    if (!open) return null;
    return React.createElement("div", {
      onMouseDown: onClose,
      style: { position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,5,14,0.66)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", padding: 24, animation: "pop-in .18s ease both" },
    },
      React.createElement("div", {
        onMouseDown: (e) => e.stopPropagation(),
        className: "panel",
        style: { width: w, maxWidth: "100%", maxHeight: "88vh", overflow: "auto", boxShadow: "var(--shadow-3)" },
      },
        title && React.createElement("div", { className: "panel-h" },
          React.createElement("div", { className: "col" },
            React.createElement("h3", null, title),
            sub && React.createElement("div", { className: "muted", style: { fontSize: 13, marginTop: 3, textTransform: "none", letterSpacing: 0, fontFamily: "var(--sans)" } }, sub)
          ),
          React.createElement("div", { className: "spacer" }),
          React.createElement("button", { className: "icon-btn", onClick: onClose }, React.createElement(window.Icon, { name: "x" }))
        ),
        children
      )
    );
  }

  // Stat block grid (STR/DEX/...)
  function StatGrid({ stats, compact }) {
    const order = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
    const mod = (v) => { const m = Math.floor((v - 10) / 2); return (m >= 0 ? "+" : "") + m; };
    return React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 } },
      order.map((k) => React.createElement("div", { key: k, style: { textAlign: "center", padding: compact ? "6px 4px" : "9px 4px", background: "var(--bg)", border: "1px solid var(--hair)", borderRadius: 8 } },
        React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.1em", color: "var(--gold)" } }, k),
        React.createElement("div", { className: "mono", style: { fontSize: compact ? 15 : 17, fontWeight: 700, color: "var(--ink)" } }, stats[k]),
        React.createElement("div", { className: "mono", style: { fontSize: 11, color: "var(--ink-dim)" } }, mod(stats[k]))
      ))
    );
  }

  window.NZUI = { Avatar, HPBar, Token, Modal, StatGrid, initials, hashHue };
})();
