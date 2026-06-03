import React, { useRef, useEffect, useState } from 'react';
import * as d3 from "d3";
import { Box, Dialog, DialogTitle, DialogContent, TextField, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Search, X } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

// 定义节点和链接的数据结构
interface GraphNode {
  id: string;
  name: string;
  group: string;
  folderId?: string;
  value?: number;
  nodes?: object[];
}
interface SourceItem {
  id: string;
  folderId: string;
  folderTitle: string;
  noteTags: string;
  nodeId: string;
  nodeTitle: string;
}
interface ApiResponse {
  code: number;
  data: SourceItem[];
  message: string;
}
interface GraphLink {
  source: string;
  target: string;
  value?: number;
}
interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// 计算文本宽度
const getTextWidth = (text: string, font: string) => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
};

// 根据节点值计算半径的函数
const getNodeRadius = (d: GraphNode) => {
  const baseRadius = 20;
  const textWidth = getTextWidth(d.name, "14px sans-serif");
  const textRadius = Math.max(textWidth / 2 + 10, baseRadius);
  return Math.max(textRadius, (d.value || 20) / 2 + 15);
};

// 主组件
const Overview: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [loading, setLoading] = useState<boolean>(true);
  const [mockGraphData, setMockGraphData] = useState<GraphData>({nodes: [], links: []});
  
  // 弹窗状态
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const fetchDataSource = async () => {
    setLoading(true);
    try {
      const result: ApiResponse = await axiosInstance.get('/notes/getNotetagsOverview');
      // 检查接口返回是否成功
      if (result.code === 200) {
        const nodes:GraphNode[] = []
        const links:GraphLink[] = []
        const tags = new Map<string, string>() // 避免标签重复添加以及和nodes重复
        result.data.forEach(item => {
          if(nodes.find(node => node.folderId === item.folderId)) {
            nodes.find(node => node.folderId === item.folderId)!.nodes!.push({nodeId: item.nodeId, nodeTitle: item.nodeTitle})
          } else {
            nodes.push({id: item.id, name: item.folderTitle, group: item.id, folderId: item.folderId, value: 10, nodes: [{nodeId: item.nodeId, nodeTitle: item.nodeTitle}]})
          }
          item.noteTags?.split(',').forEach(tag => {
            if (!tags.has(tag)) {
              tags.set(tag, item.id+tag)
              nodes.push({id: item.id+tag, name: tag, group: item.id + 'tag', value: 10, nodes: [{nodeId: item.nodeId, nodeTitle: item.nodeTitle}] })
              links.push({source: item.id, target: item.id+tag, value: 1})
            } else {
              links.push({source: item.id, target: tags.get(tag)!, value: 1})
              nodes.find(node => node.id === tags.get(tag)!)!.nodes!.push({nodeId: item.nodeId, nodeTitle: item.nodeTitle})
            }
          })
        })
        console.log('nodes', nodes);
        console.log('links', links);
        setMockGraphData({nodes, links})
      } else {
        throw new Error(result.message || '接口返回失败');
      }
    } catch (err) {
      console.error('获取数据失败:', err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDataSource();
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width, height: height });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !dimensions.height) return;
    // 清除之前的渲染
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // 创建缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    const container = svg.append("g").attr("class", "graph-container");

    // 创建力模拟
    const simulation = d3.forceSimulation(mockGraphData.nodes)
      .force("link", d3.forceLink(mockGraphData.links).id((d: any) => d.id).distance(150).strength(1))  // 增加链接强度 ：添加 strength(1) ，让相连的节点更紧密
      .force("charge", d3.forceManyBody().strength(-500)) // 增加排斥力 ：电荷从-150增加到-500，避免节点重叠
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collision", d3.forceCollide().radius((d: any) => getNodeRadius(d) + 20)) // 增加碰撞半径 ：从+5增加到+20，防止节点靠得太近
      .force("x", d3.forceX(dimensions.width / 2).strength(0.05)) // 添加X方向力 ：弱吸引力让节点向中心聚集，布局更整齐
      .force("y", d3.forceY(dimensions.height / 2).strength(0.05)); // 添加Y方向力 ：弱吸引力让节点向中心聚集，布局更整齐

    // 定义颜色比例尺
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // 创建链接
    const link = container.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(mockGraphData.links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt(d.value || 1) * 2);

    // 创建节点组
    const node = container.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(mockGraphData.nodes)
      .enter().append("g")
      .attr("class", "node-group")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // 创建节点圆
    node.append("circle")
      .attr("r", getNodeRadius)
      .attr("fill", (d: any) => color(d.group))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "grab");

    // 创建节点文本
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("font-size", "12px")
      .attr("fill", "#fff")
      .attr("font-weight", "500")
      .text((d: GraphNode) => d.name)
      .style("pointer-events", "none");

    // 创建节点光晕效果
    node.append("circle")
      .attr("r", (d: any) => getNodeRadius(d) + 5)
      .attr("fill", (d: any) => color(d.group))
      .attr("opacity", 0.2)
      .style("pointer-events", "none");

    // 更新位置
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // 拖拽开始
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    // 拖拽中
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    // 拖拽结束
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // 添加悬停效果
    node.on("mouseenter", function(event: any, d: any) {
      d3.select(this).select("circle:first-of-type")
        .transition().duration(200)
        .attr("r", getNodeRadius(d) * 1.1)
        .attr("stroke-width", 3);

      d3.select(this).select("text")
        .transition().duration(200)
        .attr("font-size", "14px");

      // 高亮连接的节点
      link.transition().duration(200)
        .attr("stroke-opacity", (l: any) => 
          l.source.id === d.id || l.target.id === d.id ? 1 : 0.2
        );

      node.transition().duration(200)
        .style("opacity", (n: any) => {
          const connected = mockGraphData.links.some(
            l => (l.source.id === n.id && l.target.id === d.id) ||
                 (l.target.id === n.id && l.source.id === d.id)
          );
          return n.id === d.id || connected ? 1 : 0.3;
        });
    });

    node.on("mouseleave", function(event: any, d: any) {
      d3.select(this).select("circle:first-of-type")
        .transition().duration(200)
        .attr("r", getNodeRadius(d))
        .attr("stroke-width", 2);

      d3.select(this).select("text")
        .transition().duration(200)
        .attr("font-size", "12px");

      // 恢复所有链接和节点
      link.transition().duration(200)
        .attr("stroke-opacity", 0.6);

      node.transition().duration(200)
        .style("opacity", 1);
    });

    // 点击节点显示弹窗
    node.on("click", function(event: any, d: GraphNode) {
      setSelectedNodeData(d);
      setSearchTerm('');
      setOpenDialog(true);
    });

    return () => {
      simulation.stop();
    };
  }, [mockGraphData,dimensions]);

  // 过滤节点列表
  const filteredNodes = React.useMemo(() => {
    if (!selectedNodeData?.nodes || searchTerm.trim() === '') {
      return selectedNodeData?.nodes || [];
    }
    const term = searchTerm.toLowerCase();
    return (selectedNodeData.nodes || []).filter((item: any) => 
      item.nodeTitle?.toLowerCase().includes(term)
    );
  }, [selectedNodeData, searchTerm]);

  // 点击列表项跳转到 View 页面
  const handleItemClick = (nodeId: string) => {
    setOpenDialog(false);
    navigate('/view', { state: { nodeId } });
  };

  return (
    <>
      {loading ? ( 
        <Box sx={{ p: 2 }}>加载中...</Box>
       )
        : 
        <div 
          ref={containerRef}
          style={{ 
            width: "100%", 
            height: "calc(100vh - 100px)", 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f5f5f5"
          }}
        >
          <div style={{ width: "100%", height: "100%" }}>
            <svg
              ref={svgRef}
              style={{ 
                width: "100%", 
                height: "100%",
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            />
          </div>
        </div>
      }

      {/* 节点详情弹窗 */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{selectedNodeData?.name || '节点详情'}</span>
          <IconButton onClick={() => setOpenDialog(false)}>
            <X />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* 搜索框 */}
          <Box sx={{ marginBottom: 2 }}>
            <TextField
              fullWidth
              placeholder="搜索节点..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Box>

          {/* 节点列表 */}
          <List>
            {filteredNodes.length > 0 ? (
              filteredNodes.map((item: any, index: number) => (
                <ListItem 
                  key={index} 
                  onClick={() => handleItemClick(item.nodeId)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#f5f5f5' } }}
                >
                  <ListItemText primary={item.nodeTitle} />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="暂无数据" />
              </ListItem>
            )}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Overview;
