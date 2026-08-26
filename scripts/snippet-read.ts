import { loadAll, type Ctx } from "./lib/store.ts";

export const meta = {
  description:
    "문구 본문 전문을 꺼낸다. id 로 콕 집거나 name 으로 찾는다. name 은 정확히 같은 것을 먼저 찾고, 없으면 이름·꼬리표에 그 말이 든 문구를 후보로 준다. 하나로 좁혀지면 body 전문을 그대로 준다 — 사용자가 복사해 붙여넣게 손대지 않는다.",
  input: {
    type: "object",
    properties: {
      id: { type: "string", description: "꺼낼 문구의 id" },
      name: { type: "string", description: "꺼낼 문구의 이름 (정확하지 않아도 된다)" }
    }
  }
};

export default async function (input: { id?: string; name?: string }, ctx: Ctx) {
  const all = loadAll(ctx);
  const id = input?.id?.trim() ?? "";
  const name = input?.name?.trim() ?? "";
  if (!id && !name) throw new Error("id 나 name 중 하나는 필요하다");

  if (id) {
    const hit = all.find((s) => s.id === id);
    if (!hit) throw new Error(`없는 문구: ${id}`);
    return { found: true, snippet: hit, body: hit.body };
  }

  const lower = name.toLowerCase();
  const exact = all.find((s) => s.name.toLowerCase() === lower);
  if (exact) return { found: true, snippet: exact, body: exact.body };

  const candidates = all.filter((s) =>
    s.name.toLowerCase().includes(lower) ||
    (s.tags ?? []).some((t) => t.toLowerCase().includes(lower)),
  );
  if (candidates.length === 1) {
    return { found: true, snippet: candidates[0], body: candidates[0].body };
  }
  return {
    found: false,
    count: candidates.length,
    candidates: candidates.map((s) => ({ id: s.id, name: s.name })),
    안내: candidates.length
      ? "여러 개가 맞는다 — 어느 것인지 골라 달라."
      : `"${name}" 에 맞는 문구가 없다.`,
  };
}
