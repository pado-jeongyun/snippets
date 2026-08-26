import { loadAll, preview, type Ctx } from "./lib/store.ts";

export const meta = {
  description:
    "저장한 문구 목록 — 각 문구의 이름·미리보기·꼬리표·id 를 최근 수정순으로 준다. query 를 주면 이름·본문·꼬리표에 그 말이 든 문구만 추린다(대소문자 무시). 본문 전문은 주지 않는다 — 전문이 필요하면 snippet-read 를 쓴다.",
  input: {
    type: "object",
    properties: {
      query: { type: "string", description: "이름·본문·꼬리표에서 찾을 키워드 (선택)" }
    }
  }
};

export default async function (input: { query?: string }, ctx: Ctx) {
  const q = input?.query?.trim().toLowerCase() ?? "";
  let rows = loadAll(ctx);
  if (q) {
    rows = rows.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.body.toLowerCase().includes(q) ||
      (s.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  }
  rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return {
    count: rows.length,
    ...(q ? { query: input.query } : {}),
    snippets: rows.map((s) => ({
      id: s.id,
      name: s.name,
      preview: preview(s.body),
      tags: s.tags ?? [],
    })),
    ...(rows.length ? {} : { 안내: q ? "이 키워드에 맞는 문구가 없다." : "아직 저장한 문구가 없다." }),
  };
}
