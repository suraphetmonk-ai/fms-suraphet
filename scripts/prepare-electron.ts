import fs from "fs";
import path from "path";

function copyRecursiveSync(src: string, dest: string) {
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

async function prepare() {
  const rootDir = process.cwd();
  const standaloneDir = path.join(rootDir, ".next", "standalone");
  const staticDir = path.join(rootDir, ".next", "static");
  const publicDir = path.join(rootDir, "public");

  if (!fs.existsSync(standaloneDir)) {
    console.error("Error: .next/standalone folder does not exist. Did you run 'next build' with output: 'standalone'?");
    process.exit(1);
  }

  console.log("Copying static assets to .next/standalone...");

  // 1. Copy .next/static to .next/standalone/.next/static
  const destStaticDir = path.join(standaloneDir, ".next", "static");
  if (fs.existsSync(staticDir)) {
    copyRecursiveSync(staticDir, destStaticDir);
    console.log("✔ Copied .next/static -> .next/standalone/.next/static");
  }

  // 2. Copy public to .next/standalone/public
  const destPublicDir = path.join(standaloneDir, "public");
  if (fs.existsSync(publicDir)) {
    copyRecursiveSync(publicDir, destPublicDir);
    console.log("✔ Copied public -> .next/standalone/public");
  }

  console.log("Standalone preparation completed successfully.");
}

void prepare();
