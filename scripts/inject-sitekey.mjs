import { copyFileSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

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

const options = {
	file: {
		type: "string",
		short: "f",
		default: "public/index.html",
	},
	backup: {
		type: "string",
		short: "b",
		default: "tmp/index.html.bak",
	},
	restore: {
		type: "boolean",
		short: "r",
		default: false,
	},
};

const { file: htmlFile, backup: backupFile, restore: restoreMode } = parseArgs({ options }).values;

//console.log({ restoreMode, htmlFile, backupFile });

if (restoreMode) {
	// console.log(`Restore from ${backupFile} to ${htmlFile}`);
	renameSync(backupFile, htmlFile);
} else {
	// backup
	// console.log(`Backing up ${htmlFile} to ${backupFile}`);
	copyFileSync(htmlFile, backupFile);

	// 書き換え
	replaceSiteKey(backupFile, htmlFile, secretKey);
}
