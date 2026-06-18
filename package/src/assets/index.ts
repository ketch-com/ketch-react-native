import { createUrlParamsObject } from '../util/helpers';
import type { KetchMobile } from '../types';

export const getIndexHtml = (parameters: KetchMobile) => {
  const urlParams = createUrlParamsObject(parameters);
  const parametersStringified = JSON.stringify(urlParams);
  return `
<html>
  <head>
    <style>
      body {
        height: 100dvh;
        width: 100dvw;
        min-height: -webkit-fill-available;
      }
    </style>
    <meta
      name="viewport"
      content="width=device-width, height=device-height, initial-scale=1, viewport-fit=cover"
    />
  </head>
  <body>
    <script>

      window.semaphore = window.semaphore || [];
      window.ketch = function () {
        window.semaphore.push(arguments);
      };

      // Simulating events similar to ones coming from lanyard.js
      // TODO: remove this once JS SDK covers all required events
      function emitEvent(event, args) {
        if (
          window.androidListener ||
          (window.webkit && window.webkit.messageHandlers) ||
          (window.ReactNativeWebView && window.ReactNativeWebView.postMessage)
        ) {
          const filteredArgs = [];
          for (const arg of args) {
            if (arg !== this) {
              filteredArgs.push(arg);
            }
          }
          let argument;
          if (
            filteredArgs.length === 1 &&
            typeof filteredArgs[0] === 'string'
          ) {
            argument = filteredArgs[0];
          } else if (filteredArgs.length === 1) {
            argument = JSON.stringify(filteredArgs[0]);
          } else if (filteredArgs.length > 1) {
            argument = JSON.stringify(filteredArgs);
          }
          if (window.androidListener && event in window.androidListener) {
            if (filteredArgs.length === 0) {
              window.androidListener[event]();
            } else {
              window.androidListener[event](argument);
            }
          } else if (
            window.webkit &&
            window.webkit.messageHandlers &&
            event in window.webkit.messageHandlers
          ) {
            window.webkit.messageHandlers[event].postMessage(argument);
          } else if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ event, data: argument }))
          } else {
            console.warn(
              \`Can't pass message to native code because '\${event}' handler is not registered\`
            );
          }
        }
      }

      // This is required to detect the moment when Ketch Tag is loaded sucessfully and ready
      // TODO: Remove this once lanyard.js will emit "onConfigLoaded" event, to avoid redundant "config.json" requests to server
      ketch('getFullConfig', function (config) {
        emitEvent('onConfigLoaded', [config]);
      });

      // Simulating "error" event
      // Capturing all the unhandled crashes of Ketch Tag
      window.addEventListener('error', (event) => {
        const errorMessage = \`\${event.message}\`;
        emitEvent('error', [errorMessage]);
      });

      // Capturing all the unhandled promise rejections of Ketch Tag
      window.addEventListener('unhandledrejection', (event) => {
        const errorMessage = \`\${event.reason.message}\`;
        emitEvent('error', [errorMessage]);
      });

      // Capturing all the internal loggin for errors handled by Ketch Tag
      // TODO: Remove this once lanyard.js will emit error events
      ((logger) => {
        var oldErr = logger.error;
        logger.error = (...args) => {
          emitEvent('error', [args.join(' ')]);
          oldErr(...args);
        };
      })(window.console);

      // A temporary workaround to get banner/modal dimensions on tablets
      // TODO: remove this once there will be a way to get dialogs position from JS SDK
      function getDialogSize() {
        var domElem = document.querySelector(
          '#lanyard_root div[role="dialog"]'
        );
        if (!domElem) {
          return;
        }
        var domRect = domElem.getBoundingClientRect();
        if (domRect) {
          return domRect;
        }
      }

      function initKetchTag(parameters) {
        console.log('Ketch Tag is initialization started...');

        // Mirror init params into the URL bar for Ketch Tag; read boot config from
        // the init object itself (no query-string round-trip).
        const urlParams = new URLSearchParams();
        for (const key in parameters) {
          if (!Object.prototype.hasOwnProperty.call(parameters, key)) continue;
          const value = parameters[key];
          if (value !== undefined && value !== null && typeof value !== 'object') {
            urlParams.set(key, String(value));
          }
        }
        window.history.replaceState({}, '', '?' + urlParams.toString());

        const url =
          parameters.ketch_mobilesdk_url ||
          'https://global.ketchcdn.com/web/v3';
        const orgCode = parameters.organizationCode;
        const propertyName = parameters.propertyCode;
        console.log('Ketch org data:', orgCode, propertyName, url);

        if (orgCode && propertyName) {
          var e = document.createElement('script');
          e.type = 'text/javascript';
          e.src = \`\${url}/config/\${orgCode}/\${propertyName}/boot.js\`;
          e.defer = e.async = !0;
          document.getElementsByTagName('head')[0].appendChild(e);
        }
      }
      // We put the script inside body, otherwise document.body will be null
      // Trigger taps outside the dialog
      document.body.addEventListener('touchstart', function (e) {
        if (e.target === document.body) {
          emitEvent('tapOutside', [getDialogSize()]);
        }
      });

      initKetchTag(${parametersStringified});
    </script>
  </body>
</html>
`;
};

/** JS hook body that redirects script/fetch URLs (used in HTML head and beforeContentLoaded). */
const buildWebResourceUrlOverridesHook = (
  overridesJson: string
) => `(function () {
  var overrides = ${overridesJson};
  if (!overrides || !Object.keys(overrides).length) return;
  function resolveUrl(url) {
    if (!url) return url;
    if (overrides[url]) return overrides[url];
    var base = url.split('?')[0].split('#')[0];
    if (base !== url && overrides[base]) return overrides[base];
    for (var key in overrides) {
      if (!Object.prototype.hasOwnProperty.call(overrides, key)) continue;
      if (key === url || key === base) continue;
      if (key.charAt(0) === '/' && base.indexOf(key) !== -1) return overrides[key];
      if (key.indexOf('://') !== -1) continue;
      if (base.endsWith(key) || base.indexOf('/' + key) !== -1) return overrides[key];
    }
    return url;
  }
  var srcDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
  if (srcDesc && srcDesc.set) {
    var nativeSrcSet = srcDesc.set;
    var nativeSrcGet = srcDesc.get;
    Object.defineProperty(HTMLScriptElement.prototype, 'src', {
      set: function (value) { nativeSrcSet.call(this, resolveUrl(value)); },
      get: nativeSrcGet,
      configurable: true,
    });
  }
  var origSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    if (name === 'src' && this.tagName === 'SCRIPT') {
      return origSetAttribute.call(this, name, resolveUrl(value));
    }
    return origSetAttribute.call(this, name, value);
  };
  if (window.fetch) {
    var origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (typeof input === 'string') {
        var mapped = resolveUrl(input);
        if (mapped !== input) input = mapped;
      } else if (input && input.url) {
        var mappedUrl = resolveUrl(input.url);
        if (mappedUrl !== input.url) input = new Request(mappedUrl, input);
      }
      return origFetch(input, init);
    };
  }
})();`;

export const getWebResourceUrlOverridesInjectionScript = (
  overrides?: Record<string, string>
): string | undefined => {
  if (!overrides || !Object.keys(overrides).length) {
    return undefined;
  }
  return `${buildWebResourceUrlOverridesHook(JSON.stringify(overrides))} true;`;
};

/**
 * Injects URL override hooks in <head> before any body scripts (iOS WebConfig parity).
 */
export const injectWebResourceUrlOverridesIntoHtml = (
  html: string,
  overrides?: Record<string, string>
) => {
  if (!overrides || !Object.keys(overrides).length) {
    return html;
  }
  const script = `<script>${buildWebResourceUrlOverridesHook(JSON.stringify(overrides))}</script>`;
  return html.replace('<head>', `<head>\n${script}`);
};

/**
 * Injects the given CSS as a <style> tag before </head> in provided html.
 * Used for runtime cssOverride support.
 */
export const injectCssIntoHtml = (html: string, css?: string) => {
  if (css && css.trim()) {
    const cssTag = `<style>${css}</style>`;
    return html.replace('</head>', `${cssTag}\n</head>`);
  }
  return html;
};
