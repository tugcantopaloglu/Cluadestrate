#!/usr/bin/env node

/**
 * Cross-platform build script for Cluadestrate Agent
 * Builds executables for Windows, Linux (x64, ARM64), and macOS
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const targets = [
  { name: "Windows x64", target: "node18-win-x64", output: "cluadestrate-agent-win-x64.exe" },
  { name: "Linux x64", target: "node18-linux-x64", output: "cluadestrate-agent-linux-x64" },
  { name: "Linux ARM64", target: "node18-linux-arm64", output: "cluadestrate-agent-linux-arm64" },
  { name: "macOS x64", target: "node18-macos-x64", output: "cluadestrate-agent-macos-x64" },
  { name: "macOS ARM64", target: "node18-macos-arm64", output: "cluadestrate-agent-macos-arm64" },
];

const distDir = path.join(__dirname, "..", "dist");
const binDir = path.join(distDir, "bin");

async function build() {
  console.log("=".repeat(60));
  console.log("  Cluadestrate Agent Build Script");
  console.log("=".repeat(60));
  console.log("");

  // Ensure directories exist
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  // First, compile TypeScript
  console.log("Compiling TypeScript...");
  try {
    execSync("npm run build", { cwd: path.join(__dirname, ".."), stdio: "inherit" });
    console.log("TypeScript compilation complete.\n");
  } catch (error) {
    console.error("TypeScript compilation failed!");
    process.exit(1);
  }

  // Build for each target
  for (const { name, target, output } of targets) {
    console.log(`Building for ${name}...`);
    const outputPath = path.join(binDir, output);

    try {
      execSync(`npx pkg . --target ${target} --output "${outputPath}"`, {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
      });

      // Get file size
      const stats = fs.statSync(outputPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`  -> ${output} (${sizeMB} MB)\n`);
    } catch (error) {
      console.error(`  Failed to build for ${name}: ${error.message}\n`);
    }
  }

  // Copy config example
  const configSrc = path.join(__dirname, "..", "config.example.yaml");
  const configDst = path.join(binDir, "config.example.yaml");
  fs.copyFileSync(configSrc, configDst);

  console.log("=".repeat(60));
  console.log("  Build Complete!");
  console.log("=".repeat(60));
  console.log(`\nBuilt files are in: ${binDir}`);
  console.log("\nAvailable binaries:");

  const files = fs.readdirSync(binDir);
  for (const file of files) {
    const filePath = path.join(binDir, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  - ${file} (${sizeMB} MB)`);
  }
}

build().catch(console.error);
