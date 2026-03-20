import { MDXRemote } from "next-mdx-remote/rsc";

interface MDXContentProps {
  content: string;
}

export async function MDXContent({ content }: MDXContentProps) {
  return (
    <article className="prose prose-invert prose-playlistwizard max-w-none">
      <MDXRemote source={content} />
    </article>
  );
}
