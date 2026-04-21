import { type NodeProps, Position } from '@xyflow/react';
import { HANDLE_STYLE, NodeShell, NodeSvg, RotatedHandle } from './NodeShell';

export function GroundNode({ id, selected }: NodeProps) {
  return (
    <NodeShell id={id} width={40} height={36}>
      <RotatedHandle
        type="source"
        position={Position.Top}
        id="gnd"
        style={HANDLE_STYLE}
      />
      <RotatedHandle
        type="target"
        position={Position.Top}
        id="gnd"
        style={{ ...HANDLE_STYLE, opacity: 0 }}
      />
      <NodeSvg width={40} height={36}>
        <line
          x1="20"
          y1="0"
          x2="20"
          y2="12"
          stroke={selected ? '#60a5fa' : '#9ca3af'}
          strokeWidth="1.5"
        />
        <line
          x1="4"
          y1="12"
          x2="36"
          y2="12"
          stroke={selected ? '#60a5fa' : '#9ca3af'}
          strokeWidth="2"
        />
        <line
          x1="10"
          y1="18"
          x2="30"
          y2="18"
          stroke={selected ? '#60a5fa' : '#9ca3af'}
          strokeWidth="1.5"
        />
        <line
          x1="16"
          y1="24"
          x2="24"
          y2="24"
          stroke={selected ? '#60a5fa' : '#9ca3af'}
          strokeWidth="1"
        />
      </NodeSvg>
    </NodeShell>
  );
}
