import {
  IContactInfo, IMetrcFacilityData, ITagOrderData, ITagOrderModalData
} from '@/interfaces';

export function extractIContactInfoFromITagOrderData(tagOrderData: ITagOrderData): IContactInfo {
  return {
    contactName: tagOrderData.FacilityContactName,
    phoneNumber: tagOrderData.FacilityPhoneNumber,
    address: {
      address1: tagOrderData.FacilityAddressStreet1,
      address2: [
        tagOrderData.FacilityAddressStreet2,
        tagOrderData.FacilityAddressStreet3,
        tagOrderData.FacilityAddressStreet4,
      ]
        .filter((x) => x !== '')
        .join(', '),
      city: tagOrderData.FacilityAddressCity,
      state: tagOrderData.FacilityAddressState,
      zip: tagOrderData.FacilityAddressPostalCode,
    },
  };
}

export function extractIContactInfoFromITagOrderModalData(
  tagOrderModalData: ITagOrderModalData
): IContactInfo {
  return {
    contactName: tagOrderModalData.Shipping.ContactName,
    phoneNumber: tagOrderModalData.Shipping.ContactPhoneNumber,
    address: {
      address1: tagOrderModalData.Shipping.Address.Street1,
      address2: tagOrderModalData.Shipping.Address.Street2,
      city: tagOrderModalData.Shipping.Address.City,
      state: tagOrderModalData.Shipping.Address.State,
      zip: tagOrderModalData.Shipping.Address.PostalCode,
    },
  };
}

export function flattenFacilityAddressOrNull(facility: IMetrcFacilityData): string | null {
  if (!facility) {
    return null;
  }

  const addressList = facilityReadableAddressLinesOrNull(facility);

  if (!addressList) {
    return null;
  }

  return addressList.filter((x) => !!x).join(' ');
}

export function facilityReadableAddressLinesOrNull(facility: IMetrcFacilityData): string[] | null {
  if (!facility) {
    return null;
  }

  const addressLines = [];

  const address1 = facility.PhysicalAddress.Street1.trim();
  if (address1) {
    addressLines.push(address1);
  }

  const address2 = [
    facility.PhysicalAddress.Street2,
    facility.PhysicalAddress.Street3,
    facility.PhysicalAddress.Street4,
  ]
    .filter((x) => !!x)
    .join(' ');

  if (address2) {
    addressLines.push(address2);
  }

  const address3 = [
    facility.PhysicalAddress.City,
    facility.PhysicalAddress.State,
    facility.PhysicalAddress.PostalCode.slice(0, 5),
  ]
    .filter((x) => !!x)
    .join(' ');

  if (address3) {
    addressLines.push(address3);
  }

  if (!addressLines.length) {
    return null;
  }

  return addressLines;
}
