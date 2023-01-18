/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { useRef, useLayoutEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import powershell from "react-syntax-highlighter/dist/esm/languages/prism/powershell";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import diff from "react-syntax-highlighter/dist/esm/languages/prism/diff";
import ini from "react-syntax-highlighter/dist/esm/languages/prism/ini";
import regex from "react-syntax-highlighter/dist/esm/languages/prism/regex";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup";

/**
 * @param {string} uri
 * @returns {string}
 */
function markdownUriTransformer(uri) {
  const url = (uri || "").trim();
  const first = url.charAt(0);
  if (first === "#" || first === "/") return url;
  const colon = url.indexOf(":");
  if (colon === -1) return url;
  let index = -1;
  const protocols = ["http", "https", "mailto", "tel", "about", "chrome"];
  while (++index < protocols.length) {
    const protocol = protocols[index];
    if (
      colon === protocol.length &&
      url.slice(0, protocol.length).toLowerCase() === protocol
    ) {
      return url;
    }
  }
  index = url.indexOf("?");
  if (index !== -1 && colon > index) return url;
  index = url.indexOf("#");
  if (index !== -1 && colon > index) return url;
  return "";
}

export const RichDescription = ({ description, prefix = "" }) => {
  const descriptionRef = useRef();
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(true);
  const [descriptionToggleHidden, setDescriptionToggleHidden] = useState(true);
  const [darkTheme, setDarkTheme] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const toggleDescriptionCollapsed = useCallback(() => {
    setDescriptionCollapsed(previous => !previous);
  }, []);

  useLayoutEffect(() => {
    const { current } = descriptionRef;
    if (current) {
      const remSize = parseFloat(
        window.getComputedStyle(document.documentElement).fontSize
      );
      const maxHeight = 20 * remSize + 8;
      let { height } = current.firstElementChild.getBoundingClientRect();
      if (height > maxHeight) {
        setDescriptionCollapsed(true);
        setDescriptionToggleHidden(false);
      } else {
        setDescriptionCollapsed(false);
        setDescriptionToggleHidden(true);
      }
    }
  }, []);

  useLayoutEffect(() => {
    let query = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = event => {
      setDarkTheme(event.matches);
    };
    query.addEventListener("change", listener);
    return () => {
      query.removeEventListener("change", listener);
    };
  }, []);

  return (
    <div
      className={`${prefix}description-wrapper ${
        descriptionCollapsed ? `${prefix}description-collapse` : ""
      }`}
    >
      <div className={`${prefix}description`} ref={descriptionRef}>
        <ReactMarkdown
          children={description}
          className="line-break"
          linkTarget="_blank"
          transformLinkUri={markdownUriTransformer}
          remarkPlugins={[remarkBreaks]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              const language = match?.[1] || null;
              return !inline ? (
                <SyntaxHighlighter
                  children={String(children).replace(/\n$/, "")}
                  style={darkTheme ? oneDark : oneLight}
                  language={language}
                  customStyle={{
                    margin: "0",
                    background: "var(--in-content-box-background-odd)",
                  }}
                  className={"syntax-highlighted-code"}
                  wrapLongLines={true}
                  {...props}
                />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        />
      </div>
      <button
        className={`button-link ${prefix}description-toggle`}
        hidden={descriptionToggleHidden}
        onClick={toggleDescriptionCollapsed}
      >
        {descriptionCollapsed ? "Show more" : "Show less"}
      </button>
    </div>
  );
};

// Register languages for syntax highlighting
new Map([
  [bash, ["bash", "sh", "shell"]],
  [powershell, ["powershell", "ps", "PS", "ps1", "PS1"]],
  [css, ["css", "CSS"]],
  [diff, ["diff", "DIFF", "patch"]],
  [ini, ["ini", "INI", "conf", "cfg", "config"]],
  [regex, ["regex", "REGEX", "regexp"]],
  [javascript, ["javascript", "js", "JS"]],
  [json, ["json", "JSON", "json5", "JSON5"]],
  [yaml, ["yaml", "YAML", "yml", "YML"]],
  [
    markup,
    [
      "markup",
      "html",
      "HTML",
      "xml",
      "XML",
      "xhtml",
      "XHTML",
      "svg",
      "SVG",
      "mathml",
      "ssml",
      "atom",
      "rss",
      "RSS",
    ],
  ],
]).forEach((aliases, language) => {
  SyntaxHighlighter.registerLanguage(aliases[0], language);
  SyntaxHighlighter.alias(aliases[0], aliases.slice(1));
});
