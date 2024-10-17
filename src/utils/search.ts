export function maybePushOntoUniqueStack(value: any | null, stack: Array<string>): Array<string> {
  if (!value) {
    return stack;
  }

  const formattedValue = value.toString();

  // Remove from stack if it exists
  stack = stack.filter((x) => x !== formattedValue);

  // Push onto beginning
  stack.unshift(formattedValue);

  // Limit stack size
  stack = stack.slice(0, 50);

  return stack;
}
