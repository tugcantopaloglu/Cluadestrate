import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { FileSyncManager } from "../src/services/FileSyncManager.js";

test("synced files stay inside their folder and reject links to outside data", async () => {
  const previousDirectory = process.cwd();
  const fixture = mkdtempSync(join(tmpdir(), "cluadestrate-sync-"));
  try {
    process.chdir(fixture);
    const manager = new FileSyncManager();
    manager.updateConfig({ watchForChanges: false });
    const folder = manager.addFolder({ hostId: "fixture", hostName: "fixture", remotePath: "workspace" });
    const file = await manager.addFile(folder.id, "nested/file.txt", "first");
    assert.equal(manager.getFileContent(file.id)?.toString(), "first");
    manager.updateFile(file.id, "second");
    assert.equal(manager.getFileContent(file.id)?.toString(), "second");
    manager.updateConfig({ maxVersionHistory: 2 });
    for (const maxVersionHistory of [-1, 0, 1.5, NaN, Infinity, null]) {
      assert.throws(() => manager.updateConfig(JSON.parse(JSON.stringify({ maxVersionHistory }))), /Version history limit/);
    }
    assert.equal(manager.getConfig().maxVersionHistory, 2);
    for (const content of ["third", "fourth", "fifth", "sixth"]) manager.updateFile(file.id, content);
    const versions = manager.getVersions(file.id);
    assert.equal(manager.getFile(file.id)?.versions.length, 2);
    assert.deepEqual(versions.map((version) => version.version), [5, 6]);
    assert.equal(new Set(versions.map((version) => version.storagePath)).size, 2);
    manager.restoreVersion(file.id, versions[0].id);
    assert.equal(manager.getFileContent(file.id)?.toString(), "fourth");
    for (const unsafePath of ["../outside.txt", "..\\outside.txt", "/outside.txt", "C:\\outside.txt", "C:outside.txt", "nested/../../outside.txt", "file.txt:stream", "nested/.. /outside.txt"]) {
      await assert.rejects(manager.addFile(folder.id, unsafePath, "blocked"), /File path/);
    }
    if (process.platform === "win32") {
      for (const devicePath of ["NUL", "CON.txt", "nested/COM1.log"]) {
        await assert.rejects(manager.addFile(folder.id, devicePath, "blocked"), /Windows device/);
      }
    }
    const outside = join(fixture, "outside");
    mkdirSync(outside);
    writeFileSync(join(outside, "sentinel.txt"), "unchanged");
    symlinkSync(outside, join(folder.localPath, "linked"), process.platform === "win32" ? "junction" : "dir");
    await assert.rejects(manager.addFile(folder.id, "linked/sentinel.txt", "blocked"), /symbolic links/);
    assert.equal(readFileSync(join(outside, "sentinel.txt"), "utf8"), "unchanged");
  } finally {
    process.chdir(previousDirectory);
    rmSync(fixture, { recursive: true, force: true });
  }
});
