import { IGraphComponentContext, IGraphState } from "@/store/page-overlay/modules/graph/interfaces";
import { Settings } from "sigma/settings";
import { EdgeDisplayData, NodeDisplayData, PartialButFor, PlainObject } from "sigma/types";

const TEXT_COLOR = "#000000";

export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function hoverRenderer(
  context: CanvasRenderingContext2D,
  data: PlainObject,
  settings: PlainObject
) {
  const size = settings.labelSize;
  const font = settings.labelFont;
  const weight = settings.labelWeight;
  const subLabelSize = size - 2;

  const label = data.label;
  const subLabel = data.tag !== "unknown" ? data.tag : "";
  const clusterLabel = data.clusterLabel;

  // Then we draw the label background
  context.beginPath();
  context.fillStyle = "#fff";
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 2;
  context.shadowBlur = 8;
  context.shadowColor = "#000";

  context.font = `${weight} ${size}px ${font}`;
  const labelWidth = context.measureText(label).width;
  context.font = `${weight} ${subLabelSize}px ${font}`;
  const subLabelWidth = subLabel ? context.measureText(subLabel).width : 0;
  context.font = `${weight} ${subLabelSize}px ${font}`;
  const clusterLabelWidth = clusterLabel ? context.measureText(clusterLabel).width : 0;

  const textWidth = Math.max(labelWidth, subLabelWidth, clusterLabelWidth);

  const x = Math.round(data.x);
  const y = Math.round(data.y);
  const w = Math.round(textWidth + size / 2 + data.size + 3);
  const hLabel = Math.round(size / 2 + 4);
  const hSubLabel = subLabel ? Math.round(subLabelSize / 2 + 9) : 0;
  const hClusterLabel = Math.round(subLabelSize / 2 + 9);

  drawRoundRect(context, x, y - hSubLabel - 12, w, hClusterLabel + hLabel + hSubLabel + 12, 5);
  context.closePath();
  context.fill();

  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // And finally we draw the labels
  context.fillStyle = TEXT_COLOR;
  context.font = `${weight} ${size}px ${font}`;
  context.fillText(label, data.x + data.size + 3, data.y + size / 3);

  if (subLabel) {
    context.fillStyle = TEXT_COLOR;
    context.font = `${weight} ${subLabelSize}px ${font}`;
    context.fillText(subLabel, data.x + data.size + 3, data.y - (2 * size) / 3 - 2);
  }

  context.fillStyle = data.color;
  context.font = `${weight} ${subLabelSize}px ${font}`;
  context.fillText(clusterLabel, data.x + data.size + 3, data.y + size / 3 + 3 + subLabelSize);
}

export function labelRenderer(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color">,
  settings: Settings
) {
  if (!data.label) {
    return;
  }

  const size = settings.labelSize,
    font = settings.labelFont,
    weight = settings.labelWeight;

  context.font = `${weight} ${size}px ${font}`;
  const width = context.measureText(data.label).width + 8;

  context.fillStyle = "#ffffffcc";
  context.fillRect(data.x + data.size, data.y + size / 3 - 15, width, 20);

  context.fillStyle = "#000";
  context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
}

// Render nodes accordingly to the internal store.state.graph:
// 1. If a node is selected, it is highlighted
// 2. If there is query, all non-matching nodes are greyed
// 3. If there is a hovered node, all non-neighbor nodes are greyed
export function nodeReducer({
  node,
  data,
  graphState,
}: {
  node: string;
  data: any;
  graphState: IGraphState;
}) {
  const res: Partial<NodeDisplayData> = { ...data };

  if (
    graphState.hoveredNeighbors.length > 0 &&
    !graphState.hoveredNeighbors.includes(node) &&
    graphState.hoveredNode !== node
  ) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  if (graphState.selectedNode === node) {
    res.highlighted = true;
  } else if (graphState.suggestions.length > 0 && !graphState.suggestions.includes(node)) {
    res.label = "";
    res.color = "#f6f6f6";
  }

  return res;
}

// Render edges accordingly to the internal store.state.graph:
// 1. If a node is hovered, the edge is hidden if it is not connected to the
//    node
// 2. If there is a query, the edge is only visible if it connects two
//    graphState.suggestions
export function edgeReducer({
  graphComponentContext,
  edge,
  data,
  graphState,
}: {
  graphComponentContext: IGraphComponentContext;
  edge: string;
  data: any;

  graphState: IGraphState;
}) {
  const res: Partial<EdgeDisplayData> = { ...data };

  if (
    graphState.hoveredNode &&
    //@ts-ignore
    !graphComponentContext.graph.hasExtremity(edge, graphState.hoveredNode)
  ) {
    res.hidden = true;
  }

  if (
    (graphState.suggestions.length > 0 &&
      !graphState.suggestions.includes(
        // @ts-ignore
        graphComponentContext.graph.source(edge)
      )) ||
    (graphState.suggestions.length > 0 &&
      !graphState.suggestions.includes(
        // @ts-ignore
        graphComponentContext.graph.target(edge)
      ))
  ) {
    res.hidden = true;
  }

  return res;
}
