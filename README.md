# Welcome to Track & Trace Tools

[![CircleCI](https://dl.circleci.com/status-badge/img/gh/msfrisbie/track-trace-tools/tree/master.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/msfrisbie/track-trace-tools/tree/master)

## What's Track & Trace Tools?

Track & Trace Tools is an open source browser extension that adds extra features to [Metrc](https://www.metrc.com). It is not affiliated with Metrc.

## Liability

This software is released under the GPL-3 license. [Read a quick overview of this license](https://www.gnu.org/licenses/gpl-3.0.txt).

## Getting Started

1.  After downloading the repository, install the required packages:

        $ yarn install --ignore-engines

2.  Build the extension:

    To build for local development:

        $ yarn serve

    To build for production:

        $ yarn build

3.  Once the build has finished, load the `dist/` directory into your browser.

## Troubleshooting

### Apple Silicon OpenSSL Error

You may experience the following error when running T3 on Apple Silicon:

```
Error: error:0308010C:digital envelope routines::unsupported
    at new Hash (node:internal/crypto/hash:71:19)
    at Object.createHash (node:crypto:133:10)
    at module.exports (/Users/mattfrisbie/Projects/track-trace-tools/node_modules/webpack/lib/util/createHash.js:135:53)
    at NormalModule._initBuildHash (/Users/mattfrisbie/Projects/track-trace-tools/node_modules/webpack/lib/NormalModule.js:417:16)
    at handleParseError (/Users/mattfrisbie/Projects/track-trace-tools/node_modules/webpack/lib/NormalModule.js:471:10)
    at /Users/mattfrisbie/Projects/track-trace-tools/node_modules/webpack/lib/NormalModule.js:503:5
    at /Users/mattfrisbie/Projects/track-trace-tools/node_modules/webpack/lib/NormalModule.js:358:12
    at /Users/mattfrisbie/Projects/track-trace-tools/node_modules/loader-runner/lib/LoaderRunner.js:373:3
    at iterateNormalLoaders (/Users/mattfrisbie/Projects/track-trace-tools/node_modules/loader-runner/lib/LoaderRunner.js:214:10)
    at iterateNormalLoaders (/Users/mattfrisbie/Projects/track-trace-tools/node_modules/loader-runner/lib/LoaderRunner.js:221:10)
    at /Users/mattfrisbie/Projects/track-trace-tools/node_modules/loader-runner/lib/LoaderRunner.js:236:3
    at context.callback (/Users/mattfrisbie/Projects/track-trace-tools/node_modules/loader-runner/lib/LoaderRunner.js:111:13)
    at /Users/mattfrisbie/Projects/track-trace-tools/node_modules/cache-loader/dist/index.js:147:7
    at /Users/mattfrisbie/Projects/track-trace-tools/node_modules/graceful-fs/graceful-fs.js:61:14
    at FSReqCallback.oncomplete (node:fs:201:23) {
  opensslErrorStack: [ 'error:03000086:digital envelope routines::initialization error' ],
  library: 'digital envelope routines',
  reason: 'unsupported',
  code: 'ERR_OSSL_EVP_UNSUPPORTED'
}
```

Solution:

Add the following to your .zshrc or similar:

`export NODE_OPTIONS=--openssl-legacy-provider`

## Testing

To run tests:

    $ yarn test:unit

## License

Track & Trace Tools is released under the GPL-3.0 license
