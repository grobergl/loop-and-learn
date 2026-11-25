import React, { useEffect, useId, useRef, useState } from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { prepareYarnPhoto } from "./yarn-photo.js";

export function YarnPhotoInput({ photo, onChange, onBusyChange }) {
  const id = useId();
  const active = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(
    () => () => {
      active.current++;
      onBusyChange(false);
    },
    [onBusyChange],
  );
  const choose = async (event) => {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    const token = ++active.current;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const prepared = await prepareYarnPhoto(file);
      if (active.current === token) onChange(prepared);
    } catch (err) {
      if (active.current === token) setError(err.message);
    } finally {
      if (active.current === token) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  };
  return (
    <div className="yarn-photo-input" role="group" aria-label="Yarn photo">
      <p className="yarn-photo-label">
        Yarn photo or screenshot <span>(optional)</span>
      </p>
      {photo && (
        <img
          className="yarn-photo-preview"
          src={photo}
          alt="Selected yarn photo"
        />
      )}
      <div className="purchase-actions">
        <label
          className="button outline"
          htmlFor={`${id}-file`}
          aria-disabled={busy}
        >
          <ImagePlus size={16} />{" "}
          {photo ? "Replace photo or screenshot" : "Upload photo or screenshot"}
        </label>
        <input
          id={`${id}-file`}
          className="visually-hidden"
          aria-label="Upload yarn photo or screenshot"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={choose}
        />
        <label
          className="button outline"
          htmlFor={`${id}-camera`}
          aria-disabled={busy}
        >
          <Camera size={16} /> Take a photo
        </label>
        <input
          id={`${id}-camera`}
          className="visually-hidden"
          aria-label="Take a yarn photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          disabled={busy}
          onChange={choose}
        />
        {photo && (
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={() => {
              onChange(null);
              setError("");
            }}
          >
            <Trash2 size={14} /> Remove photo
          </button>
        )}
      </div>
      <p className="yarn-photo-help" id={`${id}-help`}>
        JPG, PNG, or WebP, up to 15 MB. Photos are resized and saved on this
        device with your studio. The camera option depends on your device.
      </p>
      {busy && <p role="status">Preparing your photo…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
