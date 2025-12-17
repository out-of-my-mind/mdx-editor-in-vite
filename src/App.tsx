import "@mdxeditor/editor/style.css";
import {
  MDXEditor,
  headingsPlugin,
  quotePlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  toolbarPlugin,
  linkDialogPlugin,
  CreateLink,
  CodeToggle,
  directivesPlugin,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  AdmonitionDirectiveDescriptor,
  InsertAdmonition,
  codeBlockPlugin,
  codeMirrorPlugin,
  ConditionalContents,
  InsertCodeBlock,
  ChangeCodeMirrorLanguage,
  imagePlugin,
  InsertImage,
  tablePlugin,
  InsertTable,
  listsPlugin,
  ListsToggle,
  thematicBreakPlugin,
  InsertThematicBreak,
  MDXEditorMethods
} from "@mdxeditor/editor";
import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { TextField, IconButton, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DrawerCom from "./com/drawer";

// 自定义保存按钮组件
const SaveBtn = ({onSave, isSaving}: {onSave: ()=>void, isSaving: boolean}) => (
  <IconButton 
    color="primary" 
    aria-label="保存" 
    onClick={onSave}
    disabled={isSaving}
    size="small"
    style={{ margin: '0 4px' }}
  >
    {isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
  </IconButton>
);

function App() {
  const initialMarkdown = useMemo(() => `
    * Item 1
    * Item 2
    * Item 3
      * nested item

    1. Item 1
    2. Item 2
  `, []);

  const editorRef = useRef<MDXEditorMethods>(null);
  const [title, setTitle] = useState('');
  const [isEditorMounted, setIsEditorMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 使用 useRef 来获取最新的 title 值
  const titleRef = useRef(title);
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    // 确保编辑器在组件挂载后才初始化
    setIsEditorMounted(true);
  }, []);

  // 使用 useRef 方案，避免 title 变化时重新创建函数
  const saveMarkDown = useCallback(async () => {
    if (!titleRef.current.trim()) {
      alert("请填写标题");
      return;
    }
    
    if (editorRef.current) {
      setIsSaving(true);
      try {
        const content = editorRef.current.getMarkdown();
        console.log("保存数据:", { title: titleRef.current, content });
        
        const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: titleRef.current, content })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("保存成功:", result);
        alert("保存成功!");
      } catch (error) {
        console.error("保存失败:", error);
        alert("保存失败");
      } finally {
        setIsSaving(false);
      }
    }
  }, []); // 空依赖数组，函数只创建一次

  const plugins = useMemo(() => [
    headingsPlugin(),
    quotePlugin(),
    thematicBreakPlugin(),
    listsPlugin(),
    tablePlugin(),
    imagePlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
    codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS' } }),
    directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
    diffSourcePlugin({
      diffMarkdown: initialMarkdown,
      viewMode: 'rich-text'
    }),
    linkDialogPlugin(),
    toolbarPlugin({
      toolbarContents: () => (
        <DiffSourceToggleWrapper>
          <UndoRedo />
          <BoldItalicUnderlineToggles />
          <CodeToggle />
          <CreateLink />
          <InsertAdmonition />
          <InsertImage />
          <InsertTable />
          <ListsToggle />
          <InsertThematicBreak />
          <ConditionalContents
            options={[
              { 
                when: (editor) => editor?.editorType === 'codeblock', 
                contents: () => <ChangeCodeMirrorLanguage /> 
              },
              {
                fallback: () => <InsertCodeBlock />
              }
            ]}
          />
          <SaveBtn onSave={ saveMarkDown } isSaving={ isSaving } />
        </DiffSourceToggleWrapper>
      ),
    }),
  ], []);

  if (!isEditorMounted) {
    return <div>加载编辑器...</div>;
  }

  return (
    <>
      <DrawerCom>
        <TextField
          fullWidth
          required
          error={!title.trim()}
          helperText={!title.trim() ? "此字段为必填项" : ""}
          label="标题"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          style={{ marginBottom: '20px' }}
        />
        
        <MDXEditor
          key="mdx-editor"
          ref={editorRef}
          markdown={initialMarkdown}
          plugins={plugins}
        />
      </DrawerCom>
      {/* <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
      </div> */}
    </>
  );
}

export default App;