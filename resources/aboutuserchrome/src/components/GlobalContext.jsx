import React, { createContext } from "react";
const {
  PREF_UPDATE_INTERVAL,
  PREF_NOTIFICATIONS_ENABLED,
} = ChromeUtils.importESModule(
  "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs"
);

export const ucUtils =
  window._ucUtils || window.docShell.chromeEventHandler.ownerGlobal._ucUtils;
export const PREF_BRANCH = "userChromeJS.";
export const PREF_ENABLED = "userChromeJS.enabled";
export const PREF_SCRIPTSDISABLED = "userChromeJS.scriptsDisabled";
export const PREF_GBROWSERHACK_ENABLED = "userChromeJS.gBrowser_hack.enabled";
export const PREF_GBROWSERHACK_REQUIRED = "userChromeJS.gBrowser_hack.required";
export const DEFAULT_PATH = "scripts";

export const GlobalContext = createContext({});

export const gPrefs = {
  get(pref, def) {
    const { prefs } = Services;
    try {
      switch (prefs.getPrefType(pref)) {
        case 0:
          return def;
        case 32:
          return prefs.getStringPref(pref, def);
        case 64:
          return prefs.getIntPref(pref, def);
        case 128:
          return prefs.getBoolPref(pref, def);
      }
    } catch (ex) {}
    return def;
  },
  set: (pref, value) => {
    const { prefs } = Services;
    switch (typeof value) {
      case "string":
        prefs.setStringPref(pref, value);
        break;
      case "number":
        prefs.setIntPref(pref, value);
        break;
      case "boolean":
        prefs.setBoolPref(pref, value);
        break;
    }
  },
};

export class GlobalContextProvider extends React.Component {
  constructor(props) {
    super(props);

    this.navigate = newPath => {
      if (newPath !== this.state.path) {
        this.setState({ path: newPath });
        window.history.pushState({ path: newPath }, "");
      }
    };

    this.state = {
      path: DEFAULT_PATH,
      navigate: this.navigate,
      missingFxAutoconfig: !ucUtils,
      outdatedFxAutoconfig: !ucUtils?.parseStringAsScriptInfo,
      scripts: ucUtils?.getScriptData().map(script => ({
        ...script,
        path: script.asFile().path,
      })),
      ucjsEnabled: gPrefs.get(PREF_ENABLED, false),
      scriptsDisabled: gPrefs.get(PREF_SCRIPTSDISABLED, ""),
      gBrowserHackEnabled: gPrefs.get(PREF_GBROWSERHACK_ENABLED, false),
      gBrowserHackRequired: gPrefs.get(PREF_GBROWSERHACK_REQUIRED, false),
      updateInterval: gPrefs.get(PREF_UPDATE_INTERVAL, 86400000), // 24 hours
      notificationsEnabled: gPrefs.get(PREF_NOTIFICATIONS_ENABLED, true),
      updateCount: 0,
      setUpdateCount: count => {
        this.setState({ updateCount: count });
      },
    };

    window.history.replaceState({ path: this.state.path }, "");

    window.addEventListener("popstate", this);
    Services.prefs.addObserver(PREF_BRANCH, this);
  }

  handleEvent(event) {
    switch (event.type) {
      case "popstate":
        this.setState({ path: event.state?.path || DEFAULT_PATH });
        break;
    }
  }

  observe(subject, topic, data) {
    switch (topic) {
      case "nsPref:changed":
        switch (data) {
          case PREF_ENABLED:
            this.setState({
              ucjsEnabled: gPrefs.get(PREF_ENABLED, false),
            });
            break;
          case PREF_SCRIPTSDISABLED:
            this.setState({
              scriptsDisabled: gPrefs.get(PREF_SCRIPTSDISABLED, ""),
            });
            break;
          case PREF_GBROWSERHACK_ENABLED:
            this.setState({
              gBrowserHackEnabled: gPrefs.get(PREF_GBROWSERHACK_ENABLED, false),
            });
            break;
          case PREF_GBROWSERHACK_REQUIRED:
            this.setState({
              gBrowserHackRequired: gPrefs.get(
                PREF_GBROWSERHACK_REQUIRED,
                false
              ),
            });
            break;
          case PREF_UPDATE_INTERVAL:
            this.setState({
              updateInterval: gPrefs.get(PREF_UPDATE_INTERVAL, 86400000),
            });
            break;
          case PREF_NOTIFICATIONS_ENABLED:
            this.setState({
              notificationsEnabled: gPrefs.get(
                PREF_NOTIFICATIONS_ENABLED,
                true
              ),
            });
            break;
        }
        break;
    }
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this);
    Services.prefs.removeObserver(PREF_BRANCH, this);
  }

  render() {
    return (
      <GlobalContext.Provider value={this.state}>
        {this.props.children}
      </GlobalContext.Provider>
    );
  }
}
