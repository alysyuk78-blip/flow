import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import clsx from "clsx";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Code,
} from "lucide-react";

/**
 * Notion-подібний редактор нотаток. Зберігає HTML через onChange.
 * key ремонтуємо ззовні, щоб контент оновлювався при зміні задачі/проєкту.
 */
export function RichEditor({
  value,
  onChange,
  placeholder = "Пишіть нотатки…",
  toolbar = true,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  toolbar?: boolean;
}) {
  const [isEmpty, setIsEmpty] = useState(
    () => !value || value === "<p></p>"
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose-sm max-w-none text-sm text-gray-800 dark:text-gray-100 leading-relaxed",
      },
    },
    onCreate: ({ editor }) => setIsEmpty(editor.isEmpty),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setIsEmpty(editor.isEmpty);
    },
  });

  if (!editor) return null;

  const Btn = ({
    active,
    onClick,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700",
        active && "bg-brand-100 text-brand-600 dark:bg-brand-500/20"
      )}
    >
      {children}
    </button>
  );

  return (
    <div>
      {toolbar && (
        <div className="mb-2 flex flex-wrap items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
          <Btn
            active={editor.isActive("heading", { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 className="h-4 w-4" />
          </Btn>
          <Btn
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" />
          </Btn>
          <Btn
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Btn>
          <Btn
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Btn>
          <Btn
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Btn>
          <Btn
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Btn>
          <Btn
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </Btn>
          <Btn
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="h-4 w-4" />
          </Btn>
        </div>
      )}
      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute left-0 top-0 text-sm text-gray-400">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
