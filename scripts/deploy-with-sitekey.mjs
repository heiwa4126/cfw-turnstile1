import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

function run(command, args) {
	const result = spawnSync(command, args, { stdio: "inherit" });

	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		throw new Error(`${command} ${args.join(" ")} exited with code ${result.status}`);
	}
}

const rootDir = resolve(".");
const injectScript = resolve(rootDir, "scripts/inject-sitekey.mjs");
const htmlFile = resolve(rootDir, "public/index.html");
const backupDir = resolve(rootDir, "tmp");
const backupFile = resolve(backupDir, "index.html.deploy-backup");

mkdirSync(backupDir, { recursive: true });
copyFileSync(htmlFile, backupFile);

try {
	run(process.execPath, [
		injectScript,
		"--env-file",
		".env.production",
		"--file",
		"public/index.html",
	]);

	run("pnpm", ["exec", "wrangler", "deploy", "--secrets-file", ".env.production"]);
} finally {
	// Keep repository state clean even when deploy fails.
	copyFileSync(backupFile, htmlFile);
	rmSync(backupFile, { force: true });
}
