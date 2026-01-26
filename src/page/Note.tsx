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
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { TextField, IconButton, CircularProgress, AlertProps, Box } from '@mui/material';
import AlertMessage from '../com/AlertMessage';
import SaveIcon from '@mui/icons-material/Save';

interface NoteProps {
  nodeId?: string;
}

export default function Note({ nodeId }: NoteProps) {
  const [initialMarkdown, setInitialMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 当 nodeId 变化时，查询接口获取数据
  useEffect(() => {
    if (nodeId) {
      const fetchNoteData = async () => {
        setIsLoading(true);
        try {
          // 检查API地址是否配置
          if (!import.meta.env.VITE_NOTE_ENV_API) {
            throw new Error('API地址未配置');
          }
          const response = await fetch(`http://${import.meta.env.VITE_NOTE_ENV_API}/notes/getInfo?id=${nodeId}`);
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP错误! 状态码: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('获取节点数据成功:', result);
          
          if (result?.code === 200 && result?.data?.content) {
            setInitialMarkdown(result.data.content);
            // 如果有标题，也设置标题
            if (result.data.title) {
              setTitle(result.data.title);
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '获取数据失败，请检查网络连接';
          console.error('获取节点数据失败:', error);
          setSnackbar({
            open: true,
            message: `获取数据失败: ${errorMessage}`,
            severity: 'error'
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchNoteData();
    }
  }, [nodeId]);

  const editorRef = useRef<MDXEditorMethods>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as AlertProps['severity']
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
        // 检查API地址是否配置
        if (!import.meta.env.VITE_NOTE_ENV_API) {
          throw new Error('API地址未配置');
        }
        const apiUrl = nodeId ? `http://${import.meta.env.VITE_NOTE_ENV_API}/notes/edit` : `http://${import.meta.env.VITE_NOTE_ENV_API}/notes/add`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, content, id: nodeId })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP错误! 状态码: ${response.status}`);
        }

        const result = await response.json();
        console.log("保存成功:", result);
        setSnackbar({
          open: true,
          message: '保存成功!',
          severity: 'success'
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '保存失败，请检查网络连接';
        console.error("保存失败:", error);
        setSnackbar({
          open: true,
          message: `保存失败: ${errorMessage}`,
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
          <IconButton 
            color="primary" 
            aria-label="保存"
            onClick={saveMarkDown}
            disabled={isSaving}
            size="small"
            style={{ margin: '0 4px' }}
          >
            {isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          </IconButton>
        </DiffSourceToggleWrapper>
      )
    })
  ], [saveMarkDown, isSaving, initialMarkdown]);

  return (
   <>
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
        </>
      )}
      {snackbar.open && (
        <AlertMessage
          message={snackbar.message}
          severity={snackbar.severity}
        />
      )}
    </>
  )
}
