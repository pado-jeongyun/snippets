import { loadAll, saveAll, genId, normalizeTags, type Ctx, type Snippet } from "./lib/store.ts";

export const meta = {
  description:
    "문구를 저장하거나(id 없이) 고친다(id 지정). name 은 나중에 꺼낼 때 쓰는 이름/키이고 body 는 문구 본문이다. 새로 저장할 때 name·body 는 필수다. id 없이 저장해도 같은 name 이 이미 있으면 그 문구를 덮어쓴다(이름이 곧 키). tags 로 분류 꼬리표를 달 수 있다(배열이나 쉼표 구분 문자열). 고칠 때 넘기지 않은 값은 그대로 둔다.",
  input: {
    type: "object",
    properties: {
      id: { type: "string", description: "고칠 문구의 id — 없으면 이름으로 찾거나 새로 만든다" },
      name: { type: "string", description: "꺼낼 때 쓰는 이름/키 (예: 배송 안내, 환불 서식)" },
      body: { type: "string", description: "문구 본문 — 여러 줄도 된다" },
      tags: { description: "분류 꼬리표. 배열이나 쉼표로 구분한 문자열" }
    }
  }
};

export default async function (
  input: { id?: string; name?: string; body?: string; tags?: unknown },
  ctx: Ctx,
) {
  const snippets = loadAll(ctx);
  const id = input?.id ? String(input.id).trim() : "";

  let existing: Snippet | undefined;
  if (id) {
    existing = snippets.find((s) => s.id === id);
    if (!existing) throw new Error(`없는 문구: ${id}`);
  }

  const name = input?.name !== undefined ? String(input.name).trim() : existing?.name;
  if (!name) throw new Error("name 이 필요하다 (꺼낼 때 쓰는 이름)");

  // id 로 지목하지 않았으면 같은 이름을 덮어쓴다 — 이름이 곧 키다
  const overwrite = !existing
    ? snippets.find((s) => s.name.toLowerCase() === name.toLowerCase())
    : undefined;
  const base = existing ?? overwrite;

  const body = input?.body !== undefined ? String(input.body) : base?.body;
  if (body === undefined || body.trim() === "") throw new Error("body 가 필요하다 (문구 본문)");

  let tags = base?.tags ?? [];
  if (input && Object.prototype.hasOwnProperty.call(input, "tags")) {
    tags = normalizeTags(input.tags);
  }

  const now = new Date().toISOString();
  const record: Snippet = {
    id: base?.id ?? genId(),
    name,
    body,
    ...(tags.length ? { tags } : {}),
    created_at: base?.created_at ?? now,
    updated_at: now,
  };

  const next = base
    ? snippets.map((s) => (s.id === record.id ? record : s))
    : [...snippets, record];
  saveAll(ctx, next);

  return {
    id: record.id,
    created: !base,
    overwritten: !!overwrite,
    name: record.name,
    tags: record.tags ?? [],
    안내: `${base ? (overwrite ? "같은 이름을 덮어써 저장함" : "고침") : "저장함"}: "${record.name}"`,
  };
}
