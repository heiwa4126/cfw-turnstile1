const ALWAYS_FAIL_SECRET_KEY = "2x0000000000000000000000000000000AA";
// see https://developers.cloudflare.com/turnstile/troubleshooting/testing/#testing-scenarios

type TurnstileVerifyResult = {
	success: boolean;
	["error-codes"]?: string[];
};

export type AppEnv = Env & {
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

export async function buildTurnstileErrorResponse(
	request: Request,
	env: AppEnv,
	formData: FormData,
): Promise<Response | undefined> {
	const token = formData.get("cf-turnstile-response");
	if (typeof token !== "string" || token.length === 0) {
		return textPlainResponse("Turnstile token is missing.", 400);
	}

	const secret = env.TURNSTILE_SECRET_KEY ?? ALWAYS_FAIL_SECRET_KEY;

	const remoteip =
		request.headers.get("CF-Connecting-IP") ?? request.headers.get("X-Forwarded-For") ?? undefined;
	const verifyResult = await validateTurnstile(secret, token, remoteip);

	if (!verifyResult.success) {
		const errorCodes = verifyResult["error-codes"]?.join(",") ?? "unknown-error";
		return textPlainResponse(`Turnstile verification failed: ${errorCodes}`, 403);
	}

	return undefined;
}

// プレーンテキストのレスポンスを生成
export function textPlainResponse(value: string | number, status = 200): Response {
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
