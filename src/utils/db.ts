export function dataObjectToIndexableTags(data: Object): Array<string> {
  // Ignore empty strings, null, booleans
  let tags: Array<string> = [];

  const VALUES_SKIPLIST = [
    "",
    undefined,
    null,
    false,
    true,
  ];

  for (const [key, value] of Object.entries(data)) {
    if (VALUES_SKIPLIST.includes(value)) {
      continue;
    }

    if (typeof value === 'number') {
      continue;
    }

    if (typeof value === 'object') {
      // Recurse
      tags = [
        ...tags,
        ...dataObjectToIndexableTags(value),
      ];
    } else {
      tags.push(value.toString().toUpperCase());
    }
  }

  return tags;
}
