import { patternReplyRequest, importPatternReply } from "./pattern-import.js";
import { detectStitches, libraryIds } from "./stitch-library.js";
import React, { useState, useEffect, useId } from "react";
import {
  Plus,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ClipboardPaste,
  Sparkles,
  ImagePlus,
  Check,
  Trash2,
  AlertCircle,
  Scissors,
  Upload,
} from "lucide-react";
import {
  allPatterns,
  parseInstructions,
  instructionsText,
  materialsFor,
  projectPattern,
  weights,
  levels,
  stitchName,
} from "./project.js";
import { available } from "./model.js";
import { stitches } from "./data.js";
import { PatternArt } from "./art.jsx";
const uid = () => crypto.randomUUID();
const base = () => ({
  id: uid(),
  name: "",
  subtitle: "A pattern made your way.",
  category: "Plushies",
  occasion: "Just because",
  level: "Beginner",
  yards: 100,
  weight: "4 · Medium",
  hook: "4.5 mm",
  unit: "round",
  terminology: "US",
  color: "#a6b9b0",
  art: "ball",
  stitches: [],
  setup: "",
  finish: "",
  instructions: [],
  source: "paste",
});
export function Field({ label, children, hint }) {
  const id = useId();
  return (
    <label className="field">
      <span>{label}</span>
      {React.cloneElement(children, {
        "aria-label": children.props["aria-label"] || label,
        ...(hint ? { "aria-describedby": id } : {}),
      })}
      {hint && <small id={id}>{hint}</small>}
    </label>
  );
}
export function ErrorMessage({ error }) {
  return error ? (
    <p className="form-error" role="alert">
      <AlertCircle size={16} />
      {error}
    </p>
  ) : null;
}
export function PatternEditor({ draft, setDraft, text, setText }) {
  const [fullReply, setFullReply] = useState(""),
    [importMessage, setImportMessage] = useState(""),
    [importError, setImportError] = useState("");
  const organize = () => {
    try {
      const result = importPatternReply(fullReply);
      setDraft((d) => ({
        ...d,
        ...result.patch,
        stitches: [
          ...new Set([
            ...d.stitches,
            ...detectStitches(
              result.text,
              result.patch.terminology || d.terminology || "US",
            ),
          ]),
        ],
      }));
      setText(result.text);
      setImportMessage(result.summary);
      setImportError("");
    } catch (e) {
      setImportError(e.message);
      setImportMessage("");
    }
  };
  let rows = [],
    parseError = "";
  try {
    rows = parseInstructions(text);
  } catch (e) {
    parseError = e.message;
  }
  const edit = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <>
      <details className="full-pattern-import">
        <summary>Paste a full AI reply or written pattern</summary>
        <p>
          Use this box when the reply includes materials, notes, and finishing
          details as well as rounds. Clear headings help keep them separate.
        </p>
        <Field label="Full pattern reply">
          <textarea
            rows={9}
            value={fullReply}
            onChange={(e) => setFullReply(e.target.value)}
            placeholder={
              "# Pattern name\n## Pattern details\nHook size: 4 mm\n## Materials\nMain color: 80 yards\n## Notes\nUntested draft.\n## Instructions\nRound 1: 6 sc into a ring.\n## Finishing\nWeave in ends."
            }
          />
        </Field>
        <button
          type="button"
          className="button outline full"
          disabled={!fullReply.trim()}
          onClick={organize}
        >
          Organize reply into fields
        </button>
        <ErrorMessage error={importError} />
        {importMessage && (
          <p className="material-ok" role="status">
            {importMessage} Check the fields below before continuing.
          </p>
        )}
      </details>
      <div className="form-columns">
        <Field label="Pattern name">
          <input
            value={draft.name}
            maxLength={100}
            onChange={(e) => edit("name", e.target.value)}
            required
          />
        </Field>
        <Field label="Difficulty">
          <select
            value={draft.level}
            onChange={(e) => edit("level", e.target.value)}
          >
            {levels.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="form-columns">
        <Field label="Category">
          <select
            value={draft.category}
            onChange={(e) => edit("category", e.target.value)}
          >
            {["Plushies", "Clothing", "Home", "Accessories", "Other"].map(
              (x) => (
                <option key={x}>{x}</option>
              ),
            )}
          </select>
        </Field>
        <Field label="Instructions use">
          <select
            value={draft.terminology || "US"}
            onChange={(e) => edit("terminology", e.target.value)}
          >
            <option value="US">US terms</option>
            <option value="UK">UK terms</option>
          </select>
        </Field>
      </div>
      <div className="category-icon-preview">
        <PatternArt category={draft.category} color={draft.color} />
        <div>
          <strong>{draft.category} icon</strong>
          <small>
            This category symbol is used for your project. It is not a picture
            of the finished piece.
          </small>
        </div>
      </div>
      <div className="form-columns">
        <Field label="Work in">
          <select
            value={draft.unit}
            onChange={(e) => edit("unit", e.target.value)}
          >
            <option value="round">Rounds</option>
            <option value="row">Rows</option>
          </select>
        </Field>
        <Field label="Hook size">
          <input
            value={draft.hook}
            onChange={(e) => edit("hook", e.target.value)}
            maxLength={40}
          />
        </Field>
      </div>
      <Field label="Before you begin">
        <textarea
          rows={2}
          value={draft.setup}
          onChange={(e) => edit("setup", e.target.value)}
          placeholder="Size, gauge, starting chain, materials, or other notes…"
        />
      </Field>
      <Field
        label="Pattern instructions"
        hint="Only rows or rounds belong here. Use the full-reply importer above for materials and other notes. Press Enter for a new row or round. Optional labels: Round 1: … or Row 1: … . Rounds 3–5: … expands into three checkable rounds. # headings are ignored; keep essential notes above or below."
      >
        <textarea
          className="pattern-source"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            edit("stitches", [
              ...new Set([
                ...draft.stitches,
                ...detectStitches(e.target.value, draft.terminology || "US"),
              ]),
            ]);
            if (
              /(?:^|\n)\s*(?:row|rows)\s*\d/i.test(e.target.value) &&
              !/(?:^|\n)\s*(?:round|rnd)\s*\d/i.test(e.target.value)
            )
              edit("unit", "row");
          }}
          rows={9}
          placeholder={
            "Round 1: 6 sc into a magic ring. (6)\nRound 2: Inc in every stitch. (12)"
          }
          required
        />
      </Field>
      <div className="editor-preview">
        <strong>
          {rows.length} checkable {draft.unit}s
        </strong>
        <span>Preview the first few instructions</span>
        {rows.slice(0, 4).map((r, i) => (
          <p key={i}>
            <b>
              {draft.unit} {i + 1}
            </b>{" "}
            {r.text}
          </p>
        ))}
        <ErrorMessage error={parseError} />
      </div>
      <Field label="Finishing instructions">
        <textarea
          rows={2}
          value={draft.finish}
          onChange={(e) => edit("finish", e.target.value)}
          placeholder="Assembly, fastening off, and finishing…"
        />
      </Field>
      <fieldset className="plain-fieldset">
        <legend>Stitches used</legend>
        <p className="small-print">
          Recognised stitch names are selected when you paste or edit text.
          Check these selections: abbreviations and stitch recipes vary.
        </p>
        <div className="choice-chips">
          {stitches.map((s) => (
            <label key={s.id}>
              <input
                type="checkbox"
                checked={draft.stitches.includes(s.id)}
                onChange={(e) =>
                  edit(
                    "stitches",
                    e.target.checked
                      ? [...draft.stitches, s.id]
                      : draft.stitches.filter((id) => id !== s.id),
                  )
                }
              />
              {stitchName(s, draft.terminology)} <small>{s.abbr} · US</small>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
export function MaterialsEditor({
  state,
  setState,
  pattern,
  materials,
  setMaterials,
  excludeId,
}) {
  const [addFor, setAddFor] = useState(null),
    [newYarn, setNewYarn] = useState({
      name: "",
      color: "",
      yards: 100,
      fiber: "Cotton",
      hex: "#93a38b",
    }),
    [error, setError] = useState("");
  const update = (id, key, value) =>
    setMaterials((ms) =>
      ms.map((m) =>
        m.id === id
          ? {
              ...m,
              [key]: value,
              ...(key === "weight" ? { yarnId: null } : {}),
            }
          : m,
      ),
    );
  const needed = {};
  for (const m of materials)
    if (m.yarnId)
      needed[m.yarnId] = (needed[m.yarnId] || 0) + Number(m.yards || 0);
  const saveNew = () => {
    if (
      !newYarn.name.trim() ||
      !newYarn.color.trim() ||
      !newYarn.fiber.trim() ||
      !Number.isInteger(Number(newYarn.yards)) ||
      Number(newYarn.yards) < 0
    ) {
      setError("Enter a yarn name, color, fiber, and whole yards remaining.");
      return;
    }
    const target = materials.find((m) => m.id === addFor),
      y = {
        ...newYarn,
        id: uid(),
        weight: target.weight || pattern.weight,
        yards: Number(newYarn.yards),
      };
    setState((s) => ({ ...s, yarn: [...s.yarn, y] }));
    update(addFor, "yarnId", y.id);
    setAddFor(null);
    setError("");
  };
  return (
    <>
      <div className="section-title">
        <div>
          <h3>Every color has a place</h3>
          <p>
            Add a color role and estimated yards, then link it to your stash.
          </p>
        </div>
      </div>
      {materials.map((m, i) => {
        const weight = m.weight || pattern.weight;
        const stock = m.yarnId ? available(state, m.yarnId, excludeId) : 0;
        const short = m.yarnId
          ? Math.max(0, (needed[m.yarnId] || 0) - stock)
          : m.yards;
        return (
          <section className="material-editor" key={m.id}>
            <div className="material-heading">
              <strong>Color {i + 1}</strong>
              {materials.length > 1 && (
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Remove color ${i + 1}`}
                  onClick={() =>
                    setMaterials((ms) => ms.filter((x) => x.id !== m.id))
                  }
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="form-columns">
              <Field label={`Color ${i + 1} role`}>
                <input
                  placeholder="e.g. Body, wings, or trim"
                  value={m.role || ""}
                  onChange={(e) => update(m.id, "role", e.target.value)}
                  maxLength={80}
                />
              </Field>
              <Field label={`Color ${i + 1} yarn weight`}>
                <select
                  value={weight}
                  onChange={(e) => update(m.id, "weight", e.target.value)}
                >
                  {weights.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={`Color ${i + 1} yarn`}>
              <select
                value={m.yarnId || ""}
                onChange={(e) => update(m.id, "yarnId", e.target.value || null)}
              >
                <option value="">Need to buy / not assigned yet</option>
                {state.yarn
                  .filter((y) => y.weight === weight)
                  .map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.color} — {y.name} (
                      {Math.max(0, available(state, y.id, excludeId))} yd
                      available)
                    </option>
                  ))}
              </select>
            </Field>
            <div className="form-columns">
              <Field label={`Color ${i + 1} estimated yards`}>
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  step="1"
                  value={m.yards}
                  onChange={(e) =>
                    update(m.id, "yards", Number(e.target.value))
                  }
                  required
                />
              </Field>
              <div className="inline-yarn-action">
                <button
                  className="text-link"
                  type="button"
                  onClick={() => {
                    setAddFor(m.id);
                    setError("");
                  }}
                >
                  <Plus size={14} /> Add new yarn here
                </button>
              </div>
            </div>
            {short > 0 ? (
              <p className="material-warning">
                {m.yarnId
                  ? `${short} yd short across this plan and other active projects using this yarn.`
                  : `${m.yards} yd will be added to your shopping list until yarn is assigned.`}
              </p>
            ) : (
              <p className="material-ok">
                Enough unreserved yarn for the selected colors.
              </p>
            )}
            {addFor === m.id && (
              <div className="inline-yarn-form">
                <h4>Add yarn for this color</h4>
                <Field label="New yarn name">
                  <input
                    value={newYarn.name}
                    onChange={(e) =>
                      setNewYarn((y) => ({ ...y, name: e.target.value }))
                    }
                  />
                </Field>
                <div className="form-columns">
                  <Field label="New yarn color">
                    <input
                      value={newYarn.color}
                      onChange={(e) =>
                        setNewYarn((y) => ({ ...y, color: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="New yarn swatch">
                    <input
                      type="color"
                      value={newYarn.hex}
                      onChange={(e) =>
                        setNewYarn((y) => ({ ...y, hex: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <div className="form-columns">
                  <Field label="New yarn yards remaining">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={newYarn.yards}
                      onChange={(e) =>
                        setNewYarn((y) => ({ ...y, yards: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label="New yarn fiber">
                    <input
                      value={newYarn.fiber}
                      onChange={(e) =>
                        setNewYarn((y) => ({ ...y, fiber: e.target.value }))
                      }
                    />
                  </Field>
                </div>
                <ErrorMessage error={error} />
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button outline"
                    onClick={() => setAddFor(null)}
                  >
                    Never mind
                  </button>
                  <button
                    type="button"
                    className="button primary"
                    onClick={saveNew}
                  >
                    Add yarn and select it
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}
      <button
        type="button"
        className="button outline full"
        onClick={() =>
          setMaterials((ms) => [
            ...ms,
            {
              id: uid(),
              role: "",
              yards: 25,
              yarnId: null,
              weight: pattern.weight,
            },
          ])
        }
      >
        <Plus size={16} /> Add another color
      </button>
      <p className="small-print">
        Yarn matches by weight category. Check fiber and gauge yourself. Saving
        reserves estimated yards; it never consumes yarn.
      </p>
    </>
  );
}
function makeMaterials(state, p) {
  const used = {};
  return (
    p.requirements || [
      { role: "Main color", yards: p.yards || 100, weight: p.weight },
    ]
  ).map((r) => {
    const y =
      state.yarn.find(
        (y) =>
          y.weight === (r.weight || p.weight) &&
          available(state, y.id) - (used[y.id] || 0) >= r.yards,
      ) || state.yarn.find((y) => y.weight === (r.weight || p.weight));
    if (y) used[y.id] = (used[y.id] || 0) + r.yards;
    return {
      ...r,
      id: uid(),
      weight: r.weight || p.weight,
      yarnId: y?.id || null,
    };
  });
}
export function CreateProject({
  state,
  setState,
  close,
  notify,
  openProject,
  initialPattern,
}) {
  const [step, setStep] = useState(initialPattern ? "materials" : "choose"),
    [path, setPath] = useState(initialPattern ? "library" : null),
    [draft, setDraft] = useState(() =>
      initialPattern
        ? structuredClone({
            ...initialPattern,
            terminology: initialPattern.terminology || "US",
          })
        : base(),
    ),
    [text, setText] = useState(() =>
      initialPattern ? instructionsText(initialPattern) : "",
    ),
    [name, setName] = useState(initialPattern?.name || ""),
    [materials, setMaterials] = useState(() =>
      initialPattern ? makeMaterials(state, initialPattern) : [],
    ),
    [error, setError] = useState(""),
    [idea, setIdea] = useState(""),
    [image, setImage] = useState(null),
    [busy, setBusy] = useState(false),
    [supplies, setSupplies] = useState(""),
    [connection, setConnection] = useState(false),
    [libraryLevel, setLibraryLevel] = useState("All levels");
  useEffect(() => {
    let alive = true;
    if (location.protocol !== "file:")
      fetch("/api/status")
        .then((r) => (r.ok ? r.json() : null))
        .then((s) => {
          if (alive) setConnection(!!s?.aiReady);
        })
        .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const choose = (p) => {
    setDraft(structuredClone({ ...p, terminology: p.terminology || "US" }));
    setText(instructionsText(p));
    setName(p.name);
    setMaterials(makeMaterials(state, p));
    setStep("materials");
  };
  const generate = async () => {
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          image,
          level: draft.level,
          category: draft.category,
          terminology: draft.terminology,
          profile: state.profile,
        }),
      });
      const data = await r.json();
      if (!r.ok)
        throw Error(
          data.error || "The AI connection could not create a draft.",
        );
      setDraft((d) => ({
        ...d,
        ...data.pattern,
        id: d.id,
        source: path,
        generated: true,
        terminology: data.pattern.terminology || "US",
      }));
      setText(data.pattern.instructions.map((r) => r.text).join("\n"));
      setName(data.pattern.name);
      setStep("draft");
    } catch (e) {
      setError(
        e.message.includes("JSON")
          ? "AI generation needs the connected server. You can still write or paste instructions below."
          : e.message,
      );
    } finally {
      setBusy(false);
    }
  };
  const upload = async (e) => {
    setError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(f.type) ||
      f.size > 750000
    ) {
      setError("Choose a JPG, PNG, or WebP image smaller than 750 KB.");
      return;
    }
    const data = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(f);
    });
    setImage(data);
  };
  const next = () => {
    try {
      const rows = parseInstructions(text);
      if (!draft.name.trim() || !rows.length)
        throw Error("Give the pattern a name and at least one instruction.");
      setDraft((d) => ({ ...d, instructions: rows }));
      setName((n) => n || draft.name);
      setMaterials((ms) => (ms.length ? ms : makeMaterials(state, draft)));
      setError("");
      setStep("materials");
    } catch (e) {
      setError(e.message);
    }
  };
  const save = (e) => {
    e.preventDefault();
    setError("");
    try {
      if (!name.trim()) throw Error("Give your project a name.");
      if (
        !materials.length ||
        materials.some((m) => !Number.isInteger(m.yards) || m.yards < 1)
      )
        throw Error("Each color needs an estimate of at least one whole yard.");
      const pat = {
        ...draft,
        name: draft.name.trim(),
        instructions: parseInstructions(text),
        yards: materials.reduce((n, m) => n + m.yards, 0),
        terminology: draft.terminology || "US",
        source: path,
        requirements: materials.map(({ role, yards, weight }) => ({
          role,
          yards,
          weight,
        })),
      };
      if (!pat.instructions.length)
        throw Error("Add at least one instruction.");
      const id = uid(),
        custom = path !== "library",
        savedPattern = { ...pat };
      const project = {
        id,
        name: name.trim(),
        patternId: pat.id,
        pattern: pat,
        materials,
        yarnId: materials[0].yarnId,
        yards: pat.yards,
        done: [],
        status: "active",
        notes: "",
        additionalSupplies: supplies,
        referenceImage: image,
        idea,
        created: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        customPatterns: custom
          ? [...(s.customPatterns || []), savedPattern]
          : s.customPatterns || [],
        projects: [...s.projects, project],
        skillLibraryIds: [...new Set([...libraryIds(s), ...pat.stitches])],
      }));
      close();
      openProject(id);
      notify("Your project is ready. Make it your own.");
    } catch (e) {
      setError(e.message);
    }
  };
  if (step === "choose")
    return (
      <>
        <p className="modal-intro">
          Four ways to begin. Your yarn, your ideas, your pace.
        </p>
        <div className="start-paths">
          {[
            [
              "library",
              BookOpen,
              "Choose a pattern",
              "Browse your library and make it your own.",
            ],
            [
              "paste",
              ClipboardPaste,
              "Paste my pattern",
              "Turn your own instructions into editable rounds or rows.",
            ],
            [
              "idea",
              Sparkles,
              "Describe an idea",
              "Create a brief and request an AI draft when connected.",
            ],
            [
              "photo",
              ImagePlus,
              "Start from a picture",
              "Save a reference photo and request a crochet interpretation.",
            ],
          ].map(([id, Icon, title, desc]) => (
            <button
              key={id}
              onClick={() => {
                setPath(id);
                setDraft((d) => ({
                  ...d,
                  source: id,
                  level: state.profile?.level || "Beginner",
                  terminology: state.profile?.terminology || "US",
                }));
                setStep(
                  id === "library"
                    ? "library"
                    : id === "paste"
                      ? "draft"
                      : "inspiration",
                );
              }}
            >
              <Icon size={25} />
              <strong>{title}</strong>
              <span>{desc}</span>
              <ArrowRight size={16} />
            </button>
          ))}
        </div>
      </>
    );
  if (step === "library")
    return (
      <>
        <button className="text-link back" onClick={() => setStep("choose")}>
          <ArrowLeft size={14} /> Ways to start
        </button>
        <Field label="Pattern difficulty">
          <select
            value={libraryLevel}
            onChange={(e) => setLibraryLevel(e.target.value)}
          >
            <option>All levels</option>
            {levels.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        {!allPatterns(state).some(
          (p) => libraryLevel === "All levels" || p.level === libraryLevel,
        ) && (
          <div className="info-box">
            <p>
              No patterns at this level yet. Start from your own pattern, idea,
              or picture to create one.
            </p>
          </div>
        )}
        <div className="pick-list">
          {allPatterns(state)
            .filter(
              (p) => libraryLevel === "All levels" || p.level === libraryLevel,
            )
            .map((p) => (
              <button key={p.id} onClick={() => choose(p)}>
                <div className="pick-art">
                  <PatternArt
                    category={p.category}
                    type={p.art}
                    color={p.color}
                  />
                </div>
                <span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.level} · {p.yards} yd · {p.category}
                  </small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
        </div>
      </>
    );
  if (step === "inspiration")
    return (
      <>
        <button className="text-link back" onClick={() => setStep("choose")}>
          <ArrowLeft size={14} /> Ways to start
        </button>
        <h3>
          {path === "photo"
            ? "A picture to crochet from"
            : "What are you dreaming of making?"}
        </h3>
        {path === "photo" && (
          <>
            <Field
              label="Reference picture"
              hint="JPG, PNG, or WebP up to 750 KB. The photo is saved with this project. It is sent to the AI service only if you request a draft."
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={upload}
              />
            </Field>
            {image && (
              <img
                className="reference-photo"
                src={image}
                alt="Your crochet reference"
              />
            )}
          </>
        )}
        <Field
          label="Describe your project"
          hint="Try the item, size, shape, colors, recipient, and any special details."
        >
          <textarea
            rows={4}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="A small green dragon with cream wings, about 6 inches tall…"
          />
        </Field>
        <div className="form-columns">
          <Field label="Target difficulty">
            <select
              value={draft.level}
              onChange={(e) =>
                setDraft((d) => ({ ...d, level: e.target.value }))
              }
            >
              {levels.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </Field>
          <Field label="Draft terminology">
            <select
              value={draft.terminology}
              onChange={(e) =>
                setDraft((d) => ({ ...d, terminology: e.target.value }))
              }
            >
              <option>US</option>
              <option>UK</option>
            </select>
          </Field>
        </div>
        <div className="info-box">
          <strong>
            {connection
              ? "AI draft service connected"
              : "AI draft service not connected"}
          </strong>
          <p>
            {connection
              ? "Your description and selected image will be sent to the configured AI provider. Review the draft carefully; stitch counts and shaping may be wrong."
              : "Generating instructions from an idea or image needs the AI server connection. You can save the reference and supply your own instructions now. No pattern is generated automatically."}
          </p>
        </div>
        <button
          className="button outline full spaced"
          disabled={!idea.trim() || (path === "photo" && !image)}
          onClick={async () => {
            const prompt = patternReplyRequest({
              idea,
              level: draft.level,
              terminology: draft.terminology,
              photo: path === "photo",
            });
            try {
              await navigator.clipboard.writeText(prompt);
              notify(
                "Request copied. In the editor, paste the whole answer into Full pattern reply and choose Organize reply into fields.",
              );
            } catch {
              setError(prompt);
            }
          }}
        >
          Copy a request for my AI chat
        </button>
        <p className="small-print">
          You can use your existing ChatGPT or Claude chat. For a picture,
          attach the same photo there yourself. In the next step, open “Paste a
          full AI reply,” paste the whole response, and choose “Organize reply
          into fields.” Copying does not send the photo.
        </p>
        <ErrorMessage error={error} />
        <button
          className="button primary full"
          disabled={
            !connection || busy || !idea.trim() || (path === "photo" && !image)
          }
          onClick={generate}
        >
          {busy ? "Creating a draft…" : "Generate an AI draft"}
          <Sparkles size={16} />
        </button>
        <button
          className="button outline full spaced"
          disabled={path === "photo" && !image}
          onClick={() => {
            setDraft((d) => ({ ...d, setup: idea, name: d.name || "" }));
            setStep("draft");
          }}
        >
          Continue with my own instructions <ArrowRight size={15} />
        </button>
      </>
    );
  if (step === "draft")
    return (
      <>
        <button
          className="text-link back"
          onClick={() =>
            setStep(
              path === "library"
                ? "materials"
                : path === "paste"
                  ? "choose"
                  : "inspiration",
            )
          }
        >
          <ArrowLeft size={14} /> Back
        </button>
        <p className="modal-intro">
          One line becomes one checkable {draft.unit}. Edit the text until it
          matches what you want to make.
        </p>
        <PatternEditor
          draft={draft}
          setDraft={setDraft}
          text={text}
          setText={setText}
        />
        {draft.generated && (
          <div className="warning-box">
            AI draft: not test-crocheted. Review stitch counts, shaping, gauge,
            and assembly before starting.
          </div>
        )}
        <ErrorMessage error={error} />
        <button className="button primary full" onClick={next}>
          Choose colors and materials <ArrowRight size={16} />
        </button>
      </>
    );
  return (
    <form onSubmit={save}>
      <button
        type="button"
        className="text-link back"
        onClick={() => setStep("draft")}
      >
        <Scissors size={14} /> Edit pattern instructions
      </button>
      <div className="start-pattern">
        <PatternArt
          category={draft.category}
          type={draft.art}
          color={draft.color}
        />
        <div>
          <strong>{draft.name}</strong>
          <small>
            {draft.level} · {draft.terminology || "US"} terminology ·{" "}
            {draft.instructions.length || parseInstructions(text).length}{" "}
            {draft.unit}s
          </small>
        </div>
      </div>
      <Field label="Give your project a name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </Field>
      <MaterialsEditor
        state={state}
        setState={setState}
        pattern={draft}
        materials={materials}
        setMaterials={setMaterials}
      />
      <Field
        label="Other supplies needed"
        hint="For example: stuffing, 8 mm eyes, a yarn needle. Compare with your profile supplies."
      >
        <textarea
          rows={2}
          value={supplies}
          onChange={(e) => setSupplies(e.target.value)}
        />
      </Field>
      {state.profile?.supplies?.length > 0 && (
        <p className="small-print">
          Your supplies: {state.profile.supplies.join(", ")}. Hooks:{" "}
          {(state.profile.hooks || []).join(", ") || "not added"}.{" "}
          {state.profile.supplyNotes || ""}
        </p>
      )}
      {draft.stitches.some((id) => state.skills[id] !== "Mastered") && (
        <section className="new-stitch-review">
          <h3>A new stitch to try?</h3>
          <p>
            These stitches are not marked mastered. Learn one, or tell us you
            already know it.
          </p>
          {draft.stitches
            .filter((id) => state.skills[id] !== "Mastered")
            .map((id) => {
              const stitch = stitches.find((s) => s.id === id);
              return (
                <details key={id}>
                  <summary>
                    {stitchName(stitch, state.profile?.terminology || "US")} —{" "}
                    {state.skills[id] || "New to your toolkit"}
                  </summary>
                  <p>{stitch.description}</p>
                  <ol>
                    {stitch.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <label className="field">
                    <span>Your familiarity with {stitch.name}</span>
                    <select
                      value={state.skills[id] || "Want to learn"}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          skills: { ...s.skills, [id]: e.target.value },
                        }))
                      }
                    >
                      <option>Want to learn</option>
                      <option>Learning</option>
                      <option>Mastered</option>
                    </select>
                  </label>
                </details>
              );
            })}
        </section>
      )}
      <ErrorMessage error={error} />
      <button className="button primary full" type="submit">
        <Plus size={16} /> Start my project
      </button>
    </form>
  );
}
export function EditProject({ project, state, setState, close, notify }) {
  const pattern = projectPattern(state, project),
    [draft, setDraft] = useState(() =>
      structuredClone({ ...pattern, terminology: pattern.terminology || "US" }),
    ),
    [text, setText] = useState(() => instructionsText(pattern)),
    [name, setName] = useState(project.name),
    [supplies, setSupplies] = useState(project.additionalSupplies || ""),
    [materials, setMaterials] = useState(() =>
      structuredClone(materialsFor(project)),
    ),
    [reset, setReset] = useState(false),
    [confirmCancel, setConfirmCancel] = useState(false),
    [error, setError] = useState("");
  const changed =
    text !== instructionsText(pattern) || draft.unit !== pattern.unit;
  const save = (e) => {
    e.preventDefault();
    try {
      const instructions = parseInstructions(text);
      if (!name.trim() || !draft.name.trim() || !instructions.length)
        throw Error("Add names and at least one instruction.");
      if (materials.some((m) => !Number.isInteger(m.yards) || m.yards < 1))
        throw Error("Each color needs a positive whole-yard estimate.");
      if (changed && project.done.length && !reset)
        throw Error(
          "Confirm resetting checked rows or rounds before changing the instructions.",
        );
      const yards = materials.reduce((n, m) => n + m.yards, 0);
      setState((s) => ({
        ...s,
        projects: s.projects.map((p) =>
          p.id === project.id
            ? {
                ...p,
                name: name.trim(),
                additionalSupplies: supplies,
                pattern: { ...draft, instructions, yards },
                materials,
                yarnId: materials[0].yarnId,
                yards,
                done: changed ? [] : p.done,
              }
            : p,
        ),
      }));
      close();
      notify("Project updated. Yarn reservations recalculated.");
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <form onSubmit={save}>
      <Field label="Project name">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </Field>
      <MaterialsEditor
        state={state}
        setState={setState}
        pattern={draft}
        materials={materials}
        setMaterials={setMaterials}
        excludeId={project.id}
      />
      <Field label="Other supplies needed">
        <textarea
          value={supplies}
          onChange={(e) => setSupplies(e.target.value)}
          rows={2}
        />
      </Field>
      <details className="edit-instructions">
        <summary>Edit this project’s pattern instructions</summary>
        <p className="small-print">
          Changes apply to this project only. Other projects and the library
          pattern stay as they are.
        </p>
        <PatternEditor
          draft={draft}
          setDraft={setDraft}
          text={text}
          setText={setText}
        />
      </details>
      {changed && project.done.length > 0 && (
        <label className="check-filter reset-check">
          <input
            type="checkbox"
            checked={reset}
            onChange={(e) => setReset(e.target.checked)}
          />{" "}
          Reset checked rows or rounds for these revised instructions
        </label>
      )}
      <ErrorMessage error={error} />
      <div className="modal-actions">
        <button
          type="button"
          className="button danger-text"
          onClick={() => setConfirmCancel(true)}
        >
          Cancel project
        </button>
        <button className="button primary" type="submit">
          Save changes
        </button>
      </div>
      {confirmCancel && (
        <button
          className="button outline full spaced"
          type="button"
          onClick={() => {
            setState((s) => ({
              ...s,
              projects: s.projects.filter((p) => p.id !== project.id),
            }));
            close();
            notify("Project canceled. Reserved yarn released.");
          }}
        >
          Confirm cancellation and release yarn
        </button>
      )}
    </form>
  );
}
