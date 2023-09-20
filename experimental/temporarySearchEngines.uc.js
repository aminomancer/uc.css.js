(function () {
  function init() {
    const lazy = {};
    ChromeUtils.defineESModuleGetters(lazy, {
      BrowserSearchTelemetry:
        "resource:///modules/BrowserSearchTelemetry.sys.mjs",
      BrowserWindowTracker: "resource:///modules/BrowserWindowTracker.sys.mjs",
      ExtensionSearchHandler:
        "resource://gre/modules/ExtensionSearchHandler.sys.mjs",
      ObjectUtils: "resource://gre/modules/ObjectUtils.sys.mjs",
      OpenSearchEngine: "resource://gre/modules/OpenSearchEngine.sys.mjs",
      PartnerLinkAttribution:
        "resource:///modules/PartnerLinkAttribution.sys.mjs",
      QuickSuggest: "resource:///modules/QuickSuggest.sys.mjs",
      UrlbarPrefs: "resource:///modules/UrlbarPrefs.sys.mjs",
      UrlbarProviderQuickSuggest:
        "resource:///modules/UrlbarProviderQuickSuggest.sys.mjs",
      UrlbarProvidersManager:
        "resource:///modules/UrlbarProvidersManager.sys.mjs",
      UrlbarProviderTabToSearch:
        "resource:///modules/UrlbarProviderTabToSearch.sys.mjs",
      UrlbarResult: "resource:///modules/UrlbarResult.sys.mjs",
      UrlbarSearchUtils: "resource:///modules/UrlbarSearchUtils.sys.mjs",
      UrlbarUtils: "resource:///modules/UrlbarUtils.sys.mjs",
      UrlbarView: "resource:///modules/UrlbarView.sys.mjs",
    });

    const UrlbarProvidersManager = gURLBar.view.controller.manager;

    let UrlbarProviderContextualSearch = UrlbarProvidersManager.getProvider(
      "UrlbarProviderContextualSearch"
    );

    // share an engine cache with the urlbar provider to avoid redundancy.
    // this is a map of hostname -> engine
    const { engines } = UrlbarProviderContextualSearch;

    function getEngineByName(engineName) {
      if (!Services.search.hasSuccessfullyInitialized) {
        return null;
      }
      let engine = Services.search.getEngineByName(engineName);
      if (engine) {
        return engine;
      }
      for (let [hostname, engine] of engines) {
        if (engine.name === engineName) {
          return engine;
        }
      }
      return null;
    }

    lazy.UrlbarSearchUtils.getEngineByName = getEngineByName;

    let muxer = gURLBar.controller.manager.muxers.get("UnifiedComplete");

    if (!muxer._canAddResult.TSE_modified) {
      eval(
        `muxer._canAddResult = function ${muxer._canAddResult
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(
            /let engine = Services\.search\.getEngineByName\(\s*state\.context\.searchMode\.engineName\s*\);/,
            /* javascript */ `let engine = getEngineByName(state.context.searchMode.engineName);`
          )}`
      );
      muxer._canAddResult.TSE_modified = true;
    }

    if (!gURLBar.controller.speculativeConnect.TSE_modified) {
      eval(
        `gURLBar.controller.speculativeConnect = function ${gURLBar.controller.speculativeConnect
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(
            /let engine = Services\.search\.getEngineByName\(\s*result\.payload\.engine\s*\);/,
            /* javascript */ `let engine = getEngineByName(result.payload.engine);`
          )}`
      );
      gURLBar.controller.speculativeConnect.TSE_modified = true;
    }

    if (!gURLBar.pickResult.TSE_modified) {
      const SCALAR_CATEGORY_TOPSITES = "contextual.services.topsites.click";
      eval(
        `gURLBar.pickResult = function ${gURLBar.pickResult
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(
            /const engine = Services\.search\.getEngineByName\(result\.payload\.engine\);/,
            /* javascript */ `let engine = getEngineByName(result.payload.engine);`
          )}`
      );
      gURLBar.pickResult.TSE_modified = true;
    }

    if (!gURLBar.setSearchMode.TSE_modified) {
      eval(
        `gURLBar.setSearchMode = function ${gURLBar.setSearchMode
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(
            /const engine = Services\.search\.getEngineByName\(searchMode\.engineName\);/,
            /* javascript */ `let engine = getEngineByName(searchMode.engineName);`
          )}`
      );
      gURLBar.setSearchMode.TSE_modified = true;
    }

    // TODO - find some way to modify Search in UrlbarProviderPlaces.sys.mjs

    async function onCommand() {
      let engine;
      const hostname = gBrowser.currentURI.host;
      let window = lazy.BrowserWindowTracker.getTopWindow();
      if (!hostname) {
        window.BrowserSearch.webSearch();
        return;
      }

      if (engines.has(hostname)) {
        engine = engines.get(hostname);
      } else {
        const [host] = lazy.UrlbarUtils.stripPrefixAndTrim(hostname, {
          stripWww: true,
        });
        engine = (
          await lazy.UrlbarSearchUtils.enginesForDomainPrefix(host, {
            matchAllDomainLevels: true,
            onlyEnabled: false,
          })
        )[0];
      }

      if (engine) {
        engines.set(hostname, engine);
        let defaultEngine = lazy.UrlbarSearchUtils.getDefaultEngine();
        if (engine.name === defaultEngine?.name) {
          window.BrowserSearch.webSearch();
          return;
        }
        // TODO - set the urlbar search mode to the found engine
        gURLBar.searchMode = {
          engineName: engine.name,
          entry: "shortcut",
        };
        return;
      }

      let engineToAdd = window?.gBrowser.selectedBrowser?.engines?.[0];
      if (engineToAdd) {
        let newEngine = new lazy.OpenSearchEngine({ shouldPersist: false });
        newEngine._setIcon(engineToAdd.icon, false);
        await new Promise(resolve => {
          newEngine.install(engineToAdd.uri, errorCode => {
            resolve(errorCode);
          });
        });
        engines.set(hostname, newEngine);
        // TODO - set the urlbar search mode to the created engine
        gURLBar.searchMode = {
          engineName: newEngine.name,
          entry: "shortcut",
        };
        return;
      }

      window.BrowserSearch.webSearch();
    }
  }

  if (gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
