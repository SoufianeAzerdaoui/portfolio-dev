/* eslint-disable @typescript-eslint/no-require-imports */

const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const frontendRoot = path.resolve(__dirname, "../../../..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request === "server-only") {
    return path.join(__dirname, "server-only.stub.cjs");
  }

  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(frontendRoot, "src", request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = require("node:fs").readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      strict: true,
    },
    fileName: filename,
  });

  module._compile(output.outputText, filename);
};
