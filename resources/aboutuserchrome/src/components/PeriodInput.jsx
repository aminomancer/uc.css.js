import React, { useState, useCallback, useEffect } from "react";

export function getValueString(value) {
  let days = Math.floor(value / 86400000);
  let hours = Math.floor((value % 86400000) / 3600000);
  let minutes = Math.floor((value % 3600000) / 60000);
  let dayString = days > 0 ? `${days} ${days > 1 ? "days" : "day"}` : "";
  let hourString = hours > 0 ? `${hours} ${hours > 1 ? "hours" : "hour"}` : "";
  let minuteString =
    minutes > 0 ? `${minutes} ${minutes > 1 ? "minutes" : "minute"}` : "";
  let strings = [dayString, hourString, minuteString].filter(Boolean);
  if (strings.length > 2) {
    strings = [strings.slice(0, -1).join(", "), strings.slice(-1)[0]];
    return strings.join(", and ");
  }
  return strings.join(" and ");
}

export const PeriodInputField = ({ id, value, suffix, ...props }) => {
  const focusInput = useCallback(event => {
    event.target.querySelector("input").focus();
  }, []);
  return (
    <label // eslint-disable-line jsx-a11y/no-noninteractive-element-interactions
      htmlFor={id}
      className="period-input-field"
      onFocus={focusInput}
      onMouseUp={focusInput}>
      <input type="text" id={id} value={value} size="1" {...props} />
      <span className="period-input-sizer">{value || "0"}</span>
      {suffix && <span>{suffix}</span>}
    </label>
  );
};

export const PeriodInput = ({
  defaultValue = 0,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  onChange,
  onError,
  id,
  ...props
}) => {
  const [days, setDays] = useState(Math.floor(defaultValue / 86400000) || null);
  const [hours, setHours] = useState(
    Math.floor((defaultValue % 86400000) / 3600000) || null
  );
  const [minutes, setMinutes] = useState(
    Math.floor((defaultValue % 3600000) / 60000) || null
  );
  const [errorMessage, setErrorMessage] = useState(null);

  const handleInput = useCallback(event => {
    let { value } = event.target;
    if (value?.toString().length > 10) return;
    let valueAsNumber = parseInt(value, 10);
    switch (event.target.name) {
      case "days":
        setDays(valueAsNumber || null);
        break;
      case "hours":
        setHours(valueAsNumber || null);
        break;
      case "minutes":
        setMinutes(valueAsNumber || null);
        break;
    }
  }, []);
  const handleBlur = useCallback(
    event => {
      let blurredInput = event.target?.closest(".period-input");
      let focusedInput = event.relatedTarget?.closest(".period-input");
      if (focusedInput && focusedInput === blurredInput) return;
      let totalMs =
        (days || 0) * 86400000 +
        (hours || 0) * 3600000 +
        (minutes || 0) * 60000;
      if (totalMs > min && totalMs < max) {
        setDays(Math.floor(totalMs / 86400000));
        setHours(Math.floor((totalMs % 86400000) / 3600000));
        setMinutes(Math.floor((totalMs % 3600000) / 60000));
      }
    },
    [days, hours, max, min, minutes]
  );
  const selectNearestInput = useCallback(event => {
    if (event.target.localName !== "div") return;
    let inputs = [...event.target.querySelectorAll("input")];
    let clickX = event.clientX;
    let sortedInputs = inputs.sort((a, b) => {
      let aRect = a.getBoundingClientRect();
      let bRect = b.getBoundingClientRect();
      let aDistance = Math.abs(aRect.x + aRect.width / 2 - clickX);
      let bDistance = Math.abs(bRect.x + bRect.width / 2 - clickX);
      return aDistance - bDistance;
    });
    let [nearestInput] = sortedInputs;
    nearestInput.focus();
    event.preventDefault();
  }, []);

  useEffect(() => {
    let totalMs =
      (days || 0) * 86400000 + (hours || 0) * 3600000 + (minutes || 0) * 60000;
    if (totalMs < min) {
      setErrorMessage(`Must be at least ${getValueString(min)}`);
      onError?.(totalMs);
    } else if (totalMs > max) {
      setErrorMessage(`Must be at most ${getValueString(max)}`);
      onError?.(totalMs);
    } else {
      setErrorMessage(null);
      onChange(totalMs);
    }
  }, [days, hours, max, min, minutes, onChange, onError]);

  return (
    <>
      <div // eslint-disable-line jsx-a11y/no-noninteractive-element-interactions
        className={`period-input${errorMessage ? " error" : ""}`}
        id={id}
        role="form"
        onMouseDown={selectNearestInput}
        onBlurCapture={handleBlur}
        {...props}>
        <PeriodInputField
          name="days"
          id={id ? `${id}-days` : null}
          value={days || ""}
          placeholder="0"
          suffix="d"
          onInput={handleInput}
        />
        <PeriodInputField
          name="hours"
          id={id ? `${id}-hours` : null}
          value={hours || ""}
          placeholder="0"
          suffix="h"
          onInput={handleInput}
        />
        <PeriodInputField
          name="minutes"
          id={id ? `${id}-minutes` : null}
          value={minutes || ""}
          placeholder="0"
          suffix="m"
          onInput={handleInput}
        />
      </div>
      {errorMessage && (
        <div className="period-input-error-message">{errorMessage}</div>
      )}
    </>
  );
};
