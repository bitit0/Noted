import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from 'lexical';
import { useEffect, useState } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { $patchStyleText } from '@lexical/selection';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));
          setIsUnderline(selection.hasFormat('underline'));
        }
      });
    });
  }, [editor]);

  return (
    <div className="editor-toolbar">
      <button
        className={isBold ? 'active' : ''}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <Bold size={14} />
      </button>
      <button
        className={isItalic ? 'active' : ''}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <Italic size={14}/>
      </button>
      <button
        className={isUnderline ? 'active' : ''}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
      >
        <Underline size={14}/>
      </button>
      <select
        className="font-size-select"
        onChange={(e) => {
          const size = e.target.value;
          editor.update(() => {
            console.log("size", size);
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $patchStyleText(selection, {
                'font-size': size,
              });
            }
          });
        }}
        defaultValue="16px"
      >
        <option value="12px">12</option>
        <option value="14px">14</option>
        <option value="16px">16</option>
        <option value="18px">18</option>
        <option value="24px">24</option>
        <option value="32px">32</option>
      </select>
    </div>
  );
}