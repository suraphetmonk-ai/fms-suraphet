const fs = require("fs");
const path = require("path");

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const childItem of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, childItem), path.join(dest, childItem));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

exports.default = async function (context) {
  const resourcesDir = path.join(context.appOutDir, "resources");

  // 1. Copy full .next/standalone
  console.log("  • [afterPack] Copying full .next/standalone to resources/standalone...");
  const standaloneSrc = path.join(context.packager.projectDir, ".next", "standalone");
  const destStandalone = path.join(resourcesDir, "standalone");

  if (fs.existsSync(destStandalone)) {
    fs.rmSync(destStandalone, { recursive: true, force: true });
  }
  copyRecursiveSync(standaloneSrc, destStandalone);

  // Remove local .env file if it was copied by Next build so client uses config.env or setup wizard
  const standaloneEnv = path.join(destStandalone, ".env");
  if (fs.existsSync(standaloneEnv)) {
    try {
      fs.unlinkSync(standaloneEnv);
      console.log("  • [afterPack] Removed development .env from standalone build");
    } catch {}
  }
  console.log("  • [afterPack] Standalone directory successfully copied with all node_modules to resources/standalone");

  // 2. Copy embedded PostgreSQL
  const postgresSrc = path.join(context.packager.projectDir, "dist-resources", "postgres");
  const destPostgres = path.join(resourcesDir, "postgres");
  if (fs.existsSync(postgresSrc)) {
    console.log("  • [afterPack] Copying embedded PostgreSQL to resources/postgres...");
    if (fs.existsSync(destPostgres)) {
      fs.rmSync(destPostgres, { recursive: true, force: true });
    }
    copyRecursiveSync(postgresSrc, destPostgres);
    console.log("  • [afterPack] Embedded PostgreSQL copied to resources/postgres successfully");
  } else {
    console.warn("  ⚠ [afterPack] Staged postgres directory not found at: " + postgresSrc);
  }
};
