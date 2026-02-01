import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';

interface ExtractionResult {
    maskedText: string;
    placeholders: Map<string, any>;
}

export async function extractContent(markdown: string): Promise<ExtractionResult> {
    const placeholders = new Map<string, any>();
    let counter = 0;

    const processor = unified()
        .use(remarkParse)
        .use(() => (tree: any) => {
            visit(tree, ['code', 'inlineCode'], (node: any) => {
                const id = `__PROTECTED_${counter++}__`;
                placeholders.set(id, { type: node.type, value: node.value });
                
                // Replace content with placeholder
                // This preserves the Markdown syntax (e.g. backticks) but changes the inner content
                node.value = id;
            });
        })
        .use(remarkStringify, {
            bullet: '-',
            fences: true
        });

    const file = await processor.process(markdown);
    return {
        maskedText: String(file),
        placeholders
    };
}

export function restoreContent(translatedText: string, placeholders: Map<string, any>): string {
    let result = translatedText;
    
    for (const [id, originalNode] of placeholders) {
        // Robust regex to capture the placeholder even if LLM messes with spacing
        const regex = new RegExp(id, 'g');
        result = result.replace(regex, originalNode.value);
    }
    
    return result;
}
