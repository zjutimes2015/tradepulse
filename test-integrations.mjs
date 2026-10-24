// TP 外部依赖连通性测试（token 从 .env 读，不打印）
const U_T = process.env.UNIPILE_ACCESS_TOKEN || "";
const U_B = (process.env.UNIPILE_BASE_URL || "").replace(/\/$/, "");
const A_K = process.env.AI_API_KEY || "";
const A_B = (process.env.AI_BASE_URL || "").replace(/\/$/, "");
const MODEL = process.env.AI_MODEL || "(未设置)";

async function main() {
  console.log("配置检查: UNIPILE_BASE_URL=" + (U_B || "空") + " | AI_BASE_URL=" + (A_B || "空") + " | AI_MODEL=" + MODEL);

  // 1) Unipile 账户列表（验证 token + 看有没有已连的 LinkedIn）
  try {
    const r = await fetch(U_B + "/api/v1/accounts", {
      headers: { Authorization: "Bearer " + U_T },
    });
    const t = await r.text();
    console.log("\n[UNIPILE] /api/v1/accounts -> HTTP " + r.status);
    console.log("  " + t.slice(0, 600));
  } catch (e) {
    console.log("\n[UNIPILE] ERR: " + e.message);
  }

  // 2) AI 端点连通（OpenRouter/DeepSeek 兼容）
  try {
    const r = await fetch(A_B + "/models", {
      headers: { Authorization: "Bearer " + A_K },
    });
    console.log("\n[AI] " + A_B + "/models -> HTTP " + r.status);
  } catch (e) {
    console.log("\n[AI] ERR: " + e.message);
  }

  // 3) 真实调用一次 LLM，验证 key 有余额且有权限
  try {
    const r = await fetch(A_B + "/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + A_K, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: "reply with the single word OK" }],
        max_tokens: 5,
      }),
    });
    const t = await r.text();
    console.log("\n[AI] chat/completions -> HTTP " + r.status + " | " + t.slice(0, 300));
  } catch (e) {
    console.log("\n[AI] chat ERR: " + e.message);
  }
}
main();
