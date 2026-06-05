import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function getArg(flag, fallback = undefined) {
	const index = process.argv.indexOf(flag);
	if (index === -1) return fallback;
	return process.argv[index + 1];
}

function parseEnvFile(filePath) {
	const source = readFileSync(filePath, "utf8");
	const result = {};

	for (const rawLine of source.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (line.length === 0 || line.startsWith("#")) continue;
		const separator = line.indexOf("=");
		if (separator <= 0) continue;

		const key = line.slice(0, separator).trim();
		let value = line.slice(separator + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		result[key] = value;
	}

	return result;
}

const envFile = resolve(getArg("--env-file", ".env"));
const htmlFile = resolve(getArg("--file", "public/index.html"));
const envKey = getArg("--env-key", "TURNSTILE_SITE_KEY");
const target = getArg("--target", 'data-sitekey="1x00000000000000000000AA"');

const envMap = parseEnvFile(envFile);
const siteKey = envMap[envKey];

if (!siteKey) {
	throw new Error(`Missing ${envKey} in ${envFile}`);
}

const html = readFileSync(htmlFile, "utf8");
if (!html.includes(target)) {
	throw new Error(`Target string was not found in ${htmlFile}: ${target}`);
}

const replacement = `data-sitekey="${siteKey}"`;
const output = html.replaceAll(target, replacement);
writeFileSync(htmlFile, output, "utf8");

console.log(`Injected ${envKey} from ${envFile} into ${htmlFile}`);
