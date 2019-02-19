const sigma = require("../build/sigma.require.js");

QUnit.test("Constructor polymorphism", assert => {
  let s;

  const tmp = sigma.renderers.def;

  const dom = document.createElement("DIV");

  // Let's add a temporary container:
  dom.id = "abc";
  document.body.appendChild(dom);

  // Custom renderer:
  // We just need the options here.
  sigma.renderers.def = function(_1, _2, _3, options) {
    this.options = options;
  };

  s = new sigma();
  assert.equal(
    Object.keys(s.renderers).length,
    0,
    '"new sigma()" instantiate sigma without any renderer.'
  );

  s = new sigma("abc");
  assert.deepEqual(
    s.renderers[0].options,
    {
      container: dom
    },
    '"new sigma("abc")" instantiate the default renderer in the div #abc.'
  );

  s = new sigma(["abc"]);
  assert.deepEqual(
    s.renderers[0].options,
    {
      container: dom
    },
    '"new sigma(["abc"])" instantiate the default renderer in the div #abc.'
  );

  s = new sigma(document.getElementById("abc"));
  assert.deepEqual(
    s.renderers[0].options,
    {
      container: dom
    },
    '"new sigma(document.getElementById("abc"))" instantiate the default renderer in the div #abc.'
  );

  s = new sigma({
    container: "abc"
  });
  assert.deepEqual(
    s.renderers[0].options,
    {
      container: dom
    },
    '"new sigma({ container: "abc" })" instantiate the default renderer in the div #abc.'
  );

  s = new sigma({
    container: document.getElementById("abc")
  });
  assert.deepEqual(
    s.renderers[0].options,
    {
      container: dom
    },
    '"new sigma({ container: document.getElementById("abc") })" instantiate the default renderer in the div #abc.'
  );

  s = new sigma(["abc", "abc"]);
  assert.deepEqual(
    [s.renderers[0].options, s.renderers[1].options],
    [{ container: dom }, { container: dom }],
    '"new sigma(["abc", "abc"])" instantiate the default renderer in the div #abc twice.'
  );

  s = new sigma({
    renderers: [
      {
        container: document.getElementById("abc")
      }
    ]
  });
  assert.deepEqual(
    s.renderers[0].options,
    {
      container: dom
    },
    '"new sigma({ renderers: [{ container: document.getElementById("abc") }] })" instantiate the default renderer in the div #abc.'
  );

  // Restore previous state:
  sigma.renderers.def = tmp;
  document.body.removeChild(dom);

  assert.throws(
    function() {
      s = new sigma("abcd");
    },
    /Container not found./,
    "Trying to instantiate sigma with a string that is not the ID of an HTMLElement will throw an error."
  );
});

QUnit.test("Public methods", assert => {
  const s = new sigma();

  const dom = document.createElement("DIV");

  // Let's add a temporary container:
  dom.id = "abc";
  document.body.appendChild(dom);

  assert.deepEqual(
    [Object.keys(s.renderers), Object.keys(s.cameras)],
    [[], []],
    "A sigma instance created without configuration has no camera nor renderer."
  );

  // Adding and killing cameras and renderers:
  const c1 = s.addCamera("0");

  const c2 = s.addCamera("1");

  const r1 = s.addRenderer({ container: dom, camera: c1, id: "0" });

  const r2 = s.addRenderer({ container: dom, camera: c2, id: "1" });

  const r3 = s.addRenderer({ container: dom, camera: c2, id: "2" });
  assert.deepEqual(
    [Object.keys(s.renderers), Object.keys(s.cameras)],
    [["0", "1", "2"], ["0", "1"]],
    "The cameras/renderers indexes are updated when adding cameras/renderers."
  );

  s.killRenderer("2");
  assert.deepEqual(
    Object.keys(s.renderers),
    ["0", "1"],
    "The renderers indexes are updated when killing renderers."
  );

  s.killCamera("1");
  assert.deepEqual(
    [Object.keys(s.renderers), Object.keys(s.cameras)],
    [["0"], ["0"]],
    "The cameras/renderers indexes are updated when killing cameras."
  );

  assert.throws(
    function() {
      s.killCamera("42");
    },
    /The camera is undefined./,
    "Killing a camera that does not exist throws an error."
  );

  assert.throws(
    function() {
      s.killRenderer("42");
    },
    /The renderer is undefined./,
    "Killing a renderer that does not exist throws an error."
  );

  s.killCamera("0");

  // Checking a bit more deeply adding methods:
  var c = s.addCamera("myCamera");

  const r = s.addRenderer({ camera: c, container: dom, id: "myRenderer" });
  assert.deepEqual(
    [Object.keys(s.renderers), Object.keys(s.cameras)],
    [["myRenderer"], ["myCamera"]],
    "The cameras/renderers adders work well with custom IDs."
  );

  assert.throws(
    function() {
      s.addCamera("myCamera");
    },
    /The camera "myCamera" already exists./,
    "Adding a camera with an already existing ID throws an error."
  );

  assert.throws(
    function() {
      s.addRenderer({ camera: c, container: dom, id: "myRenderer" });
    },
    /The renderer "myRenderer" already exists./,
    "Adding a renderer with an already existing ID throws an error."
  );

  // And check also some crazy side cases:
  var c = s.addCamera();

  const id = c.id;

  s.killCamera(id);

  assert.throws(
    function() {
      s.addRenderer({ camera: c, container: dom });
    },
    /The camera is not properly referenced./,
    "Adding a renderer with camera that is not referenced anymore throws an error."
  );

  // Restore previous state:
  document.body.removeChild(dom);
});
