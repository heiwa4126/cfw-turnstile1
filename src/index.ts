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

const SECRET_KEY = "2x0000000000000000000000000000000AA";
// ↑ テスト用のシークレットキー。必ず失敗する
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/#testing-scenarios

type TurnstileVerifyResult = {
	success: boolean;
	["error-codes"]?: string[];
};

type AppEnv = Env & {
	TURNSTILE_SECRET_KEY?: string;
};

async function validateTurnstile(
	secret: string,
	token: string,
	remoteip?: string,
): Promise<TurnstileVerifyResult> {
	try {
		const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				secret,
				response: token,
				remoteip,
			}),
		});

		const result = (await response.json()) as TurnstileVerifyResult;
		return result;
	} catch (error) {
		console.error("Turnstile validation error:", error);
		return { success: false, "error-codes": ["internal-error"] };
	}
}






export default {
	async fetch(request, env: AppEnv, _ctx): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;
		const method = request.method.toUpperCase();

		if (method === "GET" && pathname === "/hello") {
			return textPlainResponse("Hello, World!");
		} else if (method === "POST" && pathname === "/submit") {
			const formData = await request.formData();
			const token = formData.get("cf-turnstile-response");
			if (typeof token !== "string" || token.length === 0) {
				return textPlainResponse("Turnstile token is missing.", 400);
			}

			const secret = env.TURNSTILE_SECRET_KEY ?? SECRET_KEY;
			const remoteip =
				request.headers.get("CF-Connecting-IP") ??
				request.headers.get("X-Forwarded-For") ??
				undefined;
			const verifyResult = await validateTurnstile(secret, token, remoteip);

			if (!verifyResult.success) {
				const errorCodes = verifyResult["error-codes"]?.join(",") ?? "unknown-error";
				return textPlainResponse(`Turnstile verification failed: ${errorCodes}`, 403);
			}

			const rawName = formData.get("name");
			const name = typeof rawName === "string" && rawName.length > 0 ? rawName : "nobody";

			return textPlainResponse(`Hello, ${name}!`);
		}

		return textPlainResponse("Not Found", 404);
	},
} satisfies ExportedHandler<AppEnv>;

// ヘルパー: テキストプレーンのレスポンスを生成
function textPlainResponse(value: string | number, status = 200): Response {
	const body = String(value);
	const contentLength = new TextEncoder().encode(body).length.toString();

	return new Response(body, {
		status,
		headers: {
			"content-type": "text/plain; charset=utf-8",
			"content-length": contentLength,
		},
	});
}
