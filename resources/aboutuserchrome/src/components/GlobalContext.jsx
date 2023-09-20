import React, { createContext } from "react";
const { PREF_UPDATE_INTERVAL, PREF_NOTIFICATIONS_ENABLED } =
  ChromeUtils.importESModule(
    "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs"
  );
const { _ucUtils: ucUtils } = ChromeUtils.importESModule(
  "chrome://userchromejs/content/utils.sys.mjs"
);

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
  set(pref, value) {
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

    this.navigate = (newPath, pushState = true) => {
      let path = newPath.replace(/^\/+|\/+$/g, "");
      if (path !== this.state.path) {
        this.setState({ path, initialFocus: false });
        window.history[pushState ? "pushState" : "replaceState"](
          { ...window.history.state, path, initialFocus: false },
          ""
        );
      }
    };
    this.setSearch = terms => {
      if (!this.state.search && terms) {
        window.history.pushState(
          { ...window.history.state, search: terms },
          ""
        );
      } else {
        window.history.replaceState(
          { ...window.history.state, search: terms },
          ""
        );
      }
      this.setState({ search: terms });
    };
    this.setUpdateCount = count => {
      this.setState({ updateCount: count });
    };
    this.setInitialFocus = focus => {
      this.setState({ initialFocus: focus });
      window.history.replaceState(
        { ...window.history.state, initialFocus: focus },
        ""
      );
    };

    this.state = {
      path: window.history?.state?.path || DEFAULT_PATH,
      navigate: this.navigate,
      restart: () => ucUtils?.restart(true),
      search: window.history?.state?.search || "",
      setSearch: this.setSearch,
      missingFxAutoconfig: !ucUtils,
      outdatedFxAutoconfig:
        !ucUtils?.parseStringAsScriptInfo ||
        ucUtils?.getScriptData.toString().startsWith("()"),
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
      setUpdateCount: this.setUpdateCount,
      initialFocus: window.history?.state?.initialFocus ?? true,
      setInitialFocus: this.setInitialFocus,
    };

    window.history.replaceState(
      {
        path: this.state.path,
        initialFocus: this.state.initialFocus,
        search: this.state.search,
      },
      ""
    );

    window.addEventListener("popstate", this);
    Services.prefs.addObserver(PREF_BRANCH, this);
  }

  handleEvent(event) {
    switch (event.type) {
      case "popstate":
        this.setState({
          ...event.state,
          path: event.state?.path || DEFAULT_PATH,
        });
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
