// src/components/nodes/NodeShell.tsx
import { useUpdateNodeInternals } from '@xyflow/react';
import { useEffect } from 'react';
import { useStore } from '../../store';

export const HANDLE_STYLE = { background: '#4b5563' };

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
  );
}
