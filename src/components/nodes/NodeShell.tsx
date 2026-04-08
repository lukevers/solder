// src/components/nodes/NodeShell.tsx
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
  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width, height }}
    >
      {children}
    </div>
  );
}
