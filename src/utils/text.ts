export function notAvailableMessage() {
  let stateIdentifier = window.location.hostname.split('.')[0];

  if (stateIdentifier) {
    stateIdentifier = stateIdentifier.toUpperCase();
  }

  if (!stateIdentifier || stateIdentifier.length !== 2) {
    stateIdentifier = 'your state';
  }

  return `Not available in ${stateIdentifier}`;
}
