import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import vm from "node:vm";
import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import ts from "typescript";

const require = createRequire(import.meta.url);
function loadSource(path, imports, globals) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const module = { exports: {} };
  vm.runInNewContext(outputText, {
    module, exports: module.exports,
    require: (name) => name in imports ? imports[name] : require(name),
    queueMicrotask, Event, console, ...globals,
  }, { filename: path });
  return module.exports;
}

function sdkHarness({ consent = true, src = "https://salesiq.zoho.com/widget?wc=test-only" } = {}) {
  const window = new EventTarget();
  const timers = new Map();
  const scripts = new Map();
  const calls = [];
  let nextTimer = 0;
  let appends = 0;
  let allowed = consent;
  window.setTimeout = (fn) => { timers.set(++nextTimer, fn); return nextTimer; };
  window.clearTimeout = (id) => timers.delete(id);
  const document = {
    getElementById: (id) => scripts.get(id) ?? null,
    createElement: () => {
      const script = { remove: () => scripts.delete(script.id) };
      return script;
    },
    body: { appendChild: (script) => { appends++; scripts.set(script.id, script); } },
  };
  const api = loadSource("components/shared/zoho-salesiq.tsx", {
    "@/lib/analytics/consent": { readConsent: () => ({ analytics: allowed }) },
  }, { window, document, URL, process: { env: { NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_SRC: src } } });
  return {
    api, window, calls,
    get appends() { return appends; },
    setConsent(value) { allowed = value; },
    ready() {
      const widget = window.$zoho.salesiq;
      widget.tracking = { off: () => calls.push(["tracking", "off"]) };
      widget.floatbutton = { visible: (value) => calls.push(["launcher", value]) };
      widget.chatwindow = { visible: (value) => calls.push(["chat", value]) };
      widget.ready();
    },
    fail() { scripts.get("zsiqscript").onerror(); },
    timeout() { for (const fn of timers.values()) fn(); timers.clear(); },
  };
}

test("no SalesIQ script or chat opens before statistics consent", async () => {
  const h = sdkHarness({ consent: false });
  assert.equal(await h.api.mountZohoSupportChat(), false);
  assert.equal(await h.api.openZohoSupportChat(), false);
  assert.equal(h.appends, 0);
});

test("concurrent requests and later opens share one SDK and await its ready event", async () => {
  const h = sdkHarness();
  const first = h.api.mountZohoSupportChat();
  const second = h.api.openZohoSupportChat();
  assert.equal(h.appends, 1);
  assert.deepEqual(h.calls, []);
  h.ready();
  assert.equal(await first, true);
  assert.equal(await second, true);
  assert.ok(h.calls.some(([kind, state]) => kind === "chat" && state === "show"));
  assert.equal(await h.api.mountZohoSupportChat(), true);
  assert.equal(h.appends, 1);
});

test("a late SDK cannot show a widget after leaving a support page", async () => {
  const h = sdkHarness();
  const pending = h.api.mountZohoSupportChat();
  h.api.closeZohoSupportChat();
  h.ready();
  assert.equal(await pending, false);
  assert.ok(!h.calls.some(([, state]) => state === "show"));
});

test("consent withdrawn while loading stays hidden, and regrant reuses the SDK", async () => {
  const h = sdkHarness();
  const pending = h.api.mountZohoSupportChat();
  h.setConsent(false);
  h.ready();
  assert.equal(await pending, false);
  assert.ok(!h.calls.some(([, state]) => state === "show"));
  h.setConsent(true);
  assert.equal(await h.api.openZohoSupportChat(), true);
  assert.equal(h.appends, 1);
});

test("slow loading can time out without duplicating the script; late readiness is announced", async () => {
  const h = sdkHarness();
  let events = 0;
  h.window.addEventListener(h.api.ZOHO_SALESIQ_READY_EVENT, () => events++);
  const pending = h.api.mountZohoSupportChat();
  h.timeout();
  assert.equal(await pending, false);
  h.ready();
  assert.equal(events, 1);
  assert.equal(await h.api.openZohoSupportChat(), true);
  assert.equal(h.appends, 1);
});

test("a failed script can be retried", async () => {
  const h = sdkHarness();
  const first = h.api.mountZohoSupportChat();
  h.fail();
  assert.equal(await first, false);
  const retry = h.api.mountZohoSupportChat();
  assert.equal(h.appends, 2);
  h.ready();
  assert.equal(await retry, true);
});

test("unapproved widget origins are never loaded", async () => {
  const h = sdkHarness({ src: "https://example.com/widget?wc=test-only" });
  assert.equal(h.api.zohoSalesIqConfigured(), false);
  assert.equal(await h.api.mountZohoSupportChat(), false);
  assert.equal(h.appends, 0);
});

function reactHarness({ consent = true, configured = true } = {}) {
  const window = new EventTarget();
  let allowed = consent;
  const calls = { mount: 0, close: 0, open: 0, cookies: 0 };
  const { SupportMessengerProvider, SupportMessengerLauncher } = loadSource(
    "components/support/support-messenger-launcher.tsx",
    {
      "next/dynamic": () => function LegacyMessenger() { return React.createElement("legacy-messenger"); },
      "@/components/support/support-messenger-events": { SUPPORT_MESSENGER_EVENT: "open-support" },
      "@/components/shared/zoho-salesiq": {
        zohoSalesIqConfigured: () => configured,
        mountZohoSupportChat: async () => { calls.mount++; return true; },
        closeZohoSupportChat: () => { calls.close++; },
        openZohoSupportChat: async () => { calls.open++; return true; },
        ZOHO_SALESIQ_READY_EVENT: "salesiq-ready",
      },
      "@/lib/analytics/consent": {
        readConsent: () => ({ analytics: allowed }),
        openCookieSettings: () => { calls.cookies++; },
      },
    }, { window },
  );
  const page = (key, supported = true) => React.createElement(SupportMessengerProvider, null,
    React.createElement("main", { key }, supported ? React.createElement(SupportMessengerLauncher) : null));
  return { window, calls, page, setConsent(value) { allowed = value; window.dispatchEvent(new Event("mundoria:consent-updated")); } };
}

test("one host stays mounted through keyed homepage, service, Help and booking transitions", async () => {
  const h = reactHarness();
  let renderer;
  await act(async () => { renderer = TestRenderer.create(h.page("home")); });
  assert.equal(h.calls.mount, 1);
  for (const route of ["service", "help", "booking", "home"]) {
    await act(async () => { renderer.update(h.page(route)); });
    assert.equal(h.calls.close, 0, `must not close when navigating to ${route}`);
    assert.equal(h.calls.mount, 1, `must not remount when navigating to ${route}`);
  }
  await act(async () => { h.window.dispatchEvent(new Event("open-support")); });
  assert.equal(h.calls.open, 1);
  await act(async () => { renderer.update(h.page("admin", false)); });
  assert.equal(h.calls.close, 1);
  assert.equal(renderer.root.findAllByType("button").length, 0);
  await act(async () => { renderer.unmount(); });
});

test("declining cookies keeps a launcher that opens preferences without a silent inbox switch", async () => {
  const h = reactHarness({ consent: false });
  let renderer;
  await act(async () => { renderer = TestRenderer.create(h.page("booking")); });
  assert.equal(h.calls.mount, 0);
  await act(async () => { renderer.root.findByType("button").props.onClick(); });
  assert.equal(h.calls.cookies, 1);
  assert.equal(h.calls.open, 0);
  assert.equal(renderer.root.findAllByType("legacy-messenger").length, 0);
  await act(async () => { h.setConsent(true); });
  assert.equal(h.calls.mount, 1);
  assert.equal(renderer.root.findAllByType("button").length, 0);
  await act(async () => { h.setConsent(false); });
  assert.equal(renderer.root.findAllByType("button").length, 1);
  await act(async () => { renderer.unmount(); });
});

test("deployments without a SalesIQ URL retain the existing messenger", async () => {
  const h = reactHarness({ configured: false });
  let renderer;
  await act(async () => { renderer = TestRenderer.create(h.page("home")); });
  await act(async () => { renderer.root.findByType("button").props.onClick(); });
  assert.equal(renderer.root.findAllByType("legacy-messenger").length, 1);
  assert.equal(h.calls.mount, 0);
  assert.equal(h.calls.open, 0);
  await act(async () => { renderer.unmount(); });
});
