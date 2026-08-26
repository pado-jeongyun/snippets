import { loadAll, saveAll, type Ctx, type Snippet } from "./lib/store.ts";

export const meta = {
  description:
    "문구를 지운다. id 로 콕 집거나 name 으로 지운다. name 은 정확히 같은 것만 지운다 — 정확히 맞는 게 없거나 같은 이름이 여럿이면 지우지 않고 후보를 알린다(실수 삭제 방지).",
  input: {
    type: "object",
    properties: {
      id: { type: "string", description: "지울 문구의 id" },
      name: { type: "string", description: "지울 문구의 이름 (정확히 일치해야 지운다)" }
    }
  }
};

export default async function (input: { id?: string; name?: string }, ctx: Ctx) {
  const all = loadAll(ctx);
  const id = input?.id?.trim() ?? "";
  const name = input?.name?.trim() ?? "";
  if (!id && !name) throw new Error("id 나 name 중 하나는 필요하다");

  let target: Snippet | undefined;
  if (id) {
    target = all.find((s) => s.id === id);
    if (!target) throw new Error(`없는 문구: ${id}`);
  } else {
    const lower = name.toLowerCase();
    const matches = all.filter((s) => s.name.toLowerCase() === lower);
    if (matches.length === 0) {
      return { deleted: false, 안내: `"${name}" 에 맞는 문구가 없다.` };
    }
    if (matches.length > 1) {
      return {
        deleted: false,
        count: matches.length,
        candidates: matches.map((s) => ({ id: s.id, name: s.name })),
        안내: "같은 이름이 여럿이다 — id 로 지정해 달라.",
      };
    }
    target = matches[0];
  }

  saveAll(ctx, all.filter((s) => s.id !== target.id));
  return { deleted: true, id: target.id, name: target.name, 안내: `지웠다: "${target.name}"` };
}
