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
import { TextField, IconButton, CircularProgress, AlertProps, Box, Select, MenuItem, Input, Chip, Tooltip } from '@mui/material';
import AlertMessage from '../com/AlertMessage';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import React from "react";
import axiosInstance from '../api/axiosInstance';

interface NoteProps {
  nodeId?: string;
}

// 最大标签数量限制
const MAX_TAGS = 5;

export default function Note({ nodeId }: NoteProps) {
  const [initialMarkdown, setInitialMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // 当 nodeId 变化时，查询接口获取数据
  useEffect(() => {
    if (nodeId) {
      const fetchNoteData = async () => {
        setIsLoading(true);
        try {
          const result = await axiosInstance.get(`/notes/getInfo?id=${nodeId}`);
          
          if (result?.code === 200 && result?.data?.content) {
            setInitialMarkdown(result.data.content);
            // 如果有标题，也设置标题
            if (result.data.title) {
              setTitle(result.data.title);
            }
            // 如果有标签，设置标签（最多显示5个）
            if (result.data.tags) {
              setTags(result.data.tags.split(',').slice(0, MAX_TAGS));
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
    } else {
      setIsLoading(false);
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

  // 添加标签（限制最多5个）
  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < MAX_TAGS && trimmedTag.indexOf(',') === -1) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    } else if (tags.length >= MAX_TAGS) {
      setSnackbar({
        open: true,
        message: `最多只能添加${MAX_TAGS}个标签，且标签不能包含逗号`,
        severity: 'warning'
      });
    } else if (trimmedTag.indexOf(',') !== -1) {
      setSnackbar({
        open: true,
        message: `标签不能包含逗号`,
        severity: 'warning'
      });
    }
  };

  // 删除标签
  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  // 键盘事件处理标签添加
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

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
        console.log("保存数据:", { title, content, tags });
        const apiUrl = nodeId ? '/notes/edit' : '/notes/add';
        const result = await axiosInstance.post(apiUrl, { title, content, id: nodeId, tags });

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
  }, [title, tags]);

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
          {/* 标题和标签区域 - 同一行显示 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
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
            />
            
            {/* 标签区域 - 一行显示 */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              minWidth: '300px',
              maxWidth: '400px'
            }}>
              {/* 已添加的标签 */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleDeleteTag(tag)}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
              
              {/* 添加新标签 */}
              {tags.length < MAX_TAGS && (
                <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="标签"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    sx={{ width: '80px' }}
                  />
                  <Tooltip title="添加标签">
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                      >
                        <AddIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              )}
              
              {/* 标签数量提示 */}
              <span style={{ fontSize: '12px', color: '#666' }}>
                {tags.length}/{MAX_TAGS}
              </span>
            </Box>
          </Box>
          
          <MDXEditor
            ref={editorRef}
            markdown={initialMarkdown}
            plugins={plugins}
          />
        </>
      )}
      {snackbar.open && (
        <AlertMessage
          open={snackbar.open}
          message={snackbar.message}
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        />
      )}
    </>
  )
}
