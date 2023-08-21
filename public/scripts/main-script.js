// Webpack freaks out about not being run in an extension context

// console.log("main-script");

// Preserve the function
const _confirm = window["confirm"];

window["confirm"] = function (message) {
  if (!message.includes("Select again on this line?")) {
    return _confirm(message);
  } else {
    console.log(message);
    return true;
  }
};
