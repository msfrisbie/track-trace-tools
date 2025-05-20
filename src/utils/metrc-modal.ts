import { IMetrcFacilityData } from "@/interfaces";

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

export function metrcAddressToArray(addressData: IMetrcFacilityData["PhysicalAddress"]): string[] {
  return [
    addressData.Street1,
    addressData.Street2,
    addressData.Street3,
    addressData.Street4,
    addressData.City,
    addressData.State,
    addressData.PostalCode,
  ]
    .filter((x) => !!x);
}

export function metrcAddressToString(addressData: IMetrcFacilityData["PhysicalAddress"]): string {
  return metrcAddressToArray(addressData).join(" ");
}
