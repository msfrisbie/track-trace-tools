/* eslint-disable global-require */

import { MessageType, METRC_TAG_REGEX, TTT_TABLEGROUP_ATTRIBUTE } from '@/consts';
import { getUrl } from '@/utils/assets';
import { analyticsManager } from '../analytics-manager.module';
import { modalManager } from '../modal-manager.module';
import { INLINE_TABLE_BUTTON_RENDER_DELAY, t0 } from './consts';
import { pageManager } from './page-manager.module';

export async function addButtonsToTransferTableImpl() {
  if (performance.now() - t0 < INLINE_TABLE_BUTTON_RENDER_DELAY) {
    return;
  }

  const barsIconUrl = await getUrl(require('@/assets/images/bars-solid.svg'));
  const toolsIconUrl = await getUrl(require('@/assets/images/tools-solid.svg'));

  const rows: Element[] = [];

  const grids = [...document.querySelectorAll(`table[${TTT_TABLEGROUP_ATTRIBUTE}]`)];

  for (const grid of grids) {
    const groupId = grid.getAttribute(TTT_TABLEGROUP_ATTRIBUTE);

    const transferHeaderCell = grid.querySelector(
      `[${TTT_TABLEGROUP_ATTRIBUTE}="${groupId}"] th[data-field="ManifestNumber"]`,
    );

    if (!transferHeaderCell) {
      // This is not a table grid, skip
      continue;
    }

    for (const row of grid.querySelectorAll(
      `[role="row"][${TTT_TABLEGROUP_ATTRIBUTE}="${groupId}"]:not([mesinline="1"])`,
    )) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return;
  }

  for (let i = 0; i < rows.length; ++i) {
    const row = rows[i];

    row.setAttribute('mesinline', '1');

    const targetCell = row.children[1] as HTMLElement;

    const manifestNumber = parseInt(targetCell.innerText.trim(), 10);

    if (!manifestNumber) {
      console.error('bad manifestNumber');
      continue;
    }

    const zeroPaddedManifestNumber = targetCell.innerText.match(/[0-9]+/)![0];

    const container = document.createElement('div');
    container.classList.add('inline-button-container', 'btn-group');
    // container.style.display = 'inline-block';

    const menuButton = document.createElement('button');
    menuButton.setAttribute('title', 'TRANSFER MENU');
    menuButton.onclick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const e = {
        // x: event.clientX,
        // y: event.clientY,
        x: event.pageX,
        y: event.pageY,
        zeroPaddedManifestNumber,
        manifestNumber: manifestNumber.toString(),
      };

      analyticsManager.track(MessageType.OPENED_CONTEXT_MENU, e);
      modalManager.dispatchContextMenuEvent(e);
    };
    menuButton.classList.add('btn', 'btn-default', 'btn-small', 'ttt-btn');
    menuButton.innerHTML = `<img class="btn-svg-img" src="${toolsIconUrl}" />`;
    container.appendChild(menuButton);

    targetCell.appendChild(container);
  }
}

export function modifyTransferModalImpl() {
  if (!pageManager.activeModal) {
    return;
  }

  const button = pageManager.activeModal.querySelector('#ttt-fill-transfer');

  if (!button) {
  }
}

export async function addButtonsToPackageTableImpl() {
  if (performance.now() - t0 < INLINE_TABLE_BUTTON_RENDER_DELAY) {
    return;
  }

  const barsIconUrl = await getUrl(require('@/assets/images/bars-solid.svg'));
  const toolsIconUrl = await getUrl(require('@/assets/images/tools-solid.svg'));

  const rows: Element[] = [];

  const grids = [...document.querySelectorAll(`table[${TTT_TABLEGROUP_ATTRIBUTE}]`)];

  for (const grid of grids) {
    const groupId = grid.getAttribute(TTT_TABLEGROUP_ATTRIBUTE);

    const packageHeaderCell = grid.querySelector(
      `[${TTT_TABLEGROUP_ATTRIBUTE}="${groupId}"] th[data-field="Label"],
      [${TTT_TABLEGROUP_ATTRIBUTE}="${groupId}"] th[data-field="PackageLabel"]`,
    );

    if (!packageHeaderCell) {
      // This is not a table grid, skip
      continue;
    }

    for (const row of grid.querySelectorAll(
      `[role="row"][${TTT_TABLEGROUP_ATTRIBUTE}="${groupId}"]:not([mesinline="1"])`,
    )) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return;
  }

  for (let i = 0; i < rows.length; ++i) {
    const row = rows[i];

    row.setAttribute('mesinline', '1');

    const candidateCells: Element[] = [row.children[0], row.children[1]];

    let targetCell: Element | null = null;
    let packageTag: string | null = null;

    for (const candidateCell of candidateCells) {
      // @ts-ignore
      const candidatePackageTag = candidateCell.innerText.trim();

      if (candidatePackageTag && candidatePackageTag.match(METRC_TAG_REGEX)) {
        targetCell = candidateCell;
        packageTag = candidatePackageTag;
        break;
      }
    }

    if (!targetCell || !packageTag) {
      console.error('bad packageTag');
      continue;
    }

    const container = document.createElement('div');
    container.classList.add('inline-button-container', 'btn-group');

    targetCell.appendChild(container);

    const menuButton = document.createElement('button');
    menuButton.setAttribute('title', 'PACKAGE MENU');
    menuButton.onclick = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const e = {
        x: event.pageX,
        y: event.pageY,
        packageTag: packageTag!,
      };

      analyticsManager.track(MessageType.OPENED_CONTEXT_MENU, e);
      modalManager.dispatchContextMenuEvent(e);
    };
    menuButton.classList.add('btn', 'btn-default', 'btn-small', 'ttt-btn');
    menuButton.innerHTML = `<img class="btn-svg-img" src="${toolsIconUrl}" />`;
    container.appendChild(menuButton);
  }
}
