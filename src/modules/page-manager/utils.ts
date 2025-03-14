import {
  METRC_GRID_METADATA,
  METRC_PAGE_METADATA,
  MetrcPageId,
  NativeMetrcGridId,
  UniqueMetrcGridId,
} from "@/consts";

export function noScrollEventFactory(eventName = "click"): Event {
  const e = new Event(eventName);
  e.preventDefault();
  return e;
}

export function atLeastOneIsTruthy(...elements: any[]) {
  return elements.reduce((a, b) => !!a || !!b);
}

export function metrcPageIdFromPathOrNull(path: string): MetrcPageId | null {
  const match =
    Object.entries(METRC_PAGE_METADATA).find(([metrcPageId, pageMetadata]) =>
      path.endsWith(pageMetadata.pathPartial)
    ) ?? null;

  if (!match) {
    console.error("Unmatched page ID");
    return null;
  }

  return match[0] as MetrcPageId;
}

export function uniqueMetrcGridIdFromNativeMetrcGridIdAndPathnameOrNull(
  nativeMetrcGridId: NativeMetrcGridId,
  path: string
): UniqueMetrcGridId | null {
  const metrcPageId: MetrcPageId | null = metrcPageIdFromPathOrNull(window.location.pathname);

  if (!metrcPageId) {
    return null;
  }

  for (const [uniqueMetrcGridId, metadata] of Object.entries(METRC_GRID_METADATA)) {
    if (metadata.nativeMetrcGridId === nativeMetrcGridId && metadata.metrcPageId === metrcPageId) {
      return uniqueMetrcGridId as UniqueMetrcGridId;
    }
  }

  console.error(`Unmatched grid ID: ${nativeMetrcGridId}`);

  return null;
}
