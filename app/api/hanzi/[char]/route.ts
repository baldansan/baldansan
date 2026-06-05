import { readFile } from "node:fs/promises";
import path from "node:path";

const HANZI_RE = /^[\u4e00-\u9fff]$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ char: string }> }
) {
  const { char } = await context.params;
  const decoded = decodeURIComponent(char);

  if (!HANZI_RE.test(decoded)) {
    return Response.json({ error: "invalid character" }, { status: 400 });
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "node_modules",
      "hanzi-writer-data",
      `${decoded}.json`
    );
    const raw = await readFile(filePath, "utf8");
    return Response.json(JSON.parse(raw));
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
}
