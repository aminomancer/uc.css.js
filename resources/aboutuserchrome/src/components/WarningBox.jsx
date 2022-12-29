/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

const MessageBox = ({ description, linkText, linkURL }) => {
  if (!description) return null;
  return (
    <div className="message-box">
      <div className="message">
        <p>
          <strong>{description}</strong>
        </p>
        {linkText && linkURL ? (
          <p>
            <a href={linkURL} target="_blank">
              {linkText}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
};

export const WarningBox = ({ missingFxAutoconfig, outdatedFxAutoconfig }) => {
  let message = {};
  if (missingFxAutoconfig || outdatedFxAutoconfig) {
    message.description = `fx-autoconfig is ${
      missingFxAutoconfig ? "not installed" : "outdated"
    }.`;
    message.linkText = "Download fx-autoconfig";
    message.linkURL = "https://github.com/MrOtherGuy/fx-autoconfig";
  }
  return <MessageBox {...message} />;
};
