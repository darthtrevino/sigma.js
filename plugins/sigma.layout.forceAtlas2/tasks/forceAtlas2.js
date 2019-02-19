/*
 * grunt-forceAtlas2
 *
 * This task crush and minify Force Atlas 2 code.
 */
// Shorteners
function minify(string) {
  return string;
  // return uglify.minify(string, {fromString: true}).code;
}

// Crushing function
function crush(fnString) {
  let pattern;

  let i;

  let l;

  const np = [
    "x",
    "y",
    "dx",
    "dy",
    "old_dx",
    "old_dy",
    "mass",
    "convergence",
    "size",
    "fixed"
  ];

  const ep = ["source", "target", "weight"];

  const rp = [
    "node",
    "centerX",
    "centerY",
    "size",
    "nextSibling",
    "firstChild",
    "mass",
    "massCenterX",
    "massCenterY"
  ];

  // Replacing matrix accessors by incremented indexes
  let result = fnString;
  for (i = 0, l = rp.length; i < l; i += 1) {
    pattern = new RegExp(`rp\\(([^,]*), '${rp[i]}'\\)`, "g");
    result = result.replace(pattern, i === 0 ? "$1" : `$1 + ${i}`);
  }

  for (i = 0, l = np.length; i < l; i += 1) {
    pattern = new RegExp(`np\\(([^,]*), '${np[i]}'\\)`, "g");
    result = result.replace(pattern, i === 0 ? "$1" : `$1 + ${i}`);
  }

  for (i = 0, l = ep.length; i < l; i += 1) {
    pattern = new RegExp(`ep\\(([^,]*), '${ep[i]}'\\)`, "g");
    result = result.replace(pattern, i === 0 ? "$1" : `$1 + ${i}`);
  }

  return result;
}

// Cleaning function
function clean(string) {
  return string.replace(
    /function crush\(fnString\)/,
    "var crush = null; function no_crush(fnString)"
  );
}

module.exports = grunt => {
  // Force atlas grunt multitask
  function multitask() {
    // Iterate over all specified file groups.
    this.files.forEach(f => {
      // Concat specified files.
      let src = f.src
        .filter(filepath => {
          // Warn on and remove invalid source files (if nonull was set).
          if (!grunt.file.exists(filepath)) {
            grunt.log.warn(`Source file "${filepath}" not found.`);
            return false;
          }
          return true;
        })
        .map(filepath => grunt.file.read(filepath))
        .join("\n");

      // Crushing, cleaning and minifying
      src = minify(clean(crush(src)));

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln(`File "${f.dest}" created.`);
    });
  }

  // Registering the task
  grunt.registerMultiTask(
    "forceAtlas2",
    "A grunt task to crush and minify ForceAtlas2.",
    multitask
  );
};
