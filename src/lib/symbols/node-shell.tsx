import {
  Handle,
  type HandleProps,
  Position,
  useUpdateNodeInternals,
} from '@xyflow/react';
import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { useStore } from '../../store';

export const HANDLE_STYLE = { background: '#4b5563' };

const POSITION_ORDER: Array<Position> = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

function rotatePosition(position: Position, rotation: number): Position {
  const steps = (((rotation % 360) + 360) % 360) / 90;
  const idx = POSITION_ORDER.indexOf(position);
  return POSITION_ORDER[(idx + steps) % 4];
}

// ---- Rotate custom handle style offsets ----

function resolveOffset(
  value: string | number | undefined,
  dimension: number,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'string' && value.endsWith('%')) {
    return (parseFloat(value) / 100) * dimension;
  }
  return Number(value);
}

function transformHandleStyle(
  origPosition: Position,
  style: React.CSSProperties | undefined,
  rotation: number,
  origW: number,
  origH: number,
): React.CSSProperties {
  if (!rotation || !style) {
    return style ?? {};
  }

  const hasTop = 'top' in style && style.top !== undefined;
  const hasLeft = 'left' in style && style.left !== undefined;
  if (!hasTop && !hasLeft) {
    return style;
  }

  const { top: rawTop, left: rawLeft, ...rest } = style;
  const T = resolveOffset(rawTop, origH);
  const L = resolveOffset(rawLeft, origW);

  const steps = ((rotation % 360) + 360) % 360;

  if (steps === 90) {
    switch (origPosition) {
      case Position.Left:
      case Position.Right:
        return { ...rest, left: origH - T! };
      case Position.Top:
      case Position.Bottom:
        return { ...rest, top: L! };
    }
  }
  if (steps === 180) {
    switch (origPosition) {
      case Position.Left:
      case Position.Right:
        return { ...rest, top: origH - T! };
      case Position.Top:
      case Position.Bottom:
        return { ...rest, left: origW - L! };
    }
  }
  if (steps === 270) {
    switch (origPosition) {
      case Position.Left:
      case Position.Right:
        return { ...rest, left: T! };
      case Position.Top:
      case Position.Bottom:
        return { ...rest, top: origW - L! };
    }
  }

  return style;
}

// ---- Context ----

type RotationCtx = { rotation: number; origWidth: number; origHeight: number };
const NodeRotationContext = createContext<RotationCtx>({
  rotation: 0,
  origWidth: 0,
  origHeight: 0,
});

// ---- RotatedHandle ----

export function RotatedHandle(props: HandleProps) {
  const { rotation, origWidth, origHeight } = useContext(NodeRotationContext);
  if (!rotation) {
    return <Handle {...props} />;
  }

  const newPosition = rotatePosition(props.position, rotation);
  const newStyle = transformHandleStyle(
    props.position,
    props.style,
    rotation,
    origWidth,
    origHeight,
  );

  return <Handle {...props} position={newPosition} style={newStyle} />;
}

// ---- NodeShell ----

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure handles when rotation/dimensions change
  useEffect(() => {
    updateNodeInternals(id);
  }, [rotation, width, height, id, updateNodeInternals]);

  const is90or270 = rotation === 90 || rotation === 270;
  const effW = is90or270 ? height : width;
  const effH = is90or270 ? width : height;

  return (
    <NodeRotationContext.Provider
      value={{ rotation, origWidth: width, origHeight: height }}
    >
      <div
        onClick={() => selectNode(id)}
        className="relative flex cursor-pointer items-center justify-center"
        style={{ width: effW, height: effH }}
      >
        {children}
      </div>
    </NodeRotationContext.Provider>
  );
}

// ---- NodeSvg ----

type NodeSvgProps = Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height'> & {
  width: number;
  height: number;
};

export function NodeSvg({
  width,
  height,
  children,
  ...svgProps
}: NodeSvgProps) {
  const { rotation } = useContext(NodeRotationContext);
  const is90or270 = rotation === 90 || rotation === 270;
  const effW = is90or270 ? height : width;
  const effH = is90or270 ? width : height;

  if (!rotation) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        overflow="visible"
        {...svgProps}
      >
        {children}
      </svg>
    );
  }

  const gTransform = `translate(${effW / 2}, ${effH / 2}) rotate(${rotation}) translate(${-width / 2}, ${-height / 2})`;

  return (
    <svg
      width={effW}
      height={effH}
      viewBox={`0 0 ${effW} ${effH}`}
      overflow="visible"
      {...svgProps}
    >
      <g transform={gTransform}>{children}</g>
    </svg>
  );
}

// ---- NodeText ----

type NodeTextProps = React.SVGProps<SVGTextElement>;

export function NodeText({
  x = 0,
  y = 0,
  transform,
  children,
  ...props
}: NodeTextProps) {
  const { rotation } = useContext(NodeRotationContext);
  const counterTransform = rotation
    ? `rotate(${-rotation}, ${x}, ${y})`
    : undefined;
  const combined =
    [counterTransform, transform].filter(Boolean).join(' ') || undefined;
  return (
    <text x={x} y={y} transform={combined} {...props}>
      {children}
    </text>
  );
}
