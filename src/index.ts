/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { buildTurnstileErrorResponse, textPlainResponse, type AppEnv } from "./turnstile";

export default {
	async fetch(request, env: AppEnv, _ctx): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method.toUpperCase();

		if (method === "GET" && pathname === "/hello") {
			return textPlainResponse("Hello, World!");
		} else if (method === "POST" && pathname === "/submit") {
			const formData = await request.formData();
			const turnstileErrorResponse = await buildTurnstileErrorResponse(request, env, formData);
			if (turnstileErrorResponse) {
				return turnstileErrorResponse;
			}
			const rawName = formData.get("name");
			const name = typeof rawName === "string" && rawName.length > 0 ? rawName : "nobody";
			return textPlainResponse(`Hello, ${name}!`);
		}

		return textPlainResponse("Not Found", 404);
	},
} satisfies ExportedHandler<AppEnv>;
