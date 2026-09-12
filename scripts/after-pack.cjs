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
  console.log("  • [afterPack] Copying full .next/standalone to resources/standalone...");
  const resourcesDir = path.join(context.appOutDir, "resources");
  const standaloneSrc = path.join(context.packager.projectDir, ".next", "standalone");
  const destDir = path.join(resourcesDir, "standalone");

  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  copyRecursiveSync(standaloneSrc, destDir);

  // Remove local .env file if it was copied by Next build so client uses config.env or setup wizard
  const standaloneEnv = path.join(destDir, ".env");
  if (fs.existsSync(standaloneEnv)) {
    try {
      fs.unlinkSync(standaloneEnv);
      console.log("  • [afterPack] Removed development .env from standalone build");
    } catch {}
  }

  console.log("  • [afterPack] Standalone directory successfully copied with all node_modules to resources/standalone");
};
