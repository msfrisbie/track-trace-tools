const fs = require('fs');
const nodeFetch = require('node-fetch');
const fetch = require('fetch-cookie/node-fetch')(nodeFetch);
const { URLSearchParams } = require('url');

const Headers = nodeFetch.Headers;
const Request = nodeFetch.Request;

/**
 * {
 *  "hostname": "ca.metrc.com",
 *  "username": "foo",
 *  "password": "bar"
 * }
 */

const raw = fs.readFileSync('secrets/credentials.json');
const credentials = JSON.parse(raw);

// End NodeJS shim

// Start browser compatible:

const CSRF_KEY = "__RequestVerificationToken";

const PROTOCOL = "https://";
const ORIGIN = PROTOCOL + credentials["hostname"];

const LOGIN_PATH = "/log-in";
const LOGIN_QUERY_STRING = '?ReturnUrl=%2f';

const CSRF_REGEX = new RegExp(`${CSRF_KEY}.*value="([^"]*)"`);

const defaultGetHeaders = {
    "Host": credentials["hostname"],
    "Connection": "keep-alive",
    "sec-ch-ua": `"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"`,
    "sec-ch-ua-mobile": "?0",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
}

async function main() {
    const loginPageHeaders = new Headers({
        ...defaultGetHeaders
    });

    const loginPageResponse = await fetch(ORIGIN + LOGIN_PATH, {
        headers: loginPageHeaders
    });

    const loginPageHtml = await loginPageResponse.text();

    const csrfToken = loginPageHtml.match(CSRF_REGEX)[1];

    const formData = new URLSearchParams();
    formData.append(CSRF_KEY, csrfToken);
    formData.append("Username", credentials["username"]);
    formData.append("Password", credentials["password"]);

    const loginHeaders = new Headers({
        "Host": credentials["hostname"],
        "Origin": ORIGIN,
        "Connection": "keep-alive",
        "Content-Length": formData.toString().length.toString(),
        "Cache-Control": "max-age=0",
        "sec-ch-ua": `"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"`,
        "sec-ch-ua-mobile": "?0",
        "Upgrade-Insecure-Requests": "1",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-User": "?1",
        "Sec-Fetch-Dest": "document",
        "Referer": ORIGIN + LOGIN_PATH + LOGIN_QUERY_STRING,
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9,pt;q=0.8",
    });

    const loginRequest = new Request(ORIGIN + LOGIN_PATH + LOGIN_QUERY_STRING, {
        method: 'POST',
        headers: loginHeaders,
        credentials: 'include',
        body: formData
    });

    const loginResponse = await fetch(loginRequest);

    console.log(loginRequest);
    console.log(loginHeaders);
    console.log(formData.toString());
    console.log('\n\n')
    console.log(loginResponse.status);
    console.log(loginResponse.headers);
    console.log(await loginResponse.text());

    // const testRequestResponse = fetch(ORIGIN, {
    //     headers: new Headers({
    //         'Cookie': latestCookies,
    //         ...defaultGetHeaders
    //     })
    // })

    // console.log(await (await testRequestResponse).text())
    // console.log(testRequestResponse.ok);
}

main();