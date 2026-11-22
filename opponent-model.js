// A shared articulated mesh. All poses use the same geometry and use the
// camera only for projection, visibility and lighting.
const opponentModel = (() => {
  const parts = {};
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const vec = (a, b) => a.map((n, i) => n - b[i]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const unit = (v) => {
    const len = Math.hypot(...v) || 1;
    return v.map((n) => n / len);
  };
  const up = [0, 1, 0];
  function rings(part, center, rows, colors, sides = 10, angle = 0) {
    const mesh = (parts[part] ??= { points: [], faces: [] }),
      base = mesh.points.length;
    for (const [y, w, d, sweep = 0] of rows)
      for (let i = 0; i < sides; i++) {
        const a = angle + (2 * Math.PI * i) / sides;
        mesh.points.push([
          center[0] + w * Math.cos(a),
          center[1] + y,
          center[2] + sweep + d * Math.sin(a),
        ]);
      }
    function face(indices, color) {
      const [a, b, c] = indices.map((i) => mesh.points[i]);
      mesh.faces.push({
        indices,
        n: unit(cross(vec(b, a), vec(c, a))),
        color: rgb(color),
      });
    }
    for (let j = 0; j < rows.length - 1; j++)
      for (let i = 0; i < sides; i++) {
        const a = base + j * sides + i,
          b = base + j * sides + ((i + 1) % sides);
        face([a, a + sides, b + sides, b], colors[j % colors.length]);
      }
    const last = base + (rows.length - 1) * sides;
    face(
      Array.from({ length: sides }, (_, i) => base + i),
      colors[0],
    );
    face(
      Array.from({ length: sides }, (_, i) => last + sides - 1 - i),
      colors.at(-1),
    );
  }
  function block(part, x, y, z, w, h, d, color) {
    // Four faces at 45 degrees give rectangular gear with a bevel on both rims.
    const k = Math.SQRT1_2;
    rings(
      part,
      [x, y, z],
      [
        [0, w * k * 0.91, d * k * 0.91],
        [h * 0.09, w * k, d * k],
        [h * 0.91, w * k, d * k],
        [h, w * k * 0.91, d * k * 0.91],
      ],
      [color],
      4,
      Math.PI / 4,
    );
  }
  const jacket = "#b76543",
    seam = "#945039",
    cloth = "#394858",
    belt = "#48453b",
    sand = "#bfaa81",
    strap = "#82775c";
  rings(
    "hips",
    [0, 0, 0],
    [
      [-0.11, 0.165, 0.116],
      [-0.045, 0.192, 0.13],
      [0.052, 0.18, 0.12],
    ],
    [cloth, "#46525c"],
  );
  rings(
    "chest",
    [0, 0, 0],
    [
      [0, 0.189, 0.133],
      [0.065, 0.199, 0.14],
      [0.22, 0.214, 0.143],
      [0.405, 0.238, 0.146],
      [0.51, 0.207, 0.125],
      [0.565, 0.11, 0.08],
    ],
    [seam, jacket, jacket, "#c0714d", jacket],
  );
  rings(
    "chest",
    [0, 0, 0],
    [
      [0.125, 0.205, 0.15],
      [0.157, 0.217, 0.158],
      [0.375, 0.236, 0.161],
      [0.45, 0.216, 0.141],
    ],
    [strap, sand, "#ad9977"],
  );
  rings(
    "hips",
    [0, 0.025, 0],
    [
      [0, 0.188, 0.131],
      [0.043, 0.192, 0.134],
    ],
    [belt],
  );
  block("hips", 0, 0.028, 0.13, 0.07, 0.033, 0.017, "#a39369");
  for (const side of [-1, 1]) {
    block("chest", side * 0.139, 0.369, 0.074, 0.048, 0.158, 0.106, strap);
    block("chest", side * 0.124, 0.177, 0.142, 0.077, 0.115, 0.053, "#98875f");
    block("chest", side * 0.124, 0.252, 0.17, 0.079, 0.036, 0.024, "#baa579");
    block("chest", side * 0.16, 0.22, -0.127, 0.04, 0.196, 0.045, strap);
  }
  block("chest", 0, 0.185, 0.168, 0.111, 0.108, 0.042, "#a18c66");
  block("chest", 0, 0.26, 0.191, 0.115, 0.027, 0.018, "#c1a975");
  for (const side of [-1, 1]) {
    for (const y of [0.292, 0.325, 0.358])
      block("chest", side * 0.072, y, 0.153, 0.115, 0.011, 0.017, "#998565");
    block("chest", side * 0.138, 0.414, 0.113, 0.052, 0.037, 0.018, "#645f4e");
    block("chest", side * 0.138, 0.424, 0.128, 0.031, 0.012, 0.009, "#b7ad91");
    block("thigh", side * 0.084, 0.24, 0, 0.044, 0.245, 0.133, "#475668");
    block("thigh", side * 0.106, 0.25, 0.003, 0.022, 0.062, 0.137, "#59646c");
  }
  // Raised pack, roll and webbing give the back a distinct silhouette.
  block("chest", 0, 0.142, -0.184, 0.281, 0.31, 0.14, "#697361");
  block("chest", 0, 0.164, -0.257, 0.213, 0.124, 0.057, "#566653");
  block("chest", 0, 0.343, -0.251, 0.246, 0.088, 0.053, "#818970");
  for (const side of [-1, 1])
    block("chest", side * 0.087, 0.174, -0.273, 0.027, 0.245, 0.025, "#454e40");
  rings(
    "head",
    [0, 0, 0],
    [
      [-0.025, 0.073, 0.067],
      [0.048, 0.091, 0.088],
      [0.114, 0.105, 0.105],
      [0.195, 0.11, 0.102],
    ],
    [belt, "#535751", "#71634e"],
  );
  rings(
    "head",
    [0, 0, -0.006],
    [
      [0.139, 0.117, 0.115],
      [0.158, 0.131, 0.124],
      [0.205, 0.122, 0.116],
      [0.246, 0.097, 0.096],
      [0.259, 0.061, 0.065],
    ],
    ["#484c42", "#777a64", "#85836c", "#96947a"],
  );
  block("head", 0, 0.103, 0.091, 0.178, 0.063, 0.039, "#45473c");
  block("head", 0, 0.116, 0.113, 0.156, 0.04, 0.016, "#bb833c");
  block("head", -0.027, 0.141, 0.122, 0.074, 0.007, 0.006, "#e9c683");
  for (const side of [-1, 1])
    block("head", side * 0.106, 0.06, -0.005, 0.028, 0.083, 0.069, "#585c4b");
  block("head", 0, 0.056, 0.092, 0.117, 0.043, 0.023, "#5d6055");
  for (const x of [-0.034, 0, 0.034])
    block("head", x, 0.067, 0.111, 0.015, 0.018, 0.007, "#3b413c");
  block("head", 0.008, 0.171, 0.102, 0.088, 0.023, 0.018, "#6c715e");
  block("chest", 0, 0.376, -0.283, 0.082, 0.035, 0.009, "#b59968");
  // Limb meshes use a unit length along local Y. Their cross sections stay
  // constant when the two-bone solve bends a knee or elbow.
  rings(
    "thigh",
    [0, 0, 0],
    [
      [0, 0.085, 0.087],
      [0.15, 0.109, 0.112],
      [0.39, 0.115, 0.11],
      [0.72, 0.09, 0.09],
      [1, 0.075, 0.074],
    ],
    [cloth, "#445264", "#404f60", cloth],
  );
  rings(
    "shin",
    [0, 0, 0],
    [
      [0, 0.078, 0.081],
      [0.18, 0.084, 0.096],
      [0.36, 0.078, 0.09],
      [0.72, 0.066, 0.066],
      [0.81, 0.072, 0.072],
      [1, 0.059, 0.062],
    ],
    ["#3e4954", cloth, "#485565", "#374450", cloth],
  );
  block("shin", 0, 0.036, 0.075, 0.108, 0.22, 0.035, "#58605b");
  rings(
    "boot",
    [0, 0, 0],
    [
      [0.004, 0.078, 0.131, 0.037],
      [0.033, 0.083, 0.138, 0.037],
      [0.083, 0.078, 0.13, 0.031],
      [0.116, 0.068, 0.084, 0.002],
      [0.165, 0.064, 0.066],
    ],
    ["#4d473a", "#8d795d", "#a38a67", "#857259"],
  );
  for (const y of [0.09, 0.107, 0.124])
    block("boot", 0, y, 0.073, 0.085, 0.009, 0.011, "#605b4b");
  rings(
    "upperArm",
    [0, 0, 0],
    [
      [0, 0.082, 0.084],
      [0.16, 0.095, 0.098],
      [0.54, 0.085, 0.084],
      [0.71, 0.081, 0.082],
      [1, 0.062, 0.065],
    ],
    [jacket, "#c0744e", seam, jacket],
  );
  rings(
    "forearm",
    [0, 0, 0],
    [
      [0, 0.064, 0.069],
      [0.2, 0.074, 0.077],
      [0.64, 0.066, 0.068],
      [0.85, 0.057, 0.059],
      [1, 0.051, 0.056],
    ],
    [seam, jacket, "#b76847", "#4a5046"],
  );
  rings(
    "glove",
    [0, 0, 0],
    [
      [-0.052, 0.056, 0.052],
      [0.006, 0.063, 0.061],
      [0.053, 0.047, 0.056],
    ],
    ["#514f43", "#6a6855"],
  );
  block("chest", 0.037, 0.222, 0.235, 0.077, 0.087, 0.31, "#3c4546");
  block("chest", 0.037, 0.266, 0.398, 0.062, 0.042, 0.205, "#56605b");
  block("chest", 0.037, 0.264, 0.492, 0.059, 0.048, 0.058, "#ae7445");
  block("chest", 0.037, 0.157, 0.295, 0.052, 0.085, 0.066, "#514f46");

  // Cloth grain is sampled from the original costume art, then attached to
  // individual mesh faces. Its scale and direction travel with the limb.
  const patterns = new Map();
  function loadFabric(image) {
    const swatches = {
      thigh: [44, 357, 51, 70],
      shin: [161, 468, 43, 86],
      chest: [69, 250, 40, 30],
      upperArm: [19, 130, 37, 33],
      boot: [164, 565, 29, 44],
    };
    for (const [part, rect] of Object.entries(swatches)) {
      const tile = document.createElement("canvas");
      tile.width = 64;
      tile.height = 64;
      const paint = tile.getContext("2d");
      paint.drawImage(image, ...rect, 0, 0, 64, 64);
      const pixels = paint.getImageData(0, 0, 64, 64);
      let sum = 0;
      for (let i = 0; i < pixels.data.length; i += 4)
        sum +=
          pixels.data[i] * 0.3 +
          pixels.data[i + 1] * 0.59 +
          pixels.data[i + 2] * 0.11;
      const mean = sum / (64 * 64);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const shade = clamp(
          (pixels.data[i] * 0.3 +
            pixels.data[i + 1] * 0.59 +
            pixels.data[i + 2] * 0.11 -
            mean) *
            2.5 +
            140,
          0,
          255,
        );
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
        pixels.data[i + 3] = 100;
      }
      paint.putImageData(pixels, 0, 0);
      patterns.set(part, paint.createPattern(tile, "repeat"));
    }
  }
  function frame(p, yaw) {
    const c = Math.cos(yaw),
      s = Math.sin(yaw);
    return { p, r: [-s, 0, c], u: up, f: [c, 0, s] };
  }
  function at(b, x, y, z) {
    return b.p.map((n, i) => n + b.r[i] * x + b.u[i] * y + b.f[i] * z);
  }
  function limb(a, b, front) {
    const axis = vec(b, a),
      r = unit(cross(front, unit(axis)));
    return { p: a, r, u: axis, f: unit(cross(unit(axis), r)) };
  }
  function knee(hip, ankle, front) {
    const axis = vec(ankle, hip),
      u = unit(axis),
      length = Math.hypot(...axis);
    const bend = unit(front.map((v, i) => v - u[i] * dot(u, front)));
    const height = Math.sqrt(
      Math.max(0.0001, 0.414 ** 2 - (length * 0.5) ** 2),
    );
    return hip.map((v, i) => v + axis[i] * 0.5 + bend[i] * height);
  }
  function skeleton(e) {
    const g = e.gait,
      feet = g.feet.map((f) => [f.x * TILE, 0.105 + f.lift, f.z * TILE]);
    const dx = e.x * TILE,
      dz = e.z * TILE;
    const wide = Math.max(...feet.map((f) => Math.hypot(f[0] - dx, f[2] - dz)));
    const wave = g.active < 0 ? 0 : Math.sin(Math.PI * g.phase);
    const pelvisY =
      Math.min(
        0.878,
        0.105 +
          Math.sqrt(Math.max(0.32, 0.87 ** 2 - Math.max(0, wide - 0.09) ** 2)),
      ) -
      0.023 * wave;
    const base = frame([dx, pelvisY, dz], g.yaw);
    const shift = g.active < 0 ? 0 : (g.active === 0 ? 1 : -1) * 0.027 * wave;
    const hips = frame(at(base, shift, 0, 0), g.yaw);
    const chest = frame(at(hips, 0, 0.006, 0.009), g.chest);
    const head = frame(at(chest, 0, 0.566, 0.007), g.look);
    const bones = [
      ["hips", hips],
      ["chest", chest],
      ["head", head],
    ];
    for (let i = 0; i < 2; i++) {
      const side = i === 0 ? -1 : 1;
      const hip = at(hips, side * 0.116, -0.035, 0);
      const mid = knee(hip, feet[i], base.f);
      bones.push(
        ["thigh", limb(hip, mid, base.f)],
        ["shin", limb(mid, feet[i], base.f)],
        [
          "boot",
          frame([feet[i][0], g.feet[i].lift, feet[i][2]], g.feet[i].yaw),
        ],
      );
      const shoulder = at(chest, side * 0.202, 0.435, 0),
        elbow = at(chest, side * 0.256, 0.183, 0.058);
      const hand = at(chest, side * 0.045, 0.232, i === 0 ? 0.38 : 0.201);
      bones.push(
        ["upperArm", limb(shoulder, elbow, chest.f)],
        ["forearm", limb(elbow, hand, chest.f)],
        ["glove", frame(hand, g.chest)],
      );
    }
    return bones;
  }
  function project(enemy) {
    const cos = Math.cos(player.yaw),
      sin = Math.sin(player.yaw),
      horizon = H * 0.5 + Math.tan(player.pitch) * PROJ;
    const eye = [player.x * TILE, player.eye, player.z * TILE];
    const faces = [];

    function screen(p) {
      const dx = p[0] - eye[0],
        dz = p[2] - eye[2],
        depth = dx * cos + dz * sin;
      return {
        x: W * 0.5 + ((-dx * sin + dz * cos) * PROJ) / Math.max(0.08, depth),
        y: horizon - ((p[1] - eye[1]) * PROJ) / Math.max(0.08, depth),
        depth,
      };
    }
    for (const [name, b] of skeleton(enemy)) {
      const mesh = parts[name],
        u = unit(b.u),
        points = mesh.points.map((v) => at(b, ...v));
      const screenPoints = points.map(screen);
      for (const face of mesh.faces) {
        const n = face.n.map(
          (_, i) => b.r[i] * face.n[0] + u[i] * face.n[1] + b.f[i] * face.n[2],
        );
        if (dot(n, vec(eye, points[face.indices[0]])) < 0) continue;
        const polygon = face.indices.map((i) => screenPoints[i]);
        if (polygon.some((p) => p.depth <= 0.08)) continue;
        const depth =
          polygon.reduce((sum, p) => sum + p.depth, 0) / polygon.length;
        const light =
          0.77 +
          0.27 * Math.max(0, -0.55 * n[0] + 0.71 * n[1] + 0.45 * n[2]) +
          0.07 * n[1];
        const color =
          "rgb(" + face.color.map((v) => Math.round(v * light)).join(",") + ")";
        faces.push({ polygon, depth, color, pattern: patterns.get(name) });
      }
    }
    const feet = enemy.gait.feet.map((f) => {
      const ground = screen([f.x * TILE, 0, f.z * TILE]);
      return { x: ground.x, groundY: ground.y, lift: f.lift };
    });
    faces.sort((a, b) => b.depth - a.depth);
    return { faces, feet };
  }
  function draw(ctx, pose) {
    ctx.lineWidth = 0.48;
    ctx.lineJoin = "round";
    for (const { polygon, color, pattern } of pose.faces) {
      ctx.beginPath();
      ctx.moveTo(polygon[0].x, polygon[0].y);
      for (let i = 1; i < polygon.length; i++)
        ctx.lineTo(polygon[i].x, polygon[i].y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.stroke();
      if (pattern && polygon.length === 4) {
        const [a, b, , d] = polygon;
        const xx = (d.x - a.x) / 64,
          xy = (d.y - a.y) / 64,
          yx = (b.x - a.x) / 64,
          yy = (b.y - a.y) / 64;
        if (Math.abs(xx * yy - xy * yx) > 0.024) {
          pattern.setTransform(new DOMMatrix([xx, xy, yx, yy, a.x, a.y]));
          ctx.fillStyle = pattern;
          ctx.globalCompositeOperation = "soft-light";
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";
        }
      }
    }
  }
  return { project, draw, loadFabric };
})();
