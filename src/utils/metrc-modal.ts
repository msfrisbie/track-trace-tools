export function activeMetrcModalOrNull(): HTMLElement | null {
  return document.querySelector(".k-widget.k-window");
}

export function modalTitleOrError(modalElement: HTMLElement): string {
  // @ts-ignore
  const title: string = modalElement.querySelector(".k-window-title")?.innerText.trim();

  if (!title) {
    throw new Error("Could not acquire modal title");
  }

  return title;
}
