import React, { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Leaf,
  GraduationCap,
} from "lucide-react";
import { stitches } from "./data.js";
import { Field } from "./ProjectForms.jsx";
import {
  levels,
  suggestedLevel,
  stitchName,
  translateTerms,
} from "./project.js";
export const habits = [
  "I’ve started a few things and haven’t finished yet",
  "I pick up a project occasionally, when inspiration strikes",
  "I crochet now and then and usually finish what I start",
  "I crochet most weeks, often on one longer project",
  "I start or make one or more projects most weeks",
];
const supplies = [
  "Stuffing / fiberfill",
  "Safety eyes",
  "Yarn needles",
  "Stitch markers",
  "Measuring tape",
  "Scissors",
  "Buttons",
  "Yarn only for now",
];
export function ProfileSetup({ state, setState, close, notify }) {
  const [step, setStep] = useState(0),
    [name, setName] = useState(state.maker === "Maker" ? "" : state.maker),
    [profile, setProfile] = useState(() => ({
      habits: [],
      interests: [],
      hooks: [],
      supplies: [],
      terminology: "US",
      background: "starting",
      mood: "both",
      ...state.profile,
    })),
    [skills, setSkills] = useState({ ...state.skills }),
    [error, setError] = useState(""),
    [showAdvanced, setShowAdvanced] = useState(
      stitches.slice(9).some((s) => state.skills[s.id]),
    );
  const edit = (k, v) => setProfile((p) => ({ ...p, [k]: v }));
  const toggle = (k, v) =>
    edit(
      k,
      profile[k].includes(v)
        ? profile[k].filter((x) => x !== v)
        : [...profile[k], v],
    );
  const suggested = suggestedLevel(profile, skills);
  const save = (skipSupplies = false) => {
    if (!name.trim()) {
      setError("Add a name for your studio.");
      setStep(0);
      return;
    }
    setState((s) => ({
      ...s,
      maker: name.trim(),
      skills,
      profile: {
        ...profile,
        ...(skipSupplies
          ? {
              hooks: state.profile?.hooks || [],
              supplies: state.profile?.supplies || [],
              supplyNotes: state.profile?.supplyNotes || "",
            }
          : {}),
        level: profile.level || suggested,
        onboarded: true,
      },
    }));
    notify("Your crochet profile is saved. Change it whenever you like.");
    close();
  };
  return (
    <>
      <div className="setup-progress">
        {[
          "Your rhythm",
          "Your stitches",
          "Your preferences",
          "Your supplies",
        ].map((x, i) => (
          <span
            key={x}
            className={step === i ? "active" : step > i ? "complete" : ""}
          >
            {i + 1}
            <small>{x}</small>
          </span>
        ))}
      </div>
      {step === 0 && (
        <>
          <h3>There’s no one way to be a crocheter.</h3>
          <p className="modal-intro">
            Unfinished projects count as experience, too. Choose every
            description that feels like you.
          </p>
          <Field label="Your name or studio name">
            <input
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              required
            />
          </Field>
          <div className="setup-choices">
            {habits.map((h) => (
              <label key={h}>
                <input
                  type="checkbox"
                  checked={profile.habits.includes(h)}
                  onChange={() => toggle("habits", h)}
                />
                <span>{h}</span>
              </label>
            ))}
          </div>
          <Field label="What have you explored so far?">
            <select
              value={profile.background}
              onChange={(e) => edit("background", e.target.value)}
            >
              <option value="starting">
                I’m finding my feet / getting back into it
              </option>
              <option value="following">
                I’m comfortable following familiar patterns
              </option>
              <option value="shaping">
                I’ve tried shaping, construction, or wearables
              </option>
              <option value="complex">
                I’m comfortable adapting or designing complex projects
              </option>
            </select>
          </Field>
          <Field label="How long have you crocheted? (optional)">
            <input
              value={profile.experience || ""}
              maxLength={80}
              onChange={(e) => edit("experience", e.target.value)}
              placeholder="A few weeks, on and off for years…"
            />
          </Field>
        </>
      )}
      {step === 1 && (
        <>
          <h3>Your growing stitch toolkit</h3>
          <p className="modal-intro">
            Choose how each stitch feels today. “Mastered” is your judgment; you
            can always open its guide again.
          </p>
          <div className="setup-stitches">
            {stitches
              .filter((s, i) => showAdvanced || i < 9)
              .map((s) => (
                <label key={s.id}>
                  <span>
                    <strong>{stitchName(s, profile.terminology)}</strong>
                    <small>
                      {s.name} · {s.abbr} · US
                    </small>
                  </span>
                  <select
                    aria-label={`${s.name} familiarity`}
                    value={skills[s.id] || "Want to learn"}
                    onChange={(e) =>
                      setSkills((v) => ({ ...v, [s.id]: e.target.value }))
                    }
                  >
                    <option>Want to learn</option>
                    <option>Learning</option>
                    <option>Mastered</option>
                  </select>
                </label>
              ))}
          </div>
          <button
            className="button outline full spaced"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced
              ? "Show essentials only"
              : `Explore texture and advanced stitches (+${stitches.length - 9})`}
          </button>
          <p className="small-print">
            Bobble, shell, puff, popcorn, post stitches, lace combinations, and
            more. You do not need to know them to continue.
          </p>
        </>
      )}
      {step === 2 && (
        <>
          <h3>Make this space feel like you.</h3>
          <Field label="Show terminology first">
            <select
              value={profile.terminology}
              onChange={(e) => edit("terminology", e.target.value)}
            >
              <option value="US">US first · UK equivalents underneath</option>
              <option value="UK">UK first · US equivalents underneath</option>
            </select>
          </Field>
          <fieldset className="plain-fieldset">
            <legend>What do you enjoy making?</legend>
            <div className="choice-chips">
              {["Plushies", "Clothing", "Home", "Accessories", "Other"].map(
                (v) => (
                  <label key={v}>
                    <input
                      type="checkbox"
                      checked={profile.interests.includes(v)}
                      onChange={() => toggle("interests", v)}
                    />
                    {v}
                  </label>
                ),
              )}
            </div>
          </fieldset>
          <Field label="What would you like to find?">
            <select
              value={profile.mood}
              onChange={(e) => edit("mood", e.target.value)}
            >
              <option value="both">
                A mix of comfortable makes and new challenges
              </option>
              <option value="relax">
                Relaxing projects using familiar stitches
              </option>
              <option value="challenge">
                Projects that teach me something new
              </option>
            </select>
          </Field>
          <div className="info-box">
            <strong>Suggested starting level: {suggested}</strong>
            <p>
              Based on the stitches you marked mastered, including texture
              techniques, and the kinds of construction you’ve explored. Crochet
              frequency and years alone do not set your level. This is a
              browsing preference, not a qualification.
            </p>
          </div>
          <Field label="Your preferred level">
            <select
              value={profile.level || suggested}
              onChange={(e) => edit("level", e.target.value)}
            >
              {levels.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <p className="small-print">
            Every difficulty stays available. An experienced maker can still
            choose a simple, satisfying gift.
          </p>
        </>
      )}
      {step === 3 && (
        <>
          <h3>What’s in your crochet bag?</h3>
          <p className="modal-intro">
            This is optional. Add supplies now, or skip and come back later.
            Yarn quantities are managed in your Yarn stash.
          </p>
          <fieldset className="plain-fieldset">
            <legend>Hook sizes you have</legend>
            <div className="choice-chips">
              {[
                "2 mm",
                "2.5 mm",
                "3 mm",
                "3.5 mm",
                "4 mm",
                "4.5 mm",
                "5 mm",
                "5.5 mm",
                "6 mm",
                "7 mm",
                "8 mm",
                "10 mm",
              ].map((v) => (
                <label key={v}>
                  <input
                    type="checkbox"
                    checked={profile.hooks.includes(v)}
                    onChange={() => toggle("hooks", v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="plain-fieldset">
            <legend>Other supplies</legend>
            <div className="choice-chips">
              {supplies.map((v) => (
                <label key={v}>
                  <input
                    type="checkbox"
                    checked={profile.supplies.includes(v)}
                    onChange={() => toggle("supplies", v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Supply details (optional)">
            <textarea
              value={profile.supplyNotes || ""}
              onChange={(e) => edit("supplyNotes", e.target.value)}
              rows={3}
              placeholder="e.g. 3 pairs of 8 mm eyes, stuffing, a 12 mm hook…"
            />
          </Field>
          <p className="small-print">
            Supplies are a personal checklist; the app does not measure or
            automatically deduct their quantities.
          </p>
        </>
      )}
      <p className="form-error" role="alert">
        {error}
      </p>
      <div className="modal-actions">
        {step > 0 && (
          <button
            className="button outline"
            onClick={() => setStep((n) => n - 1)}
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
        {step < 3 ? (
          <button
            className="button primary"
            onClick={() => {
              if (step === 0 && !name.trim()) {
                setError("Add a name for your studio.");
                return;
              }
              setError("");
              setStep((n) => n + 1);
            }}
          >
            Next <ArrowRight size={14} />
          </button>
        ) : (
          <>
            <button className="button outline" onClick={() => save(true)}>
              Skip supplies for now
            </button>
            <button className="button primary" onClick={() => save()}>
              <Check size={15} /> Save my profile
            </button>
          </>
        )}
      </div>
      <p className="small-print">
        This profile is saved in this browser. Separate sign-ins and
        cross-device profiles will need the class’s account/database connection.
      </p>
    </>
  );
}
