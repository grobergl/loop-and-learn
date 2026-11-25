import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  BookOpen,
  FolderHeart,
  Layers,
  GraduationCap,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Heart,
  MoreHorizontal,
  Leaf,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Download,
  Settings,
  ExternalLink,
  Scissors,
  Sparkles,
  Menu,
  Minus,
  Pencil,
  Trash2,
  ArrowLeft,
  Info,
} from "lucide-react";
import { stitches } from "./data";
import {
  allPatterns,
  materialsFor,
  validateBackup,
  upgradeState,
  stitchName,
} from "./project.js";
import { CreateProject, EditProject, Field } from "./ProjectForms.jsx";
import { ProfileSetup } from "./Profile.jsx";
import {
  activeProjects,
  reserved,
  available,
  shortages,
  finishProject,
} from "./model";
import { PatternArt } from "./art";
import { Empty, download } from "./ui";
import { pendingYards } from "./purchases.js";
import { YarnPhotoInput } from "./YarnPhoto.jsx";
import { PurchaseForm, PurchaseHistory, DeliveryForm } from "./Purchases.jsx";
const uid = () => crypto.randomUUID();
export function Modal({
  modal: m,
  close,
  state,
  setState,
  notify,
  startProject,
  openProject,
  openProfile,
  openModal,
}) {
  const patterns = allPatterns(state);
  const yarnLinked =
    m.yarn &&
    (state.projects.some((p) =>
      materialsFor(p).some((material) => material.yarnId === m.yarn.id),
    ) ||
      (state.purchases || []).some((p) => p.yarnId === m.yarn.id));
  const dialog = useRef(null),
    [error, setError] = useState(""),
    [confirmCancel, setConfirmCancel] = useState(false),
    [yarnPhoto, setYarnPhoto] = useState(m.yarn?.photo || null),
    [photoBusy, setPhotoBusy] = useState(false);
  useEffect(() => {
    const before = document.activeElement;
    dialog.current.showModal();
    return () => {
      if (before?.isConnected) before.focus();
    };
  }, []);
  useEffect(() => {
    setError("");
    setYarnPhoto(m.yarn?.photo || null);
    setPhotoBusy(false);
    dialog.current.scrollTop = 0;
  }, [m]);
  const stop = (e) => {
    e.preventDefault();
    setError("");
  };
  const field = (label, child, help) => (
    <label className="field">
      <span>{label}</span>
      {child}
      {help && <small>{help}</small>}
    </label>
  );
  const p = m.pattern,
    project = m.project;
  const title = {
    pick: "What will you make?",
    profile: "Your crochet profile",
    pattern: p?.name,
    start: "A new handmade story",
    yarn: m.yarn ? "A little stash update" : "Add to your yarn basket",
    stitch: m.stitch?.name,
    shopping: "A little top-up list",
    finish: "One lovely finish",
    editProject: "Make it your own",
    settings: "Your little studio",
    cancel: "Let this project go?",
    purchase: "Record a yarn purchase",
    purchases: "Your purchase history",
    receivePurchase: "Welcome your yarn home",
    deliveryDate: "Update expected arrival",
  }[m.type];
  let content;
  if (m.type === "purchase")
    content = (
      <PurchaseForm
        state={state}
        setState={setState}
        yarnId={m.yarnId}
        close={close}
        notify={notify}
      />
    );
  if (m.type === "purchases")
    content = (
      <PurchaseHistory
        key={m.yarnId || "all"}
        state={state}
        yarnId={m.yarnId}
        openModal={openModal}
      />
    );
  if (["receivePurchase", "deliveryDate"].includes(m.type))
    content = (
      <DeliveryForm
        key={`${m.type}-${m.purchaseId}`}
        state={state}
        setState={setState}
        purchaseId={m.purchaseId}
        mode={m.type === "receivePurchase" ? "receive" : "date"}
        close={close}
        notify={notify}
      />
    );
  if (m.type === "pattern")
    content = (
      <>
        <div className="modal-pattern-art">
          <PatternArt category={p.category} type={p.art} color={p.color} />
          <span className="pill">
            {p.category} · {p.level}
          </span>
        </div>
        <p className="modal-intro">{p.subtitle}</p>
        <div className="pattern-facts">
          <span>
            <strong>{p.yards} yd</strong>estimated yarn
          </span>
          <span>
            <strong>{p.hook}</strong>hook size
          </span>
          <span>
            <strong>{p.instructions.length}</strong>
            {p.unit}s
          </span>
        </div>
        <div className="info-box">
          <strong>About this make</strong>
          <p>{p.setup}</p>
        </div>
        <h3>Your stitch toolkit</h3>
        <p className="muted">
          {p.stitches.filter((id) => state.skills[id] === "Mastered").length} of{" "}
          {p.stitches.length} required stitches mastered. Guides are available
          inside your project.
        </p>
        <div className="skill-chips">
          {p.stitches.map((id) => (
            <span className="badge" key={id}>
              {state.skills[id] === "Mastered" && <Check size={12} />}{" "}
              {stitches.find((s) => s.id === id).name}
            </span>
          ))}
        </div>
        <p className="small-print">
          Original classroom sample. Not independently test-crocheted; check
          gauge and fit. All instructions use US terminology. You can adjust the
          yarn estimate when starting.
        </p>
        <button className="button primary full" onClick={() => startProject(p)}>
          Make this project <ArrowRight size={16} />
        </button>
      </>
    );
  if (m.type === "pick" || m.type === "start")
    content = (
      <CreateProject
        key={m.pattern?.id || "new"}
        state={state}
        setState={setState}
        close={close}
        notify={notify}
        openProject={openProject}
        initialPattern={m.pattern}
      />
    );
  if (m.type === "profile")
    content = (
      <ProfileSetup
        state={state}
        setState={setState}
        close={close}
        notify={notify}
      />
    );
  if (m.type === "yarn")
    content = (
      <form
        onSubmit={(e) => {
          stop(e);
          if (photoBusy) {
            setError("Wait for your photo to finish preparing.");
            return;
          }
          const f = new FormData(e.currentTarget);
          const val = {
            id: m.yarn?.id || uid(),
            name: f.get("name").trim(),
            color: f.get("color").trim(),
            hex: f.get("hex"),
            fiber: f.get("fiber").trim(),
            weight: f.get("weight"),
            yards: Number(f.get("yards")),
            photo: yarnPhoto,
          };
          if (
            !val.name ||
            !val.color ||
            !val.fiber ||
            !Number.isFinite(val.yards) ||
            val.yards < 0
          ) {
            setError(
              "Enter a name, color, fiber, and valid remaining yardage.",
            );
            return;
          }
          if (
            m.yarn &&
            activeProjects(state).some((p) =>
              materialsFor(p).some((material) => material.yarnId === m.yarn.id),
            ) &&
            m.yarn.weight !== val.weight
          ) {
            setError(
              "Finish or cancel projects using this yarn before changing its weight category.",
            );
            return;
          }
          setState((s) => ({
            ...s,
            yarn: m.yarn
              ? s.yarn.map((y) => (y.id === val.id ? val : y))
              : [...s.yarn, val],
          }));
          close();
          notify("Yarn basket updated.");
        }}
      >
        <p className="modal-intro">
          {!m.yarn && (
            <>
              List yarn you already own here. For yarn you just bought,{" "}
              <button
                type="button"
                className="text-link"
                onClick={() => openModal({ type: "purchase" })}
              >
                Record a purchase
              </button>{" "}
              to save its history too.{" "}
            </>
          )}
          Use the label for yarn weight and yardage. For partial skeins, enter
          your best estimate of what’s left.
        </p>
        {field(
          "Yarn name",
          <input
            name="name"
            defaultValue={m.yarn?.name}
            placeholder="e.g. Everyday cotton"
            required
            maxLength={80}
          />,
        )}
        {field(
          "Color name",
          <input
            name="color"
            defaultValue={m.yarn?.color}
            placeholder="e.g. Sage meadow"
            required
            maxLength={60}
          />,
        )}
        <YarnPhotoInput
          photo={yarnPhoto}
          onChange={setYarnPhoto}
          onBusyChange={setPhotoBusy}
        />
        <details className="yarn-fallback-color">
          <summary>Optional fallback color</summary>
          {field(
            "Fallback color",
            <input
              type="color"
              name="hex"
              defaultValue={m.yarn?.hex || "#93a38b"}
            />,
          )}
        </details>
        <div className="form-columns">
          {field(
            "Fiber",
            <input
              name="fiber"
              defaultValue={m.yarn?.fiber || ""}
              placeholder="e.g. Cotton"
              required
              maxLength={60}
            />,
          )}
          {field(
            "Yarn weight",
            <select name="weight" defaultValue={m.yarn?.weight || "4 · Medium"}>
              {[
                "0 · Lace",
                "1 · Super fine",
                "2 · Fine",
                "3 · Light",
                "4 · Medium",
                "5 · Bulky",
                "6 · Super bulky",
                "7 · Jumbo",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>,
          )}
        </div>
        {field(
          "Total yards remaining",
          <input
            name="yards"
            type="number"
            min="0"
            max="1000000"
            step="1"
            defaultValue={m.yarn?.yards ?? 200}
            required
          />,
          "Enter the total across all matching skeins, including yarn set aside for active projects.",
        )}
        {m.yarn && reserved(state, m.yarn.id) > 0 && (
          <p className="small-print">
            {reserved(state, m.yarn.id)} yd is reserved for active projects.
            Lowering stock below that will add a shopping shortage.
          </p>
        )}
        <ErrorText error={error} />
        <div className="modal-actions">
          {m.yarn && (
            <button
              type="button"
              className="button danger-text"
              disabled={yarnLinked}
              title={
                yarnLinked
                  ? "Yarn linked to project or purchase history cannot be deleted. Set remaining yards to 0 instead."
                  : ""
              }
              onClick={() => {
                setState((s) => ({
                  ...s,
                  yarn: s.yarn.filter((y) => y.id !== m.yarn.id),
                }));
                close();
                notify("Yarn removed.");
              }}
            >
              <Trash2 size={15} /> Remove
            </button>
          )}
          <button className="button primary" type="submit" disabled={photoBusy}>
            {m.yarn ? "Save changes" : "Add yarn"}
            <Check size={16} />
          </button>
        </div>
        {yarnLinked && (
          <p className="small-print">
            This yarn is linked to project or purchase history. To mark it used
            up, set its remaining yards to 0.
          </p>
        )}
      </form>
    );
  if (m.type === "stitch") {
    const s = m.stitch;
    content = (
      <>
        <div className="stitch-modal-badge">
          <span>{s.abbr}</span>
          <div>
            <strong>{s.kind}</strong>
            <small>US crochet terminology</small>
          </div>
        </div>
        <p className="modal-intro">{s.description}</p>
        <ol className="steps">
          {s.steps.map((step, i) => (
            <li key={i}>
              <span>{i + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        <div className="info-box">
          <strong>A little tip</strong>
          <p>{s.tip}</p>
        </div>
        <a
          className="button outline full"
          href={
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent("crochet " + s.name + " US terminology tutorial")
          }
          target="_blank"
          rel="noopener noreferrer"
        >
          Find a video tutorial <ExternalLink size={15} />
        </a>
        <p className="small-print">
          Opens a YouTube search so you can choose a teacher you like.
        </p>
        <h3>How’s this stitch feeling?</h3>
        <div className="status-options">
          {["Want to learn", "Learning", "Mastered"].map((status) => (
            <button
              key={status}
              className={
                (state.skills[s.id] || "Want to learn") === status
                  ? "active"
                  : ""
              }
              onClick={() => {
                setState((st) => ({
                  ...st,
                  skills: { ...st.skills, [s.id]: status },
                }));
                notify(`Stitch marked: ${status.toLowerCase()}`);
              }}
            >
              {(state.skills[s.id] || "Want to learn") === status && (
                <Check size={13} />
              )}{" "}
              {status}
            </button>
          ))}
        </div>
        <p className="small-print">
          Your guide is always here, even after you mark a stitch mastered.
        </p>
      </>
    );
  }
  if (m.type === "shopping") {
    const list = shortages(state);
    content = (
      <>
        <p className="modal-intro">
          Based on your remaining stock and the yarn reserved for all active
          projects. Quantities are estimated shortages, not skein counts.
        </p>
        {list.length ? (
          <>
            <div className="shopping-list">
              {list.map((y) => (
                <div key={y.id}>
                  {y.photo ? (
                    <img
                      className="yarn-photo-thumb"
                      src={y.photo}
                      alt={`${y.name} — ${y.color}`}
                    />
                  ) : (
                    <span
                      className="swatch large"
                      style={{ background: y.hex }}
                    />
                  )}
                  <div>
                    <strong>{y.color}</strong>
                    <small>
                      {y.name} · {y.weight} · {y.fiber}
                    </small>
                    <small>
                      {y.yards} yd on hand · {y.reserved} yd reserved
                    </small>
                    {!y.unassigned && pendingYards(state, y.id) > 0 && (
                      <small className="pending-yarn-note">
                        {pendingYards(state, y.id)} yd already purchased,
                        awaiting delivery. Not yet in stock.
                      </small>
                    )}
                    <a
                      href={
                        "https://www.google.com/search?tbm=shop&q=" +
                        encodeURIComponent(
                          `${y.name} ${y.color} ${y.fiber} yarn`,
                        )
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Search for yarn <ExternalLink size={12} />
                    </a>
                  </div>
                  <strong className="short-amount">{y.short} yd</strong>
                </div>
              ))}
            </div>
            <div className="info-box">
              <strong>Check before you buy</strong>
              <p>
                Confirm fiber, yarn weight, gauge, color, dye lot, and yards per
                skein. Shopping links open a search; they do not check
                availability or place an order.
              </p>
            </div>
            <button
              className="button primary full"
              onClick={() => {
                download(
                  "Loop & Learn — Shopping list\n\n" +
                    list
                      .map(
                        (y) =>
                          `${y.color} / ${y.name}\n${y.fiber}, ${y.weight}\nNeed at least ${y.short} additional yards${!y.unassigned && pendingYards(state, y.id) ? `\nAlready purchased, awaiting delivery: ${pendingYards(state, y.id)} yards (not yet in stock)` : ""}\n`,
                      )
                      .join("\n"),
                  "loop-and-learn-shopping-list.txt",
                  "text/plain",
                );
                notify("Shopping list downloaded.");
              }}
            >
              <Download size={16} /> Download shopping list
            </button>
          </>
        ) : (
          <Empty
            icon={CheckCircle2}
            title="Your basket is in good shape"
            text="No yarn shortages for your active projects."
            action="Keep making"
            onClick={close}
          />
        )}
      </>
    );
  }
  if (m.type === "finish") {
    const mats = materialsFor(project);
    content = (
      <form
        onSubmit={(e) => {
          stop(e);
          const f = new FormData(e.currentTarget),
            used = Object.fromEntries(
              mats.map((m) => [m.id, Number(f.get(m.id))]),
            );
          try {
            setState(finishProject(state, project.id, used));
            close();
            notify("Made with love. Your stash is updated!");
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <div className="celebration">
          <CheckCircle2 size={44} strokeWidth={1.2} />
          <h3>You made a whole thing.</h3>
          <p>Record actual use for each color.</p>
        </div>
        {mats.map((m, i) => {
          const y = state.yarn.find((y) => y.id === m.yarnId);
          return (
            <Field
              key={m.id}
              label={`Actual yards used — ${m.role || "Color " + (i + 1)}`}
              hint={
                y
                  ? `${y.yards} yd of ${y.color} is on hand. Combined use of the same yarn is checked.`
                  : "Assign purchased yarn in Edit project before recording its use, or enter 0 if this color was not used."
              }
            >
              <input
                type="number"
                name={m.id}
                defaultValue={y ? m.yards : 0}
                min="0"
                max={y?.yards || 0}
                step="1"
                required
              />
            </Field>
          );
        })}
        <div className="info-box">
          <p>
            Actual use is subtracted once from the correct yarn records. All
            project reservations are released. Completion cannot be undone in
            this version.
          </p>
        </div>
        <ErrorText error={error} />
        <button className="button primary full" type="submit">
          <Check size={16} /> Confirm and finish
        </button>
      </form>
    );
  }
  if (m.type === "editProject")
    content = (
      <EditProject
        project={project}
        state={state}
        setState={setState}
        close={close}
        notify={notify}
      />
    );
  if (m.type === "settings")
    content = (
      <>
        <form
          onSubmit={(e) => {
            stop(e);
            const name = new FormData(e.currentTarget).get("maker").trim();
            if (!name) {
              setError("Please enter a studio name.");
              return;
            }
            setState((s) => ({ ...s, maker: name }));
            notify("Your studio feels more like you.");
            close();
          }}
        >
          {field(
            "What should we call you?",
            <input
              name="maker"
              defaultValue={state.maker}
              required
              maxLength={30}
            />,
          )}
          <ErrorText error={error} />
          <button className="button primary full" type="submit">
            Save studio name
          </button>
        </form>
        <div className="settings-block">
          <h3>Your crochet profile</h3>
          <p>
            Update your crochet habits, stitches, preferences, terminology, and
            optional supplies.
          </p>
          <button className="button outline full" onClick={openProfile}>
            Edit my crochet profile
          </button>
          <h3>Your work stays with you</h3>
          <p>
            This first version saves one maker’s records in this browser. It has
            no separate account or cross-device sync. Clearing browser data will
            erase your changes.
          </p>
          <button
            className="button outline full"
            onClick={() => {
              download(
                JSON.stringify(state, null, 2),
                "loop-and-learn-backup.json",
              );
              notify("Studio backup downloaded.");
            }}
          >
            <Download size={16} /> Export studio backup
          </button>
          <BackupImport setState={setState} notify={notify} close={close} />
        </div>
        <div className="settings-block">
          <h3>About this first version</h3>
          <p>
            Choose a library pattern, organize your own, or save an idea or
            photo reference. AI drafts require the connected server. Real
            multi-user accounts and sync await the class’s database setup.
          </p>
        </div>
      </>
    );
  return (
    <dialog
      className="modal"
      ref={dialog}
      onCancel={close}
      onClick={(e) => {
        if (e.target === dialog.current) {
          const r = dialog.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close();
        }
      }}
    >
      <div className="modal-header">
        <div>
          <span className="eyebrow">LOOP & LEARN</span>
          <h2>{title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={21} />
        </button>
      </div>
      <div className="modal-body">{content}</div>
    </dialog>
  );
}
function ErrorText({ error }) {
  return error ? (
    <p className="form-error" role="alert">
      <AlertCircle size={15} />
      {error}
    </p>
  ) : null;
}
function BackupImport({ setState, notify, close }) {
  const [pending, setPending] = useState(null),
    [error, setError] = useState("");
  const valid = validateBackup;
  return (
    <div className="backup-import">
      <label className="button outline full">
        Restore a backup
        <input
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            setError("");
            const file = e.target.files[0];
            if (!file) return;
            try {
              if (file.size > 10000000) throw Error();
              const s = JSON.parse(await file.text());
              if (!valid(s)) throw Error();
              setPending(s);
            } catch {
              setError("That file is not a valid Loop & Learn backup.");
            }
          }}
        />
      </label>
      <ErrorText error={error} />
      {pending && (
        <div className="warning-box restore-warning">
          <p>
            Restoring replaces the current studio with {pending.projects.length}{" "}
            projects and {pending.yarn.length} yarn records. Export your current
            studio first if you want to keep it.
          </p>
          <button
            className="button primary full"
            onClick={() => {
              setState(upgradeState(pending));
              notify("Studio backup restored.");
              close();
            }}
          >
            Replace studio with this backup
          </button>
        </div>
      )}
    </div>
  );
}
