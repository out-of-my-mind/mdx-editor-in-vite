import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDrag, useDrop } from 'react-dnd';
import '../styles/TreeView.css';

// 数据源项组件
const DataSourceItem: React.FC<{ item: any; index: number; onRemove: (index: number) => void }> = ({ 
  item, 
  index, 
  onRemove 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'data_source_item',
    item: { item, index, source: 'datasource' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [item, index]);

  return (
    <Box
      ref={drag}
      sx={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '12px',
        margin: '8px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: 2,
        '&:hover': {
          backgroundColor: '#f0f0f0',
        },
      }}
    >
      <Typography variant="body1">{item.text || item.label || item.title}</Typography>
      <Typography 
        variant="body2" 
        color="error" 
        sx={{ cursor: 'pointer', mt: 1 }}
        onClick={() => onRemove(index)}
      >
        移除
      </Typography>
    </Box>
  );
};

// 数据源放置区域
const DataSourceDropZone: React.FC<{ 
  dataSource: any[]; 
  onDrop: (item: any) => void;
  onRemove: (index: number) => void;
}> = ({ dataSource, onDrop, onRemove }) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['tree_node'],
    drop: (item: any) => {
      if (item.source === 'tree') {
        onDrop(item.node);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDrop]);

  return (
    <Box
      ref={drop}
      sx={{
        height: '100%',
        border: isOver ? '2px solid #1976d2' : '2px dashed #ccc',
        borderRadius: '8px',
        padding: '16px',
        backgroundColor: isOver ? 'rgba(25, 118, 210, 0.1)' : '#f9f9f9',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        数据源
      </Typography>
      
      {dataSource.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          从左侧拖拽节点到此处
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {dataSource.map((item, index) => (
            <DataSourceItem 
              key={index} 
              item={item} 
              index={index} 
              onRemove={onRemove}
            />
          ))}
        </Box>
      )}
      
      {isOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            zIndex: 1,
          }}
        >
          <Typography variant="h6" color="primary">
            释放以将项目添加到数据源
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DataSourceDropZone;