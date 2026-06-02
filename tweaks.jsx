/* THE NAT ZEROES — Tweaks integration */
(function () {
  const { useEffect } = React;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "gold",
    "mood": "amethyst",
    "display": "Cinzel",
    "corners": "rounded",
    "motion": true
  }/*EDITMODE-END*/;

  const ACCENTS = {
    gold:     { bright: "#f7d278", base: "#e8b54a", deep: "#b07f30", label: "Gold" },
    crimson:  { bright: "#ff7a5f", base: "#e8412e", deep: "#a82c1d", label: "Crimson" },
    amethyst: { bright: "#b59dff", base: "#9170f0", deep: "#6f53c4", label: "Amethyst" },
    emerald:  { bright: "#7fe0b6", base: "#4fb98a", deep: "#2f8a64", label: "Emerald" },
  };
  const MOODS = {
    amethyst: { swatch: "#211a30", vars: { "--bg": "#130f1c", "--bg-2": "#181222", "--surface": "#211a30", "--surface-2": "#2a2140", "--surface-3": "#332747" } },
    slate:    { swatch: "#1c232e", vars: { "--bg": "#101319", "--bg-2": "#151a22", "--surface": "#1c232e", "--surface-2": "#243040", "--surface-3": "#2e3a4c" } },
    ember:    { swatch: "#271a16", vars: { "--bg": "#170f0e", "--bg-2": "#1d1411", "--surface": "#271a16", "--surface-2": "#32221c", "--surface-3": "#3d2a22" } },
  };
  const CORNERS = { rounded: { "--r-sm": "6px", "--r": "10px", "--r-lg": "16px", "--r-xl": "22px" },
                    sharp:   { "--r-sm": "2px", "--r": "3px", "--r-lg": "5px", "--r-xl": "7px" } };

  function NZTweaks() {
    const [t, setTweak] = window.useTweaks(TWEAK_DEFAULTS);

    useEffect(() => {
      const root = document.documentElement.style;
      const a = ACCENTS[t.accent] || ACCENTS.gold;
      root.setProperty("--gold", a.base);
      root.setProperty("--gold-bright", a.bright);
      root.setProperty("--gold-deep", a.deep);
      root.setProperty("--panel-edge", a.base + "2b");
      const m = MOODS[t.mood] || MOODS.amethyst;
      Object.entries(m.vars).forEach(([k, v]) => root.setProperty(k, v));
      const c = CORNERS[t.corners] || CORNERS.rounded;
      Object.entries(c).forEach(([k, v]) => root.setProperty(k, v));
      root.setProperty("--display", `"${t.display}", Georgia, serif`);
      document.body.classList.toggle("no-motion", !t.motion);
    }, [t]);

    const TP = window.TweaksPanel, S = window.TweakSection, Radio = window.TweakRadio, Toggle = window.TweakToggle;

    return React.createElement(TP, { title: "Tweaks" },
      React.createElement(S, { label: "Accent" }),
      React.createElement(Swatches, { value: t.accent, items: Object.entries(ACCENTS).map(([k, v]) => [k, v.base, v.label]), onChange: (v) => setTweak("accent", v) }),
      React.createElement(S, { label: "Backdrop mood" }),
      React.createElement(Swatches, { value: t.mood, items: Object.entries(MOODS).map(([k, v]) => [k, v.swatch, cap(k)]), onChange: (v) => setTweak("mood", v) }),
      React.createElement(S, { label: "Display font" }),
      React.createElement(Radio, { label: "Heading typeface", value: t.display, options: ["Cinzel", "Cormorant Garamond", "Marcellus"], onChange: (v) => setTweak("display", v) }),
      React.createElement(S, { label: "Feel" }),
      React.createElement(Radio, { label: "Corners", value: t.corners, options: ["rounded", "sharp"], onChange: (v) => setTweak("corners", v) }),
      React.createElement(Toggle, { label: "Animations", value: t.motion, onChange: (v) => setTweak("motion", v) })
    );
  }

  // custom swatch control
  function Swatches({ value, items, onChange }) {
    return React.createElement("div", { style: { display: "flex", gap: 8, padding: "2px 0 6px", flexWrap: "wrap" } },
      items.map(([key, color, label]) => React.createElement("button", { key, onClick: () => onChange(key), title: label,
        style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, cursor: "pointer", background: "none", border: "none", padding: 0 } },
        React.createElement("span", { style: { width: 34, height: 34, borderRadius: 9, background: color,
          border: value === key ? "2px solid #fff" : "2px solid rgba(255,255,255,0.15)",
          boxShadow: value === key ? `0 0 0 2px ${color}` : "none" } }),
        React.createElement("span", { style: { fontSize: 10.5, color: value === key ? "#fff" : "rgba(255,255,255,0.5)" } }, label))));
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  window.NZTweaks = NZTweaks;
})();
