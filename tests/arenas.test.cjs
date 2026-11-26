const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const arenas = vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "../arenas.js"), "utf8") + "\narenas",
);
for (const scene of Object.values(arenas)) {
  test(
    scene.code +
      " has connected lanes and reachable ground and rooftop positions",
    () => {
      const { grid, start, targets } = scene;
      const width = grid[0].length,
        height = grid.length;
      assert.ok(
        grid.every(
          (row, z) =>
            row.length === width &&
            row.startsWith("#") &&
            row.endsWith("#") &&
            ((z > 0 && z < height - 1) || /^#+$/.test(row)),
        ),
      );
      const visited = new Set(),
        queue = [[Math.floor(start[0]), Math.floor(start[1])]];
      for (let i = 0; i < queue.length; i++) {
        const [x, z] = queue[i],
          key = x + "," + z;
        if (grid[z]?.[x] !== "." || visited.has(key)) continue;
        visited.add(key);
        queue.push([x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]);
      }
      assert.equal(visited.size, grid.join("").split(".").length - 1);
      assert.equal(targets.length, 8);
      assert.equal(targets.filter((t) => t[2]).length, 2);
      for (const [x, z, perched] of targets) {
        const col = Math.floor(x),
          row = Math.floor(z);
        if (perched) {
          assert.equal(grid[row][col], "#");
          assert.ok(
            [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ].some(([dx, dz]) => visited.has(col + dx + "," + (row + dz))),
          );
        } else assert.ok(visited.has(col + "," + row));
      }
    },
  );
}
