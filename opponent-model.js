// Local X points across the garment, Y follows its joint, and Z points forward.
// The same joint transforms drive both the fabric and all attached equipment.
const opponentModel = (() => {
  const parts = {};
  const vec = (a, b) => a.map((v, i) => v - b[i]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const unit = (v) => {
    const length = Math.hypot(...v) || 1;
    return v.map((n) => n / length);
  };
  const up = [0, 1, 0];
  const palette = [
    "a75537",
    "b7a481",
    "3c4856",
    "404e59",
    "64705d",
    "7a644a",
    "958065",
    "49463d",
    "4a4b43",
    "857959",
    "c28b44",
    "787c68",
    "505b59",
    "a58f6d",
    "ae5c3e",
    "535751",
  ].map((hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)));
  const [
    jacket,
    vest,
    pants,
    gaiter,
    pack,
    leather,
    suede,
    sole,
    glove,
    webbing,
    lens,
    helmet,
    metal,
    pouch,
    sleeve,
    mask,
  ] = palette.map((_, i) => i);
  function mesh(part) {
    return (parts[part] ??= { v: [], tri: [] });
  }

  // Smooth normals along the section and around it. A rounded rectangular
  // cross-section gives soft packs and soles a flatter face without hard corners.
  function loft(
    part,
    material,
    origin,
    profile,
    {
      sides = 16,
      shape = 1,
      fold = 0,
      dim = 1,
      small = false,
      down = false,
    } = {},
  ) {
    const m = mesh(part),
      grid = [];
    const signed = (v) => Math.sign(v) * Math.pow(Math.abs(v), shape);
    for (let j = 0; j < profile.length; j++) {
      const [y, w, d, cz = 0, cx = 0] = profile[j],
        row = [];
      for (let i = 0; i < sides; i++) {
        const a = (2 * Math.PI * i) / sides - Math.PI / 2;
        const middle = j > 0 && j < profile.length - 1;
        const wrinkle = middle ? fold * Math.sin(a * 2.0 + j * 0.81) : 0;
        const variation = fold ? 1 + 0.029 * Math.sin(a * 3.0 + j * 0.71) : 1;
        row.push([
          origin[0] + cx + w * signed(Math.cos(a)) * variation,
          origin[1] + y + wrinkle,
          origin[2] + cz + d * signed(Math.sin(a)) * variation,
        ]);
      }
      grid.push(row);
    }
    const base = m.v.length,
      stride = sides + 1;
    for (let j = 0; j < grid.length; j++) {
      for (let i = 0; i <= sides; i++) {
        const k = i % sides,
          p = grid[j][k];
        const tangent = vec(
          grid[j][(k + 1) % sides],
          grid[j][(k + sides - 1) % sides],
        );
        const rise = vec(
          grid[Math.min(j + 1, grid.length - 1)][k],
          grid[Math.max(0, j - 1)][k],
        );
        const n = unit(cross(rise, tangent));
        const t =
          (profile[j][0] - profile[0][0]) / (profile.at(-1)[0] - profile[0][0]);
        m.v.push([...p, ...n, i / sides, down ? t : 1 - t]);
        if (j > 0 && i < sides) {
          const a = base + (j - 1) * stride + i,
            b = a + stride;
          m.tri.push(
            [a, b, b + 1, material, dim, small],
            [a, b + 1, a + 1, material, dim, small],
          );
        }
      }
    }
    // Dedicated normals on the end caps keep soles and garment hems crisp.
    for (const j of [0, grid.length - 1]) {
      const n = j === 0 ? -1 : 1,
        start = m.v.length;
      grid[j].forEach((p, i) =>
        m.v.push([
          ...p,
          0,
          n,
          0,
          0.5 + 0.47 * Math.cos((i * 2 * Math.PI) / sides),
          0.5 + 0.47 * Math.sin((i * 2 * Math.PI) / sides),
        ]),
      );
      for (let i = 1; i < sides - 1; i++)
        m.tri.push([start, start + i, start + i + 1, material, dim, small]);
    }
  }
  function pad(part, mat, x, y, z, w, h, d, dim = 1, small = false) {
    loft(
      part,
      mat,
      [x, y, z],
      [
        [0, w * 0.36, d * 0.34],
        [h * 0.12, w * 0.48, d * 0.46],
        [h * 0.37, w * 0.5, d * 0.5],
        [h * 0.8, w * 0.48, d * 0.48],
        [h, w * 0.38, d * 0.37],
      ],
      { shape: 0.48, sides: 12, dim, small },
    );
  }
  function bead(part, mat, center, radii, dim = 1, small = false) {
    const [x, y, z] = radii;
    loft(
      part,
      mat,
      center,
      [
        [-y, 0.18 * x, 0.18 * z],
        [-y * 0.72, 0.7 * x, 0.7 * z],
        [0, x, z],
        [y * 0.72, 0.7 * x, 0.7 * z],
        [y, 0.18 * x, 0.18 * z],
      ],
      { sides: 10, dim, small },
    );
  }
  function cord(part, mat, path, r, dim = 1, small = true) {
    const m = mesh(part),
      sides = 6,
      base = m.v.length;
    path.forEach((p, j) => {
      const axis = unit(
        vec(path[Math.min(j + 1, path.length - 1)], path[Math.max(j - 1, 0)]),
      );
      const right = unit(
          cross(axis, Math.abs(axis[1]) > 0.85 ? [1, 0, 0] : up),
        ),
        front = cross(axis, right);
      for (let i = 0; i <= sides; i++) {
        const a = (i * 2 * Math.PI) / sides,
          n = right.map((v, k) => v * Math.cos(a) + front[k] * Math.sin(a));
        const radius = Array.isArray(r) ? r[j] : r;
        m.v.push([
          ...p.map((v, k) => v + radius * n[k]),
          ...n,
          i / sides,
          j / (path.length - 1),
        ]);
        if (j && i < sides) {
          const a = base + (j - 1) * (sides + 1) + i,
            b = a + sides + 1;
          m.tri.push(
            [a, b, b + 1, mat, dim, small],
            [a, b + 1, a + 1, mat, dim, small],
          );
        }
      }
    });
  }

  loft(
    "hips",
    pants,
    [0, 0, 0],
    [
      [-0.12, 0.148, 0.103],
      [-0.08, 0.178, 0.119],
      [-0.04, 0.191, 0.126],
      [0.004, 0.185, 0.122],
      [0.06, 0.164, 0.11],
    ],
    { fold: 0.005 },
  );
  loft(
    "hips",
    webbing,
    [0, 0.011, 0],
    [
      [0, 0.179, 0.122],
      [0.008, 0.188, 0.132],
      [0.042, 0.188, 0.131],
      [0.052, 0.178, 0.124],
    ],
    { shape: 0.82, dim: 0.67 },
  );
  pad("hips", metal, 0, 0.018, 0.13, 0.072, 0.036, 0.02);
  loft(
    "chest",
    jacket,
    [0, 0, 0],
    [
      [0.014, 0.165, 0.109],
      [0.049, 0.17, 0.116],
      [0.057, 0.177, 0.123],
      [0.068, 0.19, 0.137],
      [0.091, 0.182, 0.132],
      [0.16, 0.181, 0.135],
      [0.27, 0.2, 0.147],
      [0.381, 0.216, 0.15],
      [0.433, 0.238, 0.142],
      [0.47, 0.232, 0.131],
      [0.507, 0.177, 0.109],
      [0.554, 0.089, 0.076],
    ],
    { fold: 0.007, sides: 20 },
  );
  loft(
    "chest",
    vest,
    [0, 0, 0.006],
    [
      [0.11, 0.179, 0.134],
      [0.13, 0.197, 0.151],
      [0.185, 0.201, 0.16],
      [0.29, 0.215, 0.161],
      [0.37, 0.224, 0.153],
      [0.411, 0.207, 0.14],
      [0.448, 0.177, 0.122],
    ],
    { shape: 0.81, sides: 20 },
  );
  loft(
    "chest",
    jacket,
    [0, 0.49, -0.005],
    [
      [0, 0.108, 0.087],
      [0.024, 0.109, 0.088],
      [0.049, 0.098, 0.086],
      [0.066, 0.087, 0.072],
    ],
    { dim: 0.81 },
  );
  for (const sign of [-1, 1]) {
    cord(
      "chest",
      webbing,
      [
        [sign * 0.143, 0.34, 0.139],
        [sign * 0.145, 0.43, 0.105],
        [sign * 0.135, 0.491, 0.024],
        [sign * 0.142, 0.439, -0.101],
        [sign * 0.147, 0.33, -0.14],
      ],
      0.021,
      0.87,
      false,
    );
    pad(
      "chest",
      metal,
      sign * 0.147,
      0.378,
      0.129,
      0.043,
      0.041,
      0.018,
      0.86,
      true,
    );
    pad("chest", pouch, sign * 0.12, 0.15, 0.146, 0.092, 0.134, 0.068);
    pad("chest", webbing, sign * 0.12, 0.22, 0.179, 0.098, 0.062, 0.022, 1.16);
    cord(
      "chest",
      webbing,
      [
        [sign * 0.12, 0.192, 0.182],
        [sign * 0.12, 0.221, 0.195],
        [sign * 0.12, 0.267, 0.18],
      ],
      0.006,
      0.71,
    );
  }
  pad("chest", pouch, -0.004, 0.17, 0.173, 0.116, 0.105, 0.052, 0.9);
  pad("chest", vest, -0.004, 0.227, 0.198, 0.119, 0.048, 0.022);
  for (const y of [0.299, 0.328, 0.357])
    pad("chest", webbing, 0, y, 0.158, 0.203, 0.011, 0.013, 0.93, true);
  // A stuffed rucksack curves away from the spine. Pocket flaps, piping and a
  // rolled top keep the rear and side silhouettes distinct as the actor turns.
  loft(
    "chest",
    pack,
    [0, 0.104, -0.163],
    [
      [0, 0.095, 0.047],
      [0.033, 0.131, 0.076],
      [0.103, 0.145, 0.099],
      [0.214, 0.145, 0.108],
      [0.298, 0.137, 0.094],
      [0.35, 0.115, 0.074],
      [0.365, 0.085, 0.049],
    ],
    { shape: 0.69, fold: 0.004, sides: 20 },
  );
  pad("chest", pack, 0, 0.145, -0.259, 0.214, 0.143, 0.061, 0.9);
  pad("chest", pack, 0, 0.238, -0.269, 0.221, 0.057, 0.046, 1.13);
  for (const sign of [-1, 1]) {
    cord(
      "chest",
      webbing,
      [
        [sign * 0.087, 0.135, -0.21],
        [sign * 0.092, 0.178, -0.28],
        [sign * 0.089, 0.267, -0.283],
        [sign * 0.09, 0.362, -0.268],
        [sign * 0.082, 0.421, -0.236],
      ],
      0.009,
      0.6,
      false,
    );
    pad(
      "chest",
      metal,
      sign * 0.09,
      0.28,
      -0.277,
      0.027,
      0.031,
      0.014,
      0.77,
      true,
    );
    cord(
      "chest",
      leather,
      [
        [sign * 0.117, 0.18, -0.26],
        [sign * 0.123, 0.234, -0.261],
        [sign * 0.107, 0.29, -0.256],
      ],
      0.0045,
      1.14,
    );
  }
  pad("chest", vest, 0, 0.339, -0.267, 0.076, 0.029, 0.009, 0.97, true);
  cord(
    "chest",
    jacket,
    [
      [0.111, 0.284, -0.261],
      [0.121, 0.264, -0.282],
      [0.119, 0.249, -0.286],
    ],
    0.004,
    1.18,
  );
  // The helmet shell, flexible face covering and curved tinted goggles meet
  // with overlapping edges and different highlights.
  loft(
    "head",
    mask,
    [0, 0, 0.003],
    [
      [-0.035, 0.067, 0.061],
      [0.004, 0.081, 0.08, 0.009],
      [0.035, 0.091, 0.095, 0.011],
      [0.078, 0.103, 0.103, 0.007],
      [0.127, 0.103, 0.106],
      [0.18, 0.102, 0.1],
      [0.205, 0.093, 0.09],
    ],
    { sides: 22 },
  );
  loft(
    "head",
    helmet,
    [0, 0, -0.009],
    [
      [0.129, 0.107, 0.113],
      [0.138, 0.122, 0.125],
      [0.15, 0.132, 0.132],
      [0.172, 0.13, 0.135],
      [0.198, 0.122, 0.128],
      [0.224, 0.105, 0.113],
      [0.245, 0.077, 0.087],
      [0.255, 0.039, 0.045],
      [0.257, 0.012, 0.015],
    ],
    { sides: 24 },
  );
  loft(
    "head",
    glove,
    [0, 0.122, 0.002],
    [
      [0, 0.108, 0.112],
      [0.006, 0.114, 0.118],
      [0.022, 0.115, 0.117],
      [0.027, 0.11, 0.112],
    ],
    { sides: 18 },
  );
  function goggles(mat, width, depth, bottom, top, dim) {
    const m = mesh("head"),
      base = m.v.length,
      segments = 16;
    for (let j = 0; j <= 3; j++)
      for (let i = 0; i <= segments; i++) {
        const t = i / segments,
          a = (t - 0.5) * 2.6,
          y = bottom + ((top - bottom) * j) / 3;
        const bridge =
          (1 - Math.min(1, Math.abs(t - 0.5) * 9)) * 0.012 * (1 - j / 3);
        const z =
          depth * Math.cos(a) + 0.014 + 0.004 * Math.sin((j * Math.PI) / 3);
        m.v.push([
          width * Math.sin(a),
          y + bridge - 0.007 * Math.abs(2 * t - 1),
          z,
          0.88 * Math.sin(a),
          0.13,
          0.97 * Math.cos(a),
          0.2 + 0.61 * t,
          1 - j / 3,
        ]);
        if (j && i < segments) {
          const a = base + (j - 1) * (segments + 1) + i,
            b = a + segments + 1;
          m.tri.push(
            [a, b, b + 1, mat, dim, false],
            [a, b + 1, a + 1, mat, dim, false],
          );
        }
      }
  }
  goggles(glove, 0.119, 0.113, 0.081, 0.143, 0.75);
  goggles(lens, 0.115, 0.117, 0.09, 0.137, 1.13);
  for (const side of [-1, 1]) {
    bead(
      "head",
      glove,
      [side * 0.103, 0.074, -0.008],
      [0.022, 0.047, 0.04],
      1.06,
    );
    cord(
      "head",
      webbing,
      [
        [side * 0.108, 0.092, 0.022],
        [side * 0.091, 0.044, 0.057],
        [side * 0.061, 0.004, 0.071],
      ],
      0.006,
      0.76,
    );
  }
  // Cloth sections along the elbow and knee have varying radii, off-centre
  // bulges and slanted hems. The bone lengths and all contact points are fixed.
  loft(
    "thigh",
    pants,
    [0, 0, 0],
    [
      [-0.055, 0.067, 0.069],
      [0.02, 0.093, 0.098],
      [0.15, 0.111, 0.119, 0.004],
      [0.28, 0.113, 0.117],
      [0.46, 0.103, 0.106, 0.004],
      [0.54, 0.101, 0.109],
      [0.59, 0.094, 0.092],
      [0.7, 0.093, 0.101, -0.003],
      [0.84, 0.08, 0.084],
      [0.93, 0.084, 0.083],
      [1.035, 0.074, 0.076],
    ],
    { fold: 0.026, down: true },
  );
  loft(
    "shin",
    gaiter,
    [0, 0, 0],
    [
      [-0.045, 0.073, 0.072],
      [0.035, 0.084, 0.087],
      [0.13, 0.089, 0.096],
      [0.27, 0.08, 0.094, -0.006],
      [0.43, 0.077, 0.088, -0.012],
      [0.59, 0.071, 0.077, -0.007],
      [0.74, 0.061, 0.069],
      [0.79, 0.074, 0.075],
      [0.84, 0.058, 0.064],
      [0.9, 0.069, 0.071],
      [1.018, 0.057, 0.061],
    ],
    { fold: 0.029, down: true },
  );
  // Local X on a downward-pointing thigh is reversed relative to the torso.
  const trouserLeg = parts.thigh;
  delete parts.thigh;
  for (const [part, outer] of [
    ["thighLeft", 1],
    ["thighRight", -1],
  ]) {
    parts[part] = { v: trouserLeg.v.slice(), tri: trouserLeg.tri.slice() };
    pad(part, pants, outer * 0.091, 0.28, 0.004, 0.044, 0.255, 0.139, 1.09);
    pad(
      part,
      gaiter,
      outer * 0.108,
      0.279,
      0.008,
      0.023,
      0.067,
      0.139,
      1.18,
      true,
    );
  }
  bead("shin", glove, [0, 0.127, 0.073], [0.062, 0.164, 0.033], 0.86);
  bead("shin", gaiter, [0, 0.125, 0.093], [0.05, 0.115, 0.022], 1.13);
  for (const y of [0.077, 0.128, 0.179])
    cord(
      "shin",
      glove,
      [
        [-0.03, y + 0.01, 0.105],
        [0, y, 0.115],
        [0.03, y + 0.01, 0.105],
      ],
      0.0031,
      0.73,
    );
  for (const side of [-1, 1]) {
    pad(
      "upperArm",
      webbing,
      side * 0.084,
      0.182,
      0,
      0.019,
      0.206,
      0.094,
      0.67,
      true,
    );
    pad(
      "upperArm",
      vest,
      side * 0.093,
      0.221,
      0.005,
      0.01,
      0.037,
      0.058,
      0.98,
      true,
    );
    pad(
      "upperArm",
      jacket,
      side * 0.094,
      0.272,
      0.005,
      0.01,
      0.028,
      0.04,
      1.22,
      true,
    );
  }
  loft(
    "upperArm",
    sleeve,
    [0, 0, 0],
    [
      [-0.13, 0.044, 0.048],
      [-0.035, 0.077, 0.08],
      [0.09, 0.094, 0.098],
      [0.21, 0.09, 0.093],
      [0.35, 0.084, 0.084],
      [0.48, 0.082, 0.082],
      [0.54, 0.077, 0.076],
      [0.71, 0.076, 0.075],
      [0.83, 0.065, 0.069],
      [1.04, 0.062, 0.061],
    ],
    { fold: 0.021, down: true },
  );
  loft(
    "forearm",
    jacket,
    [0, 0, 0],
    [
      [-0.07, 0.055, 0.057],
      [0.035, 0.068, 0.073],
      [0.19, 0.077, 0.081],
      [0.31, 0.071, 0.079],
      [0.43, 0.074, 0.076],
      [0.55, 0.06, 0.064],
      [0.66, 0.066, 0.068],
      [0.76, 0.052, 0.056],
      [0.825, 0.061, 0.06],
      [0.867, 0.051, 0.052],
      [1.02, 0.048, 0.049],
    ],
    { fold: 0.021, down: true },
  );
  loft(
    "forearm",
    glove,
    [0, 0, 0],
    [
      [0.82, 0.053, 0.054],
      [0.85, 0.058, 0.057],
      [0.915, 0.056, 0.054],
      [0.955, 0.05, 0.05],
    ],
    { dim: 0.78, down: true },
  );
  for (const [side, hand, boot] of [
    [-1, "gloveLeft", "bootLeft"],
    [1, "gloveRight", "bootRight"],
  ]) {
    // Curled fingers and an opposing thumb wrap around the existing grip.
    bead(hand, glove, [0, -0.002, -0.008], [0.051, 0.048, 0.062], 0.91);
    for (let i = 0; i < 4; i++) {
      const z = (i - 1.5) * 0.024,
        len = 1 - Math.abs(i - 1) * 0.065;
      cord(
        hand,
        glove,
        [
          [side * 0.014, -0.012, z],
          [side * 0.036, -0.008, z + 0.004],
          [side * 0.047, 0.011 * len, z + 0.003],
          [side * 0.041, 0.032 * len, z],
          [side * 0.022, 0.04 * len, z - 0.002],
        ],
        [0.016, 0.017, 0.015, 0.014, 0.011],
        1 + i * 0.025,
        false,
      );
      bead(
        hand,
        glove,
        [side * 0.046, 0.014, z + 0.003],
        [0.009, 0.012, 0.011],
        1.23,
        true,
      );
    }
    cord(
      hand,
      leather,
      [
        [-side * 0.023, -0.009, 0.025],
        [-side * 0.049, 0.008, 0.04],
        [-side * 0.045, 0.032, 0.046],
        [-side * 0.021, 0.048, 0.035],
      ],
      [0.022, 0.02, 0.018, 0.012],
      0.72,
      false,
    );
    // The welt follows the toe box; boot upper narrows into a padded collar.
    const toe = side * -0.009;
    loft(
      boot,
      sole,
      [0, 0, 0],
      [
        [0.003, 0.068, 0.126, 0.039, toe],
        [0.011, 0.078, 0.143, 0.04, toe],
        [0.026, 0.081, 0.146, 0.041, toe],
        [0.035, 0.079, 0.143, 0.041, toe],
      ],
      { shape: 0.7, sides: 20, dim: 0.82 },
    );
    loft(
      boot,
      leather,
      [0, 0, 0],
      [
        [0.034, 0.078, 0.141, 0.041, toe],
        [0.045, 0.081, 0.143, 0.042, toe],
        [0.052, 0.079, 0.139, 0.041, toe],
      ],
      { shape: 0.68, sides: 20, dim: 1.13 },
    );
    loft(
      boot,
      suede,
      [0, 0, 0],
      [
        [0.047, 0.078, 0.14, 0.04, toe],
        [0.066, 0.078, 0.131, 0.035, toe],
        [0.081, 0.074, 0.115, 0.027, toe],
        [0.097, 0.068, 0.09, 0.011],
        [0.121, 0.065, 0.071, -0.001],
        [0.156, 0.067, 0.066, -0.004],
        [0.177, 0.061, 0.058, -0.004],
      ],
      { shape: 0.77, sides: 18 },
    );
    bead(boot, leather, [toe, 0.065, 0.115], [0.069, 0.026, 0.063], 1.1);
    pad(boot, leather, 0, 0.065, 0.063, 0.084, 0.083, 0.034, 0.92);
    for (const y of [0.083, 0.102, 0.121, 0.14]) {
      const z = 0.116 - (y - 0.083) * 0.62;
      for (const sign of [-1, 1]) {
        bead(
          boot,
          metal,
          [sign * 0.039, y, z],
          [0.005, 0.005, 0.005],
          1.12,
          true,
        );
        cord(
          boot,
          sole,
          [
            [sign * 0.039, y, z + 0.001],
            [0, y + 0.005, z + 0.009],
            [-sign * 0.034, y + 0.014, z - 0.001],
          ],
          0.0032,
          1.17,
        );
      }
    }
    loft(
      boot,
      glove,
      [0, 0.146, -0.005],
      [
        [0, 0.063, 0.063],
        [0.008, 0.07, 0.067],
        [0.023, 0.068, 0.065],
        [0.031, 0.06, 0.057],
      ],
      { dim: 0.91 },
    );
    for (const edge of [-1, 1]) {
      cord(
        boot,
        leather,
        [
          [edge * 0.065, 0.052, 0.103],
          [edge * 0.075, 0.065, 0.065],
          [edge * 0.072, 0.082, 0.011],
          [edge * 0.064, 0.119, -0.031],
          [edge * 0.05, 0.135, -0.042],
        ],
        0.0043,
        0.76,
      );
    }
    pad(boot, leather, 0, 0.052, -0.061, 0.093, 0.079, 0.026, 0.72, true);
    cord(
      boot,
      webbing,
      [
        [0, 0.13, -0.066],
        [0, 0.182, -0.078],
        [0, 0.19, -0.069],
        [0, 0.168, -0.055],
      ],
      0.0056,
      0.8,
    );
  }
  // The training prop sits at the same hand sockets as before.
  pad("chest", metal, 0.037, 0.217, 0.238, 0.071, 0.076, 0.275, 0.76);
  pad("chest", glove, 0.037, 0.239, 0.376, 0.064, 0.051, 0.158, 0.86);
  pad("chest", metal, 0.037, 0.252, 0.46, 0.047, 0.032, 0.099, 1.02);
  pad("chest", jacket, 0.037, 0.248, 0.49, 0.053, 0.042, 0.033, 0.95);
  pad("chest", metal, 0.037, 0.154, 0.267, 0.048, 0.08, 0.057, 0.76);

  // A ribbon follows the chest volume over the clavicle. Both its face and
  // the lip are visible in profile, unlike a straight strap through the torso.
  function harness(sign) {
    const path = [
      [0.133, 0.287, 0.158],
      [0.134, 0.362, 0.156],
      [0.147, 0.421, 0.138],
      [0.153, 0.466, 0.1],
      [0.144, 0.492, 0.052],
      [0.132, 0.507, -0.001],
      [0.134, 0.48, -0.065],
      [0.145, 0.431, -0.103],
      [0.136, 0.37, -0.15],
    ];
    const m = mesh("chest"),
      base = m.v.length;
    for (let j = 0; j < path.length; j++) {
      const [x, y, z] = path[j],
        tangent = vec(
          path[Math.min(path.length - 1, j + 1)],
          path[Math.max(0, j - 1)],
        );
      const n = unit([0.18 * sign, -tangent[2], tangent[1]]);
      for (let k = 0; k < 3; k++) {
        const offset = (k - 1) * 0.025,
          relief = k === 1 ? 0.006 : 0;
        m.v.push([
          x * sign + offset,
          y + n[1] * relief,
          z + n[2] * relief,
          ...n,
          k * 0.5,
          j / (path.length - 1),
        ]);
      }
      if (j)
        for (let k = 0; k < 2; k++) {
          const a = base + (j - 1) * 3 + k,
            b = a + 3;
          m.tri.push(
            [a, b, b + 1, webbing, 0.76, false],
            [a, b + 1, a + 1, webbing, 0.76, false],
          );
        }
    }
    for (const edge of [-0.024, 0.024])
      cord(
        "chest",
        webbing,
        path.map(([x, y, z]) => [x * sign + edge, y + 0.001, z + 0.0015]),
        0.0028,
        1.16,
      );
    pad("chest", metal, sign * 0.141, 0.385, 0.151, 0.054, 0.034, 0.012, 0.85);
    pad(
      "chest",
      webbing,
      sign * 0.141,
      0.392,
      0.161,
      0.035,
      0.018,
      0.007,
      0.9,
      true,
    );
  }
  harness(-1);
  harness(1);
  for (const sign of [-1, 1]) {
    cord(
      "chest",
      jacket,
      [
        [sign * 0.091, 0.546, -0.016],
        [sign * 0.085, 0.548, 0.046],
        [sign * 0.059, 0.515, 0.083],
        [sign * 0.091, 0.461, 0.1],
      ],
      [0.012, 0.014, 0.012, 0.003],
      0.83,
      false,
    );
    cord(
      "head",
      glove,
      [
        [sign * 0.039, 0.148, 0.106],
        [sign * 0.089, 0.147, 0.088],
        [sign * 0.116, 0.137, 0.05],
        [sign * 0.119, 0.133, -0.004],
      ],
      0.005,
      0.65,
    );
    pad("chest", pouch, sign * 0.181, 0.173, 0.091, 0.077, 0.113, 0.063, 0.85);
    pad("chest", vest, sign * 0.181, 0.237, 0.119, 0.081, 0.044, 0.026, 1.03);
  }
  cord(
    "chest",
    leather,
    [
      [-0.09, 0.346, 0.163],
      [-0.011, 0.351, 0.176],
      [0.083, 0.356, 0.164],
    ],
    0.0046,
    0.79,
  );
  cord(
    "chest",
    metal,
    [
      [0.073, 0.355, 0.169],
      [0.077, 0.339, 0.18],
      [0.071, 0.327, 0.179],
    ],
    0.0037,
    1.1,
  );
  // Amber training identifier is sewn to the rucksack, between its bindings.
  pad("chest", webbing, 0, 0.322, -0.27, 0.092, 0.042, 0.012, 0.73, true);
  pad("chest", jacket, -0.016, 0.331, -0.278, 0.018, 0.023, 0.006, 1.22, true);
  pad("chest", vest, 0.012, 0.335, -0.279, 0.025, 0.01, 0.006, 1.07, true);
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
        [side < 0 ? "thighLeft" : "thighRight", limb(hip, mid, base.f)],
        ["shin", limb(mid, feet[i], base.f)],
        [
          side < 0 ? "bootLeft" : "bootRight",
          frame([feet[i][0], g.feet[i].lift, feet[i][2]], g.feet[i].yaw),
        ],
      );
      const shoulder = at(chest, side * 0.202, 0.435, 0),
        elbow = at(chest, side * 0.256, 0.183, 0.058);
      const hand = at(chest, side * 0.045, 0.232, i === 0 ? 0.38 : 0.201);
      bones.push(
        ["upperArm", limb(shoulder, elbow, chest.f)],
        ["forearm", limb(elbow, hand, chest.f)],
        [side < 0 ? "gloveLeft" : "gloveRight", frame(hand, g.chest)],
      );
    }
    return bones;
  }
  const resolution = 512,
    tileSize = 256;
  let clothPixels = null,
    clothImage = null;
  function loadFabric(image) {
    if (
      image.naturalWidth !== 4 * tileSize ||
      image.naturalHeight !== 4 * tileSize
    )
      return;
    const source = document.createElement("canvas");
    source.width = image.naturalWidth;
    source.height = image.naturalHeight;
    const paint = source.getContext("2d");
    paint.drawImage(image, 0, 0);
    // A file opened directly may deny texture reads. The built-in palette
    // still shades the same model; the single-file edition embeds the atlas.
    try {
      clothPixels = paint.getImageData(0, 0, source.width, source.height).data;
    } catch (error) {
      if (error.name !== "SecurityError") throw error;
      return;
    }
    clothImage = image;
    gpu?.texture(image);
  }
  function project(enemy) {
    const s = enemyScreenData(enemy),
      h = s.syFeet - s.syTop;
    const cos = Math.cos(player.yaw),
      sin = Math.sin(player.yaw),
      horizon = H / 2 + Math.tan(player.pitch) * PROJ;
    const feet = enemy.gait.feet.map((foot) => {
      const dx = foot.x - player.x,
        dz = foot.z - player.z,
        depth = Math.max(0.08, dx * cos + dz * sin);
      return {
        x: W / 2 + ((-dx * sin + dz * cos) * PROJ) / depth,
        groundY: horizon + (player.eye * PROJ) / (depth * TILE),
        lift: foot.lift,
      };
    });
    const left = Math.floor(s.sx - 0.67 * h),
      top = Math.floor(s.syTop - 0.18 * h);
    const width = Math.max(2, Math.ceil(1.34 * h)),
      height = Math.max(2, Math.ceil(1.53 * h));
    const scale = Math.min(1.3, resolution / Math.max(width, height));
    return {
      bones: skeleton(enemy),
      feet,
      left,
      top,
      width,
      height,
      cos,
      sin,
      horizon,
      w: Math.max(2, Math.round(width * scale)),
      h: Math.max(2, Math.round(height * scale)),
      fine: h > 66,
    };
  }
  function createPainter() {
    const surface = document.createElement("canvas");
    surface.width = surface.height = resolution;
    const gl = surface.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });
    if (!gl) return null;
    const program = gl.createProgram();
    function shader(type, code) {
      const s = gl.createShader(type);
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        throw Error(gl.getShaderInfoLog(s));
      gl.attachShader(program, s);
    }
    shader(
      gl.VERTEX_SHADER,
      `attribute vec3 pos,normal;attribute vec2 uv;attribute vec3 tint;
      attribute float material;uniform mat4 bone;uniform vec3 eye;uniform vec2 view;uniform vec4 crop;
      varying vec3 n,v,t;varying vec2 tex;varying float mat;
      void main(){vec3 p=(bone*vec4(pos,1.)).xyz-eye;float d=dot(p.xz,view.xy);
        float side=dot(p.xz,vec2(-view.y,view.x));gl_Position=vec4(crop.x*d+crop.z*side,crop.y*d+crop.w*p.y,d*1.002-.34,d);
        n=bone[0].xyz*normal.x+bone[1].xyz*normal.y/dot(bone[1].xyz,bone[1].xyz)+bone[2].xyz*normal.z;
        v=-p;t=tint;tex=uv;mat=material;}`,
    );
    shader(
      gl.FRAGMENT_SHADER,
      `precision mediump float;uniform sampler2D fabric;
      varying vec3 n,v,t;varying vec2 tex;varying float mat;
      void main(){vec3 N=normalize(n),V=normalize(v),L=vec3(-.54,.73,.42);
        float id=floor(mat+.5);vec2 cell=vec2(mod(id,4.),floor(id*.25));
        vec3 base=texture2D(fabric,(cell+(16.5+clamp(tex,0.,1.)*223.)/256.)*.25).rgb;
        base*=t;
        float sun=max(dot(N,L),0.);float sky=.5+.5*N.y;
        vec3 light=vec3(.57,.62,.68)+sky*.14+sun*vec3(.47,.40,.32);
        float gloss=abs(mat-10.)<.2?.55:(abs(mat-12.)<.2?.24:.032);
        float shine=pow(max(dot(N,normalize(L+V)),0.),mix(10.,48.,gloss))*gloss;
        gl_FragColor=vec4(base*light+shine*vec3(1.,.91,.73),1.);}`,
    );
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const loc = (name) => gl.getUniformLocation(program, name),
      boneLoc = loc("bone"),
      view = loc("view"),
      crop = loc("crop"),
      eye = loc("eye");
    const vertices = [],
      batches = {};
    // Solid details are at the end of each batch so distant actors can omit
    // tiny stitches and eyelets without another mesh or animation state.
    for (const [name, m] of Object.entries(parts)) {
      const first = vertices.length / 12;
      let plain = 0;
      for (const detail of [false, true])
        for (const [a, b, c, mat, dim, small] of m.tri) {
          if (detail !== small) continue;
          for (const i of [a, b, c]) {
            const v = m.v[i];
            vertices.push(...v, dim, dim, dim, mat);
          }
          if (!detail) plain += 3;
        }
      batches[name] = { first, plain, all: vertices.length / 12 - first };
    }
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    for (const [name, size, offset] of [
      ["pos", 3, 0],
      ["normal", 3, 3],
      ["uv", 2, 6],
      ["tint", 3, 8],
      ["material", 1, 11],
    ]) {
      const i = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, size, gl.FLOAT, false, 48, offset * 4);
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // A tiny palette atlas also works before the photograph has decoded.
    const swatch = new Uint8Array(palette.flat());
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      4,
      4,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      swatch,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.uniform1i(loc("fabric"), 0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);
    gl.clearColor(0, 0, 0, 0);
    const matrix = new Float32Array(16);
    matrix[15] = 1;
    return {
      texture(image) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGB,
          gl.RGB,
          gl.UNSIGNED_BYTE,
          image,
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      },
      draw(ctx, p) {
        gl.viewport(0, 0, p.w, p.h);
        gl.scissor(0, 0, p.w, p.h);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform3f(eye, player.x * TILE, player.eye, player.z * TILE);
        gl.uniform2f(view, p.cos, p.sin);
        gl.uniform4f(
          crop,
          (2 * (W / 2 - p.left)) / p.width - 1,
          1 - (2 * (p.horizon - p.top)) / p.height,
          (2 * PROJ) / p.width,
          (2 * PROJ) / p.height,
        );
        for (const [name, b] of p.bones) {
          matrix.set(b.r, 0);
          matrix.set(b.u, 4);
          matrix.set(b.f, 8);
          matrix.set(b.p, 12);
          gl.uniformMatrix4fv(boneLoc, false, matrix);
          const batch = batches[name];
          gl.drawArrays(
            gl.TRIANGLES,
            batch.first,
            p.fine ? batch.all : batch.plain,
          );
        }
        ctx.drawImage(
          surface,
          0,
          resolution - p.h,
          p.w,
          p.h,
          p.left,
          p.top,
          p.width,
          p.height,
        );
      },
      lost: () => gl.isContextLost(),
    };
  }
  // The CPU path uses the same mesh, UVs, depth buffer and joint matrices on
  // browsers without WebGL. Gouraud lighting keeps rounded sleeves continuous.
  const fallback = document.createElement("canvas");
  fallback.width = fallback.height = resolution;
  const painter = fallback.getContext("2d"),
    image = painter.createImageData(resolution, resolution);
  const zbuf = new Float32Array(resolution * resolution);
  function software(ctx, p) {
    image.data.fill(0, 0, p.h * resolution * 4);
    zbuf.fill(0, 0, p.h * resolution);
    const sx = p.w / p.width,
      sy = p.h / p.height;
    for (const [name, b] of p.bones) {
      const m = parts[name],
        len = dot(b.u, b.u);
      const points = m.v.map(([x, y, z, nx, ny, nz, u, v]) => {
        const P = at(b, x, y, z),
          dx = P[0] - player.x * TILE,
          dz = P[2] - player.z * TILE;
        const depth = dx * p.cos + dz * p.sin,
          inv = 1 / Math.max(0.07, depth);
        const n = unit(
          b.r.map((a, i) => a * nx + (b.u[i] * ny) / len + b.f[i] * nz),
        );
        const light =
          0.618 +
          0.071 * (1 + n[1]) +
          0.43 * Math.max(0, -0.54 * n[0] + 0.73 * n[1] + 0.42 * n[2]);
        return [
          (W / 2 + (-dx * p.sin + dz * p.cos) * PROJ * inv - p.left) * sx,
          (p.horizon - (P[1] - player.eye) * PROJ * inv - p.top) * sy,
          inv,
          u * inv,
          v * inv,
          light,
        ];
      });
      for (const [ia, ib, ic, mat, dim, small] of m.tri) {
        if (small && !p.fine) continue;
        const a = points[ia],
          b = points[ib],
          c = points[ic],
          abx = b[0] - a[0],
          aby = b[1] - a[1],
          acx = c[0] - a[0],
          acy = c[1] - a[1];
        const det = abx * acy - aby * acx;
        if (Math.abs(det) < 0.02) continue;
        const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))),
          x1 = Math.min(p.w - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
        const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))),
          y1 = Math.min(p.h - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
        for (let y = y0; y <= y1; y++)
          for (let x = x0; x <= x1; x++) {
            const dx = x + 0.5 - a[0],
              dy = y + 0.5 - a[1],
              B = (dx * acy - dy * acx) / det,
              C = (abx * dy - aby * dx) / det,
              A = 1 - B - C;
            if (A < 0 || B < 0 || C < 0) continue;
            const q = A * a[2] + B * b[2] + C * c[2],
              i = y * resolution + x;
            if (q <= zbuf[i]) continue;
            zbuf[i] = q;
            const k = i * 4,
              light = dim * (A * a[5] + B * b[5] + C * c[5]);
            let color = palette[mat],
              j = 0;
            if (clothPixels) {
              const u = clamp((A * a[3] + B * b[3] + C * c[3]) / q, 0, 0.999),
                v = clamp((A * a[4] + B * b[4] + C * c[4]) / q, 0, 0.999);
              j =
                4 *
                ((Math.floor(mat / 4) * tileSize + ((16 + v * 223) | 0)) *
                  1024 +
                  (mat % 4) * tileSize +
                  ((16 + u * 223) | 0));
              color = clothPixels;
            }
            image.data[k] = color[j] * light;
            image.data[k + 1] = color[j + 1] * light;
            image.data[k + 2] = color[j + 2] * light;
            image.data[k + 3] = 255;
          }
      }
    }
    painter.putImageData(image, 0, 0, 0, 0, p.w, p.h);
    ctx.drawImage(fallback, 0, 0, p.w, p.h, p.left, p.top, p.width, p.height);
  }
  let gpu = null,
    initialized = false;
  function draw(ctx, pose) {
    if (!initialized) {
      initialized = true;
      try {
        gpu = createPainter();
        if (gpu && clothImage) gpu.texture(clothImage);
      } catch (error) {
        console.warn("Using software character drawing", error);
        gpu = null;
      }
    }
    if (gpu && !gpu.lost()) gpu.draw(ctx, pose);
    else software(ctx, pose);
  }
  return { project, draw, loadFabric };
})();
