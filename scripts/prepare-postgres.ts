import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import net from "net";

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
  });
}

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

async function preparePostgres() {
  console.log("================ PREPARING EMBEDDED POSTGRESQL ================");

  const pgInstallDir = "C:\\Program Files\\PostgreSQL\\18";
  if (!fs.existsSync(pgInstallDir)) {
    console.error(`Error: PostgreSQL 18 not found at ${pgInstallDir}`);
    process.exit(1);
  }

  const rootDir = process.cwd();
  const stagingDir = path.join(rootDir, "dist-resources", "postgres");
  const targetBin = path.join(stagingDir, "bin");
  const targetLib = path.join(stagingDir, "lib");
  const targetShare = path.join(stagingDir, "share");
  const templateDataDir = path.join(stagingDir, "template_data");

  // 1. Copy bin, lib, share
  console.log("1. Copying PostgreSQL binaries (bin, lib, share)...");
  if (!fs.existsSync(targetBin)) {
    console.log("   Copying bin...");
    copyRecursiveSync(path.join(pgInstallDir, "bin"), targetBin);
  } else {
    console.log("   bin already exists, skipping copy.");
  }

  if (!fs.existsSync(targetLib)) {
    console.log("   Copying lib...");
    copyRecursiveSync(path.join(pgInstallDir, "lib"), targetLib);
  } else {
    console.log("   lib already exists, skipping copy.");
  }

  if (!fs.existsSync(targetShare)) {
    console.log("   Copying share...");
    copyRecursiveSync(path.join(pgInstallDir, "share"), targetShare);
  } else {
    console.log("   share already exists, skipping copy.");
  }

  // 2. Initialize template database
  console.log("2. Initializing template database cluster...");
  if (fs.existsSync(templateDataDir)) {
    console.log("   Removing existing template_data...");
    fs.rmSync(templateDataDir, { recursive: true, force: true });
  }

  const initdbExe = path.join(targetBin, "initdb.exe");
  const pgctlExe = path.join(targetBin, "pg_ctl.exe");
  const createdbExe = path.join(targetBin, "createdb.exe");
  const pgdumpExe = path.join(targetBin, "pg_dump.exe");
  const psqlExe = path.join(targetBin, "psql.exe");

  execSync(`"${initdbExe}" -D "${templateDataDir}" -U postgres -A trust -E UTF8`, {
    stdio: "inherit",
  });

  // Optimize postgresql.conf for embedded local application
  const confPath = path.join(templateDataDir, "postgresql.conf");
  if (fs.existsSync(confPath)) {
    fs.appendFileSync(
      confPath,
      [
        "",
        "# Embedded settings for FMS MCU Desktop",
        "listen_addresses = '127.0.0.1'",
        "max_connections = 50",
        "shared_buffers = 64MB",
        "synchronous_commit = off",
        "",
      ].join("\n"),
      "utf8"
    );
  }

  // 3. Start temporary cluster and seed ums_dev
  const tempPort = await getFreePort();
  console.log(`3. Starting temporary PostgreSQL cluster on port ${tempPort}...`);
  const logFile = path.join(stagingDir, "init.log");

  execSync(`"${pgctlExe}" -D "${templateDataDir}" -l "${logFile}" -o "-p ${tempPort} -h 127.0.0.1" start`, {
    stdio: "inherit",
  });

  // Wait 1.5s for engine ready
  await new Promise((r) => setTimeout(r, 1500));

  try {
    console.log("4. Creating 'ums_dev' database...");
    execSync(`"${createdbExe}" -h 127.0.0.1 -p ${tempPort} -U postgres ums_dev`, {
      stdio: "inherit",
    });

    console.log("5. Dumping active database into template cluster...");
    // Dump from local dev postgresql (port 5432) with password 1234
    const dumpSqlPath = path.join(stagingDir, "dump.sql");
    execSync(`"${pgdumpExe}" -U postgres -h localhost -p 5432 -d ums_dev -f "${dumpSqlPath}"`, {
      env: { ...process.env, PGPASSWORD: "1234" },
      stdio: "inherit",
    });

    console.log("6. Restoring schema and data into template cluster...");
    execSync(`"${psqlExe}" -h 127.0.0.1 -p ${tempPort} -U postgres -d ums_dev -f "${dumpSqlPath}"`, {
      stdio: "inherit",
    });

    if (fs.existsSync(dumpSqlPath)) {
      fs.unlinkSync(dumpSqlPath);
    }
    console.log("✔ Template database seeded successfully!");
  } finally {
    console.log("7. Stopping temporary PostgreSQL cluster...");
    try {
      execSync(`"${pgctlExe}" -D "${templateDataDir}" -m fast stop`, {
        stdio: "inherit",
      });
    } catch {}

    // Ensure postmaster.pid is removed if left over
    const pidFile = path.join(templateDataDir, "postmaster.pid");
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }
  }

  console.log("================ EMBEDDED POSTGRESQL READY ================");
}

void preparePostgres();
