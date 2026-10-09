import assert from "node:assert/strict";
import { test } from "node:test";
import { createFileSyncRoutes } from "../src/routes/fileSync.js";
import { createImageSharingRoutes } from "../src/routes/imageSharing.js";

test("downloaded files retain bytes and cannot become active API-origin documents", async () => {
  const content = Buffer.from("<script>fixture</script>");
  const router = createFileSyncRoutes({ getFileContent: () => content, getFile: () => ({ mimeType: "text/html" }) } as never);
  const response = await router.request("/files/fixture/content");
  assert.equal(await response.text(), content.toString());
  assert.equal(response.headers.get("content-disposition"), "attachment");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy")!, /sandbox/);
});

test("SVG originals and thumbnails carry a sandbox policy", async () => {
  const content = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>fixture</script></svg>');
  const router = createImageSharingRoutes({
    getImageContent: () => content, getThumbnailContent: () => content,
    getImage: () => ({ mimeType: "image/svg+xml" }),
  } as never);
  for (const endpoint of ["/fixture/content", "/fixture/thumbnail"]) {
    const response = await router.request(endpoint);
    assert.equal(await response.text(), content.toString());
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy")!, /sandbox/);
  }
});
