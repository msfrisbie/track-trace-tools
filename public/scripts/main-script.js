// Webpack freaks out about not being run in an extension context
// Solution is to just write an uncompiled .js file

console.log("main-script");

// Preserve the function
const _confirm = window["confirm"];

const BYPASS_CONFIRM_FRAGMENT_LIST = [
  "Select again on this line?",
  "Are you sure you wish to remove line",
  "Resetting the grid settings requires a page reload",
];

const confirmShim = function (message) {
  // Always return true, otherwise this will break Metrc

  try {
    for (const fragment of BYPASS_CONFIRM_FRAGMENT_LIST) {
      if (message.includes(fragment)) {
        console.log(message);
        return true;
      }
    }

    return _confirm(message);
  } catch {
    return true;
  }
};

window["confirm"] = confirmShim;
