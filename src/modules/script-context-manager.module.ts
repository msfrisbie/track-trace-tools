import { IAtomicService } from "@/interfaces";
import { customFetch, retryDefaults } from "@/modules/fetch-manager.module";
import * as Sentry from "@sentry/browser";
import { timer } from "rxjs";

/**
 * This module was used to re-run the JavaScript needed for quick package/transfer/tpl
 * 
 * Initialize as follows:
 * 
 *  //   scriptContextManager.init();
 */

interface Metrc {
    $: any;
    kendo: any;
    notificationAlert: any;
}

// @ts-ignore
function localModalForm(title, formContent, formQuery, formSelector, submitUrl, $grid, success, openHandler, requestType) {
    // @ts-ignore
    let metrc = window.metrc as any;

    if (metrc.kendo.modalWindowOpened) return null;
    metrc.kendo.modalWindowOpened = true;

    title = title || '';
    // formUrl = formUrl || '';
    formQuery = formQuery || {};
    formSelector = formSelector || 'form';
    submitUrl = submitUrl || '';
    success = success || function () { };
    requestType = requestType || 'GET';

    let usingSpinner = metrc.startSpinner(),
        $element = metrc.$(document.createElement('div')),
        destroyModalWindow = function () {
            setTimeout(function () { $element.data('kendoWindow').destroy(); }, 1000);
            delete metrc.kendo.modalWindowOpened;
        };

    $element.kendoWindow({
        // config
        actions: ['Close'],
        draggable: true,
        modal: true,
        resizable: false,
        title: title,
        // events
        open: openHandler,
        activate: function () {
            if (usingSpinner) {
                metrc.stopSpinner();
            }

            metrc.$(formSelector)
                .find('input[type=text]:not([readonly]),select,textarea:not([readonly])')
                .filter(':visible:enabled:first')
                .focus(); // Set focus to first enabled and visible input in form
        },
        close: destroyModalWindow,
        error(e: any) {
            if (usingSpinner) {
                metrc.stopSpinner();
            }

            destroyModalWindow();
            metrc.errorResponseHandler(e.xhr);
        }
    });

    let kWindow = $element.data('kendoWindow');

    $element.html(formContent);

    $element.find(formSelector).metrcActivateAjaxForm({
        url: submitUrl,
        type: 'POST',
        success(e: any) {
            kWindow.close();
            if ($grid instanceof Array) {
                for (let i = 0, icnt = $grid.length; i < icnt; i++) {
                    $grid[i].data('kendoGrid').dataSource.read();
                }
            }
            else if ($grid) {
                $grid.data('kendoGrid').dataSource.read();
            }
            success(e);
        }
    });
    $element.find('#cancel').click(() => kWindow.close());

    kWindow.center();
    kWindow.open();

    return $element;
};

class ScriptContextManager implements IAtomicService {
    private _metrcPromise: Promise<Metrc | null>;
    private _metrcResolver: any;
    private _metrcRejecter: any;

    constructor() {
        this._metrcPromise = new Promise((resolve, reject) => {
            // If script context cant be acquired in 30s, timeout
            const id = setTimeout(() => reject('Script context timed out'), 30000);

            this._metrcResolver = (metrc: any) => {
                clearTimeout(id);
                resolve(metrc);
            };

            this._metrcRejecter = (error: any) => {
                clearTimeout(id);
                reject(error);
            };
        });

        this._metrcPromise.catch((e) => {
            console.error('Failed to send message to background:', e);

            Sentry.captureException(e);
        })
    }

    async init() {
        // init() aggressively loads script tags, which displaces other
        // resources loaded over the network. Delay 2000ms before starting
        await timer(2000).toPromise();

        const staticAssetPaths = [];
        const scriptTags = document.querySelectorAll("script");
        let authTag = null;

        // Override AJAX nonce
        // Date.now = () => {
        //     // https://github.com/jquery/jquery/blob/master/src/ajax/var/nonce.js
        //     return shimDateNow ? 0 : (new Date).getTime();
        // };

        for (let i = 0; i < scriptTags.length; ++i) {
            let scriptTag = scriptTags[i];
            let srcAttr = scriptTag.getAttribute("src");

            if (!srcAttr) {
                let inlineScriptText = scriptTag.innerText;

                if (inlineScriptText.indexOf('ApiVerificationToken') > -1) {
                    authTag = scriptTag;
                }
            } else if (srcAttr && srcAttr.startsWith("/Public")) {
                staticAssetPaths.push(srcAttr);
            }
        }

        // This fixes the setTimeout context on firefox
        window.setTimeout = window.setTimeout.bind(window);

        for (let path of staticAssetPaths) {
            let response;
            try {
                response = await customFetch(window.location.origin + path, {
                    ...retryDefaults
                });
            } catch (e) {
                console.error('Static asset fetch error:', e);
                throw e
            }

            try {
                // Angular throws some bullshit error, its Metrc's fault
                eval(await response.text());
            } catch (e) {
                console.error('Static asset eval error:', e);
            }
        }

        // This requires the 'metrc' variable to be declared in this scope.
        if (authTag) {
            try {
                // This loads the authentication data into the local metrc JS objects
                eval(authTag.innerText);
            } catch (e) {
                console.error('authTag eval error:', e);
                throw e;
            }
        }

        // This might not be present in places such as the landing page
        // @ts-ignore
        if (!!window.metrc?.kendo) {
            // @ts-ignore
            window.metrc.kendo.localModalForm = localModalForm;

            // @ts-ignore
            this._metrcResolver(window.metrc);
        } else {
            this._metrcRejecter('No metrc kendo present')
        }
    }

    async metrc(): Promise<Metrc | null> {
        return await this._metrcPromise;
    }
}

export let scriptContextManager = new ScriptContextManager();
