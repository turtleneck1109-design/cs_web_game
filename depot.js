// Static depot geometry is uploaded once. The same mesh casts the afternoon shadows.
function createDepot(canvas, map, tileSize) {
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
    for (let k = 0; k < 13; k++) {
      const a = k * 2.4,
        length = 1.6 + random() * 1.45,
        col = ["#688453", "#788b56", "#547648", "#8a985f"][k % 4];
      const point = (t) => [
        crown[0] + Math.cos(a) * length * t,
        h + Math.sin(t * Math.PI) * 0.6 - t * t * 0.75,
        crown[2] + Math.sin(a) * length * t,
      ];
      beam(crown, point(0.5), 0.036, col);
      beam(point(0.5), point(1), 0.025, col);
      for (let j = 1; j <= 11; j++) {
        const t = j / 13,
          mid = point(t),
          next = point(t + 0.09),
          w = Math.sin(Math.PI * t) * 0.29 + 0.04;
        for (const side of [-1, 1]) {
          const tip = [
            mid[0] + Math.cos(a) * 0.25 - Math.sin(a) * w * side,
            mid[1] - 0.1 - w * 0.55,
            mid[2] + Math.sin(a) * 0.25 + Math.cos(a) * w * side,
          ];
          quad(mid, tip, next, next, 0, col);
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
  const roofHeight = (x, z) =>
    2.68 + ((Math.floor(x / 3) * 3 + Math.floor(z / 3) * 2) % 4) * 0.42;
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
  tank(6.65 * tileSize, 3.4 * tileSize, roofHeight(6, 3));
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
    "precision highp float;varying float elevation;void main(){gl_FragColor=vec4(elevation,0.,0.,1.);}",
  );
  const sceneProgram = program(
    `attribute vec3 pos,uvMat,tint;uniform vec3 camera;uniform vec4 lens;
    varying vec3 vPos,vMat,vTint;varying float distanceZ;
    void main(){vec3 p=pos-camera;float d=dot(p.xz,lens.xy);float right=dot(p.xz,vec2(-lens.y,lens.x));
      gl_Position=vec4(right*lens.z,p.y*lens.z*1.777778-lens.w*d,d*1.001-0.09,d);
      vPos=pos;vTint=tint;vMat=uvMat;distanceZ=d;}`,
    `precision highp float;uniform sampler2D atlasTex,shadowTex;uniform vec3 camera;varying vec3 vPos,vMat,vTint;varying float distanceZ;` +
      lightProjection +
      `
    float shade(vec2 uv){return step((vPos.y+4.0)/20.+.008,texture2D(shadowTex,uv).r);}
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
    void main(){float idx=floor(vMat.z+.5);
      if(idx>15.5){
        vec3 dir=normalize(vPos-camera);
        vec3 sky=mix(vec3(.86,.88,.80),vec3(.37,.65,.74),smoothstep(-.04,.55,dir.y));
        vec2 cloud=dir.xz/max(.055,dir.y)*vec2(1.2,2.2);
        float wisps=noise(cloud)*.6+noise(cloud*2.1)*.28+noise(cloud*4.2)*.12;
        sky=mix(sky,vec3(.96,.92,.82),smoothstep(.54,.77,wisps)*.55*smoothstep(.02,.14,dir.y));
        gl_FragColor=vec4(sky,1.);return;
      }
      vec2 cell=vec2(mod(idx,4.),floor(idx/4.));
      vec3 c=texture2D(atlasTex,(cell+(fract(vMat.xy)*.989+.0055))/4.).rgb*vTint;
      vec2 suv=shadowUV(vPos);vec2 o=vec2(.00048,.00048);
      float s=(shade(suv-o)+shade(suv+o)+shade(suv+vec2(o.x,-o.y))+shade(suv+vec2(-o.x,o.y)))*.25;
      c*=mix(vec3(1.035,1.015,.98),vec3(.64,.70,.77),s);
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
  gl.drawArrays(gl.TRIANGLES, 0, count);
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
  return {
    cover,
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
