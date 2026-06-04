/* SCHEDULER — availability poll, countdown, RSVP, weekly schedule */
(function () {
  const { useState, useEffect, useContext } = React;
  const Icon = window.Icon;
  const { Avatar, Modal } = window.NZUI;

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function Scheduler({ members, pollOptions, sessions, weeklySchedule }) {
    const ctx = useContext(window.NZAuth.RoleContext);
    const canEdit = window.NZAuth.can(ctx.role, "manageCombat"); // DM+Admin
    const ME = ctx.user ? ctx.user.name : "Jess";

    const [poll, setPoll] = useState(pollOptions);
    const [sess, setSess] = useState(sessions);
    const [proposeOpen, setProposeOpen] = useState(false);
    const [wsch, setWsch] = useState(weeklySchedule || { primaryDay: 2, backupDay: 3, primaryTime: "7:00 PM", backupTime: "7:00 PM", active: false, activationNote: "" });
    const [discordLink, setDiscordLink] = useState(() => { try { return localStorage.getItem("nz_discordlink") || ""; } catch(e) { return ""; } });
    const [editingDiscord, setEditingDiscord] = useState(false);
    const [discordVal, setDiscordVal] = useState(discordLink);
    const [copied, setCopied] = useState(false);
    var copiedTimerRef = React.useRef(null);
    function saveDiscord() { setDiscordLink(discordVal); try { localStorage.setItem("nz_discordlink", discordVal); } catch(e) {} setEditingDiscord(false); }

    function exportICS() {
      var lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Nat Zeroes//VTT//EN","CALSCALE:GREGORIAN","X-WR-CALNAME:Nat Zeroes Sessions","X-WR-CALDESC:D&D session schedule for The Nat Zeroes"];
      // Guard: only include sessions with a valid ISO date
      sess.filter(function(s) { return s.date && /^\d{4}-\d{2}-\d{2}$/.test(s.date); }).forEach(function(s) {
        var parts = s.date.split("-").map(Number);
        var y = parts[0], mo = parts[1], d = parts[2];
        var hour = 19, min = 0;
        var tm = s.time && s.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (tm) { hour = parseInt(tm[1]); min = parseInt(tm[2]); if (tm[3] && tm[3].toUpperCase() === "PM" && hour !== 12) hour += 12; if (tm[3] && tm[3].toUpperCase() === "AM" && hour === 12) hour = 0; }
        function p2(n) { return String(n).padStart(2,"0"); }
        var dtStart = "" + y + p2(mo) + p2(d) + "T" + p2(hour) + p2(min) + "00";
        var dtEnd = "" + y + p2(mo) + p2(d) + "T" + p2((hour+3)%24) + p2(min) + "00";
        lines.push("BEGIN:VEVENT","UID:nz-session-" + s.id + "@natzeros","DTSTART:" + dtStart,"DTEND:" + dtEnd,
          "SUMMARY:Session " + s.num + ": " + s.title,"LOCATION:" + (s.venue || "Online"),
          "STATUS:" + (s.confirmed ? "CONFIRMED" : "TENTATIVE"),"END:VEVENT");
      });
      lines.push("END:VCALENDAR");
      var blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "nat-zeroes-sessions.ics"; a.click();
    }

    function copyForDiscord() {
      var next = sess.find(function(s) { return s.confirmed; }) || sess[0];
      if (!next) return;
      var counts = { in: 0, maybe: 0, out: 0 };
      (members || []).forEach(function(m) { var r = next.rsvp[m.id]; if (r) counts[r]++; });
      var text = [
        "📅 **Session " + next.num + ": " + next.title + "**",
        "🗓️ " + fmtDate(next.date) + " at " + next.time,
        "📍 " + next.venue,
        next.confirmed ? "✅ **CONFIRMED**" : "⏳ Tentative — check availability poll",
        "",
        "👍 In: " + counts.in + "  ❔ Maybe: " + counts.maybe + "  👎 Out: " + counts.out
      ].join("\n");
      function doCopy(txt) {
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
        setCopied(true);
        copiedTimerRef.current = setTimeout(function() { setCopied(false); copiedTimerRef.current = null; }, 2200);
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function() { doCopy(text); }).catch(function() { prompt("Copy for Discord:", text); });
      } else { prompt("Copy for Discord:", text); }
    }

    // your vote per option: derive from data (use ME dynamically)
    function myVote(o) {
      if (o.yes.includes(ME)) return "yes";
      if (o.no.includes(ME)) return "no";
      if (o.maybe.includes(ME)) return "maybe";
      return null;
    }
    function setVote(oid, v) {
      setPoll((ps) => ps.map((o) => {
        if (o.id !== oid) return o;
        const yes = o.yes.filter((m) => m !== ME), no = o.no.filter((m) => m !== ME), maybe = o.maybe.filter((m) => m !== ME);
        if (v === "yes") yes.push(ME); if (v === "no") no.push(ME); if (v === "maybe") maybe.push(ME);
        return { ...o, yes, no, maybe };
      }));
    }
    function setRsvp(sid, status) {
      setSess((ss) => ss.map((s) => s.id === sid ? { ...s, rsvp: { ...s.rsvp, [ME]: status } } : s));
    }

    const best = [...poll].sort((a, b) => b.yes.length - a.yes.length)[0];
    const nextConfirmed = sess.find((s) => s.confirmed) || sess[0];

    return React.createElement("div", { className: "view-pad", style: { maxWidth: 1100 } },
      // Discord / calendar bar
      React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 16px", background: "var(--surface)", border: "1px solid var(--hair)", borderRadius: 12, flexWrap: "wrap" } },
        React.createElement("span", { style: { fontSize: 20 } }, "🎮"),
        React.createElement("span", { style: { fontFamily: "var(--display)", fontWeight: 600, fontSize: 13, color: "var(--amethyst)", letterSpacing: "0.06em" } }, "GROUP DISCORD"),
        React.createElement("div", { className: "spacer" }),
        editingDiscord
          ? React.createElement(React.Fragment, null,
              React.createElement("input", { className: "input", value: discordVal, onChange: (e) => setDiscordVal(e.target.value), placeholder: "Paste Discord invite link…", style: { width: 260 }, autoFocus: true, onKeyDown: (e) => e.key === "Enter" && saveDiscord() }),
              React.createElement("button", { className: "btn primary sm", onClick: saveDiscord }, "Save"),
              React.createElement("button", { className: "btn ghost sm", onClick: () => setEditingDiscord(false) }, "Cancel"))
          : React.createElement(React.Fragment, null,
              discordLink
                ? React.createElement("a", { href: discordLink, target: "_blank", rel: "noopener", className: "btn primary sm", style: { textDecoration: "none" } }, React.createElement(Icon, { name: "party", size: 15 }), "Open Discord")
                : React.createElement("span", { className: "muted", style: { fontSize: 13 } }, "No Discord link set"),
              canEdit && React.createElement("button", { className: "btn sm ghost", onClick: () => { setDiscordVal(discordLink); setEditingDiscord(true); } }, React.createElement(Icon, { name: "settings", size: 13 }), "Edit link"),
              // Export calendar as .ics (importable to Google Calendar, Outlook, Apple Calendar)
              React.createElement("button", { className: "btn sm ghost", onClick: exportICS, title: "Download sessions as a .ics calendar file — import into Google Calendar, Apple Calendar, Outlook, or any Discord bot that reads iCal feeds" },
                React.createElement(Icon, { name: "upload", size: 14 }), "Export .ics"),
              // Copy next session info formatted for Discord
              React.createElement("button", { className: "btn sm" + (copied ? " primary" : " ghost"), onClick: copyForDiscord, title: "Copy next session details in Discord markdown format — paste into any Discord channel" },
                copied ? "✓ Copied!" : (React.createElement(React.Fragment, null, React.createElement(Icon, { name: "party", size: 14 }), "Copy for Discord"))))),
      // weekly schedule
      React.createElement(WeeklySchedulePanel, { wsch, setWsch, canEdit, members }),
      // countdown + propose
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 26 } },
        React.createElement(Countdown, { session: nextConfirmed }),
        React.createElement(QuickStats, { poll, members, onPropose: () => setProposeOpen(true) })),

      // availability poll
      React.createElement("div", { className: "row", style: { marginBottom: 14 } },
        React.createElement("div", { className: "section-title", style: { margin: 0, flex: 1 } }, "When can everyone play?"),
        React.createElement("button", { className: "btn sm", onClick: () => setProposeOpen(true) }, React.createElement(Icon, { name: "plus", size: 15 }), "Propose a date")),
      React.createElement("div", { className: "panel", style: { overflow: "hidden", marginBottom: 30 } },
        React.createElement(PollGrid, { poll, members, me: ME, myVote, setVote, best })),

      // upcoming sessions
      React.createElement("div", { className: "section-title" }, "Upcoming Sessions"),
      React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
        sess.map((s) => React.createElement(SessionCard, { key: s.id, s, members, me: ME, setRsvp }))),

      React.createElement(ProposeModal, { open: proposeOpen, onClose: () => setProposeOpen(false), onAdd: (o) => { setPoll((p) => [...p, o]); setProposeOpen(false); } })
    );
  }

  // ---- Weekly Schedule Panel ----
  function WeeklySchedulePanel({ wsch, setWsch, canEdit, members }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(wsch);
    function save() { setWsch(draft); setEditing(false); }

    const activeDay = wsch.active ? wsch.backupDay : wsch.primaryDay;
    const activeTime = wsch.active ? wsch.backupTime : wsch.primaryTime;

    return React.createElement("div", { className: "panel", style: { padding: 20, marginBottom: 24, position: "relative", overflow: "hidden" } },
      // ambient glow
      React.createElement("div", { style: { position: "absolute", inset: 0, background: wsch.active ? "radial-gradient(90% 100% at 80% 0%, rgba(232,65,46,0.08), transparent 60%)" : "radial-gradient(90% 100% at 80% 0%, rgba(232,181,74,0.07), transparent 60%)", pointerEvents: "none" } }),
      React.createElement("div", { className: "row", style: { marginBottom: editing ? 16 : 12, gap: 10 } },
        React.createElement("div", { className: "section-title", style: { margin: 0, flex: 1 } }, "Regular Schedule"),
        wsch.active && React.createElement("span", { className: "tag", style: { background: "rgba(232,65,46,0.12)", color: "var(--red-bright)", borderColor: "rgba(232,65,46,0.3)", fontSize: 11 } },
          React.createElement(Icon, { name: "bell", size: 12 }), "Backup day active"),
        canEdit && !editing && React.createElement("button", { className: "btn sm ghost", onClick: () => { setDraft({...wsch}); setEditing(true); } }, React.createElement(Icon, { name: "settings", size: 14 }), "Edit")),

      !editing ? React.createElement("div", null,
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 } },
          // Primary day
          React.createElement("div", { style: { background: !wsch.active ? "rgba(232,181,74,0.08)" : "var(--bg)", border: `1px solid ${!wsch.active ? "var(--panel-edge)" : "var(--hair)"}`, borderRadius: 12, padding: 14 } },
            React.createElement("div", { className: "row", style: { gap: 8, marginBottom: 6 } },
              React.createElement("span", { className: "tag", style: { fontSize: 10, color: "var(--gold)", borderColor: "var(--panel-edge)", background: "rgba(232,181,74,0.1)" } }, !wsch.active ? "★ Active" : "Primary"),
              !wsch.active && React.createElement("span", { className: "tag emerald", style: { fontSize: 10 } }, "This week")),
            React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 20, color: !wsch.active ? "var(--gold-bright)" : "var(--ink-soft)" } }, DAYS[wsch.primaryDay]),
            React.createElement("div", { className: "muted", style: { fontSize: 12.5, marginTop: 3 } }, wsch.primaryTime)),
          // Backup day
          React.createElement("div", { style: { background: wsch.active ? "rgba(232,65,46,0.06)" : "var(--bg)", border: `1px solid ${wsch.active ? "rgba(232,65,46,0.3)" : "var(--hair)"}`, borderRadius: 12, padding: 14 } },
            React.createElement("div", { className: "row", style: { gap: 8, marginBottom: 6 } },
              React.createElement("span", { className: "tag", style: { fontSize: 10, color: wsch.active ? "var(--red-bright)" : "var(--ink-dim)", borderColor: wsch.active ? "rgba(232,65,46,0.35)" : "var(--hair)", background: wsch.active ? "rgba(232,65,46,0.1)" : "transparent" } }, wsch.active ? "★ Active" : "Backup"),
              wsch.active && React.createElement("span", { className: "tag red", style: { fontSize: 10 } }, "This week")),
            React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 20, color: wsch.active ? "var(--red-bright)" : "var(--ink-dim)" } }, DAYS[wsch.backupDay]),
            React.createElement("div", { className: "muted", style: { fontSize: 12.5, marginTop: 3 } }, wsch.backupTime))),
        React.createElement("div", { className: "row", style: { gap: 10, flexWrap: "wrap" } },
          React.createElement("p", { className: "muted", style: { margin: 0, fontSize: 13, lineHeight: 1.5, flex: 1, minWidth: 240 } },
            "Game night is every ", React.createElement("strong", { style: { color: "var(--ink)" } }, DAYS[wsch.primaryDay]),
            " at ", wsch.primaryTime, ". If 2+ players can't make it, the session automatically moves to ",
            React.createElement("strong", { style: { color: "var(--ink)" } }, DAYS[wsch.backupDay]), "."),
          canEdit && React.createElement("button", { className: "btn sm" + (wsch.active ? " danger" : ""), onClick: () => setWsch((s) => ({ ...s, active: !s.active })),
            style: wsch.active ? { color: "var(--red-bright)", borderColor: "rgba(232,65,46,0.35)", background: "rgba(232,65,46,0.08)" } : {} },
            React.createElement(Icon, { name: wsch.active ? "x" : "bell", size: 14 }), wsch.active ? "Cancel backup" : "Activate backup day")))
      : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          React.createElement("div", { className: "field" }, React.createElement("label", null, "Primary day"),
            React.createElement("select", { className: "select", value: draft.primaryDay, onChange: (e) => setDraft((d) => ({ ...d, primaryDay: +e.target.value })) },
              DAYS.map((d, i) => React.createElement("option", { key: i, value: i }, d)))),
          React.createElement("div", { className: "field" }, React.createElement("label", null, "Backup day"),
            React.createElement("select", { className: "select", value: draft.backupDay, onChange: (e) => setDraft((d) => ({ ...d, backupDay: +e.target.value })) },
              DAYS.map((d, i) => React.createElement("option", { key: i, value: i }, d))))),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } },
          React.createElement("div", { className: "field" }, React.createElement("label", null, "Primary time"),
            React.createElement("input", { className: "input", value: draft.primaryTime, onChange: (e) => setDraft((d) => ({ ...d, primaryTime: e.target.value })) })),
          React.createElement("div", { className: "field" }, React.createElement("label", null, "Backup time"),
            React.createElement("input", { className: "input", value: draft.backupTime, onChange: (e) => setDraft((d) => ({ ...d, backupTime: e.target.value })) }))),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: () => setEditing(false) }, "Cancel"),
          React.createElement("button", { className: "btn primary", onClick: save }, React.createElement(Icon, { name: "check", size: 15 }), "Save schedule")))
    );
  }

  function Countdown({ session }) {
    const [now, setNow] = useState(Date.now());
    useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
    const target = new Date(session.date + "T19:00:00").getTime();
    const diff = Math.max(0, target - now);
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    const unit = (v, l) => React.createElement("div", { style: { textAlign: "center" } },
      React.createElement("div", { className: "mono", style: { fontSize: 38, fontWeight: 700, color: "var(--gold-bright)", lineHeight: 1, textShadow: "0 0 20px rgba(232,181,74,0.3)" } }, String(v).padStart(2, "0")),
      React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 10, letterSpacing: "0.16em", color: "var(--ink-dim)", marginTop: 6 } }, l));
    return React.createElement("div", { className: "panel", style: { padding: 24, position: "relative", overflow: "hidden" } },
      React.createElement("div", { style: { position: "absolute", inset: 0, background: "radial-gradient(120% 100% at 90% -20%, rgba(232,181,74,0.12), transparent 55%)", pointerEvents: "none" } }),
      React.createElement("div", { className: "row", style: { gap: 10, marginBottom: 4 } },
        React.createElement("span", { className: "tag gold" }, "Next Session"),
        session.confirmed ? React.createElement("span", { className: "tag emerald" }, React.createElement(Icon, { name: "check", size: 12 }), "Confirmed") : React.createElement("span", { className: "tag" }, "Tentative")),
      React.createElement("h2", { style: { fontSize: 24, margin: "12px 0 4px", color: "var(--ink)" } }, `Session ${session.num}: ${session.title}`),
      React.createElement("div", { className: "muted row", style: { gap: 14, fontSize: 13.5, marginBottom: 20 } },
        React.createElement("span", { className: "row", style: { gap: 6 } }, React.createElement(Icon, { name: "scheduler", size: 15 }), fmtDate(session.date)),
        React.createElement("span", { className: "row", style: { gap: 6 } }, React.createElement(Icon, { name: "clock", size: 15 }), session.time),
        React.createElement("span", { className: "row", style: { gap: 6 } }, React.createElement(Icon, { name: "pin", size: 15 }), session.venue)),
      React.createElement("div", { className: "row", style: { gap: 18, justifyContent: "flex-start" } }, unit(d, "DAYS"), sep(), unit(h, "HRS"), sep(), unit(m, "MIN"), sep(), unit(s, "SEC")));
  }
  function sep() { return React.createElement("div", { style: { fontSize: 30, color: "var(--ink-faint)", fontWeight: 300, marginTop: -6 } }, ":"); }

  function QuickStats({ poll, members, onPropose }) {
    const best = [...poll].sort((a, b) => b.yes.length - a.yes.length)[0];
    return React.createElement("div", { className: "panel", style: { padding: 22, display: "flex", flexDirection: "column", gap: 14 } },
      React.createElement("div", { className: "section-title", style: { margin: 0 } }, "Scheduling Assistant"),
      React.createElement("div", { style: { background: "var(--bg)", border: "1px solid var(--panel-edge)", borderRadius: 12, padding: 14 } },
        React.createElement("div", { className: "muted", style: { fontSize: 12, marginBottom: 6 } }, "Best fit right now"),
        React.createElement("div", { className: "row", style: { gap: 10 } },
          React.createElement(Icon, { name: "sparkle", size: 18, style: { color: "var(--gold)" } }),
          React.createElement("div", { className: "col", style: { lineHeight: 1.35 } },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, color: "var(--gold-bright)" } }, best.label + " \u00b7 " + best.time),
            React.createElement("div", { className: "muted", style: { fontSize: 12.5 } }, `${best.yes.length} of ${members.length} can make it`)))),
      React.createElement("p", { className: "muted", style: { margin: 0, fontSize: 13, lineHeight: 1.5 } }, "Propose dates, let everyone vote, and the assistant surfaces the night that works for the most players."),
      React.createElement("button", { className: "btn primary", style: { justifyContent: "center" }, onClick: onPropose }, React.createElement(Icon, { name: "plus", size: 16 }), "Propose a new date"));
  }

  function PollGrid({ poll, members, me, myVote, setVote, best }) {
    return React.createElement("div", { style: { overflowX: "auto" } },
      React.createElement("table", { style: { width: "100%", borderCollapse: "collapse", minWidth: 620 } },
        React.createElement("thead", null, React.createElement("tr", null,
          React.createElement("th", { style: thStyle("left") }, "Player"),
          poll.map((o) => React.createElement("th", { key: o.id, style: Object.assign(thStyle("center"), o.id === best.id ? { background: "rgba(232,181,74,0.08)" } : {}) },
            React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 13, color: o.id === best.id ? "var(--gold-bright)" : "var(--ink)" } }, o.label),
            React.createElement("div", { className: "muted mono", style: { fontSize: 11, fontWeight: 400 } }, o.time),
            o.id === best.id && React.createElement("div", { style: { fontSize: 10, color: "var(--gold)", marginTop: 3 } }, "\u2728 best"))))),
        React.createElement("tbody", null,
          members.map((mem) => React.createElement("tr", { key: mem.id, style: { borderTop: "1px solid var(--hair)" } },
            React.createElement("td", { style: { padding: "10px 16px", whiteSpace: "nowrap" } },
              React.createElement("div", { className: "row", style: { gap: 9 } },
                React.createElement(Avatar, { name: mem.id, size: 30, ring: mem.role ? "var(--gold-deep)" : undefined }),
                React.createElement("div", { className: "col" },
                  React.createElement("span", { style: { fontSize: 13.5, fontWeight: 600 } }, mem.id, mem.id === me && React.createElement("span", { style: { color: "var(--gold)", fontSize: 11, marginLeft: 5 } }, "(you)")),
                  mem.role && React.createElement("span", { className: "muted", style: { fontSize: 11 } }, mem.role)))),
            poll.map((o) => {
              const v = o.yes.includes(mem.id) ? "yes" : o.no.includes(mem.id) ? "no" : o.maybe.includes(mem.id) ? "maybe" : null;
              const isMe = mem.id === me;
              return React.createElement("td", { key: o.id, style: { padding: "8px", textAlign: "center", background: o.id === best.id ? "rgba(232,181,74,0.05)" : "transparent" } },
                isMe ? React.createElement("div", { className: "row", style: { gap: 4, justifyContent: "center" } },
                  ["yes", "maybe", "no"].map((opt) => React.createElement("button", { key: opt, onClick: () => setVote(o.id, opt), title: opt, style: voteBtn(v === opt, opt) },
                    React.createElement(Icon, { name: opt === "yes" ? "check" : opt === "no" ? "x" : "clock", size: 13 }))))
                  : React.createElement(VoteDot, { v }));
            })))))
    );
  }

  function VoteDot({ v }) {
    const map = { yes: ["var(--emerald)", "check"], no: ["var(--red)", "x"], maybe: ["var(--gold)", "clock"] };
    if (!v) return React.createElement("span", { style: { color: "var(--ink-faint)" } }, "\u2013");
    const [c, ic] = map[v];
    return React.createElement("div", { style: { display: "inline-grid", placeItems: "center", width: 26, height: 26, borderRadius: "50%", background: c + "22", color: c } }, React.createElement(Icon, { name: ic, size: 14 }));
  }

  function SessionCard({ s, members, me, setRsvp }) {
    const counts = { in: 0, maybe: 0, out: 0 };
    members.forEach((m) => { const r = s.rsvp[m.id]; if (r) counts[r]++; });
    const mine = s.rsvp[me];
    return React.createElement("div", { className: "panel", style: { padding: 18, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" } },
      React.createElement("div", { style: { width: 58, textAlign: "center", flex: "none" } },
        React.createElement("div", { style: { fontFamily: "var(--display)", fontSize: 11, color: "var(--gold)", letterSpacing: "0.1em" } }, monthOf(s.date)),
        React.createElement("div", { style: { fontFamily: "var(--display)", fontWeight: 700, fontSize: 30, color: "var(--ink)", lineHeight: 1 } }, dayOf(s.date))),
      React.createElement("div", { style: { width: 1, height: 44, background: "var(--hair)" } }),
      React.createElement("div", { className: "col", style: { flex: 1, minWidth: 200 } },
        React.createElement("div", { className: "row", style: { gap: 8 } },
          React.createElement("span", { style: { fontFamily: "var(--display)", fontWeight: 600, fontSize: 16 } }, `Session ${s.num}: ${s.title}`),
          s.confirmed ? React.createElement("span", { className: "tag emerald", style: { fontSize: 10 } }, "Confirmed") : React.createElement("span", { className: "tag", style: { fontSize: 10 } }, "Tentative")),
        React.createElement("div", { className: "muted row", style: { gap: 14, fontSize: 13, marginTop: 5 } },
          React.createElement("span", { className: "row", style: { gap: 5 } }, React.createElement(Icon, { name: "clock", size: 14 }), s.time),
          React.createElement("span", { className: "row", style: { gap: 5 } }, React.createElement(Icon, { name: "pin", size: 14 }), s.venue),
          React.createElement("span", { className: "row", style: { gap: 5, color: "var(--emerald)" } }, React.createElement(Icon, { name: "check", size: 14 }), `${counts.in} in`),
          counts.maybe > 0 && React.createElement("span", { style: { color: "var(--gold)" } }, `${counts.maybe} maybe`))),
      React.createElement("div", { className: "col", style: { gap: 6, alignItems: "flex-end" } },
        React.createElement("div", { className: "muted", style: { fontSize: 11 } }, "Your RSVP"),
        React.createElement("div", { className: "row", style: { gap: 5 } },
          [["in", "I'm in", "emerald", "check"], ["maybe", "Maybe", "gold", "clock"], ["out", "Can't", "red", "x"]].map(([k, l, c, ic]) =>
            React.createElement("button", { key: k, onClick: () => setRsvp(s.id, k), style: rsvpBtn(mine === k, c) }, React.createElement(Icon, { name: ic, size: 14 }), l))))
    );
  }

  function ProposeModal({ open, onClose, onAdd }) {
    const [date, setDate] = useState("2026-06-21");
    const [time, setTime] = useState("7:00 PM");
    useEffect(() => { if (open) { setDate("2026-06-21"); setTime("7:00 PM"); } }, [open]);
    function add() {
      const d = new Date(date + "T00:00:00");
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      onAdd({ id: "o" + Date.now(), date, label, time, yes: ["Jess"], no: [], maybe: [] });
    }
    return React.createElement(Modal, { open, onClose, title: "Propose a Session Date", sub: "Add an option for the party to vote on.", w: 460 },
      React.createElement("div", { style: { padding: 20, display: "flex", flexDirection: "column", gap: 16 } },
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Date"),
          React.createElement("input", { className: "input", type: "date", value: date, onChange: (e) => setDate(e.target.value) })),
        React.createElement("div", { className: "field" }, React.createElement("label", null, "Start time"),
          React.createElement("input", { className: "input", value: time, onChange: (e) => setTime(e.target.value) })),
        React.createElement("div", { className: "row", style: { justifyContent: "flex-end", gap: 10 } },
          React.createElement("button", { className: "btn ghost", onClick: onClose }, "Cancel"),
          React.createElement("button", { className: "btn primary", onClick: add }, React.createElement(Icon, { name: "check", size: 16 }), "Add to poll")))
    );
  }

  // helpers
  function fmtDate(d) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }); }
  function monthOf(d) { return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase(); }
  function dayOf(d) { return new Date(d + "T00:00:00").getDate(); }
  function thStyle(align) { return { padding: "12px 16px", textAlign: align, fontFamily: "var(--display)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "var(--ink-dim)", textTransform: "uppercase", background: "var(--bg-2)", borderBottom: "1px solid var(--hair)" }; }
  function voteBtn(active, opt) {
    const c = opt === "yes" ? "var(--emerald)" : opt === "no" ? "var(--red)" : "var(--gold)";
    return { width: 28, height: 28, borderRadius: 7, cursor: "pointer", display: "grid", placeItems: "center",
      border: `1px solid ${active ? c : "var(--hair)"}`, background: active ? c + "26" : "var(--surface-2)", color: active ? c : "var(--ink-faint)" };
  }
  function rsvpBtn(active, c) {
    const col = `var(--${c === "gold" ? "gold" : c})`;
    return { display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 600,
      border: `1px solid ${active ? col : "var(--hair)"}`, background: active ? col + "1e" : "var(--surface-2)", color: active ? col : "var(--ink-dim)" };
  }

  window.Scheduler = Scheduler;
})();
