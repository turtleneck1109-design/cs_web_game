function roofHeight(x, z) {
  return 2.68 + ((Math.floor(x / 3) * 3 + Math.floor(z / 3) * 2) % 4) * 0.42;
}
// Static depot geometry is uploaded once. The same mesh casts the afternoon shadows.
function createDepot(canvas, map, tileSize, onMaterialsReady) {
  const gl = canvas.getContext("webgl", { alpha: false, antialias: true });
  if (!gl) return null;
  const atlas = document.createElement("canvas");
  const tile = 256;
  atlas.width = atlas.height = tile * 4;
  const paint = atlas.getContext("2d");
  let seed = 8319;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  function rect(x, y, w, h, color) {
    paint.fillStyle = color;
    paint.fillRect(x, y, w, h);
  }
  function word(value, x, y, size, color) {
    paint.fillStyle = color;
    paint.font = "900 " + size + "px Arial";
    paint.fillText(value, x, y);
  }
  function plaster(color) {
    rect(0, 0, tile, tile, color);
    for (let i = 0; i < 6900; i++) {
      const x = random() * tile,
        y = random() * tile;
      rect(
        x,
        y,
        random() * 2.6 + 0.5,
        random() * 1.6 + 0.4,
        random() > 0.5 ? "#fff2" : "#382b2614",
      );
    }
    for (let i = 0; i < 70; i++) {
      const x = random() * tile,
        y = random() * tile;
      rect(x, y, 1 + random() * 5, 1 + random() * 9, "#77694e13");
    }
  }
  function shutter(x, y, w, h) {
    rect(x - 5, y - 5, w + 10, h + 11, "#ead4a9");
    rect(x - 1, y - 1, w + 3, h + 4, "#424d49");
    rect(x, y, w, h, "#53756f");
    for (let i = 4; i < h; i += 6) {
      rect(x + 2, y + i, w - 4, 2, "#314f50");
      rect(x + 2, y + i + 2, w - 4, 1, "#779486");
    }
    rect(x + w * 0.49, y, 3, h, "#c4b68d");
    rect(x - 6, y + h + 3, w + 12, 4, "#a68a64");
  }
  for (let n = 0; n < 16; n++) {
    paint.save();
    paint.translate((n % 4) * tile, Math.floor(n / 4) * tile);
    paint.beginPath();
    paint.rect(0, 0, tile, tile);
    paint.clip();
    if (n === 0) rect(0, 0, 256, 256, "white");
    if (n >= 1 && n <= 8) {
      plaster(
        [
          "",
          "#e7c994",
          "#edd8b0",
          "#d49d72",
          "#e0bb8a",
          "#e7cf9f",
          "#dfb984",
          "#e8cf9e",
          "#e5c28e",
        ][n],
      );
      rect(0, 225, 256, 31, "#9b8d7350");
      rect(0, 225, 256, 2, "#9d805d78");
      if (n === 2) {
        shutter(79, 39, 85, 90);
        rect(85, 137, 74, 2, "#816b50");
      }
      if (n === 3) {
        rect(37, 59, 184, 196, "#a97b55");
        rect(45, 68, 168, 188, "#477376");
        for (let i = 75; i < 256; i += 8) {
          rect(46, i, 166, 2, "#344f52");
          rect(46, i + 2, 166, 1, "#73928a");
        }
        rect(32, 53, 194, 8, "#ecd8b4");
      }
      if (n === 4) {
        rect(85, 99, 88, 157, "#a38667");
        rect(91, 104, 75, 152, "#456967");
        for (let i = 98; i < 163; i += 11) rect(i, 107, 2, 149, "#304a4a");
        rect(148, 175, 9, 4, "#d4bb88");
      }
      if (n === 5) {
        word("A", 20, 181, 145, "#a45537");
        word("→", 117, 170, 102, "#a45537");
        word("DEPOT   /   01", 27, 204, 16, "#74583f");
      }
      if (n === 6) {
        rect(0, 164, 256, 24, "#c2a270");
        word("SANDPORT", 21, 140, 38, "#586b60");
        word("TRANSIT DEPOT", 23, 158, 13, "#766b53");
      }
      if (n === 7) {
        shutter(24, 46, 70, 82);
        shutter(157, 46, 70, 82);
      }
      if (n === 8) {
        for (let i = 0; i < 5; i++) rect(74, 55 + i * 6, 113, 3, "#726e5c");
      }
      for (let i = 0; i < 160; i++)
        rect(
          random() * 256,
          random() * 256,
          random() * 6 + 1,
          random() * 2 + 1,
          "#efd5a147",
        );
    }
    if (n === 9) {
      plaster("#c6b397");
      rect(0, 0, 256, 2, "#9e917b");
      rect(0, 128, 256, 1, "#a79b87");
      rect(72, 0, 1, 128, "#a79b87");
      rect(198, 128, 1, 128, "#a79b87");
      for (let i = 0; i < 36; i++)
        rect(random() * 256, random() * 256, random() * 5 + 1, 1, "#88785e46");
    }
    if (n === 10) {
      plaster("#ac8656");
      for (let i = 0; i < 256; i += 34) {
        rect(i, 0, 2, 256, "#70583d");
        rect(i + 2, 0, 2, 256, "#c7a371");
      }
      rect(0, 0, 256, 19, "#bd9869");
      rect(0, 237, 256, 19, "#bd9869");
      paint.strokeStyle = "#886a47";
      paint.lineWidth = 14;
      paint.beginPath();
      paint.moveTo(8, 241);
      paint.lineTo(248, 14);
      paint.stroke();
      word("↑  ↑", 18, 216, 26, "#494a3b");
    }
    if (n === 11) {
      plaster("#83938b");
      for (let i = 0; i < 256; i += 17) {
        rect(i, 0, 4, 256, "#647970");
        rect(i + 4, 0, 3, 256, "#9eaba0");
      }
    }
    if (n === 12) {
      rect(0, 0, 256, 256, "#516d67");
      rect(5, 5, 246, 246, "#e1ce9d");
      rect(9, 9, 238, 238, "#516d67");
      word("SANDPORT", 22, 128, 40, "#f2e3b9");
      word("TRANSIT DEPOT", 25, 167, 24, "#e3d6b2");
    }
    if (n === 13) {
      plaster("#d0a563");
      for (let i = -256; i < 512; i += 60) {
        paint.fillStyle = "#4f5143";
        paint.beginPath();
        paint.moveTo(i, 256);
        paint.lineTo(i + 29, 256);
        paint.lineTo(i + 163, 0);
        paint.lineTo(i + 134, 0);
        paint.fill();
      }
    }
    if (n === 14) {
      plaster("#c0ac83");
      for (let i = 0; i < 256; i += 23) rect(0, i, 256, 3, "#88764f");
    }
    if (n === 15) {
      plaster("#e1c592");
      word("B", 22, 183, 154, "#52736b");
      word("02", 143, 181, 50, "#52736b");
    }
    paint.restore();
  }

  const verts = [];
  function rgb(hex) {
    return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  }
  function quad(a, b, c, d, material = 0, color = "#ffffff", repeat = [1, 1]) {
    const u = repeat[0],
      v = repeat[1],
      tint = rgb(color);
    const ab = b.map((n, i) => n - a[i]),
      ac = c.map((n, i) => n - a[i]);
    const normal = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ];
    const length = Math.hypot(...normal) || 1;
    const light = Math.abs(
      (-0.548 * normal[0] + 0.71 * normal[1] + 0.454 * normal[2]) / length,
    );
    for (let i = 0; i < 3; i++) tint[i] *= 0.84 + 0.23 * light;
    for (const [p, s, t] of [
      [a, 0, 0],
      [b, u, 0],
      [c, u, v],
      [a, 0, 0],
      [c, u, v],
      [d, 0, v],
    ])
      verts.push(...p, s, t, material, ...tint);
  }
  function box(x, y, z, w, h, d, color, material = 0) {
    const X = x + w,
      Y = y + h,
      Z = z + d;
    quad([x, Y, Z], [x, Y, z], [x, y, z], [x, y, Z], material, color);
    quad([X, Y, z], [X, Y, Z], [X, y, Z], [X, y, z], material, color);
    quad([x, Y, z], [X, Y, z], [X, y, z], [x, y, z], material, color);
    quad([X, Y, Z], [x, Y, Z], [x, y, Z], [X, y, Z], material, color);
    quad([x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z], 0, color);
    quad([x, y, Z], [X, y, Z], [X, y, z], [x, y, z], 0, color);
  }
  function beam(a, b, r, color) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      dz = b[2] - a[2],
      len = Math.hypot(dx, dy, dz);
    const horiz = Math.hypot(dx, dz);
    const u = horiz ? [-dz / horiz, 0, dx / horiz] : [1, 0, 0];
    const v = [
      (dy * u[2]) / len,
      (dz * u[0] - dx * u[2]) / len,
      (-dy * u[0]) / len,
    ];
    const ring = (p, i) =>
      p.map(
        (n, j) =>
          n +
          r *
            (Math.cos((i * Math.PI) / 3) * u[j] +
              Math.sin((i * Math.PI) / 3) * v[j]),
      );
    for (let i = 0; i < 6; i++)
      quad(ring(a, i), ring(a, i + 1), ring(b, i + 1), ring(b, i), 0, color);
  }
  function palm(x, z, h) {
    const crown = [x + 0.33, h, z + 0.14];
    beam([x, 0, z], [x + 0.09, h * 0.55, z + 0.03], 0.18, "#967451");
    beam([x + 0.09, h * 0.55, z + 0.03], crown, 0.14, "#a2875c");
    for (let j = 1; j < 15; j++) {
      const t = j / 16;
      const trunk = [x + 0.23 * t, h * t, z + 0.085 * t];
      beam(
        trunk,
        [trunk[0] + 0.002, trunk[1] + 0.042, trunk[2]],
        0.17 - t * 0.023,
        "#8b7455",
      );
    }
    for (let k = 0; k < 16; k++) {
      const a = k * 2.39996,
        length = 1.65 + random() * 1.35,
        bend = 0.56 + random() * 0.67,
        spread = 0.2 + random() * 0.17;
      const dx = Math.cos(a),
        dz = Math.sin(a);
      const point = (t) => [
        crown[0] + dx * length * t,
        h + Math.sin(t * Math.PI) * 0.62 - t * t * bend,
        crown[2] + dz * length * t,
      ];
      for (let seg = 0; seg < 4; seg++)
        beam(
          point(seg / 4),
          point((seg + 1) / 4),
          0.024 - seg * 0.003,
          "#91905b",
        );
      for (let j = 1; j < 18; j++) {
        const t = j / 19,
          root = point(t),
          w = (0.28 + 0.72 * Math.sin(Math.PI * t)) * spread;
        for (const side of [-1, 1]) {
          const long = 0.3 + 0.24 * Math.sin(t * Math.PI);
          const tip = [
            root[0] + dx * long - dz * w * side,
            root[1] - 0.13 - w * 0.61,
            root[2] + dz * long + dx * w * side,
          ];
          const mid = [
            (root[0] + tip[0]) * 0.5,
            (root[1] + tip[1]) * 0.5 + 0.043,
            (root[2] + tip[2]) * 0.5,
          ];
          const left = [
            mid[0] - 0.041 * dz,
            mid[1] - 0.014,
            mid[2] + 0.041 * dx,
          ];
          const right = [
            mid[0] + 0.046 * dz,
            mid[1] - 0.022,
            mid[2] - 0.046 * dx,
          ];
          quad(
            root,
            left,
            tip,
            mid,
            0,
            ["#658455", "#547751", "#85955e"][k % 3],
          );
          quad(
            root,
            mid,
            tip,
            right,
            0,
            ["#809559", "#788a54", "#96a368"][k % 3],
          );
        }
      }
    }
  }

  const size = map.length * tileSize;
  quad(
    [-30, 0, -30],
    [size + 30, 0, -30],
    [size + 30, 0, size + 30],
    [-30, 0, size + 30],
    9,
    "#ffffff",
    [42, 42],
  );
  const solid = (x, z) => map[z]?.[x] === "#";
  // Connected walls share a roofline, with smaller rooftop water tanks and aerials above it.
  for (let z = 0; z < map.length; z++)
    for (let x = 0; x < map[z].length; x++) {
      if (!solid(x, z)) continue;
      const X = x * tileSize,
        Z = z * tileSize,
        s = tileSize,
        idx = x * 13 + z * 7;
      const height = roofHeight(x, z);
      const Y = height;
      const roof = "#cfad7e";
      const faces = [
        [
          x - 1,
          z,
          [
            [X, Y, Z],
            [X, Y, Z + s],
            [X, 0, Z + s],
            [X, 0, Z],
          ],
        ],
        [
          x + 1,
          z,
          [
            [X + s, Y, Z + s],
            [X + s, Y, Z],
            [X + s, 0, Z],
            [X + s, 0, Z + s],
          ],
        ],
        [
          x,
          z - 1,
          [
            [X + s, Y, Z],
            [X, Y, Z],
            [X, 0, Z],
            [X + s, 0, Z],
          ],
        ],
        [
          x,
          z + 1,
          [
            [X, Y, Z + s],
            [X + s, Y, Z + s],
            [X + s, 0, Z + s],
            [X, 0, Z + s],
          ],
        ],
      ];
      for (let f = 0; f < 4; f++) {
        const [nx, nz, p] = faces[f];
        let mat = [1, 2, 1, 4, 7, 8, 3, 2, 6, 1, 4][(idx + f * 3) % 11];
        if (z === 5 && f === 2 && x === 6) mat = 5;
        if (z === 5 && f === 2 && x === 5) mat = 3;
        if (x === 14 && z === 4 && f === 0) mat = 5;
        if (x > 9 && z > 9 && (idx + f) % 9 === 0) mat = 15;
        if (solid(nx, nz) && roofHeight(nx, nz) >= Y) continue;
        if (solid(nx, nz)) mat = 1;
        if (x === 6 && z === 3 && f === 0) mat = 6;
        quad(...p, mat, ["#fff9ef", "#ebe5d6", "#eee7d8", "#fffdfa"][f]);
      }
      quad([X, Y, Z], [X + s, Y, Z], [X + s, Y, Z + s], [X, Y, Z + s], 0, roof);
      box(X - 0.045, Y - 0.12, Z - 0.045, s + 0.09, 0.14, s + 0.09, "#ead3ac");
      if (idx % 8 === 0) {
        box(X + 0.3, Y, Z + 0.36, s * 0.65, 0.52, s * 0.56, "#cfb791");
        box(
          X + 0.25,
          Y + 0.52,
          Z + 0.31,
          s * 0.65 + 0.1,
          0.08,
          s * 0.56 + 0.1,
          "#eee0be",
        );
      }
      if (idx % 17 === 0) {
        beam([X + 1, Y, Z + 1], [X + 1, Y + 1.65, Z + 1], 0.024, "#5f6356");
        beam(
          [X + 0.57, Y + 1.43, Z + 1],
          [X + 1.43, Y + 1.43, Z + 1],
          0.018,
          "#636a60",
        );
      }
    }
  // Cloth shades, exposed downpipes and projecting sills break up the flat façades.
  function awning(x, z, width, y) {
    const stripes = 9;
    for (let i = 0; i < stripes; i++) {
      const a = z + (i * width) / stripes,
        b = z + ((i + 1) * width) / stripes;
      const col = i % 2 ? "#c3704f" : "#eee0b9";
      quad(
        [x, y, a],
        [x, y, b],
        [x - 0.72, y - 0.27, b],
        [x - 0.72, y - 0.27, a],
        0,
        col,
      );
      quad(
        [x - 0.72, y - 0.27, a],
        [x - 0.72, y - 0.27, b],
        [x - 0.72, y - 0.39, b],
        [x - 0.72, y - 0.39, a],
        0,
        col,
      );
    }
    for (const end of [z + 0.06, z + width - 0.06])
      beam([x, y - 0.72, end], [x - 0.7, y - 0.29, end], 0.023, "#59675e");
  }
  awning(6 * tileSize - 0.01, 3.05 * tileSize, tileSize * 0.88, 2.36);
  awning(14 * tileSize - 0.01, 7.1 * tileSize, tileSize * 0.8, 2.6);
  awning(10 * tileSize - 0.01, 1.08 * tileSize, tileSize * 0.84, 2.55);
  function wallDetails(x, z) {
    const X = x * tileSize,
      Z = z * tileSize - 0.035,
      H = roofHeight(x, z);
    beam([X + 0.18, 0.09, Z], [X + 0.18, H - 0.08, Z], 0.043, "#8b907c");
    for (const y of [0.48, 1.65])
      box(X + 0.11, y, Z - 0.07, 0.14, 0.038, 0.11, "#696f62");
    box(X + 0.39, H - 0.75, Z - 0.2, 0.66, 0.39, 0.21, "#d6ccaf");
    for (let k = 0; k < 5; k++)
      box(
        X + 0.43,
        H - 0.7 + k * 0.051,
        Z - 0.212,
        0.53,
        0.016,
        0.02,
        "#8e9586",
      );
  }
  for (const [x, z] of [
    [5, 5],
    [7, 5],
    [12, 3],
    [10, 10],
    [14, 13],
    [17, 1],
  ])
    wallDetails(x, z);
  // The upper gallery occupies existing rooftops. Its arches frame recessed shutters.
  function gallery(x, z, floor, bays) {
    const bay = 1.18,
      radius = 0.42,
      sill = floor + 0.28,
      spring = floor + 1.14,
      top = spring + 0.63;
    const width = bays * bay;
    box(x + 0.22, floor, z, 0.98, top - floor, width, "#ddc69f", 13);
    box(x - 0.12, floor - 0.06, z - 0.09, 1.48, 0.19, width + 0.18, "#ddc6a0");
    for (let k = 0; k < bays; k++) {
      const center = z + (k + 0.5) * bay;
      const face = (height, side) => [x, height, center + side];
      const rear = (height, side) => [x + 0.215, height, center + side];
      quad(
        rear(top, -radius),
        rear(top, radius),
        rear(sill, radius),
        rear(sill, -radius),
        0,
        "#325955",
      );
      for (let slat = 0; slat < 9; slat++)
        box(
          x + 0.18,
          sill + 0.1 + slat * 0.095,
          center - radius + 0.065,
          0.035,
          0.035,
          radius * 2 - 0.13,
          "#63837a",
        );
      for (const sign of [-1, 1]) {
        const offset = sign < 0 ? -bay / 2 : radius;
        box(
          x,
          sill,
          center + offset,
          0.23,
          spring - sill,
          bay / 2 - radius,
          "#dfc29b",
          13,
        );
        box(
          x - 0.035,
          spring - 0.07,
          center + offset - 0.025,
          0.31,
          0.09,
          bay / 2 - radius + 0.05,
          "#f0d8b0",
        );
      }
      for (let j = 0; j < 14; j++) {
        const arc = (n, r) => [
          Math.sin((n * Math.PI) / 14) * r + spring,
          Math.cos((n * Math.PI) / 14) * r,
        ];
        const [ya, za] = arc(j, radius),
          [yb, zb] = arc(j + 1, radius);
        quad(
          face(top, za),
          face(top, zb),
          face(yb, zb),
          face(ya, za),
          0,
          "#dbc399",
        );
        quad(
          face(ya, za),
          face(yb, zb),
          rear(yb, zb),
          rear(ya, za),
          0,
          "#aa967a",
        );
        const [yc, zc] = arc(j, radius + 0.1),
          [yd, zd] = arc(j + 1, radius + 0.1);
        const stone = (y, s) => [x - 0.025, y, center + s];
        quad(
          stone(yc, zc),
          stone(yd, zd),
          stone(yb, zb),
          stone(ya, za),
          0,
          ["#f4e0b9", "#e4cfa8", "#ead6af"][j % 3],
        );
      }
    }
    box(x - 0.09, top, z - 0.065, 1.44, 0.12, width + 0.13, "#efe0c1");
    box(x - 0.14, top + 0.12, z - 0.1, 1.5, 0.09, width + 0.2, "#ac7455");
    box(x - 0.16, top + 0.21, z - 0.13, 1.53, 0.07, width + 0.26, "#cd946f");
    for (let i = 0; i < Math.ceil(width / 0.17); i++) {
      const edge = z + i * 0.17;
      beam(
        [x - 0.135, top + 0.275, edge],
        [x + 0.38, top + 0.34, edge],
        0.045,
        ["#cf946e", "#bd835d", "#da9e76"][i % 3],
      );
    }
    const front = x - 0.3;
    for (let i = 0; i <= bays * 5; i++) {
      const Z = z + (i * width) / (bays * 5);
      box(front, floor + 0.07, Z, 0.027, 0.55, 0.027, "#3c5550");
    }
    box(front, floor + 0.57, z, 0.05, 0.053, width + 0.03, "#4c6158");
    box(front, floor + 0.23, z, 0.035, 0.032, width, "#657468");
    box(
      front - 0.05,
      floor - 0.06,
      z - 0.06,
      0.54,
      0.12,
      width + 0.12,
      "#c9ab84",
    );
  }
  gallery(6 * tileSize - 0.015, 3.04 * tileSize, roofHeight(6, 3) + 0.03, 2);
  gallery(14 * tileSize - 0.02, 6.08 * tileSize, roofHeight(14, 6) + 0.03, 2);
  gallery(10 * tileSize - 0.02, 16.05 * tileSize, roofHeight(10, 16) + 0.03, 2);

  function floweringVine(x, y, z, length) {
    for (let strand = 0; strand < 13; strand++) {
      const offset = (strand / 12 - 0.5) * 1.4,
        drop = length * (0.22 + 0.78 * random());
      const stem = (t) => [
        x - 0.09 * Math.sin(t * 3),
        y - t * drop,
        z + offset + 0.095 * Math.sin(strand + t * 5),
      ];
      beam(stem(0), stem(0.55), 0.015, "#726c46");
      beam(stem(0.55), stem(1), 0.01, "#686749");
      for (let j = 0; j < 13; j++) {
        const [X, Y, Z] = stem(j / 13),
          leaf = 0.07 + random() * 0.065;
        const dz = (random() - 0.5) * 0.23,
          a = [X - 0.025, Y, Z + dz];
        quad(
          a,
          [X - 0.07, Y + 0.07, Z + dz + leaf],
          [X - 0.09, Y - 0.03, Z + dz + leaf * 1.5],
          [X - 0.055, Y - 0.055, Z + dz + leaf * 0.45],
          0,
          ["#50694b", "#6d8254", "#81915e"][j % 3],
        );
        if (random() < 0.58) {
          const zz = Z + dz - 0.02,
            yy = Y + 0.03,
            scale = 0.045 + random() * 0.045;
          const tilt = random() * Math.PI;
          for (let petal = 0; petal < 3; petal++) {
            const angle = tilt + petal * 2.094,
              cy = Math.sin(angle),
              cz = Math.cos(angle);
            const tip = [X - 0.13, yy + cy * scale, zz + cz * scale];
            const left = [
              X - 0.115,
              yy + (cy * 0.48 + cz * 0.27) * scale,
              zz + (cz * 0.48 - cy * 0.27) * scale,
            ];
            const right = [
              X - 0.117,
              yy + (cy * 0.48 - cz * 0.25) * scale,
              zz + (cz * 0.48 + cy * 0.25) * scale,
            ];
            quad(
              [X - 0.11, yy, zz],
              left,
              tip,
              right,
              0,
              ["#a64664", "#d27385", "#c15b75", "#df99a2"][
                (strand + j + petal) % 4
              ],
            );
          }
        }
      }
    }
  }
  floweringVine(
    6 * tileSize - 0.37,
    roofHeight(6, 3) + 0.62,
    3.21 * tileSize,
    0.94,
  );
  floweringVine(
    14 * tileSize - 0.37,
    roofHeight(14, 6) + 0.58,
    6.61 * tileSize,
    1.18,
  );
  // Harbor crane beyond the playable streets, with a trolley and hanging hook.
  function dockCrane(x, z, height) {
    const iron = "#59736f",
      lit = "#83988a",
      rust = "#aa7d56";
    for (const dx of [-0.8, 0.8])
      for (const dz of [-0.8, 0.8]) {
        beam([x + dx, 0, z + dz], [x + dx, height, z + dz], 0.1, iron);
        for (let y = 1; y < height - 1.8; y += 1.8) {
          beam([x + dx, y, z + dz], [x - dx, y + 1.8, z + dz], 0.043, lit);
          beam([x + dx, y, z + dz], [x + dx, y + 1.8, z - dz], 0.043, lit);
        }
      }
    for (const dx of [-0.52, 0.52]) {
      const bottom = (t) => [x + dx, height + 0.06, z + t];
      const top = (t) => [x + dx, height + 1.18, z + t];
      beam(bottom(-6), bottom(8), 0.09, iron);
      beam(top(-6), top(8), 0.07, lit);
      for (let j = -6; j < 8; j++) {
        beam(bottom(j), top(j + 1), 0.05, lit);
        beam(top(j + 1), bottom(j + 1), 0.035, iron);
      }
    }
    box(x - 0.75, height - 1.03, z - 1.65, 1.48, 1.08, 1.55, "#b79a72");
    box(x - 0.78, height - 0.84, z - 1.48, 0.05, 0.58, 1.15, "#526e71");
    box(x - 0.7, height - 0.14, z - 5.7, 1.4, 1.22, 2.15, rust);
    for (const dz of [4.9, 5.23])
      beam([x, height, z + dz], [x, height - 2.9, z + dz], 0.022, "#536662");
    box(x - 0.16, height - 2.95, z + 4.87, 0.32, 0.17, 0.42, "#947951");
  }
  dockCrane(18.0 * tileSize, 4.95 * tileSize, 8.2);

  function tank(x, z, base) {
    for (const dx of [-0.51, 0.51])
      for (const dz of [-0.51, 0.51])
        beam(
          [x + dx, base, z + dz],
          [x + dx, base + 1.4, z + dz],
          0.048,
          "#526664",
        );
    for (const dz of [-0.51, 0.51]) {
      beam(
        [x - 0.51, base + 0.06, z + dz],
        [x + 0.51, base + 1.26, z + dz],
        0.033,
        "#62746b",
      );
      beam(
        [x + 0.51, base + 0.06, z + dz],
        [x - 0.51, base + 1.26, z + dz],
        0.033,
        "#62746b",
      );
    }
    box(x - 0.7, base + 1.21, z - 0.7, 1.4, 0.08, 1.4, "#606e63");
    const ring = (i, h, r) => [
      x + Math.cos((i * Math.PI) / 8) * r,
      h,
      z + Math.sin((i * Math.PI) / 8) * r,
    ];
    for (let i = 0; i < 16; i++) {
      quad(
        ring(i, base + 2.45, 0.8),
        ring(i + 1, base + 2.45, 0.8),
        ring(i + 1, base + 1.28, 0.8),
        ring(i, base + 1.28, 0.8),
        11,
      );
      quad(
        ring(i, base + 2.45, 0.85),
        ring(i + 1, base + 2.45, 0.85),
        [x, base + 2.72, z],
        [x, base + 2.72, z],
        0,
        "#a9b2a2",
      );
    }
  }
  tank(7.55 * tileSize, 2.62 * tileSize, roofHeight(7, 2));
  tank(14.6 * tileSize, 5.4 * tileSize, roofHeight(14, 5));
  for (const [x, z, h] of [
    [6.1, 2.7, 6.2],
    [7.6, 1.7, 7.3],
    [13.6, 3.5, 6.9],
    [15.1, 6.5, 6.4],
    [3.7, 5.6, 5.8],
    [11.5, 10.4, 7],
    [2.4, 12.5, 6.5],
    [16.2, 13.4, 6.6],
    [10.6, 16.2, 7.4],
  ])
    palm(x * tileSize, z * tileSize, h);
  function cable(a, b, sag) {
    let prev = a;
    for (let i = 1; i <= 13; i++) {
      const t = i / 13,
        p = a.map(
          (val, j) =>
            val + (b[j] - val) * t - (j === 1 ? 4 * t * (1 - t) * sag : 0),
        );
      beam(prev, p, 0.014, "#474e47");
      prev = p;
    }
  }
  for (const [a, b] of [
    [
      [7, 6],
      [6, 3],
    ],
    [
      [10, 5],
      [7, 3],
    ],
    [
      [14, 5],
      [10, 2],
    ],
    [
      [7, 9],
      [3, 8],
    ],
    [
      [15, 12],
      [11, 10],
    ],
  ]) {
    const A = [a[0] * tileSize, 4.9, a[1] * tileSize],
      B = [b[0] * tileSize, 5.55, b[1] * tileSize];
    beam([A[0], 0, A[2]], A, 0.062, "#786a51");
    beam([B[0], 0, B[2]], B, 0.062, "#786a51");
    cable(A, B, 0.6);
    cable([A[0], 4.6, A[2]], [B[0], 5.3, B[2]], 0.78);
  }
  // A painted overhead sign and rooftop cargo mark the approach down the main lane.
  const gx = 12.9 * tileSize,
    gz = 4 * tileSize;
  box(gx, 3.0, gz - 0.5, 0.14, 0.12, 3.5, "#54635c");
  beam([gx, 3.1, gz + 2.8], [gx, 0, gz + 2.8], 0.068, "#657069");
  quad(
    [gx - 0.02, 3.8, gz + 0.15],
    [gx - 0.02, 3.8, gz + 2.35],
    [gx - 0.02, 3.12, gz + 2.35],
    [gx - 0.02, 3.12, gz + 0.15],
    12,
  );
  // Sandstone aprons distinguish the loading doors from the cobbled road.
  for (const [x, z, length] of [
    [3.1, 4.73, 4.85],
    [10.15, 2.73, 2.65],
    [2.1, 11.73, 1.75],
  ]) {
    const X = x * tileSize,
      Z = z * tileSize,
      end = X + length * tileSize;
    quad(
      [X, 0.008, Z],
      [end, 0.008, Z],
      [end, 0.008, Z + 0.27 * tileSize],
      [X, 0.008, Z + 0.27 * tileSize],
      14,
      "#fffaf0",
      [length * 1.5, 0.43],
    );
  }
  // Paint and drainage hardware sit flush with the paving along the loading bays.
  function paving(x, z, w, d, color) {
    quad(
      [x, 0.012, z],
      [x + w, 0.012, z],
      [x + w, 0.012, z + d],
      [x, 0.012, z + d],
      0,
      color,
    );
  }
  for (const [x, z] of [
    [4.7, 4.83],
    [8.2, 4.83],
    [12, 3.93],
    [13.1, 8.83],
    [6.4, 11.85],
  ]) {
    const X = x * tileSize,
      Z = z * tileSize;
    paving(X, Z, 0.76, 0.28, "#746f60");
    for (let i = 0; i < 10; i++)
      quad(
        [X + 0.04 + i * 0.07, 0.018, Z + 0.025],
        [X + 0.064 + i * 0.07, 0.018, Z + 0.025],
        [X + 0.064 + i * 0.07, 0.018, Z + 0.255],
        [X + 0.04 + i * 0.07, 0.018, Z + 0.255],
        0,
        "#424a44",
      );
  }
  for (let i = 0; i < 12; i++) {
    paving(
      (3.8 + i * 0.34) * tileSize,
      4.68 * tileSize,
      0.45,
      0.055,
      "#ddbd65",
    );
  }
  paving(4.35 * tileSize, 4.68 * tileSize, 0.055, 0.62, "#ddbd65");
  paving(6.65 * tileSize, 4.68 * tileSize, 0.055, 0.62, "#ddbd65");
  const cover = [];
  function crate(x, z, w, h, d) {
    box(x, 0, z, w, h, d, "#ffffff", 10);
    for (const y of [0.08, h - 0.15])
      box(x - 0.018, y, z - 0.018, w + 0.036, 0.07, d + 0.036, "#927549");
    cover.push({
      x: x / tileSize,
      z: z / tileSize,
      w: w / tileSize,
      d: d / tileSize,
      h: h / tileSize,
    });
  }
  crate(7.9 * tileSize, 3.88 * tileSize, 1.05, 1.08, 0.83);
  crate(13.83 * tileSize, 4.69 * tileSize, 0.86, 0.95, 0.69);
  crate(8.25 * tileSize, 12.02 * tileSize, 1.16, 0.92, 0.94);
  crate(15.1 * tileSize, 15.1 * tileSize, 0.96, 1.05, 0.8);
  // Distant dunes close the horizon behind the playable depot.
  for (let i = 0; i < 96; i++) {
    const a = (i * Math.PI) / 48,
      b = ((i + 1) * Math.PI) / 48;
    const ridge = (t) => [
      size / 2 + Math.cos(t) * 68,
      3.4 + Math.sin(t * 7) * 1.7 + Math.cos(t * 13) * 0.85,
      size / 2 + Math.sin(t) * 68,
    ];
    const p = ridge(a),
      q = ridge(b);
    quad(p, q, [q[0], -2, q[2]], [p[0], -2, p[2]], 0, "#c7ad91");
  }
  const shadowVertexCount = verts.length / 9;
  for (let i = 0; i < 80; i++) {
    const a = (i * Math.PI) / 40,
      b = ((i + 1) * Math.PI) / 40;
    const p = (t) => [
      size / 2 + Math.cos(t) * 63,
      0,
      size / 2 + Math.sin(t) * 63,
    ];
    const a0 = p(a),
      b0 = p(b);
    quad([a0[0], 80, a0[2]], [b0[0], 80, b0[2]], b0, a0, 16);
  }
  const lightProjection = `
    vec2 shadowUV(vec3 p) {
      return (p.xz + vec2(0.78,-0.65)*p.y + 16.0) / 84.0;
    }`;
  function program(vs, fs) {
    function compile(type, source) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, "pos");
    gl.bindAttribLocation(p, 1, "uvMat");
    gl.bindAttribLocation(p, 2, "tint");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  const shadowProgram = program(
    "attribute vec3 pos;varying float elevation;" +
      lightProjection +
      `
    void main(){elevation=(pos.y+4.)/20.;gl_Position=vec4(shadowUV(pos)*2.-1.,1.-2.*elevation,1.);}`,
    "precision highp float;varying float elevation;void main(){float e=elevation*255.;gl_FragColor=vec4(floor(e)/255.,fract(e),0.,1.);}",
  );
  const sceneVertex = `attribute vec3 pos,uvMat,tint;uniform vec3 camera;uniform vec4 lens;
    varying vec3 vPos,vMat,vTint;varying float distanceZ;
    void main(){vec3 p=pos-camera;float d=dot(p.xz,lens.xy);float right=dot(p.xz,vec2(-lens.y,lens.x));
      gl_Position=vec4(right*lens.z,p.y*lens.z*1.777778-lens.w*d,d*1.001-0.09,d);
      vPos=pos;vTint=tint;vMat=uvMat;distanceZ=d;}`;
  const sceneProgram = program(
    sceneVertex,
    `precision highp float;uniform sampler2D atlasTex,shadowTex;uniform vec3 camera;varying vec3 vPos,vMat,vTint;varying float distanceZ;` +
      lightProjection +
      `
    float shade(vec2 uv){vec2 packedHeight=texture2D(shadowTex,uv).rg;return step((vPos.y+4.0)/20.+.0095,dot(packedHeight,vec2(1.,1./255.)));}
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){float idx=floor(vMat.z+.5);
      if(idx>15.5){
        vec3 dir=normalize(vPos-camera);
        vec3 sky=mix(vec3(.94,.88,.74),vec3(.36,.62,.73),smoothstep(-.04,.55,dir.y));
        vec2 cloud=dir.xz/max(.055,dir.y)*vec2(1.2,2.2);
        float wisps=noise(cloud)*.6+noise(cloud*2.1)*.28+noise(cloud*4.2)*.12;
        sky=mix(sky,vec3(.96,.92,.82),smoothstep(.54,.77,wisps)*.55*smoothstep(.02,.14,dir.y));
        gl_FragColor=vec4(sky,1.);return;
      }
      vec2 cell=vec2(mod(idx,4.),floor(idx/4.));
      vec3 c=texture2D(atlasTex,(cell+(fract(vMat.xy)*.989+.0055))/4.).rgb*vTint;
      vec2 suv=shadowUV(vPos);vec2 o=vec2(.00048,.00048);
      float s=(shade(suv-o)+shade(suv+o)+shade(suv+vec2(o.x,-o.y))+shade(suv+vec2(-o.x,o.y)))*.25;
      c*=mix(vec3(1.065,1.026,.975),vec3(.63,.72,.805),s);
      if(idx>0.5 && idx<8.5)c*=mix(vec3(.81,.82,.82),vec3(1.),smoothstep(0.,.56,vPos.y));
      if(idx==9.) c*=.975+.052*sin(vPos.x*.46+vPos.z*.29);
      c=(c-.43)*1.03+.43;
      c=mix(c,vec3(.84,.79,.68),min(.45,max(0.,distanceZ-7.)*.009));gl_FragColor=vec4(c,1.);}`,
  );
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
  const count = verts.length / 9;
  const materials = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, materials);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.LINEAR_MIPMAP_LINEAR,
  );
  const detailedAtlas = document.getElementById("harbor-materials");
  function installMaterials() {
    if (!detailedAtlas.naturalWidth || gl.isContextLost()) return;
    // Browsers may deny a local file texture. The generated atlas is already bound.
    try {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, materials);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        detailedAtlas,
      );
      gl.generateMipmap(gl.TEXTURE_2D);
      onMaterialsReady();
    } catch (error) {
      if (error.name !== "SecurityError") throw error;
    }
  }
  detailedAtlas
    .decode()
    .then(installMaterials)
    .catch(() => {});
  const anisotropy = gl.getExtension("EXT_texture_filter_anisotropic");
  if (anisotropy)
    gl.texParameterf(
      gl.TEXTURE_2D,
      anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,
      Math.min(4, gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)),
    );
  const shadow = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, shadow);
  const res = Math.min(
    2048,
    gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    gl.getParameter(gl.MAX_TEXTURE_SIZE),
  );
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    res,
    res,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const target = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, target);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    shadow,
    0,
  );
  const depth = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, res, res);
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    depth,
  );
  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, res, res);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(shadowProgram);
  gl.drawArrays(gl.TRIANGLES, 0, shadowVertexCount);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(target);
  gl.deleteRenderbuffer(depth);
  gl.useProgram(sceneProgram);
  gl.enableVertexAttribArray(1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, materials);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, shadow);
  gl.uniform1i(gl.getUniformLocation(sceneProgram, "atlasTex"), 0);
  gl.uniform1i(gl.getUniformLocation(sceneProgram, "shadowTex"), 1);
  const cam = gl.getUniformLocation(sceneProgram, "camera"),
    lens = gl.getUniformLocation(sceneProgram, "lens");
  // Cache a small camera-depth image on demand. The wall trim, rooftop
  // equipment and scenery use the same triangles as the visible scene.
  const dw = 320,
    dh = 180,
    pixels = new Uint8Array(dw * dh * 4);
  const depthProgram = program(
    sceneVertex,
    `precision highp float;varying float distanceZ;
    void main(){float d=min(distanceZ,127.99)*512.;gl_FragColor=vec4(floor(d/256.)/255.,mod(floor(d),256.)/255.,0.,1.);}`,
  );
  const depthCam = gl.getUniformLocation(depthProgram, "camera"),
    depthLens = gl.getUniformLocation(depthProgram, "lens");
  const framebuffer = gl.createFramebuffer(),
    zbuffer = gl.createRenderbuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  // Use an RGBA8 texture for lossless packed depths (RGBA4 would round bytes).
  const depthImage = gl.createTexture();
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, depthImage);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    dw,
    dh,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    depthImage,
    0,
  );
  gl.bindRenderbuffer(gl.RENDERBUFFER, zbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, dw, dh);
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    gl.DEPTH_ATTACHMENT,
    gl.RENDERBUFFER,
    zbuffer,
  );
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
    throw Error("Depth target unavailable");
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  let depthKey = "";
  function cameraDepth(player, fov) {
    const key = [
      player.x,
      player.z,
      player.yaw,
      player.pitch,
      player.eye,
      fov,
    ].join("/");
    if (key !== depthKey) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.viewport(0, 0, dw, dh);
      gl.disable(gl.DITHER);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(depthProgram);
      const focal = 1 / Math.tan(fov / 2);
      gl.uniform3f(
        depthCam,
        player.x * tileSize,
        player.eye,
        player.z * tileSize,
      );
      gl.uniform4f(
        depthLens,
        Math.cos(player.yaw),
        Math.sin(player.yaw),
        focal,
        (Math.tan(player.pitch) * focal * 16) / 9,
      );
      gl.drawArrays(gl.TRIANGLES, 0, shadowVertexCount);
      gl.readPixels(0, 0, dw, dh, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(sceneProgram);
      gl.enable(gl.DITHER);
      depthKey = key;
    }
    return depthAt;
  }
  function depthAt(u, v) {
    const i =
      4 *
      ((dh - 1 - Math.min(dh - 1, Math.max(0, Math.floor(v * dh)))) * dw +
        Math.min(dw - 1, Math.max(0, Math.floor(u * dw))));
    return (pixels[i] * 256 + pixels[i + 1]) / 512 / tileSize;
  }
  return {
    cover,
    cameraDepth,
    draw(player, fov) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.56, 0.75, 0.79, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform3f(cam, player.x * tileSize, player.eye, player.z * tileSize);
      const focal = 1 / Math.tan(fov / 2);
      gl.uniform4f(
        lens,
        Math.cos(player.yaw),
        Math.sin(player.yaw),
        focal,
        (Math.tan(player.pitch) * focal * canvas.width) / canvas.height,
      );
      gl.drawArrays(gl.TRIANGLES, 0, count);
    },
  };
}
