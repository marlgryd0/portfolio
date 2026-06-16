#!/usr/bin/env node
// Rebuilds the site whenever anything in projects/ changes.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECTS_DIR = path.join(__dirname, "..", "projects");

function build() {
  try {
    execSync("node " + path.join(__dirname, "build.js"), { stdio: "inherit" });
  } catch (e) {
    console.error(e.message);
  }
}

build();
console.log("Watching projects/ for changes... (Ctrl+C to stop)");
fs.watch(PROJECTS_DIR, { recursive: true }, () => build());
