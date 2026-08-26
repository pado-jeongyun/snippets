// 데이터의 거처. store 폴더(~/Relay/snippets) 아래 사람이 읽을 수 있는 파일로 읽고 쓴다.
// snippets.jsonl 한 줄에 문구 하나 — 사용자가 폴더를 직접 열어 보고 고칠 수 있다.
import fs from "node:fs";
import path from "node:path";

export interface Ctx {
  dir(name: string): string;
}

export interface Snippet {
  id: string;
  name: string;        // 꺼낼 때 쓰는 이름/키
  body: string;        // 문구 본문
  tags?: string[];     // 분류용 꼬리표(선택)
  created_at: string;
  updated_at: string;
}

function file(ctx: Ctx): string {
  const d = ctx.dir("store");
  fs.mkdirSync(d, { recursive: true });
  return path.join(d, "snippets.jsonl");
}

export function loadAll(ctx: Ctx): Snippet[] {
  const f = file(ctx);
  if (!fs.existsSync(f)) return [];
  const out: Snippet[] = [];
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      // 손상된 줄은 건너뛰되 지우지 않는다 — 사람이 파일을 열어 고칠 수 있게
    }
  }
  return out;
}

export function saveAll(ctx: Ctx, snippets: Snippet[]): void {
  const body = snippets.map((s) => JSON.stringify(s)).join("\n");
  fs.writeFileSync(file(ctx), body ? body + "\n" : "");
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function preview(body: string, n = 80): string {
  const oneLine = body.replace(/\s+/g, " ").trim();
  return oneLine.length > n ? oneLine.slice(0, n) + "…" : oneLine;
}

export function normalizeTags(input: unknown): string[] {
  if (input == null) return [];
  const arr = Array.isArray(input) ? input : String(input).split(",");
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of arr) {
    const v = String(t).trim();
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}
