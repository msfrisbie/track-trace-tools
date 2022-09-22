#!/bin/bash

node bin/remove-local-endpoints.js

if [ "$?" -eq "1" ]; then
    echo "Remove endpoints failed, exiting"
    exit 1
fi

ver=`node bin/read-version.js`

if [ -z "${ver}" ]; then 
    echo "Version number is empty! Exiting."
    exit 1 
fi

rm -r releases/$ver
mkdir releases/$ver

(
    zip -r releases/$ver/dist-chrome-$ver.zip ./dist/*
)
(
    cd dist
    zip -r ../releases/$ver/dist-firefox-$ver.zip ./*
)
(
    zip -r releases/$ver/src-$ver.zip ./src/* ./public/* ./babel.config.js ./package.json ./postcss.config.js ./tailwind.config.js ./tsconfig.json ./vue.config.js ./webpack.config.js
)

git add .
git commit -m "v$ver"
git push origin master v$ver
