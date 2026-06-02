/* CHAT ZEROES — aftershow tab */
(function () {
  var useState = React.useState;
  var useContext = React.useContext;
  var useEffect = React.useEffect;
  var Icon = window.Icon;
  var Modal = window.NZUI.Modal;

  var CZ_BG      = "#12101e";
  var CZ_SURFACE = "#1c1830";
  var CZ_POP     = "#ff4ecd";
  var CZ_TEAL    = "#00e5cc";
  var CZ_GOLD    = "#ffe066";
  var CZ_MUTED   = "#8a82aa";
  var CZ_INK     = "#f0ebff";

  function czBtn(color) {
    return { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 12px",
      borderRadius: 8, border: "1px solid " + color + "55", background: color + "18",
      color: color, cursor: "pointer", fontSize: 13, fontWeight: 600,
      width: "100%", justifyContent: "center" };
  }

  function statEmoji(icon) {
    var map = { sparkle: "✨", dice: "🎲", flame: "🔥", recap: "📖", shield: "🛡️", skull: "💀", party: "🎉", map: "🗺️" };
    return map[icon] || "✨";
  }

  // ---- Stat card ----
  function StatCard(props) {
    var s = props.s;
    var isDM = props.isDM;
    var onEdit = props.onEdit;
    var onDelete = props.onDelete;
    return React.createElement("div", {
      style: { background: CZ_SURFACE, borderRadius: 14, padding: "20px 16px", textAlign: "center",
        border: "1px solid " + CZ_POP + "22", position: "relative" }
    },
      isDM && React.createElement("div", { style: { position: "absolute", top: 8, right: 8, display: "flex", gap: 4 } },
        React.createElement("button", { onClick: onEdit, title: "Edit",
          style: { background: "none", border: "none", color: CZ_MUTED, cursor: "pointer", padding: 2, fontSize: 14 } }, "✏️"),
        React.createElement("button", { onClick: onDelete, title: "Delete",
          style: { background: "none", border: "none", color: "#ff6060", cursor: "pointer", padding: 2, fontSize: 14 } }, "🗑️")),
      React.createElement("div", { style: { fontSize: 26, marginBottom: 4 } }, statEmoji(s.icon)),
      React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 38, fontWeight: 700, color: CZ_GOLD, lineHeight: 1 } }, s.value),
      React.createElement("div", { style: { fontSize: 12.5, color: CZ_MUTED, marginTop: 6 } }, s.label)
    );
  }

  // ---- Award card ----
  function AwardCard(props) {
    var award = props.award;
    var isDM = props.isDM;
    var party = props.party;
    var onEdit = props.onEdit;
    var onDelete = props.onDelete;
    var onAddWinner = props.onAddWinner;
    var onRemoveWinner = props.onRemoveWinner;

    var winners = award.winners || [];
    var recent = winners.slice(-3).reverse();
    var tally = {};
    winners.forEach(function(w) { tally[w.player] = (tally[w.player] || 0) + 1; });
    var sorted = Object.entries(tally).sort(function(a, b) { return b[1] - a[1]; });

    var medals = ["🥇","🥈","🥉"];

    return React.createElement("div", {
      style: { background: CZ_SURFACE, borderRadius: 16, padding: 22,
        border: "1px solid " + CZ_POP + "33", display: "grid",
        gridTemplateColumns: "1fr auto", gap: 20 }
    },
      React.createElement("div", null,
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 } },
          React.createElement("span", { style: { fontSize: 28 } }, award.emoji),
          React.createElement("div", null,
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, color: CZ_INK } }, award.name),
            React.createElement("div", { style: { fontSize: 13, color: CZ_MUTED, marginTop: 2 } }, award.desc))),
        winners.length > 0
          ? React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 } },
              recent.map(function(w, i) {
                return React.createElement("div", { key: i,
                  style: { display: "flex", alignItems: "center", gap: 6, background: CZ_BG,
                    border: "1px solid " + CZ_POP + "44", borderRadius: 100,
                    padding: "4px 12px 4px 8px", fontSize: 12.5 }
                },
                  React.createElement("span", { style: { fontSize: 16 } }, award.emoji),
                  React.createElement("span", { style: { color: CZ_GOLD, fontWeight: 600 } }, w.player),
                  React.createElement("span", { style: { color: CZ_MUTED } }, " Ep " + w.session),
                  isDM && React.createElement("button", {
                    onClick: function() { onRemoveWinner(winners.length - 1 - i); },
                    style: { background: "none", border: "none", color: "#ff6060", cursor: "pointer", fontSize: 11, padding: "0 0 0 4px" }
                  }, "✕"));
              }))
          : React.createElement("div", { style: { fontSize: 13, color: CZ_MUTED, fontStyle: "italic", marginTop: 8 } }, "No winners recorded yet.")),

      React.createElement("div", { style: { minWidth: 160 } },
        sorted.length > 0 && React.createElement("div", { style: { marginBottom: 12 } },
          React.createElement("div", { style: { fontSize: 11, color: CZ_TEAL, letterSpacing: "0.12em", marginBottom: 6, textTransform: "uppercase", fontFamily: "var(--display)" } }, "All-time"),
          sorted.slice(0, 5).map(function(entry, i) {
            var player = entry[0], count = entry[1];
            return React.createElement("div", { key: player,
              style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4, fontSize: 13 }
            },
              React.createElement("span", { style: { color: i === 0 ? CZ_GOLD : CZ_MUTED, minWidth: 16 } }, medals[i] || (i + 1) + "."),
              React.createElement("span", { style: { color: CZ_INK, flex: 1 } }, player),
              React.createElement("span", { style: { color: CZ_POP, fontFamily: "var(--mono)", fontWeight: 700 } }, count));
          })),
        isDM && React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
          React.createElement("button", { onClick: onAddWinner, style: czBtn(CZ_POP) }, award.emoji + " Record winner"),
          React.createElement("button", { onClick: onEdit, style: czBtn(CZ_MUTED) }, "✏️ Edit"),
          React.createElement("button", { onClick: onDelete,
            style: Object.assign({}, czBtn("#ff6060"), { marginTop: 2 }) }, "🗑️ Delete")))
    );
  }

  // ---- Stat modal ----
  function StatModal(props) {
    var open = props.open, initial = props.initial, onClose = props.onClose, onSave = props.onSave;
    var labelState = useState(initial ? initial.label : "");
    var label = labelState[0], setLabel = labelState[1];
    var valueState = useState(initial ? initial.value : 0);
    var value = valueState[0], setValue = valueState[1];
    var iconState = useState(initial ? initial.icon : "sparkle");
    var icon = iconState[0], setIcon = iconState[1];

    useEffect(function() {
      if (open) {
        setLabel(initial ? initial.label : "");
        setValue(initial ? initial.value : 0);
        setIcon(initial ? initial.icon : "sparkle");
      }
    }, [open]);

    var icons = [["sparkle","✨"],["dice","🎲"],["flame","🔥"],["recap","📖"],["skull","💀"],["party","🎉"],["map","🗺️"]];
    var isEdit = initial && initial.id;

    return React.createElement(Modal, { open: open, onClose: onClose, title: isEdit ? "Edit Stat" : "New Stat", w: 400 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Label"),
          React.createElement("input", { className: "input", value: label, onChange: function(e) { setLabel(e.target.value); }, placeholder: "e.g. Drinks consumed" })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Value"),
          React.createElement("input", { className: "input", type: "number", value: value, onChange: function(e) { setValue(+e.target.value); } })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Icon"),
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            icons.map(function(pair) {
              var id = pair[0], em = pair[1];
              return React.createElement("button", { key: id, onClick: function() { setIcon(id); },
                style: { fontSize: 22, padding: "4px 8px", borderRadius: 8, cursor: "pointer",
                  border: "2px solid " + (icon === id ? "var(--gold)" : "var(--hair)"),
                  background: icon === id ? "rgba(232,181,74,0.15)" : "var(--surface-2)" } }, em);
            }))),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary",
            onClick: function() { onSave(Object.assign({}, initial, { label: label, value: value, icon: icon })); }
          }, isEdit ? "Save" : "Add stat"))));
  }

  // ---- Award modal ----
  function AwardModal(props) {
    var open = props.open, initial = props.initial, onClose = props.onClose, onSave = props.onSave;
    var nameState = useState(initial ? initial.name : "");
    var name = nameState[0], setName = nameState[1];
    var emojiState = useState(initial ? initial.emoji : "🏆");
    var emoji = emojiState[0], setEmoji = emojiState[1];
    var descState = useState(initial ? initial.desc : "");
    var desc = descState[0], setDesc = descState[1];

    useEffect(function() {
      if (open) {
        setName(initial ? initial.name : "");
        setEmoji(initial ? initial.emoji : "🏆");
        setDesc(initial ? initial.desc : "");
      }
    }, [open]);

    var isEdit = initial && initial.id;
    return React.createElement(Modal, { open: open, onClose: onClose, title: isEdit ? "Edit Award" : "New Award", w: 440 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Award name"),
          React.createElement("input", { className: "input", value: name, onChange: function(e) { setName(e.target.value); }, placeholder: "e.g. Richard of the Recording" })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Emoji"),
          React.createElement("input", { className: "input", value: emoji, onChange: function(e) { setEmoji(e.target.value); }, style: { fontSize: 22, maxWidth: 80 } })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Description"),
          React.createElement("input", { className: "input", value: desc, onChange: function(e) { setDesc(e.target.value); }, placeholder: "What is this award for?" })),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", disabled: !name,
            onClick: function() { onSave(Object.assign({}, initial, { name: name, emoji: emoji, desc: desc })); }
          }, isEdit ? "Save" : "Create award"))));
  }

  // ---- Winner modal ----
  function WinnerModal(props) {
    var open = props.open, award = props.award, party = props.party, onClose = props.onClose, onSave = props.onSave;
    var playerState = useState("");
    var player = playerState[0], setPlayer = playerState[1];

    useEffect(function() {
      if (open && party && party.length > 0) setPlayer(party[0].player || "");
    }, [open]);

    var players = [];
    if (party) {
      var seen = {};
      party.forEach(function(p) { if (!seen[p.player]) { seen[p.player] = true; players.push(p.player); } });
    }

    return React.createElement(Modal, { open: open, onClose: onClose, title: award ? award.name : "Record Winner", w: 380 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { style: { fontSize: 32, textAlign: "center", marginBottom: 4 } }, award ? award.emoji : ""),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Who won this session?"),
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 } },
            players.map(function(p) {
              return React.createElement("button", { key: p, onClick: function() { setPlayer(p); },
                style: { padding: "8px 14px", borderRadius: 100, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
                  border: "1px solid " + (player === p ? "#ff4ecd" : "var(--hair)"),
                  background: player === p ? "rgba(255,78,205,0.15)" : "var(--surface-2)",
                  color: player === p ? "#ff4ecd" : "var(--ink-soft)" }
              }, p);
            }))),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", disabled: !player,
            onClick: function() { onSave(award ? award.id : null, player); }
          }, (award ? award.emoji + " " : "") + "Award it!"))));
  }

  // ---- Quote modal ----
  function QuoteModal(props) {
    var open = props.open, initial = props.initial, party = props.party, onClose = props.onClose, onSave = props.onSave;
    var textState = useState(""); var quoteText = textState[0], setQuoteText = textState[1];
    var speakerState = useState(""); var speaker = speakerState[0], setSpeaker = speakerState[1];
    var sessionState = useState(""); var session = sessionState[0], setSession = sessionState[1];

    useEffect(function() {
      if (open) {
        setQuoteText(initial ? initial.text : "");
        setSpeaker(initial ? initial.speaker : (party && party[0] ? party[0].player : ""));
        setSession(initial ? initial.session : "");
      }
    }, [open]);

    var players = [];
    if (party) { var seen = {}; party.forEach(function(p) { if (!seen[p.player]) { seen[p.player] = true; players.push(p.player); } }); }
    players.push("Callum (DM)");

    return React.createElement(Modal, { open: open, onClose: onClose, title: (initial && initial.id) ? "Edit Quote" : "Add a Quote", w: 480 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Quote"),
          React.createElement("textarea", { className: "input", rows: 3, value: quoteText, onChange: function(e) { setQuoteText(e.target.value); },
            placeholder: '"I check for traps." "There are no traps." "I check for traps again."', style: { resize: "vertical" } })),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Who said it?"),
          React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" } },
            players.map(function(p) {
              return React.createElement("button", { key: p, onClick: function() { setSpeaker(p); },
                style: { padding: "6px 12px", borderRadius: 100, cursor: "pointer", fontSize: 13, fontWeight: 600,
                  border: "1px solid " + (speaker === p ? CZ_POP : "var(--hair)"),
                  background: speaker === p ? "rgba(255,78,205,0.15)" : "var(--surface-2)",
                  color: speaker === p ? CZ_POP : "var(--ink-soft)" } }, p);
            }))),
        React.createElement("div", { className: "field" },
          React.createElement("label", null, "Session / context (optional)"),
          React.createElement("input", { className: "input", value: session, onChange: function(e) { setSession(e.target.value); }, placeholder: "e.g. Session 12, or 'The bar fight'" })),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", disabled: !quoteText.trim(),
            onClick: function() { onSave(Object.assign({}, initial, { text: quoteText, speaker: speaker, session: session })); }
          }, "💬 Save quote"))));
  }

  // ---- Main component ----
  function ChatZeroes(props) {
    var chatStats = props.chatStats;
    var setChatStats = props.setChatStats;
    var awards = props.awards;
    var setAwards = props.setAwards;
    var quotes = props.quotes || [];
    var setQuotes = props.setQuotes;
    var party = props.party;

    var ctx = useContext(window.NZAuth.RoleContext);
    var isDM = ctx.role === "dm";

    var statEditState = useState(null);
    var statEdit = statEditState[0], setStatEdit = statEditState[1];

    var awardEditState = useState(null);
    var awardEdit = awardEditState[0], setAwardEdit = awardEditState[1];

    var winnerEditState = useState(null);
    var winnerEdit = winnerEditState[0], setWinnerEdit = winnerEditState[1];

    var quoteEditState = useState(null);
    var quoteEdit = quoteEditState[0], setQuoteEdit = quoteEditState[1];

    function saveQuote(q) {
      if (q.id) {
        setQuotes(function(qs) { return qs.map(function(x) { return x.id === q.id ? q : x; }); });
      } else {
        setQuotes(function(qs) { return [Object.assign({}, q, { id: "q" + Date.now() })].concat(qs); });
      }
      setQuoteEdit(null);
    }
    function deleteQuote(id) { setQuotes(function(qs) { return qs.filter(function(q) { return q.id !== id; }); }); }

    function saveStat(s) {
      if (s.id) {
        setChatStats(function(ss) { return ss.map(function(x) { return x.id === s.id ? s : x; }); });
      } else {
        setChatStats(function(ss) { return ss.concat([Object.assign({}, s, { id: "cs" + Date.now() })]); });
      }
      setStatEdit(null);
    }
    function deleteStat(id) {
      if (confirm("Remove this stat?")) {
        setChatStats(function(ss) { return ss.filter(function(s) { return s.id !== id; }); });
      }
    }
    function saveAward(a) {
      if (a.id) {
        setAwards(function(as) { return as.map(function(x) { return x.id === a.id ? Object.assign({}, x, a) : x; }); });
      } else {
        setAwards(function(as) { return as.concat([Object.assign({}, a, { id: "aw" + Date.now(), winners: [] })]); });
      }
      setAwardEdit(null);
    }
    function deleteAward(id) {
      if (confirm("Remove this award?")) {
        setAwards(function(as) { return as.filter(function(a) { return a.id !== id; }); });
      }
    }
    function addWinner(awardId, player) {
      var found = awards.find(function(a) { return a.id === awardId; });
      var session = found && found.winners ? found.winners.length + 1 : 1;
      setAwards(function(as) {
        return as.map(function(a) {
          if (a.id !== awardId) return a;
          return Object.assign({}, a, { winners: a.winners.concat([{ session: session, player: player }]) });
        });
      });
      setWinnerEdit(null);
    }
    function removeWinner(awardId, idx) {
      setAwards(function(as) {
        return as.map(function(a) {
          if (a.id !== awardId) return a;
          return Object.assign({}, a, { winners: a.winners.filter(function(_, i) { return i !== idx; }) });
        });
      });
    }

    return React.createElement("div", {
      style: { height: "100%", minHeight: 0, overflowY: "auto", background: CZ_BG }
    },
      React.createElement("div", { style: { maxWidth: 1100, margin: "0 auto", padding: "28px 28px 60px" } },

        React.createElement("div", { style: { textAlign: "center", marginBottom: 32 } },
          React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.35em", color: CZ_POP, marginBottom: 6 } }, "✦ AFTERSHOW ✦"),
          React.createElement("h1", { style: { fontFamily: "var(--display)", fontSize: 42, fontWeight: 700, margin: 0, lineHeight: 1,
            color: CZ_POP } }, "THE CHAT ZEROES"),
          React.createElement("div", { style: { fontFamily: "var(--mono)", fontSize: 13, color: CZ_MUTED, marginTop: 8 } }, "Post-session chaos, bad takes & award ceremonies"),
          React.createElement("div", { style: { height: 3, width: 120, margin: "14px auto 0", borderRadius: 2, background: CZ_POP } })),

        React.createElement("div", { style: { marginBottom: 32 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 } },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.2em", color: CZ_TEAL, textTransform: "uppercase" } }, "Campaign Stats"),
            isDM && React.createElement("button", { onClick: function() { setStatEdit(false); }, style: czBtn(CZ_TEAL) },
              React.createElement(Icon, { name: "plus", size: 14 }), " Add stat")),
          React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 } },
            chatStats.map(function(s) {
              return React.createElement(StatCard, { key: s.id, s: s, isDM: isDM,
                onEdit: function() { setStatEdit(s); },
                onDelete: function() { deleteStat(s.id); } });
            }))),

        React.createElement("div", null,
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 } },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.2em", color: CZ_POP, textTransform: "uppercase" } }, "Awards & Honours"),
            isDM && React.createElement("button", { onClick: function() { setAwardEdit(false); }, style: czBtn(CZ_POP) },
              React.createElement(Icon, { name: "plus", size: 14 }), " New award")),
          React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } },
            awards.map(function(a) {
              return React.createElement(AwardCard, { key: a.id, award: a, isDM: isDM, party: party,
                onEdit: function() { setAwardEdit(a); },
                onDelete: function() { deleteAward(a.id); },
                onAddWinner: function() { setWinnerEdit(a); },
                onRemoveWinner: function(idx) { removeWinner(a.id, idx); } });
            }))),

        // ===== Quote Wall =====
        React.createElement("div", { style: { marginTop: 40 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 } },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 13, letterSpacing: "0.2em", color: CZ_GOLD, textTransform: "uppercase" } }, "💬 Quote Wall"),
            React.createElement("div", { style: { flex: 1, height: 1, background: CZ_GOLD + "33" } }),
            React.createElement("button", { onClick: function() { setQuoteEdit(false); }, style: czBtn(CZ_GOLD) },
              React.createElement(Icon, { name: "plus", size: 14 }), " Add quote")),
          quotes.length === 0
            ? React.createElement("div", { style: { textAlign: "center", padding: "40px 20px", color: CZ_MUTED, fontStyle: "italic", fontSize: 14 } },
                "No quotes yet. Add the first one — somebody definitely said something ridiculous this session.")
            : React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 } },
                quotes.map(function(q) {
                  return React.createElement("div", { key: q.id,
                    style: { background: CZ_SURFACE, borderRadius: 14, padding: 20,
                      border: "1px solid " + CZ_GOLD + "22",
                      borderLeft: "4px solid " + CZ_GOLD + "88",
                      position: "relative" }
                  },
                    isDM && React.createElement("div", { style: { position: "absolute", top: 10, right: 10, display: "flex", gap: 4 } },
                      React.createElement("button", { onClick: function() { setQuoteEdit(q); },
                        style: { background: "none", border: "none", color: CZ_MUTED, cursor: "pointer", fontSize: 14 } }, "✏️"),
                      React.createElement("button", { onClick: function() { deleteQuote(q.id); },
                        style: { background: "none", border: "none", color: "#ff6060", cursor: "pointer", fontSize: 14 } }, "🗑️")),
                    React.createElement("div", { style: { fontSize: 28, color: CZ_GOLD + "55", marginBottom: 6, fontFamily: "Georgia, serif", lineHeight: 1 } }, "“"),
                    React.createElement("div", { style: { fontSize: 14.5, color: CZ_INK, lineHeight: 1.55, fontStyle: "italic", marginBottom: 12 } }, q.text),
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8 } },
                      React.createElement("span", { style: { color: CZ_POP, fontWeight: 700, fontSize: 13 } }, "— " + (q.speaker || "Unknown")),
                      q.session && React.createElement("span", { style: { color: CZ_MUTED, fontSize: 12 } }, q.session)));
                }))),

        React.createElement(StatModal, {
          open: statEdit !== null, initial: statEdit || null,
          onClose: function() { setStatEdit(null); }, onSave: saveStat }),
        React.createElement(AwardModal, {
          open: awardEdit !== null, initial: awardEdit || null,
          onClose: function() { setAwardEdit(null); }, onSave: saveAward }),
        React.createElement(WinnerModal, {
          open: !!winnerEdit, award: winnerEdit, party: party,
          onClose: function() { setWinnerEdit(null); }, onSave: addWinner }),
        React.createElement(QuoteModal, {
          open: quoteEdit !== null, initial: quoteEdit || null, party: party,
          onClose: function() { setQuoteEdit(null); }, onSave: saveQuote })
      )
    );
  }

  window.ChatZeroes = ChatZeroes;
})();
