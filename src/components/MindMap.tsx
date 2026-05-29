import { useState, useRef, useCallback, useEffect } from "react";

interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  children?: MindMapNode[];
}

interface MindMapProps {
  data: string;
}

export default function MindMap({ data }: MindMapProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scaleRef = useRef(1);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const parseMarkdownToNodes = useCallback(
    (markdown: string): MindMapNode[] => {
      const lines = markdown.split("\n");
      const nodes: MindMapNode[] = [];
      let currentParent: MindMapNode | null = null;
      let currentLevel = 0;
      const nodeStack: MindMapNode[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const match = line.match(/^(#{1,4})\s*(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2].trim();

          const node: MindMapNode = {
            id: `node-${i}`,
            text,
            x: 0,
            y: 0,
            children: [],
          };

          if (level === 1) {
            nodes.push(node);
            nodeStack.length = 0;
            nodeStack.push(node);
            currentParent = node;
            currentLevel = level;
          } else if (level > currentLevel) {
            if (currentParent) {
              currentParent.children = currentParent.children || [];
              currentParent.children.push(node);
              nodeStack.push(node);
              currentParent = node;
              currentLevel = level;
            }
          } else {
            while (nodeStack.length > 0 && level <= currentLevel) {
              nodeStack.pop();
              currentLevel--;
            }
            currentParent = nodeStack[nodeStack.length - 1];
            if (currentParent) {
              currentParent.children = currentParent.children || [];
              currentParent.children.push(node);
              nodeStack.push(node);
              currentLevel = level;
            } else {
              nodes.push(node);
              nodeStack.push(node);
              currentLevel = level;
            }
          }
        }
      }

      return nodes;
    },
    [],
  );

  const calculateLayout = useCallback(
    (
      nodes: MindMapNode[],
      startX: number = 180,
      startY: number = 220,
      level = 0,
    ) => {
      const horizontalSpacing = 240;
      const verticalSpacing = 80;
      let currentY = startY;

      nodes.forEach((node) => {
        node.x = startX;
        node.y = currentY;

        if (node.children && node.children.length > 0) {
          calculateLayout(
            node.children,
            startX + horizontalSpacing,
            currentY,
            level + 1,
          );
          const totalHeight = (node.children.length - 1) * verticalSpacing;
          currentY += totalHeight + verticalSpacing;
        } else {
          currentY += verticalSpacing;
        }
      });
    },
    [],
  );

  const nodes = parseMarkdownToNodes(data);
  calculateLayout(nodes);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      const isInsideContainer =
        containerRef.current && containerRef.current.contains(target);

      if (isInsideContainer) {
        e.preventDefault();
        e.stopImmediatePropagation();

        const delta = e.deltaY > 0 ? -0.25 : 0.25;
        const newScale = Math.max(0.2, Math.min(5, scaleRef.current + delta));
        setScale(newScale);
      }
    };

    window.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true,
    });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContainerWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener("wheel", handleContainerWheel, {
      passive: false,
    });
    return () => container.removeEventListener("wheel", handleContainerWheel);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setScale(Math.min(5, scale + 0.5));
  }, [scale]);

  const handleZoomOut = useCallback(() => {
    setScale(Math.max(0.2, scale - 0.5));
  }, [scale]);

  const renderNode = useCallback(
    (node: MindMapNode, depth: number = 0): JSX.Element[] => {
      const colors = [
        "#8B5CF6",
        "#EC4899",
        "#06B6D4",
        "#10B981",
        "#F59E0B",
        "#EF4444",
      ];
      const color = colors[depth % colors.length];

      const elements: JSX.Element[] = [];

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          const midX = (node.x + child.x) / 2;

          elements.push(
            <path
              key={`line-${node.id}-${child.id}`}
              d={`M ${node.x + 160} ${node.y} Q ${midX} ${node.y} ${midX} ${(node.y + child.y) / 2} Q ${midX} ${child.y} ${child.x - 45} ${child.y}`}
              stroke={color}
              strokeWidth={2.5}
              fill="none"
            />,
          );
          elements.push(...renderNode(child, depth + 1));
        });
      }

      const nodeWidth = 220;
      const fontSize = depth === 0 ? 17 : depth === 1 ? 15 : 13;

      elements.push(
        <g key={node.id}>
          <rect
            x={node.x - 45}
            y={node.y - 22}
            width={nodeWidth}
            height={44}
            rx={22}
            fill="white"
            stroke={color}
            strokeWidth={2}
            filter="url(#shadow)"
          />
          <circle
            cx={node.x - 30}
            cy={node.y}
            r={7}
            fill="white"
            stroke={color}
            strokeWidth={3}
          />
          <text
            x={node.x + 75}
            y={node.y + 7}
            textAnchor="middle"
            fill="#333333"
            fontSize={fontSize}
            fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
            fontWeight={depth === 0 ? "700" : "500"}
          >
            {node.text.length > 28
              ? node.text.substring(0, 28) + "..."
              : node.text}
          </text>
        </g>,
      );

      return elements;
    },
    [],
  );

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl">
        <svg
          className="w-16 h-16 mb-4 opacity-50 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
        <p className="text-gray-400">暂无思维导图数据</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] bg-white rounded-xl overflow-hidden shadow-lg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        touchAction: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <span className="text-gray-600 text-sm font-medium">思维导图</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleReset();
          }}
          className="px-4 py-2 text-sm bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-all hover:scale-105"
        >
          重置视图
        </button>
        <span className="text-gray-400 text-sm">
          缩放: {Math.round(scale * 100)}%
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomIn();
          }}
          className="w-10 h-10 flex items-center justify-center text-lg bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-all hover:scale-110"
        >
          +
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleZoomOut();
          }}
          className="w-10 h-10 flex items-center justify-center text-lg bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-all hover:scale-110"
        >
          -
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 bg-gray-100 rounded-full">
        <span className="text-gray-500 text-xs">滚轮缩放 · 拖拽平移</span>
      </div>

      <div className="w-full h-full overflow-hidden pointer-events-none">
        <svg
          ref={svgRef}
          className="w-full h-full pointer-events-auto"
          viewBox="-600 -500 1800 1500"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center center",
            touchAction: "none",
          }}
        >
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.1" />
            </filter>
          </defs>
          {nodes.length > 0 && renderNode(nodes[0], 0)}
        </svg>
      </div>
    </div>
  );
}
