import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { TextNode } from 'lexical';

export default function AutoStylePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerMutationListener(TextNode, (mutations) => {
      editor.getEditorState().read(() => {
        const rootElement = editor.getRootElement();
        if (!rootElement) return;

        const spans = rootElement.querySelectorAll('span[style]');
        spans.forEach((el) => {
          el.style.fontSize = el.style.fontSize;
          el.style.fontFamily = el.style.fontFamily;
        });
      });
    });
  }, [editor]);

  return null;
}
