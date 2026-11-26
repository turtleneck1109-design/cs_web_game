// Atlas tiles for the freight containers, insulated station modules and their ground surfaces.
function paintArenaTile(scene, n, { rect, plaster, word, random }) {
  const cold = scene.code === "FROSTLINE";
  if (n === 9) {
    plaster(cold ? "#dce7ea" : "#826d60");
    for (let i = 0; i < 550; i++) {
      const x = random() * 256,
        y = random() * 256;
      rect(
        x,
        y,
        cold ? 3 + random() * 12 : 1 + random() * 4,
        1 + random() * 2,
        cold ? "#9ab6c22c" : "#3e393750",
      );
    }
    return;
  }
  const colors = cold
    ? ["#b9d0d9", "#829eaf", "#dce4df", "#68909e"]
    : ["#9b513e", "#527f81", "#ab6b41", "#697a68"];
  plaster(colors[(n - 1) % 4]);
  for (let i = 0; i < 256; i += cold ? 64 : 16) {
    rect(i, 0, cold ? 3 : 4, 256, "#28363b48");
    rect(i + 4, 0, 2, 256, "#f7edde45");
  }
  rect(0, 0, 256, 9, cold ? "#dce7e8" : "#584a42");
  rect(0, 248, 256, 8, "#31434a85");
  if (cold) {
    rect(0, 192, 256, 17, "#dd753b");
    rect(0, 209, 256, 3, "#f7bd77");
    if (n % 3 === 1) {
      rect(31, 64, 194, 74, "#536975");
      rect(37, 70, 182, 61, "#294a5c");
      for (let i = 0; i < 3; i++) {
        rect(40 + i * 61, 72, 54, 18, "#587d8a");
        rect(94 + i * 61, 68, 4, 64, "#95abb1");
      }
    } else if (n % 3 === 2) {
      rect(42, 77, 64, 61, "#566a73");
      for (let y = 83; y < 133; y += 6) rect(47, y, 54, 2, "#263d4b");
      word("OBS", 145, 111, 29, "#334953");
      word("POLAR LAB", 146, 128, 11, "#3d555f");
    } else {
      rect(92, 83, 75, 164, "#566e78");
      rect(98, 90, 63, 150, "#8398a1");
      rect(108, 105, 42, 31, "#324b56");
    }
  } else {
    if (n % 3 === 1) {
      rect(125, 10, 6, 235, "#303d3c");
      for (const x of [28, 93, 160, 225]) {
        rect(x, 19, 4, 219, "#c3b59b");
        rect(x - 4, 115, 12, 5, "#4e5149");
      }
    } else {
      word(n % 2 ? "IRON RAIL" : "RY / 04", 16, 102, 26, "#e6dbb8");
      word("FREIGHT DIVISION", 18, 120, 9, "#efe1c0");
      rect(204, 185, 31, 15, "#d1ab57");
      rect(208, 190, 22, 2, "#5d4c3a");
    }
    for (const x of [4, 234])
      for (const y of [3, 235]) {
        rect(x, y, 17, 17, "#696158");
        rect(x + 5, y + 5, 7, 6, "#373e3c");
      }
  }
}

// All solid landmarks stand on wall cells or beyond the perimeter.
// Rails, sleepers and wayfinding paint sit flush with the walkable surface.
function buildArenaScenery(scene, tile, { box, beam, quad, crate }) {
  if (scene.code === "SWITCHYARD") {
    for (const lane of [4.5, 10.5]) {
      const z = lane * tile;
      for (let x = tile; x < 19 * tile; x += 0.76)
        box(x, 0.006, z - 0.91, 0.17, 0.045, 1.82, "#594d45");
      for (const side of [-0.63, 0.63])
        box(tile, 0.052, z + side, 18 * tile, 0.045, 0.08, "#a5a59b");
    }
    for (const cell of [6.4, 13.4]) {
      const x = cell * tile,
        z0 = 2.5 * tile,
        z1 = 6.5 * tile,
        top = 7.3;
      for (const z of [z0, z1]) {
        for (const offset of [-0.53, 0.53])
          box(x + offset - 0.08, 0, z - 0.1, 0.16, top, 0.2, "#a85c38");
        for (let y = 1; y < top - 1; y += 1.25)
          beam([x - 0.53, y, z], [x + 0.53, y + 1.1, z], 0.064, "#bb7348");
      }
      for (const y of [top, top + 1])
        box(x - 0.7, y, z0 - 0.35, 1.4, 0.13, z1 - z0 + 0.7, "#975239");
      for (const xx of [x - 0.65, x + 0.65])
        for (let i = 0; i < 8; i++) {
          const z = z0 + ((z1 - z0) * i) / 8;
          beam(
            [xx, top + (i % 2), z],
            [xx, top + 1 - (i % 2), z + (z1 - z0) / 8],
            0.063,
            "#d99a63",
          );
        }
      box(x - 0.46, top - 0.75, (z0 + z1) / 2, 0.92, 0.74, 1.27, "#d6a94f");
      box(
        x - 0.48,
        top - 0.64,
        (z0 + z1) / 2 + 0.13,
        0.035,
        0.39,
        0.95,
        "#465d69",
      );
    }
    for (const [x, z] of [
      [8.4, 6.3],
      [13.6, 9.2],
      [5.8, 14.4],
    ])
      crate(x * tile, z * tile, 1.15, 1.02, 0.95);
    return;
  }
  const cx = 10.5 * tile,
    cz = 9.5 * tile,
    base = 4.35,
    r = 3.65;
  // Alternating triangular panels and raised seams form a landmark visible from every courtyard.
  const point = (band, i) => {
    const lat = (band * Math.PI) / 10,
      angle = ((i + (band % 2) * 0.5) * Math.PI) / 8;
    return [
      cx + r * Math.cos(lat) * Math.cos(angle),
      base + r * Math.sin(lat),
      cz + r * Math.cos(lat) * Math.sin(angle),
    ];
  };
  for (let i = 0; i < 16; i++) {
    const a = point(0, i),
      b = point(0, i + 1);
    quad(
      [a[0], 2.6, a[2]],
      [b[0], 2.6, b[2]],
      b,
      a,
      0,
      i % 2 ? "#697f8b" : "#7d94a0",
    );
    beam(a, b, 0.07, "#df9b60");
    for (let k = 0; k < 5; k++) {
      const lo = point(k, i),
        next = point(k, i + 1),
        up = point(k + 1, i),
        across = point(k + 1, i + 1);
      const tri = (a, b, c, color) => quad(a, b, c, c, 0, color);
      if (k % 2) {
        tri(lo, next, across, "#cedde2");
        tri(lo, across, up, "#e5edf0");
        beam(lo, across, 0.024, "#849da8");
      } else {
        tri(lo, next, up, "#dce6e8");
        tri(next, across, up, "#b9cdd5");
        beam(next, up, 0.024, "#8fa7b2");
      }
      beam(lo, up, 0.025, "#a4b7bf");
    }
  }
  for (const [x, z] of [
    [7.6, 2.6],
    [16.4, 7.5],
    [7.5, 13.6],
  ]) {
    const X = x * tile,
      Z = z * tile,
      h = roofHeight(Math.floor(x), Math.floor(z));
    beam([X, h, Z], [X, h + 3.5, Z], 0.068, "#7a8c94");
    for (let i = 0; i < 3; i++)
      beam(
        [X - 0.61 + i * 0.11, h + 2 + i * 0.45, Z],
        [X + 0.61 - i * 0.11, h + 2 + i * 0.45, Z],
        0.04,
        "#d67e47",
      );
    box(X - 0.065, h + 3.47, Z - 0.065, 0.13, 0.15, 0.13, "#f4a35e");
  }
  // Wind-scoured peaks outside the playable area sit inside the sky dome.
  const ridge = (t, dist, height) => [
    27.5 + dist * Math.cos(t),
    height,
    27.5 + dist * Math.sin(t),
  ];
  const skyline = (angle) =>
    ridge(
      angle,
      54,
      7.8 +
        3.7 * Math.sin(5 * angle + 0.33) +
        2.1 * Math.cos(9 * angle) +
        0.8 * Math.sin(19 * angle),
    );
  for (let i = 0; i < 80; i++) {
    const a = (i * Math.PI) / 40,
      b = ((i + 1) * Math.PI) / 40,
      mid = (a + b) / 2;
    const left = skyline(a),
      right = skyline(b);
    const footA = ridge(a, 48, -1),
      footB = ridge(b, 48, -1);
    const shoulder = ridge(mid, 50, Math.min(left[1], right[1]) * 0.46);
    quad(left, right, shoulder, shoulder, 0, i % 3 ? "#d5e3e7" : "#dae8ed");
    quad(footA, left, shoulder, shoulder, 0, "#96b1bf");
    quad(shoulder, right, footB, footB, 0, "#b4cad4");
    quad(footA, shoulder, footB, footB, 0, "#a8c1cc");
  }
  for (const [x, z] of [
    [6.1, 9.2],
    [12.4, 6.4],
    [11.4, 13.2],
  ])
    crate(x * tile, z * tile, 0.94, 0.84, 0.94);
}
