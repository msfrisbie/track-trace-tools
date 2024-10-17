import { pageManager } from "@/modules/page-manager/page-manager.module";

export async function setFormInputValue(
  input: HTMLInputElement | HTMLSelectElement,
  value: string,
  eventType: string = 'change',
) {
  input.value = value;
  input.dispatchEvent(new Event(eventType));
  await pageManager.clickSettleDelay();
}

export async function setAutocompleteValueOrError(input: HTMLInputElement, value: string) {
  const inputParent = input.parentElement;

  if (!inputParent?.classList.contains('input-append')) {
    throw new Error('Autocomplete input formatting error');
  }

  const autocompleteListContainer = inputParent.querySelector('ul');

  if (!autocompleteListContainer) {
    throw new Error('Missing autocomplete list ref');
  }

  await setFormInputValue(input, value);

  const autocompleteChildren = [...autocompleteListContainer.querySelectorAll('li')];

  if (autocompleteChildren.length !== 1) {
    throw new Error(`Autocomplete list has invalid length: ${autocompleteChildren.length}`);
  }

  autocompleteChildren[0].click();

  await pageManager.clickSettleDelay();
}
