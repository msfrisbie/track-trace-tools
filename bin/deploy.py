import sys


def wait_for_enter():
    input("Press Enter to continue")

    print("""




""")


class StopLocalBuild(object):
    def run(self, context):
        print('''
Stop local development watcher
''')
        wait_for_enter()


class RunTests(object):
    def run(self, context):
        print('''
Run:

    npm run test:unit
''')
        wait_for_enter()


class IncrementVersionNumber(object):
    def run(self, context):
        print('''
Run:

    npm version major/minor/patch
''')
        wait_for_enter()


class BuildProductionAssets(object):
    def run(self, context):
        print('''
Run:

    npm run build
''')
        wait_for_enter()


# class AddCssToProductionAssets(object):
#     def run(self, context):
#         print('''
# Replace in manifest.json:

#     - "css": [
#         "css/content-script.<cachebust>.css",
#     ]
# ''')
#         wait_for_enter()


class ChromeTest(object):
    def run(self, context):
        print('''
Perform full test in Chrome:

    - chrome://extensions
    - Load upacked
''')
        wait_for_enter()


class FirefoxTest(object):
    def run(self, context):
        print('''
Perform full test in Firefox:

    - about:debugging#/runtime/this-firefox
    - Load Temporary Add-on...
''')
        wait_for_enter()


class DomShimTest(object):
    def run(self, context):
        print('''
Check that requestAF / getCS dom shim is in place in Firefox

    - Check that popover renders correctly
    - Copy code from reference/shim/dom.js to node_modules/bootstrap-vue/esm/utils/dom.js
''')
        wait_for_enter()


class BuildRelease(object):
    def run(self, context):
        print('''
Run:
    sh bin/build-release.sh
''')
        wait_for_enter()


class UploadToChrome(object):
    def run(self, context):
        print('''
Upload chrome zip to Chrome Developer Dashboard:

    https://chrome.google.com/u/1/webstore/devconsole/01a931ab-e1d9-4f2b-85d4-89f58c482221/ncgolofjahimgobkmbplikkbbmilccje/edit/package
''')
        wait_for_enter()


class UploadToFirefox(object):
    def run(self, context):
        print('''
Upload firefox zip to Firefox Addons Dashboard:

    https://addons.mozilla.org/en-US/developers/addon/track-trace-tools/versions/submit/
''')
        wait_for_enter()


class CommitRelease(object):
    def run(self, context):
        print('''
Commit the release:

    git push origin master <release>
''')
#         print('''
# Commit the release:

#     git add . && git commit -m "release X"
# ''')
        wait_for_enter()


if __name__ == "__main__":
    # context = {"username": sys.argv[1]}
    context = {}

    procedure = [
        StopLocalBuild(),
        RunTests(),
        IncrementVersionNumber(),
        BuildProductionAssets(),
        # AddCssToProductionAssets(),
        ChromeTest(),
        FirefoxTest(),
        DomShimTest(),
        # RemoveLocalRefsFromProductionAssets(),
        BuildRelease(),
        UploadToFirefox(),
        UploadToChrome(),
        # CommitRelease(),
    ]

    for step in procedure:
        step.run(context)

    print("""
    
Done.

""")
