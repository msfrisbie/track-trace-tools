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

## Testing

To run tests:

    $ yarn test:unit

## License

Track & Trace Tools is released under the GPL-3.0 license
