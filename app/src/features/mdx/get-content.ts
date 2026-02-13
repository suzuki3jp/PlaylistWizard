import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export function getContent(slug: string) {
  const filePath = path.join(process.cwd(), "src", "content", `${slug}.mdx`);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(fileContent);
  return { frontmatter, content };
}
