import { IAtomicService, IPageMetrcFacilityData } from '@/interfaces';
import { authManager } from '@/modules/auth-manager.module';
import { customAxios } from '@/modules/fetch-manager.module';
import store from '@/store/page-overlay/index';
import { debugLogFactory } from '@/utils/debug';
import { t3RequestManager } from './t3-request-manager.module';

const debugLog = debugLogFactory('facility-manager.module.ts');

class FacilityManager implements IAtomicService {
  cachedActiveFacility: IPageMetrcFacilityData | null = null;

  cachedFacilities: IPageMetrcFacilityData[] = [];

  async init() {
    const facilities = await this.ownedFacilitiesOrError();

    t3RequestManager.upsertFacilities(facilities.map((x) => x.licenseNumber));
  }

  async activeFacilityOrError(): Promise<IPageMetrcFacilityData> {
    const authState = await authManager.authStateOrError();

    const ownedFacilities = await this.ownedFacilitiesOrError();

    if (store.state.mockDataMode) {
      return ownedFacilities[0];
    }

    const activeFacility = ownedFacilities.find((facility) =>
      facility.name.includes(authState.license));

    if (!activeFacility) {
      throw new Error('Cannot find active facility');
    }

    debugLog(async () => ['Active facility', activeFacility]);

    return activeFacility;
  }

  async ownedFacilitiesOrError(): Promise<IPageMetrcFacilityData[]> {
    const authState = await authManager.authStateOrError();

    if (store.state.mockDataMode) {
      return [
        {
          name: 'Metrc Direct - Microbusiness 01 | 4b-X0002',
          link: '?',
          licenseName: 'Metrc Direct - Microbusiness 01',
          licenseNumber: '4b-X0002',
        },
        {
          name: 'Metrc Direct - Cultivation 02 | LIC-0000002',
          link: '?',
          licenseName: 'Metrc Direct - Cultivation 02',
          licenseNumber: 'LIC-0000002',
        },
        {
          name: 'Metrc Direct - Lab 03 | LIC-0000003',
          link: '?',
          licenseName: 'Metrc Direct - Lab 03',
          licenseNumber: 'LIC-0000003',
        },
        {
          name: 'Metrc Direct - Processor 04 | LIC-0000004',
          link: '?',
          licenseName: 'Metrc Direct - Processor 04',
          licenseNumber: 'LIC-0000004',
        },
        {
          name: 'Metrc Direct - Transporter 05 | LIC-0000005',
          link: '?',
          licenseName: 'Metrc Direct - Transporter 05',
          licenseNumber: 'LIC-0000005',
        },
        {
          name: 'Metrc Direct - Dispensary 06 | LIC-0000006',
          link: '?',
          licenseName: 'Metrc Direct - Dispensary 06',
          licenseNumber: 'LIC-0000006',
        },
      ];
    }

    // Check in page
    let facilityLinks = this.extractFacilityLinks(document);

    if (!facilityLinks || facilityLinks.length === 0) {
      // Fall back to network request
      const loadedHTML = await customAxios(window.location.origin).then(
        (response) => response.data,
      );

      // @ts-ignore
      const facilitiesDropdownHTML: string | null = loadedHTML.match(
        /(<div class="btn-group facilities-dropdown">.*)/,
      )[0];

      if (!facilitiesDropdownHTML) {
        throw new Error('Could not extract facilities html');
      }

      const el = document.createElement('div');
      el.innerHTML = facilitiesDropdownHTML;

      facilityLinks = this.extractFacilityLinks(el);
    }

    const ownedFacilities: IPageMetrcFacilityData[] = [];

    for (let i = 0; i < facilityLinks.length; ++i) {
      const facilityLink = facilityLinks[i];

      const link = facilityLink.getAttribute('href');
      const licenseNumber = facilityLink.querySelector('small')?.innerText.trim();
      const licenseName = facilityLink.querySelector('strong')?.innerText.trim();

      if (!link || !licenseName || !licenseNumber) {
        throw new Error('Could not extract facilities');
      }

      ownedFacilities.push({
        link,
        licenseName,
        licenseNumber,
        // @ts-ignore
        name: `${licenseName} | ${licenseNumber}`,
      });
    }

    debugLog(async () => ['Owned facilities', ownedFacilities]);

    this.cachedFacilities = ownedFacilities;
    this.cachedActiveFacility = ownedFacilities.filter((x) => x.licenseNumber === authState.license)[0];

    console.log({ ownedFacilities });

    return ownedFacilities;
  }

  private extractFacilityLinks(element: Document | HTMLElement) {
    return element.querySelectorAll('.facilities-dropdown ul.dropdown-menu li > a');
  }

  // private async cacheFacilities() {
  //     const now = Date.now();

  //     // Eagerly load transfer modal
  //     const transferTimestamp: number = (await get(IdbKeyPiece.TRANSFER_MODAL_HTML_TIMESTAMP)) as number;

  //     const currentKeys = await keys();

  //     if (!transferTimestamp || ((now - transferTimestamp) > TRANSFER_MODAL_HTML_EXPIRATION_MS) || !currentKeys.includes(IdbKeyPiece.TRANSFER_MODAL_HTML)) {
  //         primaryMetrcRequestManager.getNewTransferHTML().then((response: AxiosResponse) => response.text().then((text: string) => set(IdbKeyPiece.TRANSFER_MODAL_HTML, text)))
  //     }
  // }

  // private async transferTemplateHtml() {
  //     const html = await get(IdbKeyPiece.TRANSFER_MODAL_HTML);

  //     if (html) {
  //         return html;
  //     }

  //     return primaryMetrcRequestManager.getNewTransferHTML().then((response: AxiosResponse) => response.text());
  // }

  // async allFacilities() {
  //     const currentKeys = await keys();
  //     // if ()
  // }
}

export const facilityManager = new FacilityManager();
