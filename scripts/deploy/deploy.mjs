// Guarded deploy of Firestore rules, indexes and Storage rules.
//
//   node scripts/deploy/deploy.mjs <dev|staging|prod> [--yes] [--dry-run]
//
// Safety: refuses placeholder project IDs, runs the rules tests first, and requires
// --yes for staging/prod. It deploys ONLY rules + indexes + storage rules (never data).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const [env, ...flags] = process.argv.slice(2);
const dryRun = flags.includes("--dry-run");
const yes = flags.includes("--yes");

const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

if (!["dev", "staging", "prod"].includes(env ?? "")) fail("Usage: deploy.mjs <dev|staging|prod> [--yes] [--dry-run]");

const rc = JSON.parse(readFileSync(join(root, ".firebaserc"), "utf8"));
const projectId = rc.projects?.[env];
if (!projectId || projectId.startsWith("REPLACE_WITH_")) {
  fail(`.firebaserc alias "${env}" is not set. Put the real Firebase project ID there first.`);
}
if (env !== "dev" && !yes) fail(`Deploying to ${env} (${projectId}) needs --yes.`);

const isWin = process.platform === "win32";
const run = (cmd, args, cwd) => {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: isWin });
  if (r.status !== 0) fail(`${cmd} failed (exit ${r.status}).`);
};

// 1. Rules tests must pass (uses the emulator, never touches a real project).
const testsDir = join(root, "firebase", "tests");
if (!existsSync(join(testsDir, "node_modules"))) run("npm", ["install"], testsDir);
run("npm", ["test"], testsDir);

// 2. Deploy rules + indexes (no data is written).
const localFirebase = join(testsDir, "node_modules", ".bin", "firebase");
const args = ["deploy", "--only", "firestore:rules,firestore:indexes,storage", "--project", projectId];
if (dryRun) {
  console.log(`\nDry run: would deploy to ${env} (${projectId}) with: firebase ${args.join(" ")}`);
  process.exit(0);
}
run(localFirebase, args, root);
console.log(`\n✔ Deployed rules and indexes to ${env} (${projectId}). Indexes may still be building; check the console.`);
