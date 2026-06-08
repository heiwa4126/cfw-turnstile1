import { copyFileSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function getArg(flag, fallback = undefined) {
	const index = process.argv.indexOf(flag);
	if (index === -1) return fallback;
	return process.argv[index + 1];
}

function replaceSiteKey(srcfile, dstfile, siteKey) {
	const target = `data-sitekey="1x00000000000000000000AA"`;

	const text = readFileSync(srcfile, "utf8");

	if (!text.includes(target)) {
		throw new Error(`Target string was not found in ${srcfile}: ${target}`);
	}
	const replacement = `data-sitekey="${siteKey}"`;
	const output = text.replaceAll(target, replacement);
	writeFileSync(dstfile, output, "utf8");
}

const secretKey = process.env.TURNSTILE_SECRET_KEY;
if (!secretKey) {
	throw new Error("TURNSTILE_SECRET_KEY is not set");
}

const htmlFile = resolve(getArg("--file", "public/index.html"));
const backupFile = resolve(getArg("--backup", "tmp/index.html.bak"));
const restoreMode = getArg("--restore");

if (!restoreMode) {
	console.log(`Restore from ${backupFile} to ${htmlFile}`);
	renameSync(backupFile, htmlFile);
} else {
	// backup
	console.log(`Backing up ${htmlFile} to ${backupFile}`);
	copyFileSync(htmlFile, backupFile);

	// 書き換え
	replaceSiteKey(backupFile, htmlFile, secretKey);
}
