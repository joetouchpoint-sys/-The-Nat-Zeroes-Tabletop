/* Line-icon set for The Nat Zeroes UI. Usage: <Icon name="map" /> */
(function () {
  const P = (d, extra) => React.createElement("path", Object.assign({ d, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" }, extra));
  const C = (cx, cy, r, extra) => React.createElement("circle", Object.assign({ cx, cy, r, fill: "none", stroke: "currentColor", strokeWidth: 1.7 }, extra));

  const ICONS = {
    home: [P("M3 10.5 12 3l9 7.5"), P("M5 9.5V20h14V9.5"), P("M9.5 20v-6h5v6")],
    map: [P("M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 7 9 4.5Z"), P("M9 4.5V17"), P("M15 7v12.5")],
    bestiary: [P("M12 3c-4 0-6.5 2.8-6.5 6.3 0 2 .9 3.4 2 4.4.5.5.7 1 .7 1.7V17a1.5 1.5 0 0 0 1.5 1.5h.3"), P("M18.5 9.3C18.5 5.8 16 3 12 3"), P("M18.5 9.3c0 2-.9 3.4-2 4.4-.5.5-.7 1-.7 1.7V17a1.5 1.5 0 0 1-1.5 1.5h-.3"), C(9.3, 9.5, 1.05, { fill: "currentColor", stroke: "none" }), C(14.7, 9.5, 1.05, { fill: "currentColor", stroke: "none" }), P("M10.5 18.5V21M13.5 18.5V21")],
    party: [C(8.5, 8, 2.6), C(16, 9.5, 2.1), P("M3.5 19c0-2.8 2.2-4.7 5-4.7s5 1.9 5 4.7"), P("M14.5 18.8c.1-2.2 1.6-3.7 3.7-3.7 2.2 0 3.8 1.6 3.8 4")],
    scheduler: [React.createElement("rect", { x: 3.5, y: 4.5, width: 17, height: 16, rx: 2.5, fill: "none", stroke: "currentColor", strokeWidth: 1.7 }), P("M3.5 9h17"), P("M8 3v3M16 3v3"), P("M7.5 13h3M7.5 16.5h6")],
    dice: [P("M12 2.6 3.8 7.2v9.6L12 21.4l8.2-4.6V7.2L12 2.6Z"), P("M3.8 7.2 12 11.9l8.2-4.7"), P("M12 11.9v9.5"), C(12, 8.2, 1.15, { fill: "currentColor", stroke: "none" })],
    recap: [P("M5 4.5h11l3 3V19.5H5Z"), P("M16 4.5v3h3"), P("M8 11h8M8 14.5h8M8 8h3")],
    settings: [C(12, 12, 3), P("M12 2.5v3M12 18.5v3M4.2 7l2.6 1.5M17.2 15.5l2.6 1.5M4.2 17l2.6-1.5M17.2 8.5 19.8 7")],
    plus: [P("M12 5v14M5 12h14")],
    upload: [P("M12 16V4M7.5 8.5 12 4l4.5 4.5"), P("M4.5 16v3.5h15V16")],
    fog: [P("M5 14.5a3.5 3.5 0 0 1 .7-6.9A5 5 0 0 1 16 8a3.8 3.8 0 0 1 1 7.5H6"), P("M4 18.5h7M14 18.5h6")],
    ruler: [P("M4 13.5 13.5 4l6.5 6.5L10.5 20Z"), P("M8 8.5l2 2M11 5.5l2 2M5.5 11l2 2M14.5 8l1.5 1.5")],
    move: [P("M12 3v18M3 12h18"), P("M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5")],
    ping: [C(12, 12, 3.2), P("M12 3v3M12 18v3M3 12h3M18 12h3")],
    trash: [P("M5 7h14M9.5 7V5.2c0-.6.5-1.2 1.2-1.2h2.6c.7 0 1.2.6 1.2 1.2V7"), P("M6.5 7l.8 12c0 .8.7 1.4 1.5 1.4h6.4c.8 0 1.5-.6 1.5-1.4L18 7"), P("M10 11v6M14 11v6")],
    link: [P("M9.5 14.5 14.5 9.5"), P("M11 7.5l1.5-1.5a3.5 3.5 0 0 1 5 5L16 12.5"), P("M13 16.5 11.5 18a3.5 3.5 0 0 1-5-5L8 11.5")],
    check: [P("M5 12.5 10 17.5 19 7")],
    x: [P("M6 6l12 12M18 6 6 18")],
    heart: [P("M12 20s-7-4.4-9.2-9C1.4 8 3 4.5 6.3 4.5c2 0 3.2 1.2 3.7 2.2.5-1 1.7-2.2 3.7-2.2 3.3 0 4.9 3.5 3.5 6.5C19 15.6 12 20 12 20Z")],
    shield: [P("M12 3 5 6v5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6Z"), P("M9.5 12l1.8 1.8L15 10")],
    chevL: [P("M14 6l-6 6 6 6")],
    chevR: [P("M10 6l6 6-6 6")],
    chevD: [P("M6 10l6 6 6-6")],
    search: [C(11, 11, 6.2), P("M16 16l4 4")],
    bell: [P("M6.5 10a5.5 5.5 0 0 1 11 0c0 4.5 1.5 5.5 1.5 5.5H5s1.5-1 1.5-5.5"), P("M10 19a2 2 0 0 0 4 0")],
    clock: [C(12, 12, 8.5), P("M12 7.5V12l3 2")],
    flame: [P("M12 3c1 3-1.5 4-1.5 6.5 0 1 .7 1.8 1.5 1.8s1.5-.8 1.5-1.8c0 0 2 1.6 2 4.5a5.5 5.5 0 0 1-11 0C4.5 10 8 9 9 6c.5 2 2 2 3-3Z")],
    grid: [React.createElement("rect", { x: 4, y: 4, width: 16, height: 16, rx: 1.5, fill: "none", stroke: "currentColor", strokeWidth: 1.7 }), P("M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16")],
    hex: [P("M12 3 20 7.5v9L12 21 4 16.5v-9Z")],
    eye: [P("M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"), C(12, 12, 2.6)],
    eyeOff: [P("M4 4l16 16"), P("M9.5 5.9A8.8 8.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.8 3.4"), P("M6.2 7.8A15.6 15.6 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.7-.4"), P("M9.9 10a2.6 2.6 0 0 0 3.6 3.6")],
    swords: [P("M14.5 3.5 20.5 3.5 20.5 9.5 11 19l-3-3Z", { fill: "none" }), P("M3.5 14.5 3.5 20.5 9.5 20.5"), P("M16.5 16.5 20.5 20.5"), P("M3.5 9.5 3.5 3.5 9.5 3.5 16 16")],
    skull: [P("M12 3c-4.4 0-7.5 3-7.5 7 0 2.4 1.2 4 2.5 5v2.2c0 .9.7 1.6 1.6 1.6h6.8c.9 0 1.6-.7 1.6-1.6V15c1.3-1 2.5-2.6 2.5-5 0-4-3.1-7-7.5-7Z"), C(9, 11.5, 1.4, { fill: "currentColor", stroke: "none" }), C(15, 11.5, 1.4, { fill: "currentColor", stroke: "none" }), P("M10.5 18.5V20M13.5 18.5V20M12 14.5l-.6 1.5h1.2Z")],
    menu: [P("M4 7h16M4 12h16M4 17h16")],
    sparkle: [P("M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z"), P("M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z")],
    play: [P("M7 4.5 19 12 7 19.5Z")],
    arrowR: [P("M5 12h14M13 6l6 6-6 6")],
    user: [C(12, 8, 3.4), P("M5.5 20c0-3.4 2.9-5.5 6.5-5.5s6.5 2.1 6.5 5.5")],
    pin: [P("M12 21s6.5-5.8 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15.2 12 21 12 21Z"), C(12, 10.5, 2.4)],
    layers: [P("M12 3 3 7.5l9 4.5 9-4.5Z"), P("M3 12l9 4.5 9-4.5"), P("M3 16.5 12 21l9-4.5")],
    save: [P("M5 5h11l3 3v11H5Z"), P("M8 5v5h7V5"), P("M8 19v-5h8v5")],
    arrowR: [P("M5 12h14M13 6l6 6-6 6")],
  };

  function Icon({ name, size, ...rest }) {
    const paths = ICONS[name] || ICONS.sparkle;
    return React.createElement("svg", Object.assign({
      viewBox: "0 0 24 24", width: size || 22, height: size || 22, "aria-hidden": "true",
    }, rest), paths.map((p, i) => React.cloneElement(p, { key: i })));
  }
  window.Icon = Icon;
})();
