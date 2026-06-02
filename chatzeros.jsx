/* CHAT ZEROES — aftershow tab: custom stats, awards, leaderboard */
(function () {
  const { useState, useContext, useEffect } = React;
  const Icon = window.Icon;
  const { Modal } = window.NZUI;

  // Accent palette distinct from the main dark-fantasy theme
  const CZ = {
    bg:      "#12101e",
    surface: "#1c1830",
    pop:     "#ff4ecd",   // hot pink
    lime:    "#39ff14",
    teal:    "#00e5cc",
    gold:    "#ffe066",
    muted:   "#8a82aa",
    ink:     "#f0ebff",
  };

  function ChatZeroes({ chatStats, setChatStats, awards, setAwards, party }) {
    const ctx = useContext(window.NZAuth.RoleContext);
    const isDM = ctx.role === "dm";
    const [statEdit, setStatEdit] = useState(null);   // null | false | stat obj
    const [awardEdit, setAwardEdit] = useState(null); // null | false | award obj
    const [winnerEdit, setWinnerEdit] = useState(null); // { award } | null

    function saveStat(s) {
      if (s.id) setChatStats((ss) => ss.map((x) => x.id === s.id ? s : x));
      else setChatStats((ss) => [...ss, { ...s, id: "cs" + Date.now() }]);
      setStatEdit(null);
    }
    function deleteStat(id) { if (confirm("Remove this stat?")) setChatStats((ss) => ss.filter((s) => s.id !== id)); }

    function saveAward(a) {
      if (a.id) setAwards((as) => as.map((x) => x.id === a.id ? { ...x, ...a } : x));
      else setAwards((as) => [...as, { ...a, id: "aw" + Date.now(), winners: [] }]);
      setAwardEdit(null);
    }
    function deleteAward(id) { if (confirm("Remove this award?")) setAwards((as) => as.filter((a) => a.id !== id)); }
    function addWinner(awardId, player) {
      const session = (awards.find(a => a.id === awardId)?.winners?.length || 0) + 1;
      setAwards((as) => as.map((a) => a.id === awardId ? { ...a, winners: [...a.winners, { session, player }] } : a));
      setWinnerEdit(null);
    }
    function removeWinner(awardId, idx) { setAwards((as) => as.map((a) => a.id === awardId ? { ...a, winners: a.winners.filter((_, i) => i !== idx) } : a)); }

    const topAward = awards[0];
    const recentWinner = topAward?.winners?.slice(-1)[0];

    return React.createElement("div", { style: { height: "100%", minHeight: 0, overflowY: "auto", background: CZ.bg } },
      React.createElement("div", { style: { maxWidth: 1100, margin: "0 auto", padding: "28px 28px 60px" } },

        // ===== Header =====
        React.createElement("div", { style: { textAlign: "center", marginBottom: 32, position: "relative" } },
          React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.35em", color: CZ.pop, marginBottom: 6 } }, "✦ AFTERSHOW ✦"),
          React.createElement("h1", { style: { fontFamily: "var(--display)", fontSize: 42, fontWeight: 700, margin: 0, lineHeight: 1,
            background: `linear-gradient(135deg, ${CZ.gold} 0%, ${CZ.pop} 40%, ${CZ.teal} 100%)`,
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } }, "THE CHAT ZEROES"),
          React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 13, color: CZ.muted, marginTop: 8 } }, "Post-session chaos, bad takes & award ceremonies"),
          // Squiggly underline decoration
          React.createElement("div", { style: { height: 3, width: 120, margin: "14px auto 0", borderRadius: 2,
            background: `linear-gradient(90deg, ${CZ.pop}, ${CZ.teal})` } })),

        // ===== Stats grid =====
        React.createElement("div", { style: { marginBottom: 32 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 } },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.2em", color: CZ.teal, textTransform: "uppercase" } }, "Campaign Stats"),
            isDM && React.createElement("button", { onClick: () => setStatEdit(false), style: czBtn(CZ.teal) }, React.createElement(Icon, { name: "plus", size: 14 }), "Add stat")),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 } },
            chatStats.map((s) => React.createElement("div", { key: s.id, style: { background: CZ.surface, borderRadius: 14, padding: "20px 16px", textAlign: "center", border: `1px solid ${CZ.pop}22`, position: "relative" } },
              isDM && React.createElement("div", { style: { position: "absolute", top: 8, right: 8, display: "flex", gap: 4 } },
                React.createElement("button", { onClick: () => setStatEdit(s), style: { background: "none", border: "none", color: CZ.muted, cursor: "pointer", padding: 2, fontSize: 12 } }, "✏️"),
                React.createElement("button", { onClick: () => deleteStat(s.id), style: { background: "none", border: "none", color: "#ff6060", cursor: "pointer", padding: 2, fontSize: 12 } }, "🗑️")),
              React.createElement("div", { style: { fontSize: 26, marginBottom: 4 } }, statEmoji(s.icon)),
              React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 38, fontWeight: 700, color: CZ.gold, lineHeight: 1 } }, s.value),
              React.createElement("div", { style: { fontSize: 12.5, color: CZ.muted, marginTop: 6, letterSpacing: "0.06em" } }, s.label))))),

        // ===== Awards =====
        React.createElement("div", null,
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 } },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.2em", color: CZ.pop, textTransform: "uppercase" } }, "Awards & Honours"),
            isDM && React.createElement("button", { onClick: () => setAwardEdit(false), style: czBtn(CZ.pop) }, React.createElement(Icon, { name: "plus", size: 14 }), "New award")),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
            awards.map((a) => React.createElement(AwardCard, { key: a.id, award: a, isDM, party,
              onEdit: () => setAwardEdit(a),
              onDelete: () => deleteAward(a.id),
              onAddWinner: () => setWinnerEdit(a),
              onRemoveWinner: (idx) => removeWinner(a.id, idx) }))))),

        // ===== Modals =====
        React.createElement(StatModal, { open: statEdit !== null, initial: statEdit || null, onClose: () => setStatEdit(null), onSave: saveStat }),
        React.createElement(AwardModal, { open: awardEdit !== null, initial: awardEdit || null, onClose: () => setAwardEdit(null), onSave: saveAward }),
        React.createElement(WinnerModal, { open: !!winnerEdit, award: winnerEdit, party, onClose: () => setWinnerEdit(null), onSave: addWinner })
      )
    );
  }

  function AwardCard({ award, isDM, party, onEdit, onDelete, onAddWinner, onRemoveWinner }) {
    const recent = award.winners.slice(-3).reverse();
    const tally = {};
    award.winners.forEach(w => { tally[w.player] = (tally[w.player] || 0) + 1; });
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);

    return React.createElement("div", { style: { background: CZ.surface, borderRadius: 16, padding: 22, border: `1px solid ${CZ.pop}33`, display: "grid", gridTemplateColumns: "1fr auto", gap: 20 } },
      // Left: info + history
      React.createElement("div", null,
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 } },
          React.createElement("span", { style: { fontSize: 28 } }, award.emoji),
          React.createElement("div", null,
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: CZ.ink } }, award.name),
            React.createElement("div", { style: { fontSize: 13, color: CZ.muted, marginTop: 2 } }, award.desc))),
        // Recent winners
        award.winners.length > 0
          ? React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 } },
              recent.map((w, i) => React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", gap: 6, background: CZ.bg, border: `1px solid ${CZ.pop}44`, borderRadius: 100, padding: "4px 12px 4px 8px", fontSize: 12.5 } },
                React.createElement("span", { style: { fontSize: 16 } }, award.emoji),
                React.createElement("span", { style: { color: CZ.gold, fontWeight: 600 } }, w.player),
                React.createElement("span", { style: { color: CZ.muted } }, `Ep ${w.session}`),
                isDM && React.createElement("button", { onClick: () => onRemoveWinner(award.winners.length - 1 - i), style: { background: "none", border: "none", color: "#ff6060", cursor: "pointer", fontSize: 11, padding: "0 0 0 4px" } }, "✕"))))
          : React.createElement("div", { style: { fontSize: 13, color: CZ.muted, fontStyle: "italic", marginTop: 8 } }, "No winners recorded yet.")),

      // Right: leaderboard + actions
      React.createElement("div", { style: { minWidth: 160 } },
        sorted.length > 0 && React.createElement("div", { style: { marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 11, color: CZ.teal, letterSpacing: "0.12em", marginBottom: 6, textTransform: "uppercase", fontFamily: "var(--display)" } }, "All-time"),
          sorted.slice(0, 5).map(([player, count], i) => React.createElement("div", { key: player, style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 13 } },
            React.createElement("span", { style: { color: i === 0 ? CZ.gold : CZ.muted, minWidth: 16 } }, i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`),
            React.createElement("span", { style: { color: CZ.ink, flex: 1 } }, player),
            React.createElement("span", { style: { color: CZ.pop, fontFamily: "var(--mono)", fontWeight: 700 } }, count)))),
        isDM && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
          React.createElement("button", { onClick: onAddWinner, style: czBtn(CZ.pop) }, award.emoji, " Record winner"),
          React.createElement("button", { onClick: onEdit, style: czBtn(CZ.muted) }, "✏️ Edit"),
          React.createElement("button", { onClick: onDelete, style: { ...czBtn("#ff6060"), marginTop: 2 } }, "🗑️ Delete")))
    );
  }

  function StatModal({ open, initial, onClose, onSave }) {
    const [label, setLabel] = useState(initial?.label || "");
    const [value, setValue] = useState(initial?.value || 0);
    const [icon, setIcon] = useState(initial?.icon || "sparkle");
    useEffect(() => { if (open) { setLabel(initial?.label || ""); setValue(initial?.value ?? 0); setIcon(initial?.icon || "sparkle"); } }, [open]);
    const icons = [["sparkle","✨"],["dice","🎲"],["flame","🔥"],["recap","📖"],["shield","🛡️"],["skull","💀"],["party","🎉"],["map","🗺️"]];
    return React.createElement(Modal, { open, onClose, title: (initial && initial.id) ? "Edit Stat" : "New Stat", w: 400 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Label"),
          React.createElement("input", { className: "input", value: label, onChange: (e) => setLabel(e.target.value), placeholder: "e.g. Drinks consumed" })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Value"),
          React.createElement("input", { className: "input", type: "number", value: value, onChange: (e) => setValue(+e.target.value) })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Icon"),
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            icons.map(([id, em]) => React.createElement("button", { key: id, onClick: () => setIcon(id),
              style: { fontSize: 22, padding: "4px 8px", borderRadius: 8, border: "2px solid " + (icon === id ? "var(--gold)" : "var(--hair)"), background: icon === id ? "rgba(232,181,74,0.15)" : "var(--surface-2)", cursor: "pointer" } }, em)))),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", onClick: () => onSave(Object.assign({}, initial, { label, value, icon })) }, (initial && initial.id) ? "Save" : "Add stat"))));
  }

  function AwardModal({ open, initial, onClose, onSave }) {
    const [name, setName] = useState(initial?.name || "");
    const [emoji, setEmoji] = useState(initial?.emoji || "🏆");
    const [desc, setDesc] = useState(initial?.desc || "");
    useEffect(() => { if (open) { setName(initial?.name || ""); setEmoji(initial?.emoji || "🏆"); setDesc(initial?.desc || ""); } }, [open]);
    return React.createElement(Modal, { open, onClose, title: (initial && initial.id) ? "Edit Award" : "New Award", w: 440 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Award name"),
          React.createElement("input", { className: "input", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Richard of the Recording" })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Emoji"),
          React.createElement("input", { className: "input", value: emoji, onChange: (e) => setEmoji(e.target.value), style: { fontSize: 22, maxWidth: 80 } })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Description"),
          React.createElement("input", { className: "input", value: desc, onChange: (e) => setDesc(e.target.value), placeholder: "What is this award for?" })),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", disabled: !name, onClick: () => onSave(Object.assign({}, initial, { name, emoji, desc })) }, (initial && initial.id) ? "Save" : "Create award"))));
  }

  function WinnerModal({ open, award, party, onClose, onSave }) {
    const [player, setPlayer] = useState("");
    useEffect(() => { if (open) setPlayer(party?.[0]?.player || ""); }, [open]);
    const players = party ? [...new Set(party.map(p => p.player))] : [];
    return React.createElement(Modal, { open, onClose, title: (award ? award.name : "Winner"), w: 380 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { style: { fontSize: 32, textAlign: "center", marginBottom: 4 } }, award ? award.emoji : ""),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Who won this session?"),
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            players.map(function(p) { return React.createElement("button", { key: p, onClick: function() { setPlayer(p); },
              style: { padding: "8px 14px", borderRadius: 100, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
                border: "1px solid " + (player === p ? "#ff4ecd" : "var(--hair)"),
                background: player === p ? "rgba(255,78,205,0.15)" : "var(--surface-2)", color: player === p ? "#ff4ecd" : "var(--ink-soft)" } }, p); }))),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", disabled: !player, onClick: function() { onSave(award ? award.id : null, player); } }, award ? award.emoji : "", " Award it!"))));
  }

  function statEmoji(icon) {
    const map = { sparkle: "✨", dice: "🎲", flame: "🔥", recap: "📖", shield: "🛡️", skull: "💀", party: "🎉", map: "🗺️" };
    return map[icon] || "✨";
  }
  function czBtn(color) {
    return { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8, border: `1px solid ${color}55`, background: color + "18", color, cursor: "pointer", fontSize: 13, fontWeight: 600, width: "100%", justifyContent: "center" };
  }

  window.ChatZeroes = ChatZeroes;
})();
