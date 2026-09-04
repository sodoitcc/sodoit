export type TimelineNodeState = "start" | "regular" | "finish";

export function deriveTimelineState(
  index: number,
  count: number,
): TimelineNodeState {
  if (count <= 1) return "start";
  if (index === 0) return "start";
  if (index === count - 1) return "finish";
  return "regular";
}
