import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { gitRouter } from "../src/routes/git.js";

let directory: string;
const query = (path: string, values: Record<string, string> = {}) =>
  gitRouter.request(`${path}?${new URLSearchParams({ directory, ...values })}`);

before(() => {
  directory = mkdtempSync(join(tmpdir(), "cluadestrate git & "));
  execFileSync("git", ["init", "-q", directory]);
  execFileSync("git", ["-C", directory, "config", "user.name", "Test User"]);
  execFileSync("git", ["-C", directory, "config", "user.email", "test@example.invalid"]);
  writeFileSync(join(directory, "first.txt"), "original\n");
  execFileSync("git", ["-C", directory, "add", "."]);
  execFileSync("git", ["-C", directory, "commit", "-qm", "Create fixture"]);
  writeFileSync(join(directory, "first.txt"), "modified\n");
  writeFileSync(join(directory, "second.txt"), "staged\n");
  execFileSync("git", ["-C", directory, "add", "second.txt"]);
});
after(() => rmSync(directory, { recursive: true, force: true }));

test("Git reads accept literal paths and retain unstaged status columns", async () => {
  const response = await query("/status");
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.changes.find((change: { file: string }) => change.file === "first.txt"), {
    status: "modified", file: "first.txt", staged: false,
  });
  assert.deepEqual(data.changes.find((change: { file: string }) => change.file === "second.txt"), {
    status: "added", file: "second.txt", staged: true,
  });
  const diff = await (await query("/diff", { file: "first.txt" })).json();
  assert.match(diff.diff, /modified/);
  assert.equal((await query("/branches")).status, 200);
  assert.equal((await (await query("/log", { limit: "1" })).json()).length, 1);
});

test("Git command endpoint rejects shell operators, Git options and malformed commands", async () => {
  for (const command of ["git status && echo injected", "git -c alias.run=anything run", "git push --force", "git reset --hard", "git status; echo injected", "__proto__", null]) {
    const response = await gitRouter.request("/command", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ directory, command }),
    });
    assert.equal(response.status, 400);
  }
  const response = await gitRouter.request("/command", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ directory, command: "git status" }),
  });
  assert.equal(response.status, 200);
  assert.match((await response.json()).stdout, /first.txt/);
});

test("Git log rejects malformed and unbounded limits", async () => {
  for (const limit of ["0", "101", "1 & echo injected", "--all", "1.5"]) {
    assert.equal((await query("/log", { limit })).status, 400);
  }
});
