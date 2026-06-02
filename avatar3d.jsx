/* ============================================================
   Avatar3D v2 — smooth stylized humanoid (Three.js)
   Capsule limbs, lathe torso, faces, hair, beards, capes, armor.
   window.Avatar3D = { OPTIONS, GROUPS, DEFAULT, build(cfg), makeViewer(...), randomConfig() }
   ============================================================ */
(function () {
  const T = window.THREE;

  // ---------------- option metadata ----------------
  const OPTIONS = {
    race: [
      { id: "human", label: "Human" }, { id: "elf", label: "Elf" }, { id: "halfelf", label: "Half-Elf" },
      { id: "halforc", label: "Half-Orc" }, { id: "tiefling", label: "Tiefling" }, { id: "dragonborn", label: "Dragonborn" },
      { id: "dwarf", label: "Dwarf" }, { id: "gnome", label: "Gnome" }, { id: "halfling", label: "Halfling" },
    ],
    bodyType: [{ id: "slim", label: "Slim" }, { id: "average", label: "Average" }, { id: "athletic", label: "Athletic" }, { id: "broad", label: "Broad" }],
    hair: [
      { id: "bald", label: "Bald" }, { id: "buzz", label: "Buzz" }, { id: "short", label: "Short" }, { id: "swept", label: "Swept" },
      { id: "messy", label: "Messy" }, { id: "long", label: "Long" }, { id: "ponytail", label: "Ponytail" }, { id: "bun", label: "Top knot" },
      { id: "braids", label: "Braids" }, { id: "mohawk", label: "Mohawk" }, { id: "afro", label: "Afro" }, { id: "twin", label: "Twin tails" },
    ],
    facialHair: [
      { id: "none", label: "Clean" }, { id: "stubble", label: "Stubble" }, { id: "mustache", label: "Mustache" },
      { id: "goatee", label: "Goatee" }, { id: "full", label: "Full beard" }, { id: "long", label: "Long beard" },
    ],
    horns: [
      { id: "none", label: "None" }, { id: "curved", label: "Curved" }, { id: "straight", label: "Straight" },
      { id: "ram", label: "Ram" }, { id: "antlers", label: "Antlers" }, { id: "crown", label: "Crown" },
    ],
    outfit: [
      { id: "tunic", label: "Tunic" }, { id: "leather", label: "Leather armor" }, { id: "plate", label: "Plate armor" },
      { id: "robe", label: "Mage robe" }, { id: "noble", label: "Noble coat" }, { id: "ranger", label: "Ranger garb" }, { id: "barbarian", label: "Furs" },
    ],
    cape: [{ id: "none", label: "None" }, { id: "short", label: "Short" }, { id: "long", label: "Long" }, { id: "hooded", label: "Hooded cloak" }, { id: "tattered", label: "Tattered" }],
    headgear: [
      { id: "none", label: "None" }, { id: "circlet", label: "Circlet" }, { id: "wizard", label: "Wizard hat" }, { id: "hood", label: "Hood" },
      { id: "helmOpen", label: "Open helm" }, { id: "helmFull", label: "Great helm" }, { id: "crown", label: "Crown" }, { id: "cap", label: "Cap" }, { id: "bandana", label: "Bandana" },
    ],
    weapon: [
      { id: "none", label: "None" }, { id: "sword", label: "Sword" }, { id: "greatsword", label: "Greatsword" }, { id: "staff", label: "Staff" },
      { id: "bow", label: "Bow" }, { id: "axe", label: "Axe" }, { id: "dagger", label: "Dagger" }, { id: "mace", label: "Mace" }, { id: "spear", label: "Spear" }, { id: "wand", label: "Wand" },
    ],
    offhand: [{ id: "none", label: "None" }, { id: "shield", label: "Shield" }, { id: "roundshield", label: "Round shield" }, { id: "torch", label: "Torch" }, { id: "book", label: "Spellbook" }, { id: "lantern", label: "Lantern" }],
    skin: ["#f6d3b0", "#eebd96", "#d99e6f", "#b87a47", "#8a5a32", "#5e3a1f", "#9fb89a", "#7fae8a", "#c98a8a", "#b97fc0", "#8a93c0", "#cfd3da"],
    hairColor: ["#1c140e", "#3a2418", "#6b4423", "#9a6a32", "#c9a24a", "#e3d6b0", "#9a9a9a", "#e6e0d2", "#2a2440", "#3a2a4a", "#7a2e2e", "#2e5a6a"],
    eyeColor: ["#3a2a1a", "#6b4a22", "#4a7d4a", "#2f6d8a", "#4a4a9a", "#7a4a9a", "#b08a3a", "#9a3a3a", "#d0a020"],
    primary: ["#3b3a8c", "#7d8896", "#9c3b6e", "#3c5a36", "#c9a84a", "#6e4a2f", "#2e3a36", "#3a4d8c", "#8a2f2f", "#2f6d6a", "#5a3a7a", "#b0763a"],
    secondary: ["#221f5a", "#3a4350", "#5e2342", "#243a20", "#7d6320", "#42291a", "#1c2420", "#222a44", "#561d1d", "#1d4442", "#371f52", "#6e4520"],
    trim: ["#e8c35a", "#cdd3da", "#d9a23a", "#8a909a", "#caa46a", "#e3d6b0", "#2a2228", "#b07f30"],
  };

  // creator grouping for tabbed UI
  const GROUPS = [
    { id: "body", label: "Body", controls: [["race", "Race", "chips"], ["bodyType", "Build", "chips"], ["height", "Height", "slider"], ["skin", "Skin tone", "color"]] },
    { id: "head", label: "Head & Face", controls: [["eyeColor", "Eye colour", "color"], ["brows", "Eyebrows", "toggle"], ["facialHair", "Facial hair", "chips"], ["facialHairColor", "Beard colour", "color"], ["horns", "Horns / antlers", "chips"]] },
    { id: "hair", label: "Hair", controls: [["hair", "Hairstyle", "chips"], ["hairColor", "Hair colour", "color"]] },
    { id: "outfit", label: "Outfit", controls: [["outfit", "Outfit", "chips"], ["primary", "Primary", "color"], ["secondary", "Secondary", "color"], ["trim", "Trim", "color"], ["shoulders", "Shoulder pads", "toggle"], ["gloves", "Gloves", "toggle"]] },
    { id: "extras", label: "Cloak & Gear", controls: [["cape", "Cape / cloak", "chips"], ["capeColor", "Cloak colour", "color"], ["headgear", "Headgear", "chips"], ["weapon", "Main hand", "chips"], ["offhand", "Off hand", "chips"]] },
  ];

  const DEFAULT = {
    race: "human", bodyType: "average", height: 1,
    skin: "#eebd96", hair: "short", hairColor: "#3a2418",
    brows: true, eyeColor: "#4a4a9a", facialHair: "none", facialHairColor: "#3a2418", horns: "none",
    outfit: "leather", primary: "#3c5a36", secondary: "#243a20", trim: "#caa46a",
    shoulders: true, gloves: true, cape: "none", capeColor: "#5e2342",
    headgear: "none", weapon: "sword", offhand: "none",
  };

  // ---------------- materials ----------------
  function smat(color, o) { return new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.62, metalness: 0.04 }, o || {})); }
  function metal(color, rough) { return new T.MeshStandardMaterial({ color, roughness: rough || 0.32, metalness: 0.9 }); }
  function cloth(color) { return new T.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0 }); }

  // ---------------- geometry helpers ----------------
  function capsuleGeo(r, len, radial) {
    radial = radial || 28; const seg = 10, h = len / 2, pts = [];
    for (let i = 0; i <= seg; i++) { const a = -Math.PI / 2 + (i / seg) * (Math.PI / 2); pts.push(new T.Vector2(Math.cos(a) * r, -h + Math.sin(a) * r)); }
    for (let i = 0; i <= seg; i++) { const a = (i / seg) * (Math.PI / 2); pts.push(new T.Vector2(Math.cos(a) * r, h + Math.sin(a) * r)); }
    const g = new T.LatheGeometry(pts, radial); g.computeVertexNormals(); return g;
  }
  function limb(r, len, mat) { const m = new T.Mesh(capsuleGeo(r, len), mat); return m; }
  function sphere(r, mat, seg) { return new T.Mesh(new T.SphereGeometry(r, seg || 32, seg || 28), mat); }

  // torso as a smooth lathe (waist->chest->shoulders) revolved, then flattened in Z
  function torsoGeo(profileScale) {
    const p = [
      [0.02, 0.0], [0.21, 0.02], [0.235, 0.18], [0.265, 0.36], [0.285, 0.5], [0.255, 0.6], [0.16, 0.66], [0.1, 0.7], [0.02, 0.71],
    ].map(([x, y]) => new T.Vector2(x * profileScale, y));
    const g = new T.LatheGeometry(p, 36); g.computeVertexNormals(); return g;
  }

  // ---------------- main build ----------------
  function build(cfgIn) {
    const c = Object.assign({}, DEFAULT, cfgIn);
    const g = new T.Group(); g.userData.config = c;

    const skinMat = smat(c.skin);
    const primMat = c.outfit === "plate" ? metal(c.primary, 0.4) : c.outfit === "leather" ? smat(c.primary, { roughness: 0.7 }) : cloth(c.primary);
    const secMat = c.outfit === "plate" ? metal(c.secondary, 0.45) : cloth(c.secondary);
    const trimMat = metal(c.trim, 0.4);
    const hairMat = smat(c.hairColor, { roughness: 0.72 });
    const beardMat = smat(c.facialHairColor, { roughness: 0.78 });
    const bootMat = smat(shade(c.secondary, -0.08), { roughness: 0.7 });

    const widths = { slim: 0.86, average: 1, athletic: 1.06, broad: 1.22 };
    const bw = widths[c.bodyType] || 1;
    const raceScale = c.race === "gnome" ? 0.72 : c.race === "halfling" ? 0.78 : c.race === "dwarf" ? 0.84 : c.race === "elf" ? 1.03 : 1;
    const headScale = (c.race === "gnome" || c.race === "halfling") ? 1.22 : c.race === "dwarf" ? 1.08 : 1;
    const isDragon = c.race === "dragonborn";

    const add = (m, x, y, z) => { if (x !== undefined) m.position.set(x, y || 0, z || 0); m.castShadow = true; m.receiveShadow = false; g.add(m); return m; };

    // ---- legs ----
    const legMat = c.outfit === "robe" ? cloth(c.secondary) : smat(shade(c.primary, -0.12), { roughness: 0.7 });
    if (c.outfit !== "robe") {
      [-1, 1].forEach((s) => {
        add(limb(0.13 * bw, 0.5, legMat), s * 0.15 * bw, 0.55, 0);
        add(limb(0.115 * bw, 0.42, skinMat.clone()), s * 0.15 * bw, 0.22, 0.01);
        const boot = add(sphere(0.15 * bw, bootMat), s * 0.15 * bw, 0.14, 0.04); boot.scale.set(1, 0.8, 1.5);
      });
    }

    // ---- pelvis ----
    const pelvis = add(sphere(0.24 * bw, primMat), 0, 0.92, 0); pelvis.scale.set(1, 0.7, 0.8);

    // ---- robe skirt (for robe outfit) ----
    if (c.outfit === "robe") {
      const skirt = add(new T.Mesh(robeGeo(0.22 * bw, 0.42 * bw, 0.95), cloth(c.primary)), 0, 0.5, 0);
    }

    // ---- torso ----
    const torso = add(new T.Mesh(torsoGeo(bw), primMat), 0, 0.9, 0);
    torso.scale.z = 0.74;
    // chest overlay (armor plate / tunic front)
    if (c.outfit === "plate") { const chest = add(new T.Mesh(torsoGeo(bw * 1.04), metal(c.primary, 0.38)), 0, 0.91, 0.02); chest.scale.z = 0.6; }
    // belt
    add(new T.Mesh(new T.TorusGeometry(0.22 * bw, 0.035, 10, 28), trimMat), 0, 0.96, 0).scale.set(1, 1, 0.78);

    // ---- shoulders / arms ----
    const armMat = c.outfit === "plate" ? metal(c.primary, 0.4) : (c.outfit === "robe" ? cloth(c.primary) : primMat);
    const shoulderX = 0.30 * bw;
    [-1, 1].forEach((s) => {
      add(sphere(0.115 * bw, armMat), s * shoulderX, 1.46, 0);
      if (c.shoulders) { const pad = add(sphere(0.15 * bw, c.outfit === "plate" ? trimMat : secMat), s * shoulderX, 1.5, 0); pad.scale.set(1.1, 0.8, 1.1); }
      const upper = add(limb(0.082 * bw, 0.34, armMat), s * (shoulderX + 0.04), 1.27, 0); upper.rotation.z = s * 0.12;
      const fore = add(limb(0.072 * bw, 0.32, c.gloves ? secMat : skinMat.clone()), s * (shoulderX + 0.085), 0.93, 0); fore.rotation.z = s * 0.14;
      const hand = add(sphere(0.078, c.gloves ? smat(shade(c.secondary, -0.05)) : skinMat.clone()), s * (shoulderX + 0.11), 0.74, 0.01);
      g.userData[s < 0 ? "handL" : "handR"] = hand.position.clone();
    });

    // ---- neck + head ----
    add(limb(0.075, 0.1, skinMat.clone()), 0, 1.58, 0);
    const headR = 0.2 * headScale;
    const head = add(sphere(headR, skinMat.clone(), 40), 0, 1.78, 0); head.scale.set(0.96, 1.04, 0.96);
    if (isDragon) { const snout = add(sphere(headR * 0.6, smat(c.skin), 18), 0, 1.74, headR * 0.8); snout.scale.set(0.8, 0.6, 1.1); }
    // ears
    if (c.race === "elf" || c.race === "halfelf") [-1, 1].forEach((s) => { const e = add(new T.Mesh(new T.ConeGeometry(0.045, 0.16, 10), skinMat.clone()), s * headR * 0.95, 1.84, -0.02); e.rotation.z = s * -0.6; e.rotation.x = -0.3; });
    else [-1, 1].forEach((s) => { const e = add(sphere(0.05, skinMat.clone(), 12), s * headR * 0.98, 1.78, 0); e.scale.set(0.5, 1, 0.7); });

    // eyes — pushed out past the head sphere surface (headR * 1.1+)
    [-1, 1].forEach((s) => {
      const white = add(sphere(0.052, smat("#f5f0e6"), 16), s * 0.077, 1.796, headR * 1.1); white.scale.set(1, 1.18, 0.6);
      add(sphere(0.032, smat(c.eyeColor, { roughness: 0.25 }), 16), s * 0.077, 1.79, headR * 1.15);
      add(sphere(0.016, smat("#0a0806"), 12), s * 0.077, 1.79, headR * 1.19);
      // catchlight
      add(sphere(0.006, smat("#ffffff", { roughness: 0.1 }), 8), s * 0.083, 1.797, headR * 1.2);
      if (c.brows) { const b = add(new T.Mesh(new T.BoxGeometry(0.076, 0.019, 0.028), hairMat), s * 0.077, 1.862, headR * 1.12); b.rotation.z = s * -0.12; }
    });
    // nose + mouth
    const nose = add(sphere(0.026, skinMat.clone(), 18), 0, 1.757, headR * 1.14); nose.scale.set(0.85, 0.78, 0.9);
    [-1, 1].forEach((s) => { const n = add(sphere(0.012, smat(shade(c.skin, -0.07)), 10), s * 0.021, 1.744, headR * 1.15); n.scale.set(1, 0.65, 0.75); });
    // upper lip — two small flattened spheres side-by-side
    [-1, 1].forEach((s) => { const ul = add(sphere(0.022, smat("#9a5050"), 14), s * 0.025, 1.706, headR * 1.13); ul.scale.set(0.9, 0.38, 0.55); });
    // lower lip — single wider flattened sphere
    const ll = add(sphere(0.028, smat(shade(c.skin, -0.04)), 14), 0, 1.692, headR * 1.125); ll.scale.set(1.55, 0.42, 0.6);

    // tusks for half-orc
    if (c.race === "halforc") [-1, 1].forEach((s) => { const t = add(new T.Mesh(new T.ConeGeometry(0.024, 0.1, 8), smat("#efe9d6")), s * 0.05, 1.7, headR * 1.0); t.rotation.x = 0.25; t.rotation.z = Math.PI; });

    // ---- facial hair ----
    buildBeard(add, c, headR, beardMat);
    // ---- hair ----
    buildHair(add, c, headR, hairMat);
    // ---- horns ----
    let horns = c.horns; if ((c.race === "tiefling" || isDragon) && horns === "none") horns = "curved";
    buildHorns(add, horns, headR, smat("#2a2228", { roughness: 0.5 }), trimMat);
    // ---- headgear ----
    buildHeadgear(add, c.headgear, headR, secMat, primMat, trimMat, hairMat);

    // ---- cape ----
    buildCape(g, c, bw);
    // ---- weapon / offhand ----
    buildWeapon(g, c.weapon, g.userData.handR, c);
    buildOffhand(g, c.offhand, g.userData.handL, c);

    // dragonborn / tiefling tail
    if (isDragon || c.race === "tiefling") {
      const tail = add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0, 0.85, -0.18), new T.Vector3(0.12, 0.6, -0.4), new T.Vector3(0.05, 0.35, -0.55), new T.Vector3(-0.1, 0.2, -0.42)]), 20, 0.05, 8), smat(c.skin)));
    }

    g.scale.setScalar(raceScale * (c.height || 1));
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    return g;
  }

  // robe / cape geometry: a flared open cylinder (lathe)
  function robeGeo(rTop, rBot, h) {
    const p = [new T.Vector2(rTop, h), new T.Vector2((rTop + rBot) / 2, h * 0.5), new T.Vector2(rBot, 0.02), new T.Vector2(rBot * 0.92, 0)];
    const g = new T.LatheGeometry(p, 24, 0, Math.PI * 2); g.computeVertexNormals(); return g;
  }

  function buildHair(add, c, headR, hairMat) {
    // Cap: tight to head (1.01×), raised to y=1.83 so the open bottom sits inside the head sphere
    const cap = (tl, sy, yo, zo) => {
      const R = headR * 1.01, theta = tl + 0.05;
      const capY = 1.83 + (yo || 0), capZ = zo || -0.01;
      const m = add(new T.Mesh(new T.SphereGeometry(R, 32, 24, 0, Math.PI * 2, 0, theta), hairMat), 0, capY, capZ);
      if (sy) m.scale.y = sy;
      // Closing disc to seal the open bottom
      const discR = Math.sin(theta) * R;
      const discY = capY + Math.cos(theta) * R;
      const disc = add(new T.Mesh(new T.CircleGeometry(discR, 28), hairMat), 0, discY, capZ);
      disc.rotation.x = Math.PI / 2;
      return m;
    };
    const strand = (x, y, z, r, h, rot) => { const m = add(limb(r, h, hairMat), x, y, z); if (rot) m.rotation.z = rot; return m; };
    switch (c.hair) {
      case "bald": break;
      case "buzz": { const m = cap(Math.PI * 0.5); m.material = smat(c.hairColor, { roughness: 0.9 }); m.scale.setScalar(0.99); break; }
      case "short": cap(Math.PI * 0.56); break;
      case "swept": { const m = cap(Math.PI * 0.55); m.scale.set(1.05, 1, 1.1); m.position.z += 0.03; break; }
      case "messy": { cap(Math.PI * 0.58); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; add(sphere(0.05, hairMat, 8), Math.cos(a) * headR * 0.7, 1.96 + Math.random() * 0.04, Math.sin(a) * headR * 0.7 - 0.01); } break; }
      case "afro": { const a = add(sphere(headR * 1.42, smat(c.hairColor, { roughness: 0.95 }), 20), 0, 1.86, -0.01); break; }
      case "mohawk": { for (let i = 0; i < 6; i++) { const m = add(new T.Mesh(new T.BoxGeometry(0.07, 0.16 - i * 0.008, 0.11), hairMat), 0, 2.0, headR * 0.62 - i * (headR * 0.26)); m.rotation.x = -0.05; } break; }
      case "long": cap(Math.PI * 0.6); { const b = add(new T.Mesh(robeGeo(headR * 0.85, headR * 0.65, 0.45), hairMat), 0, 1.32, -0.06); b.scale.z = 0.7; } break;
      case "ponytail": cap(Math.PI * 0.52); strand(0, 1.6, -headR * 0.95, 0.055, 0.42); break;
      case "bun": cap(Math.PI * 0.52); add(sphere(0.1, hairMat, 16), 0, 2.0, -0.05); break;
      case "braids": cap(Math.PI * 0.55); [-1, 1].forEach((s) => strand(s * headR * 0.7, 1.5, -0.05, 0.045, 0.5)); break;
      case "twin": cap(Math.PI * 0.53); [-1, 1].forEach((s) => { const m = strand(s * headR * 1.0, 1.55, -0.02, 0.05, 0.46, s * 0.2); }); break;
      default: cap(Math.PI * 0.56);
    }
  }

  function buildBeard(add, c, headR, beardMat) {
    switch (c.facialHair) {
      case "none": break;
      case "stubble": { const m = add(new T.Mesh(new T.SphereGeometry(headR * 1.0, 20, 16, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.4), smat(c.facialHairColor, { roughness: 0.95 })), 0, 1.78, 0.01); m.scale.set(1, 0.9, 1.02); break; }
      case "mustache": add(new T.Mesh(new T.TorusGeometry(0.05, 0.018, 8, 16, Math.PI), beardMat), 0, 1.715, headR * 0.9).rotation.z = Math.PI; break;
      case "goatee": { const m = add(sphere(0.06, beardMat, 14), 0, 1.66, headR * 0.78); m.scale.set(0.8, 1.2, 0.7); break; }
      case "full": { const m = add(new T.Mesh(new T.SphereGeometry(headR * 1.04, 20, 16, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.55), beardMat), 0, 1.76, 0.02); m.scale.set(1, 1.3, 1.05); break; }
      case "long": { const m = add(new T.Mesh(robeGeo(headR * 0.75, headR * 0.4, 0.4), beardMat), 0, 1.3, 0.06); m.scale.z = 0.8; const u = add(new T.Mesh(new T.SphereGeometry(headR * 1.02, 20, 16, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.5), beardMat), 0, 1.74, 0.03); u.scale.set(1, 1.2, 1.05); break; }
    }
  }

  function buildHorns(add, horns, headR, hornMat, goldMat) {
    if (horns === "none") return;
    const pair = (fn) => [-1, 1].forEach((s) => fn(s));
    switch (horns) {
      case "curved": pair((s) => { const h = add(new T.Mesh(new T.TorusGeometry(0.1, 0.03, 8, 16, Math.PI * 0.9), hornMat), s * 0.12, 1.95, -0.02); h.rotation.y = Math.PI / 2; h.rotation.z = s * 0.4 - (s < 0 ? 0 : 0); h.rotation.x = -0.4; }); break;
      case "straight": pair((s) => { const h = add(new T.Mesh(new T.ConeGeometry(0.045, 0.32, 10), hornMat), s * 0.12, 2.06, -0.02); h.rotation.z = s * 0.35; h.rotation.x = -0.25; }); break;
      case "ram": pair((s) => { const h = add(new T.Mesh(new T.TorusGeometry(0.11, 0.04, 10, 20, Math.PI * 1.4), hornMat), s * 0.14, 1.9, 0); h.rotation.y = Math.PI / 2; h.rotation.x = -0.2; h.rotation.z = s * 0.2; }); break;
      case "antlers": pair((s) => { const base = add(new T.Mesh(new T.ConeGeometry(0.03, 0.3, 8), hornMat), s * 0.1, 2.05, -0.02); base.rotation.z = s * 0.4; for (let i = 0; i < 2; i++) { const br = add(new T.Mesh(new T.ConeGeometry(0.018, 0.14, 6), hornMat), s * (0.16 + i * 0.05), 2.12 + i * 0.05, -0.02); br.rotation.z = s * 0.9; } }); break;
      case "crown": for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI - Math.PI / 2; add(new T.Mesh(new T.ConeGeometry(0.025, 0.12, 8), hornMat), Math.sin(a) * headR, 2.02, Math.cos(a) * headR * 0.5 - 0.05).rotation.x = -0.1; } break;
    }
  }

  function buildHeadgear(add, hg, headR, secMat, primMat, trimMat, hairMat) {
    switch (hg) {
      case "none": break;
      case "circlet": { const c = add(new T.Mesh(new T.TorusGeometry(headR * 0.96, 0.022, 10, 28), trimMat), 0, 1.92, 0); c.rotation.x = Math.PI / 2; add(sphere(0.035, metal("#7fd0ff", 0.2), 14), 0, 1.97, headR * 0.92); break; }
      case "wizard": { add(new T.Mesh(new T.CylinderGeometry(headR * 1.5, headR * 1.5, 0.035, 24), secMat), 0, 2.0, 0); const cone = add(new T.Mesh(new T.ConeGeometry(headR * 1.05, 0.62, 24), primMat), 0, 2.32, 0); cone.rotation.x = 0.08; add(sphere(0.05, new T.MeshStandardMaterial({ color: "#f7d278", emissive: "#7a5a10", emissiveIntensity: 0.7 }), 14), 0, 2.62, 0.05); break; }
      case "hood": {
        // Crown dome — tight cap, closed at bottom so no open-edge ring
        const hR = headR * 1.06, hTh = Math.PI * 0.5;
        add(new T.Mesh(new T.SphereGeometry(hR, 28, 20, 0, Math.PI * 2, 0, hTh), primMat), 0, 1.88, -0.03);
        // Closing disc for the dome bottom
        const hdR = Math.sin(hTh) * hR, hdY = 1.88 + Math.cos(hTh) * hR;
        const hd = add(new T.Mesh(new T.CircleGeometry(hdR, 24), primMat), 0, hdY, -0.03); hd.rotation.x = Math.PI / 2;
        // Side draping (wide flat plane behind head)
        const drape = add(new T.Mesh(robeGeo(headR * 1.03, headR * 0.82, 0.52), primMat), 0, 1.44, -0.1);
        drape.scale.z = 0.65; drape.scale.x = 1.15;
        break;
      }
      case "helmOpen": { const dome = add(new T.Mesh(new T.SphereGeometry(headR * 1.12, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.62), metal("#9aa3b0", 0.4)), 0, 1.8, 0); add(new T.Mesh(new T.BoxGeometry(0.045, 0.32, 0.06), metal("#9aa3b0", 0.4)), 0, 1.78, headR * 1.05); break; }
      case "helmFull": {
        const hm = metal("#8a929e", 0.4);
        // Upper dome (top hemisphere only — no open bottom on skull area)
        const dR = headR * 1.17, dTh = Math.PI * 0.5;
        add(new T.Mesh(new T.SphereGeometry(dR, 28, 20, 0, Math.PI * 2, 0, dTh), hm), 0, 1.88, 0);
        const ddR = Math.sin(dTh) * dR, ddY = 1.88 + Math.cos(dTh) * dR;
        const dd = add(new T.Mesh(new T.CircleGeometry(ddR, 24), hm), 0, ddY, 0); dd.rotation.x = Math.PI / 2;
        // Lower face guard (open cylinder — faces/neck area, no endcaps needed)
        add(new T.Mesh(new T.CylinderGeometry(headR * 1.16, headR * 1.14, 0.28, 28, 1, true), hm), 0, 1.69, 0);
        // Horizontal eye slit
        add(new T.Mesh(new T.BoxGeometry(headR * 2.2, 0.038, 0.045), metal("#2a2e36", 0.6)), 0, 1.79, headR * 1.15);
        // Nose guard
        add(new T.Mesh(new T.BoxGeometry(0.038, 0.1, 0.055), hm), 0, 1.75, headR * 1.13);
        // Top crest
        add(new T.Mesh(new T.BoxGeometry(0.04, 0.2, 0.4), metal(trimMat.color.getStyle(), 0.35)), 0, 2.08, -0.02);
        // Trim ring where dome meets guard
        add(new T.Mesh(new T.TorusGeometry(dR, 0.016, 8, 28), metal(trimMat.color.getStyle(), 0.38)), 0, ddY, 0).rotation.x = Math.PI / 2;
        break;
      }
      case "crown": { add(new T.Mesh(new T.CylinderGeometry(headR * 1.05, headR * 1.05, 0.1, 24, 1, true), trimMat), 0, 1.98, 0); for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; add(new T.Mesh(new T.ConeGeometry(0.025, 0.1, 8), trimMat), Math.cos(a) * headR * 1.02, 2.06, Math.sin(a) * headR * 1.02); } break; }
      case "cap": { const cp = add(new T.Mesh(new T.SphereGeometry(headR * 1.08, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), primMat), 0, 1.82, 0); add(new T.Mesh(new T.CylinderGeometry(headR * 0.5, headR * 0.7, 0.03, 16, 1, false, 0, Math.PI), primMat), 0, 1.86, headR * 0.9).rotation.x = 0.2; break; }
      case "bandana": { add(new T.Mesh(new T.CylinderGeometry(headR * 1.04, headR * 1.04, 0.12, 22, 1, true), secMat), 0, 1.9, 0); add(new T.Mesh(new T.ConeGeometry(0.05, 0.18, 8), secMat), -headR * 0.9, 1.86, -0.06).rotation.z = 0.9; break; }
    }
  }

  function buildCape(g, c, bw) {
    if (!c.cape || c.cape === "none") return;
    const len = c.cape === "long" || c.cape === "hooded" ? 1.0 : c.cape === "tattered" ? 0.9 : 0.62;
    const geo = new T.PlaneGeometry(0.62 * bw, len, 8, 12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, -Math.cos(x * 3.2) * 0.06 - (0.5 - (y / len + 0.5)) * 0.18); if (c.cape === "tattered" && y < -len * 0.2) pos.setX(i, x * (1 - (0.4 + 0.3 * Math.sin(x * 20)))); }
    geo.computeVertexNormals();
    const mat = new T.MeshStandardMaterial({ color: c.capeColor, roughness: 0.85, metalness: 0, side: T.DoubleSide });
    const cape = new T.Mesh(geo, mat); cape.position.set(0, 1.42, -0.16 * bw); cape.rotation.x = 0.12; cape.castShadow = true; g.add(cape);
    if (c.cape === "hooded") { const hood = new T.Mesh(new T.SphereGeometry(0.26, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6), mat); hood.position.set(0, 1.74, -0.12); hood.scale.set(1.1, 1.15, 1.2); g.add(hood); }
  }

  function meshAt(geo, m, x, y, z) { const me = new T.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = true; return me; }

  function buildWeapon(g, weapon, hand, c) {
    if (!weapon || weapon === "none" || !hand) return;
    const grp = new T.Group(); grp.position.copy(hand);
    const steel = metal("#cdd3da", 0.28), gold = metal(c.trim, 0.35), wood = smat("#6b4423", { roughness: 0.8 });
    switch (weapon) {
      case "sword": grp.add(meshAt(capsuleGeo(0.022, 0.18), wood, 0, -0.02, 0)); grp.add(meshAt(new T.BoxGeometry(0.2, 0.045, 0.05), gold, 0, 0.1, 0)); grp.add(meshAt(bladeGeo(0.07, 0.7), steel, 0, 0.48, 0)); break;
      case "greatsword": grp.add(meshAt(capsuleGeo(0.026, 0.28), wood, 0, -0.04, 0)); grp.add(meshAt(new T.BoxGeometry(0.28, 0.05, 0.06), gold, 0, 0.14, 0)); grp.add(meshAt(bladeGeo(0.1, 1.1), steel, 0, 0.74, 0)); break;
      case "staff": grp.add(meshAt(capsuleGeo(0.03, 1.4), wood, 0, 0.35, 0)); grp.add(meshAt(new T.IcosahedronGeometry(0.09, 0), new T.MeshStandardMaterial({ color: "#7fd0ff", emissive: "#2a7dd0", emissiveIntensity: 0.9, roughness: 0.15 }), 0, 1.12, 0)); break;
      case "wand": grp.add(meshAt(capsuleGeo(0.018, 0.34), wood, 0, 0.12, 0)); grp.add(meshAt(sphereGeo(0.045), new T.MeshStandardMaterial({ color: "#e89cff", emissive: "#9a2ad0", emissiveIntensity: 0.9 }), 0, 0.32, 0)); break;
      case "axe": grp.add(meshAt(capsuleGeo(0.028, 0.85), wood, 0, 0.3, 0)); { const blade = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.04, 24, 1, false, -0.6, 1.2), metal("#aab0ba", 0.3)); blade.rotation.x = Math.PI / 2; blade.position.set(0.08, 0.6, 0); grp.add(blade); } break;
      case "dagger": grp.add(meshAt(capsuleGeo(0.02, 0.12), wood, 0, 0, 0)); grp.add(meshAt(bladeGeo(0.05, 0.28), steel, 0, 0.2, 0)); break;
      case "mace": grp.add(meshAt(capsuleGeo(0.026, 0.55), wood, 0, 0.18, 0)); grp.add(meshAt(new T.IcosahedronGeometry(0.1, 0), metal("#8a909a", 0.35), 0, 0.52, 0)); break;
      case "spear": grp.add(meshAt(capsuleGeo(0.024, 1.5), wood, 0, 0.4, 0)); grp.add(meshAt(new T.ConeGeometry(0.06, 0.26, 10), steel, 0, 1.2, 0)); break;
    }
    grp.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    grp.rotation.x = -0.12;
    grp.position.z += 0.07; // move weapon forward to avoid shoulder clipping
    g.add(grp);
  }
  function buildOffhand(g, off, hand, c) {
    if (!off || off === "none" || !hand) return;
    const grp = new T.Group(); grp.position.copy(hand);
    const steel = metal("#aab0ba", 0.3), wood = smat("#6b4423", { roughness: 0.8 });
    switch (off) {
      case "shield": { const s = meshAt(new T.BoxGeometry(0.04, 0.46, 0.34), metal(c.primary, 0.4), -0.08, 0.05, 0); grp.add(s); grp.add(meshAt(new T.BoxGeometry(0.05, 0.4, 0.28), metal(c.trim, 0.4), -0.06, 0.05, 0)); break; }
      case "roundshield": { const s = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.04, 28), metal(c.primary, 0.4)); s.rotation.z = Math.PI / 2; s.position.set(-0.08, 0.05, 0); grp.add(s); grp.add(meshAt(sphereGeo(0.05), metal(c.trim, 0.35), -0.1, 0.05, 0)); break; }
      case "torch": grp.add(meshAt(capsuleGeo(0.022, 0.4), wood, 0, 0.1, 0)); grp.add(meshAt(sphereGeo(0.08), new T.MeshStandardMaterial({ color: "#ff8a2a", emissive: "#ff5a10", emissiveIntensity: 1.1, roughness: 0.4 }), 0, 0.34, 0)); break;
      case "book": grp.add(meshAt(new T.BoxGeometry(0.04, 0.26, 0.2), smat(c.secondary), -0.05, 0.05, 0)); grp.add(meshAt(new T.BoxGeometry(0.05, 0.22, 0.02), smat("#f4eddd"), -0.03, 0.05, 0.1)); break;
      case "lantern": grp.add(meshAt(new T.BoxGeometry(0.12, 0.16, 0.12), metal(c.trim, 0.4), 0, 0.12, 0)); grp.add(meshAt(sphereGeo(0.05), new T.MeshStandardMaterial({ color: "#ffd27a", emissive: "#ffb020", emissiveIntensity: 1 }), 0, 0.12, 0)); break;
    }
    grp.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    g.add(grp);
  }
  function bladeGeo(w, len) { const g = new T.BoxGeometry(w, len, 0.022); return g; }
  function sphereGeo(r) { return new T.SphereGeometry(r, 16, 14); }

  function shade(hex, amt) { const c = new T.Color(hex); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + amt))); return "#" + c.getHexString(); }

  // ---------------- viewer ----------------
  function makeViewer(container, config, opts) {
    opts = opts || {};
    const w = container.clientWidth || 360, h = container.clientHeight || 460;
    const scene = new T.Scene();
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.outputEncoding = T.sRGBEncoding;
    container.appendChild(renderer.domElement);

    const camera = new T.PerspectiveCamera(36, w / h, 0.1, 100);

    scene.add(new T.HemisphereLight(0xcdbcff, 0x2a2036, 0.85));
    const key = new T.DirectionalLight(0xfff2dc, 1.3); key.position.set(3, 6, 5);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 1; key.shadow.camera.far = 22;
    key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 4; key.shadow.camera.bottom = -1; key.shadow.bias = -0.0005;
    scene.add(key);
    const rim = new T.DirectionalLight(0xe8623e, 0.55); rim.position.set(-5, 3, -4); scene.add(rim);
    const fill = new T.PointLight(0x9170f0, 0.55, 24); fill.position.set(-3, 2, 4); scene.add(fill);

    if (opts.ground !== false) {
      // ---- Stone floor platform ----
      const floorMat = new T.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.96 });
      const floor = new T.Mesh(new T.CylinderGeometry(3.5, 3.5, 0.14, 40), floorMat);
      floor.position.y = -0.08; floor.receiveShadow = true; scene.add(floor);
      // Gold trim ring
      const trimRing = new T.Mesh(new T.TorusGeometry(3.48, 0.022, 8, 64), new T.MeshStandardMaterial({ color: "#b07f30", emissive: "#b07f30", emissiveIntensity: 0.3, roughness: 0.4 }));
      trimRing.rotation.x = Math.PI / 2; trimRing.position.y = -0.01; scene.add(trimRing);
      // Inner ring
      const innerRing = new T.Mesh(new T.TorusGeometry(1.1, 0.016, 8, 48), new T.MeshStandardMaterial({ color: "#9170f0", emissive: "#9170f0", emissiveIntensity: 0.4, roughness: 0.4 }));
      innerRing.rotation.x = Math.PI / 2; innerRing.position.y = -0.01; scene.add(innerRing);

      // ---- Back wall ----
      const wallMat = new T.MeshStandardMaterial({ color: 0x141018, roughness: 0.94 });
      const backWall = new T.Mesh(new T.PlaneGeometry(6, 6), wallMat);
      backWall.position.set(0, 2.9, -3.4); backWall.receiveShadow = true; scene.add(backWall);
      // Arch frame over the character
      const archMat = new T.MeshStandardMaterial({ color: 0x2a2230, roughness: 0.88 });
      const archBase1 = new T.Mesh(new T.BoxGeometry(0.28, 3.2, 0.28), archMat);
      archBase1.position.set(-1.0, 1.4, -3.3); scene.add(archBase1);
      const archBase2 = new T.Mesh(new T.BoxGeometry(0.28, 3.2, 0.28), archMat);
      archBase2.position.set(1.0, 1.4, -3.3); scene.add(archBase2);
      // Arch top (half-torus)
      const archTop = new T.Mesh(new T.TorusGeometry(1.0, 0.14, 10, 24, Math.PI), archMat);
      archTop.position.set(0, 3.0, -3.3); archTop.rotation.z = Math.PI; scene.add(archTop);

      // ---- Torch sconces (left and right of arch) ----
      const torchMat = new T.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.88 });
      const flameMat = new T.MeshStandardMaterial({ color: 0xff8a30, emissive: 0xff5010, emissiveIntensity: 1.4 });
      [[-1.6, 2.1, -3.2], [1.6, 2.1, -3.2]].forEach(([tx, ty, tz]) => {
        const stick = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.4, 8), torchMat);
        stick.position.set(tx, ty, tz); scene.add(stick);
        const flame = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), flameMat);
        flame.position.set(tx, ty + 0.25, tz); flame.scale.set(1, 1.3, 1); scene.add(flame);
        const pl = new T.PointLight(0xff7020, 1.8, 6);
        pl.position.set(tx, ty + 0.3, tz); scene.add(pl);
      });

      // Subtle uplight from the floor ring
      const upLight = new T.PointLight(0x9170f0, 0.4, 4); upLight.position.set(0, -0.05, 0); scene.add(upLight);
      scene.userData.particles = []; // no particles
    }

    const pivot = new T.Group(); scene.add(pivot);
    let figure = build(config); pivot.add(figure);

    let spin = opts.spin !== false, dragging = false, px = 0, targetRotY = 0, rotY = 0, dist = 4.4;
    const dom = renderer.domElement; dom.style.cursor = "grab";
    const down = (e) => { dragging = true; spin = false; px = (e.touches ? e.touches[0].clientX : e.clientX); dom.style.cursor = "grabbing"; };
    const move = (e) => { if (!dragging) return; const x = (e.touches ? e.touches[0].clientX : e.clientX); targetRotY += (x - px) * 0.01; px = x; };
    const up = () => { dragging = false; dom.style.cursor = "grab"; };
    dom.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    const wheel = (e) => { e.preventDefault(); dist = Math.max(2.6, Math.min(7, dist + e.deltaY * 0.002)); };
    dom.addEventListener("wheel", wheel, { passive: false });

    let raf;
    function loop() {
      raf = requestAnimationFrame(loop);
      if (spin) targetRotY += 0.0035;
      rotY += (targetRotY - rotY) * 0.1; pivot.rotation.y = rotY;

      // Subtle breathing / idle animation
      const t = performance.now() * 0.001;
      pivot.scale.y = 1 + Math.sin(t * 0.55) * 0.009;
      pivot.position.y = Math.sin(t * 0.55) * 0.007;
      pivot.rotation.z = Math.sin(t * 0.28) * 0.008;


      camera.position.set(0, 1.45, dist); camera.lookAt(0, 1.02, 0);
      renderer.render(scene, camera);
    }
    loop();
    function resize() { const W = container.clientWidth, H = container.clientHeight; if (!W || !H) return; renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    const ro = new ResizeObserver(resize); ro.observe(container); setTimeout(resize, 0);

    return {
      update(cfg) { pivot.remove(figure); disposeObj(figure); figure = build(cfg); pivot.add(figure); },
      setSpin(v) { spin = v; }, resetView() { targetRotY = 0; dist = 4.4; },
      dispose() { cancelAnimationFrame(raf); ro.disconnect(); dom.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); dom.removeEventListener("wheel", wheel); disposeObj(scene); renderer.dispose(); if (dom.parentNode) dom.parentNode.removeChild(dom); },
    };
  }
  function disposeObj(obj) { obj.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose()); }); }

  function randomConfig() {
    const p = (a) => a[Math.floor(Math.random() * a.length)];
    return { race: p(OPTIONS.race).id, bodyType: p(OPTIONS.bodyType).id, height: 0.9 + Math.random() * 0.22,
      skin: p(OPTIONS.skin), hair: p(OPTIONS.hair).id, hairColor: p(OPTIONS.hairColor),
      brows: Math.random() > 0.15, eyeColor: p(OPTIONS.eyeColor), facialHair: p(OPTIONS.facialHair).id, facialHairColor: p(OPTIONS.hairColor), horns: p(OPTIONS.horns).id,
      outfit: p(OPTIONS.outfit).id, primary: p(OPTIONS.primary), secondary: p(OPTIONS.secondary), trim: p(OPTIONS.trim),
      shoulders: Math.random() > 0.4, gloves: Math.random() > 0.3, cape: p(OPTIONS.cape).id, capeColor: p(OPTIONS.secondary),
      headgear: p(OPTIONS.headgear).id, weapon: p(OPTIONS.weapon).id, offhand: p(OPTIONS.offhand).id };
  }

  window.Avatar3D = { OPTIONS, GROUPS, DEFAULT, build, makeViewer, randomConfig, disposeObj };
})();
