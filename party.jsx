/* PARTY — character roster with D&D Beyond links */
(function () {
  const { useState } = React;
  const Icon = window.Icon;
  const { Avatar, HPBar, StatGrid, Modal } = window.NZUI;

  function Party({ party, dm }) {
    const [detail, setDetail] = useState(null);
    return React.createElement("div", { className: "view-pad" },
      React.createElement("div", { className: "row", style: { marginBottom: 22, gap: 12, flexWrap: "wrap", alignItems: "flex-start" } },
        React.createElement("p", { className: "muted", style: { margin: 0, maxWidth: 540, flex: 1 } }, "The heroes of the realm, allegedly. Each sheet links straight to D&D Beyond \u2014 hit ", React.createElement("span", { style: { color: "var(--gold)" } }, "Open sheet"), " to jump in."),
        React.createElement("a", { className: "btn", href: "https://www.dndbeyond.com/campaigns", target: "_blank", rel: "noopener" }, React.createElement(Icon, { name: "link", size: 16 }), "Open campaign on D&D Beyond")),

      React.createElement("div", { className: "section-title" }, "The Party \u00b7 Level 7"),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: 16 } },
        party.map((p) => React.createElement(CharCard, { key: p.id, p, onOpen: () => setDetail(p) }))),

      React.createElement("div", { className: "section-title", style: { marginTop: 30 } }, "Behind the Screen"),
      React.createElement("div", { className: "panel", style: { padding: 18, display: "flex", alignItems: "center", gap: 16, maxWidth: 520 } },
        React.createElement(Avatar, { name: dm.name, ring: dm.ring, size: 52, glow: true }),
        React.createElement("div", { className: "col", style: { flex: 1 } },
          React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 600, fontSize: 16 } }, dm.name),
          React.createElement("div", { className: "muted", style: { fontSize: 13 } }, "Dungeon Master \u00b7 Keeper of the chaos")),
        React.createElement("span", { className: "tag gold" }, "DM")),

      React.createElement(CharDetail, { p: detail, onClose: () => setDetail(null) })
    );
  }

  function CharCard({ p, onOpen }) {
    return React.createElement("div", { className: "panel", style: { overflow: "hidden", display: "flex", flexDirection: "column" } },
      React.createElement("div", { style: { padding: "18px 18px 14px", display: "flex", gap: 14, alignItems: "center" } },
        React.createElement(Avatar, { name: p.name, ring: p.ring, size: 60, glow: true }),
        React.createElement("div", { className: "col", style: { flex: 1, minWidth: 0 } },
          React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 600, fontSize: 17, color: "var(--ink)", lineHeight: 1.15 } }, p.name),
          React.createElement("div", { className: "muted", style: { fontSize: 13, marginTop: 3 } }, `${p.race} ${p.cls} \u00b7 ${p.subclass}`),
          React.createElement("div", { className: "row", style: { gap: 6, marginTop: 7 } },
            React.createElement("span", { className: "tag gold", style: { fontSize: 10 } }, "Lv " + p.level),
            React.createElement("span", { className: "tag", style: { fontSize: 10 } }, "Played by " + p.player)))),
      React.createElement("div", { style: { padding: "0 18px" } },
        React.createElement(HPBar, { hp: p.hp, max: p.hpMax })),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: 18 } },
        mini("AC", p.ac, "shield"), mini("Init", (p.init >= 0 ? "+" : "") + p.init, "swords"), mini("Speed", p.speed, "move"), mini("Pass", p.passive, "eye")),
      React.createElement("p", { style: { margin: "0 18px 16px", fontSize: 13, fontStyle: "italic", color: "var(--ink-dim)", lineHeight: 1.5 } }, "\u201c" + p.blurb + "\u201d"),
      React.createElement("div", { className: "row", style: { gap: 9, padding: "0 18px 18px", marginTop: "auto" } },
        React.createElement("button", { className: "btn ghost grow", onClick: onOpen }, React.createElement(Icon, { name: "user", size: 16 }), "Details"),
        React.createElement("a", { className: "btn primary grow", href: p.dndb, target: "_blank", rel: "noopener", style: { textDecoration: "none" } }, React.createElement(Icon, { name: "link", size: 16 }), "Open sheet"))
    );
  }

  function mini(label, val, icon) {
    return React.createElement("div", { style: { background: "var(--bg)", border: "1px solid var(--hair)", borderRadius: 9, padding: "8px 4px", textAlign: "center" } },
      React.createElement("div", { className: "row", style: { justifyContent: "center", gap: 4, color: "var(--gold)" } }, React.createElement(Icon, { name: icon, size: 12 }),
        React.createElement("span", { style: { fontFamily: "var(--display)", fontSize: 9, letterSpacing: "0.08em" } }, label)),
      React.createElement("div", { className: "mono", style: { fontSize: 15, fontWeight: 700, marginTop: 2 } }, val));
  }

  function CharDetail({ p, onClose }) {
    if (!p) return null;
    return React.createElement(Modal, { open: !!p, onClose, title: p.name, sub: `${p.race} ${p.cls} (${p.subclass}) \u00b7 Level ${p.level}`, w: 540 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 18 } },
        React.createElement("div", { className: "row", style: { gap: 16 } },
          React.createElement(Avatar, { name: p.name, ring: p.ring, size: 70, glow: true }),
          React.createElement("div", { style: { flex: 1 } }, React.createElement(HPBar, { hp: p.hp, max: p.hpMax, height: 10 }))),
        React.createElement(StatGrid, { stats: p.stats }),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 } },
          mini("AC", p.ac, "shield"), mini("Init", (p.init >= 0 ? "+" : "") + p.init, "swords"), mini("Speed", p.speed + "ft", "move"), mini("Passive", p.passive, "eye")),
        React.createElement("p", { style: { margin: 0, fontStyle: "italic", color: "var(--ink-soft)", lineHeight: 1.5 } }, "\u201c" + p.blurb + "\u201d"),
        React.createElement("a", { className: "btn primary", href: p.dndb, target: "_blank", rel: "noopener", style: { justifyContent: "center", textDecoration: "none" } }, React.createElement(Icon, { name: "link", size: 16 }), "Open full sheet on D&D Beyond"))
    );
  }

  window.Party = Party;
})();
