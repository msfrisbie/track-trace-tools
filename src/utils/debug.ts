import store from "@/store/page-overlay/index";

// These can be used to target/eliminate loggers
const whitelist: string[] | null = null;
const blacklist: string[] | null = null;

function textToColor(val: string): string {
    return `color: #${textToRGB(val)}`
}

// https://stackoverflow.com/questions/3426404/create-a-hexadecimal-colour-based-on-a-string-with-javascript
function textToRGB(text: string): string {
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }

    // This mask ensures the text is sufficiently dark
    // https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color
    // the human eyeball is most sensitive to green light, less to red and least to blue
    let c = (hash & 0x00FF0FFF)
        .toString(16)
        .toUpperCase();

    return "00000".substring(0, 6 - c.length) + c;
}


export function debugLogFactory(name: string,) {
    return async function (argFn: () => Promise<any[]>) {
        if (!store.state.debugMode) {
            return;
        }

        // Lazily evaluate the args
        const args = await argFn();

        if (whitelist?.includes(name)) {
            return;
        }

        if (blacklist?.includes(name)) {
            return;
        }

        console.log(`%c ${name}:`, textToColor(name), ...args);
    }
}
