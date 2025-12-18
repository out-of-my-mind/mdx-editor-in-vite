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
import { useRef, useState, useMemo, useCallback } from "react";
import { TextField, IconButton, CircularProgress, ThemeProvider, createTheme, Snackbar, Alert } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DrawerCom from "./com/Drawer";

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

// 创建主题配置
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

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
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as const
  });

  const saveMarkDown = useCallback(async () => {
    if (!title.trim()) {
      setSnackbar({
        open: true,
        message: '请填写标题',
        severity: 'error'
      });
      return;
    }
    
    if (editorRef.current) {
      setIsSaving(true);
      try {
        const content = editorRef.current.getMarkdown();
        console.log("保存数据:", { title, content });
        
        const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, content })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("保存成功:", result);
        setSnackbar({
          open: true,
          message: '保存成功!',
          severity: 'success'
        });
      } catch (error) {
        console.error("保存失败:", error);
        setSnackbar({
          open: true,
          message: '保存失败',
          severity: 'error'
        });
      } finally {
        setIsSaving(false);
      }
    }
  }, [title]);

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
  ], [saveMarkDown, isSaving]);

  return (
    <ThemeProvider theme={theme}>
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
          ref={editorRef}
          markdown={initialMarkdown}
          plugins={plugins}
        />
      </DrawerCom>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;