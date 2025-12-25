import * as React from 'react';
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view';
import { Paper, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import '../styles/TreeView.css';

// 定义书签树节点的数据结构
interface TreeNode {
  id: string;
  label: string;
  type: 'folder' | 'bookmark';
  children?: TreeNode[];
}

// 模拟书签树数据
const bookmarkTreeData: TreeNode[] = [
  {
    id: '0',
    label: '书签栏',
    type: 'folder',
    children: [
      {
        id: '1',
        label: 'deepseek',
        type: 'bookmark'
      },
      {
        id: '2',
        label: '从HTML文件导入',
        type: 'bookmark'
      },
      {
        id: '3',
        label: '收藏栏',
        type: 'bookmark'
      },
      {
        id: '4',
        label: 'Code',
        type: 'folder',
        children: [
          {
            id: '5',
            label: '下载',
            type: 'bookmark'
          },
          {
            id: '6',
            label: '扩展',
            type: 'folder',
            children: [
              {
                id: '7',
                label: '临时',
                type: 'bookmark'
              },
              {
                id: '8',
                label: 'CAD',
                type: 'bookmark'
              },
              {
                id: '9',
                label: '延伸',
                type: 'bookmark'
              },
              {
                id: '10',
                label: '扩展',
                type: 'bookmark'
              }
            ]
          }
        ]
      },
      {
        id: '44',
        label: 'Code',
        type: 'folder',
        children: [
          {
            id: '44-5',
            label: '下载',
            type: 'bookmark'
          },
          {
            id: '44-6',
            label: '扩展',
            type: 'folder',
            children: [
              {
                id: '44-7',
                label: '临时',
                type: 'bookmark'
              },
              {
                id: '44-8',
                label: 'CAD',
                type: 'bookmark'
              },
              {
                id: '44-9',
                label: '延伸',
                type: 'bookmark'
              },
              {
                id: '44-10',
                label: '扩展',
                type: 'bookmark'
              }
            ]
          }
        ]
      }
    ]
  }
];

// 递归渲染TreeItem的组件
const TreeItemRenderer: React.FC<{ node: TreeNode }> = ({ node }) => {
  return (
    <TreeItem
      itemId={node.id}
      label={
        <React.Fragment>
          {node.type === 'folder' ? (
            <FolderIcon sx={{ mr: 1 }} />
          ) : (
            <BookmarkIcon sx={{ mr: 1 }} />
          )}
          {node.label}
        </React.Fragment>
      }
    >
      {node.children?.map((childNode) => (
        <TreeItemRenderer key={childNode.id} node={childNode} />
      ))}
    </TreeItem>
  );
};


const TreeViewComponent: React.FC = () => {
  return (
    <Paper className='tree-view-paper' elevation={0} >
      <Box className='tree-view-box'>
        <SimpleTreeView
          aria-label="书签树"
          slots={{
            collapseIcon: ExpandMoreIcon,
            expandIcon: ChevronRightIcon,
          }}
          
        >
          {bookmarkTreeData.map((node) => (
            <TreeItemRenderer key={node.id} node={node} />
          ))}
        </SimpleTreeView>
      </Box>
      
    </Paper>
  );
};

export default TreeViewComponent;