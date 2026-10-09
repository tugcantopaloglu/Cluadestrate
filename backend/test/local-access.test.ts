import assert from "node:assert/strict";
import { test } from "node:test";
import { getListenHost, isLocalRequest } from "../src/localAccess.js";

test("local requests reject cross-origin browsers and DNS rebinding hosts", () => {
  assert.equal(isLocalRequest("localhost:3001", "http://localhost:3000"), true);
  assert.equal(isLocalRequest("127.0.0.1:3001", undefined), true);
  assert.equal(isLocalRequest("[::1]:3001", undefined), true);
  assert.equal(isLocalRequest("attacker.example:3001", undefined), false);
  assert.equal(isLocalRequest("localhost:3001", "https://attacker.example"), false);
  assert.equal(isLocalRequest("localhost:3001", "null"), false);
  assert.equal(isLocalRequest(undefined, undefined), false);
});

test("server cannot bind to a public interface", () => {
  const previous = process.env.HOST;
  try {
    delete process.env.HOST;
    assert.equal(getListenHost(), "127.0.0.1");
    process.env.HOST = "0.0.0.0";
    assert.throws(getListenHost, /loopback/);
  } finally {
    if (previous === undefined) delete process.env.HOST;
    else process.env.HOST = previous;
  }
});
