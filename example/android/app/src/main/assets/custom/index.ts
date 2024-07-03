export default `<html>
<head>
  <script>
    const setQueryParameters = () => {};
  </script>

  <script>
    // Get parameters inject into webview
    const parameters = JSON.parse(
      window.ReactNativeWebView.injectedObjectJson()
    );

    console.log(window.location);

    // let params = new URL(document.location).searchParams;

    // setQueryParameters(parameters);

    window.semaphore = window.semaphore || [];
    window.ketch = function () {
      window.semaphore.push(arguments);
    };

    // Simulating events similar to ones coming from lanyard.js
    // TODO: remove this once JS SDK covers all required events
    function emitEvent(event, args) {
      if (
        window.androidListener ||
        (window.webkit && window.webkit.messageHandlers)
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

    // Get query parameters
    let params = new URL(document.location).searchParams;

    // Get url override from query parameters
    let url =
      params.get('ketch_mobilesdk_url') ||
      'https://global.ketchcdn.com/web/v3';

    // Get property name from query parameters
    let propertyName = params.get('propertyName');

    // Get organization code from query parameters
    let orgCode = params.get('orgCode');

    if (orgCode && propertyName) {
      var e = document.createElement('script');
      e.type = 'text/javascript';
      e.src = \`\${url}/config/\${orgCode}/\${propertyName}/boot.js\`;
      e.defer = e.async = !0;
      document.getElementsByTagName('head')[0].appendChild(e);
    }
  </script>
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
    // We put the script inside body, otherwise document.body will be null
    // Trigger taps outside of the dialog
    document.body.addEventListener('touchstart', function (e) {
      if (e.target === document.body) {
        emitEvent('tapOutside', [getDialogSize()]);
      }
    });
  </script>
</body>
</html>
`;
