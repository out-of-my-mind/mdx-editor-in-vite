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
import { TextField, IconButton, CircularProgress, AlertProps, Box, Select, MenuItem, Input } from '@mui/material';
import AlertMessage from '../com/AlertMessage';
import SaveIcon from '@mui/icons-material/Save';
import React from "react";

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
  const [titleLevel, setTitleLevel] = React.useState('');

  const handleSelectClick = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log(event);
    const value = event.target.value;
    setTitleLevel(value);
    
    // 根据 titleLevel 设置当前在 MDXEditor 输入内容的标题等级
    if (editorRef.current) {
      // 首先获取当前选中的文本
      const selectedText = editorRef.current.getSelectionMarkdown();
      // 根据选中的文本和 titleLevel 生成带有标题格式的 markdown
      let markdownToInsert = '';
      if (value) {
        // 设置标题等级
        const headingPrefix = '#'.repeat(Number(value)) + ' ';
        markdownToInsert = headingPrefix + selectedText;
      } else {
        // 清除标题格式（移除可能的标题前缀）
        markdownToInsert = selectedText.replace(/^#+\s/, '');
      }
      // 插入带有标题格式的文本
      if (markdownToInsert) {
        editorRef.current.insertMarkdown(markdownToInsert);
      }
      setTitleLevel('')
    }
  };
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
    codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', cmd: 'Shell', 未知: 'language' } }),
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
          <Select
            value={titleLevel}
            onClick={handleSelectClick}
            variant="standard"
            displayEmpty
            input={<Input disableUnderline />}
          >
            <MenuItem value=""><em>常规</em></MenuItem>
            <MenuItem value={1}>标题1</MenuItem>
            <MenuItem value={2}>标题2</MenuItem>
            <MenuItem value={3}>标题3</MenuItem>
            <MenuItem value={4}>标题4</MenuItem>
            <MenuItem value={5}>标题5</MenuItem>
            <MenuItem value={6}>标题6</MenuItem>
          </Select>
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
  ], [saveMarkDown, isSaving, initialMarkdown, handleSelectClick]);

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
