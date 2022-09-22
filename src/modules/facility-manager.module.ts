import { IAtomicService, IPageMetrcFacilityData } from "@/interfaces";
import { authManager } from "@/modules/auth-manager.module";
import { customFetch } from "@/modules/fetch-manager.module";
import store from "@/store/page-overlay/index";
import { debugLogFactory } from "@/utils/debug";
import { upsertManager } from "./upsert-manager.module";

const debugLog = debugLogFactory("facility-manager.module.ts");

class FacilityManager implements IAtomicService {
  async init() {
    this.ownedFacilitiesOrError();
  }

  async activeFacilityOrError(): Promise<IPageMetrcFacilityData> {
    const authState = await authManager.authStateOrError();

    const ownedFacilities = await this.ownedFacilitiesOrError();

    if (store.state.mockDataMode) {
      return ownedFacilities[0];
    }

    const activeFacility = ownedFacilities.find(facility =>
      facility.name.includes(authState.license)
    );

    if (!activeFacility) {
      throw new Error("Cannot find active facility");
    }

    debugLog(async () => ["Active facility", activeFacility]);

    return activeFacility;
  }

  async ownedFacilitiesOrError(): Promise<IPageMetrcFacilityData[]> {
    const authState = await authManager.authStateOrError();

    if (store.state.mockDataMode) {
      return [
        {
          name: "Foo 123 | LIC-0000001",
          link: "#",
          licenseName: "Foo 123",
          licenseNumber: "LIC-0000001"
        },
        {
          name: "Foobar 123456 | LIC-0000002",
          link: "#",
          licenseName: "Foobar 123456",
          licenseNumber: "LIC-0000002"
        },
        {
          name: "Bar 123 | LIC-0000003",
          link: "#",
          licenseName: "Bar 123",
          licenseNumber: "LIC-0000003"
        },
        {
          name: "123 Bar Foo | LIC-0000004",
          link: "#",
          licenseName: "123 Bar Foo",
          licenseNumber: "LIC-0000004"
        },
        {
          name: "Baz 456 123 | LIC-0000005",
          link: "#",
          licenseName: "Baz 456 123",
          licenseNumber: "LIC-0000005"
        },
        {
          name: "FooBarBazQux FooBarBazQux 123456 | LIC-0000006",
          link: "#",
          licenseName: "FooBarBazQux FooBarBazQux 123456",
          licenseNumber: "LIC-0000006"
        }
      ];
    }

    // Check in page
    let facilityLinks = this.extractFacilityLinks(document);

    if (!facilityLinks || facilityLinks.length === 0) {
      // Fall back to network request
      const loadedHTML = await customFetch(window.location.origin).then(response =>
        response.text()
      );

      // @ts-ignore
      const facilitiesDropdownHTML: string | null = loadedHTML.match(
        /(<div class="btn-group facilities-dropdown">.*)/
      )[0];

      if (!facilitiesDropdownHTML) {
        throw new Error("Could not extract facilities html");
      }

      const el = document.createElement("div");
      el.innerHTML = facilitiesDropdownHTML;

      facilityLinks = this.extractFacilityLinks(el);
    }

    const ownedFacilities: IPageMetrcFacilityData[] = [];

    for (let i = 0; i < facilityLinks.length; ++i) {
      const facilityLink = facilityLinks[i];

      const link = facilityLink.getAttribute("href");
      const licenseNumber = facilityLink.querySelector("small")?.innerText.trim();
      const licenseName = facilityLink.querySelector("strong")?.innerText.trim();

      if (!link || !licenseName || !licenseNumber) {
        throw new Error("Could not extract facilities");
      }

      ownedFacilities.push({
        link,
        licenseName,
        licenseNumber,
        // @ts-ignore
        name: `${licenseName} | ${licenseNumber}`
      });
    }

    debugLog(async () => ["Owned facilities", ownedFacilities]);

    upsertManager.maybeSendKeyval({
      key: "facilities",
      category: "FACILITIES",
      dataType: "json",
      authState,
      data: ownedFacilities
    });

    return ownedFacilities;
  }

  private extractFacilityLinks(element: Document | HTMLElement) {
    return element.querySelectorAll(".facilities-dropdown ul.dropdown-menu li > a");
  }

  // private async cacheFacilities() {
  //     const now = Date.now();

  //     // Eagerly load transfer modal
  //     const transferTimestamp: number = (await get(IdbKeyPiece.TRANSFER_MODAL_HTML_TIMESTAMP)) as number;

  //     const currentKeys = await keys();

  //     if (!transferTimestamp || ((now - transferTimestamp) > TRANSFER_MODAL_HTML_EXPIRATION_MS) || !currentKeys.includes(IdbKeyPiece.TRANSFER_MODAL_HTML)) {
  //         primaryMetrcRequestManager.getNewTransferHTML().then((response: Response) => response.text().then((text: string) => set(IdbKeyPiece.TRANSFER_MODAL_HTML, text)))
  //     }
  // }

  // private async transferTemplateHtml() {
  //     const html = await get(IdbKeyPiece.TRANSFER_MODAL_HTML);

  //     if (html) {
  //         return html;
  //     }

  //     return await primaryMetrcRequestManager.getNewTransferHTML().then((response: Response) => response.text());
  // }

  // async allFacilities() {
  //     const currentKeys = await keys();
  //     // if ()
  // }
}

export let facilityManager = new FacilityManager();
