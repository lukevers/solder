// src/components/nodes/NodeShell.tsx
import { useUpdateNodeInternals } from '@xyflow/react';
import { createContext, useContext, useEffect } from 'react';
import type React from 'react';
import { useStore } from '../../store';

export const HANDLE_STYLE = { background: '#4b5563' };

const NodeRotationContext = createContext(0);

type NodeShellProps = {
  id: string;
  width: number;
  height: number;
  children: React.ReactNode;
};

export function NodeShell({ id, width, height, children }: NodeShellProps) {
  const selectNode = useStore((s) => s.selectNode);
  const rotation = useStore(
    (s) => s.nodes.find((n) => n.id === id)?.rotation ?? 0,
  );
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [rotation, id, updateNodeInternals]);

  return (
    <NodeRotationContext.Provider value={rotation}>
      <div
        onClick={() => selectNode(id)}
        className="relative flex items-center justify-center cursor-pointer"
        style={{
          width,
          height,
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
        }}
      >
        {children}
      </div>
    </NodeRotationContext.Provider>
  );
}

type NodeTextProps = React.SVGProps<SVGTextElement>;

export function NodeText({ x = 0, y = 0, transform, children, ...props }: NodeTextProps) {
  const rotation = useContext(NodeRotationContext);
  const counterTransform = rotation ? `rotate(${-rotation}, ${x}, ${y})` : undefined;
  const combined = [counterTransform, transform].filter(Boolean).join(' ') || undefined;
  return (
    <text x={x} y={y} transform={combined} {...props}>
      {children}
    </text>
  );
}
