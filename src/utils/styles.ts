import { getUrl } from "./assets";

export async function addRobotoToHead() {
  // roboto-fontface by default will attempt to load Roboto from the page domain, which is not correct.
  // This will generate the font css at runtime and insert it into the page head
  const ROBOTO_CSS_TEMPLATE = `
    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Thin.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Thin.woff")
            )}") format("woff");
        font-weight: 100;
        font-style: normal;
    }

    @font-face {
        font-family: "Roboto-Thin";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Thin.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Thin.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-ThinItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-ThinItalic.woff")
            )}") format("woff");
        font-weight: 100;
        font-style: italic;
    }

    @font-face {
        font-family: "Roboto-ThinItalic";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-ThinItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-ThinItalic.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Light.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Light.woff")
            )}") format("woff");
        font-weight: 300;
        font-style: normal;
    }

    @font-face {
        font-family: "Roboto-Light";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Light.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Light.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-LightItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-LightItalic.woff")
            )}") format("woff");
        font-weight: 300;
        font-style: italic;
    }

    @font-face {
        font-family: "Roboto-LightItalic";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-LightItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-LightItalic.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Regular.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Regular.woff")
            )}") format("woff");
        font-weight: 400;
        font-style: normal;
    }

    @font-face {
        font-family: "Roboto-Regular";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Regular.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Regular.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-RegularItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-RegularItalic.woff")
            )}") format("woff");
        font-weight: 400;
        font-style: italic;
    }

    @font-face {
        font-family: "Roboto-RegularItalic";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-RegularItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-RegularItalic.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Medium.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Medium.woff")
            )}") format("woff");
        font-weight: 500;
        font-style: normal;
    }

    @font-face {
        font-family: "Roboto-Medium";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Medium.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Medium.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-MediumItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-MediumItalic.woff")
            )}") format("woff");
        font-weight: 500;
        font-style: italic;
    }

    @font-face {
        font-family: "Roboto-MediumItalic";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-MediumItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-MediumItalic.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Bold.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Bold.woff")
            )}") format("woff");
        font-weight: 700;
        font-style: normal;
    }

    @font-face {
        font-family: "Roboto-Bold";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Bold.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Bold.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-BoldItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-BoldItalic.woff")
            )}") format("woff");
        font-weight: 700;
        font-style: italic;
    }

    @font-face {
        font-family: "Roboto-BoldItalic";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-BoldItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-BoldItalic.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Black.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Black.woff")
            )}") format("woff");
        font-weight: 900;
        font-style: normal;
    }

    @font-face {
        font-family: "Roboto-Black";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Black.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-Black.woff")
            )}") format("woff");
    }

    @font-face {
        font-family: "Roboto";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-BlackItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-BlackItalic.woff")
            )}") format("woff");
        font-weight: 900;
        font-style: italic;
    }

    @font-face {
        font-family: "Roboto-BlackItalic";
        src: url("${await getUrl(
          require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-BlackItalic.woff2")
        )}") format("woff2"),
            url("${await getUrl(
              require("@/assets/fonts/roboto-fontface/fonts/roboto/Roboto-BlackItalic.woff")
            )}") format("woff");
    }
    `;

  const head = document.head || document.getElementsByTagName("head")[0],
    style = document.createElement("style");

  head.appendChild(style);

  style.appendChild(document.createTextNode(ROBOTO_CSS_TEMPLATE));
}
