import fs from 'fs';
import { compile } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

const fileContent = fs.readFileSync('src/content/editorials/follow-the-quran-or-follow-rashad/index.mdx', 'utf8');

try {
    const result = await compile(fileContent, {
        remarkPlugins: [remarkFrontmatter, remarkGfm],
        rehypePlugins: [rehypeSlug],
    });
    console.log("MDX compiled successfully!");
} catch (e) {
    console.error("MDX Compile Error:", e);
}
