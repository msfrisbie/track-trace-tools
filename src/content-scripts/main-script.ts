// Webpack freaks out about not being run in an extension context

console.log("main-script");

// Preserve the function
const _confirm = window["confirm"];

const BYPASS_CONFIRM_FRAGMENT_LIST: string[] = [
  "Select again on this line?",
  "Are you sure you wish to remove line",
];

const confirmShim = function (message: string): boolean {
  for (const fragment of BYPASS_CONFIRM_FRAGMENT_LIST) {
    if (message.includes(fragment)) {
      console.log(message);
      return true;
    }
  }

  return _confirm(message);
};

// @ts-ignore
window["confirm"] = confirmShim;
