/**
 * Renders an op-amp node entirely from its SymbolDef.
 *
 * The renderer does not branch on model name. Instead, the selected symbol
 * definition drives pin placement and body style.
 *
 * Body styles handled here:
 *   opamp-triangle — standard schematic triangle
 *   dip            — rectangular DIP package
 *
 * Switching a node to a different symbol gives it that symbol's rendering
 * automatically.
 */

import { type NodeProps, Position } from '@xyflow/react';
import { Fragment } from 'react';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from '../node-shell';
import { resolveOpAmpSymbol } from '../symbol-registry';
import type { SymbolDef, SymbolPin } from '../types';
import type { OpAmpData } from './types';

/**
 * Map a symbol-pin side to the corresponding XYFlow Position enum.
 */
function pinPosition(pin: SymbolPin): Position {
  switch (pin.side) {
    case 'left':
      return Position.Left;
    case 'right':
      return Position.Right;
    case 'top':
      return Position.Top;
    case 'bottom':
      return Position.Bottom;
  }
}

/**
 * Build a handle style object that places the handle along the edge selected by
 * the pin.
 */
function handleStyle(pin: SymbolPin): React.CSSProperties {
  const bg = { background: '#4b5563' };
  if (pin.side === 'left' || pin.side === 'right') {
    return { top: pin.offset, ...bg };
  }
  return { left: pin.offset, ...bg };
}

/**
 * Resolve a numeric pixel value from an offset that may be '50%'.
 *
 * Used only when SVG elements need a concrete number.
 */
function resolveOffset(offset: number | string, dimension: number): number {
  if (typeof offset === 'string') {
    return (parseFloat(offset) / 100) * dimension;
  }
  return offset;
}

/**
 * Render XYFlow handles for every connectable pin in the selected symbol
 * definition.
 */
function PinHandles({ sym }: { sym: SymbolDef }) {
  return (
    <>
      {sym.pins
        .filter((p) => p.connectable)
        .map((p) => {
          const primaryType = p.source ? 'source' : 'target';
          const secondaryType = p.source ? 'target' : 'source';

          return (
            <Fragment key={p.id}>
              <RotatedHandle
                type={primaryType}
                position={pinPosition(p)}
                id={p.id}
                style={handleStyle(p)}
              />
              <RotatedHandle
                type={secondaryType}
                position={pinPosition(p)}
                id={p.id}
                style={{ ...HANDLE_STYLE, ...handleStyle(p), opacity: 0 }}
              />
            </Fragment>
          );
        })}
    </>
  );
}

/**
 * SVG body renderer for triangle-style op-amp symbols.
 */
function TriangleBody({
  sym,
  data,
  stroke,
}: {
  sym: SymbolDef;
  data: OpAmpData;
  stroke: string;
}) {
  const W = sym.width;
  const H = sym.height;

  /**
   * Locate the + and - input pins so the labels can be placed on the body next
   * to the correct edge positions.
   */
  const inPos = sym.pins.find((p) => p.id === 'in_pos');
  const inNeg = sym.pins.find((p) => p.id === 'in_neg');
  const posY = inPos ? resolveOffset(inPos.offset, H) : H * 0.25;
  const negY = inNeg ? resolveOffset(inNeg.offset, H) : H * 0.75;

  return (
    <>
      <polygon
        points={`10,5 10,${H - 5} ${W - 10},${H / 2}`}
        fill="#1f2937"
        stroke={stroke}
        strokeWidth="1.5"
      />
      <NodeText
        x={20}
        y={posY + 4}
        fill="#e5e7eb"
        fontSize="10"
        fontFamily="monospace"
      >
        +
      </NodeText>
      <NodeText
        x={20}
        y={negY + 4}
        fill="#e5e7eb"
        fontSize="10"
        fontFamily="monospace"
      >
        −
      </NodeText>
      <NodeText
        x={W / 2}
        y={H / 2 + 4}
        textAnchor="middle"
        fill={stroke}
        fontSize="8"
        fontFamily="monospace"
      >
        {data.label}
      </NodeText>
      <NodeText
        x={W / 2}
        y={18}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="7"
        fontFamily="monospace"
      >
        {data.model}
      </NodeText>
    </>
  );
}

const STUB = 16; // px: pin stub length on each side

function DIPBody({
  sym,
  data,
  stroke,
}: {
  sym: SymbolDef;
  data: OpAmpData;
  stroke: string;
}) {
  const W = sym.width;
  const H = sym.height;
  const bodyX = STUB;
  const bodyW = W - 2 * STUB;
  const bodyY = 5;
  const bodyH = H - 10;
  const dimStroke = '#374151';

  const leftPins = sym.pins.filter((p) => p.side === 'left');
  const rightPins = sym.pins.filter((p) => p.side === 'right');

  function stubColor(pin: SymbolPin) {
    return pin.connectable ? stroke : dimStroke;
  }
  function numColor(pin: SymbolPin) {
    return pin.connectable ? '#e5e7eb' : '#4b5563';
  }

  return (
    <>
      {/* Body rect */}
      <rect
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        fill="#1f2937"
        stroke={stroke}
        strokeWidth="1.5"
        rx="2"
      />

      {/* Notch — semicircle at top-centre (marks pin-1 end) */}
      <path
        d={`M ${bodyX + bodyW / 2 - 5},${bodyY} A 5,5 0 0,1 ${bodyX + bodyW / 2 + 5},${bodyY}`}
        fill="#111827"
        stroke={stroke}
        strokeWidth="1"
      />

      {/* Left pin stubs + numbers */}
      {leftPins.map((pin) => {
        const y = resolveOffset(pin.offset, H);
        return (
          <g key={pin.id}>
            <line
              x1={0}
              y1={y}
              x2={bodyX}
              y2={y}
              stroke={stubColor(pin)}
              strokeWidth="1"
            />
            <NodeText
              x={bodyX + 3}
              y={y + 4}
              fill={numColor(pin)}
              fontSize="7"
              fontFamily="monospace"
            >
              {pin.number}
            </NodeText>
          </g>
        );
      })}

      {/* Right pin stubs + numbers */}
      {rightPins.map((pin) => {
        const y = resolveOffset(pin.offset, H);
        return (
          <g key={pin.id}>
            <line
              x1={bodyX + bodyW}
              y1={y}
              x2={W}
              y2={y}
              stroke={stubColor(pin)}
              strokeWidth="1"
            />
            <NodeText
              x={bodyX + bodyW - 3}
              y={y + 4}
              textAnchor="end"
              fill={numColor(pin)}
              fontSize="7"
              fontFamily="monospace"
            >
              {pin.number}
            </NodeText>
          </g>
        );
      })}

      {/* Centre: model + label */}
      <NodeText
        x={W / 2}
        y={H / 2 - 4}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="7"
        fontFamily="monospace"
      >
        {data.model}
      </NodeText>
      <NodeText
        x={W / 2}
        y={H / 2 + 10}
        textAnchor="middle"
        fill={stroke}
        fontSize="8"
        fontFamily="monospace"
      >
        {data.label}
      </NodeText>
    </>
  );
}

/**
 * Main op-amp node component. Chooses the body
 * renderer from the selected SymbolDef style.
 */

export function OpAmpNode({ id, data, selected }: NodeProps) {
  const d = data as OpAmpData;
  const stroke = selected ? '#fb923c' : '#f97316';
  const sym = resolveOpAmpSymbol(d.model, d.symbol);

  return (
    <NodeShell id={id} width={sym.width} height={sym.height}>
      <PinHandles sym={sym} />

      <NodeSvg width={sym.width} height={sym.height}>
        {sym.style === 'opamp-triangle' ? (
          <TriangleBody sym={sym} data={d} stroke={stroke} />
        ) : (
          <DIPBody sym={sym} data={d} stroke={stroke} />
        )}
      </NodeSvg>
    </NodeShell>
  );
}
