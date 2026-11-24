import appInfo from "../package.json";
import { libraryIds } from "./stitch-library.js";
import { categoryVisual } from "./categories.js";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/lora/latin-400.css";
import "@fontsource/lora/latin-500.css";
import "@fontsource/lora/latin-400-italic.css";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
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
import { stitches, initialState } from "./data";
import {
  allPatterns,
  projectPattern,
  materialsFor,
  upgradeState,
  validateBackup,
  recommendations,
  translateTerms,
  stitchName,
} from "./project.js";
import {
  activeProjects,
  reserved,
  available,
  shortages,
  canMake,
  finishProject,
} from "./model";
import { Yarn, PatternArt, HeroArt } from "./art";
import "./style.css";
import { Modal } from "./Modal";
import { Stat, SectionTitle, PageHeading, SearchInput, Empty } from "./ui";
const brandMark =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="%23b65e45"/><g fill="none" stroke="%23fff9ec" stroke-width="3"><circle cx="30" cy="34" r="17"/><path d="M16 25q25 0 28 18M14 33q18-3 25 15M23 18q-6 23 9 32M34 17q-9 22 10 24M43 26l12-17q3-6-2-5"/></g></svg>'.replaceAll(
      "%23",
      "#",
    ),
  );
const KEY = "loop-and-learn.v1";
const nav = [
  ["Dashboard", LayoutDashboard],
  ["Patterns", BookOpen],
  ["My projects", FolderHeart],
  ["Yarn stash", Layers],
  ["Stitch library", GraduationCap],
];
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (validateBackup(s)) return upgradeState(s);
  } catch {}
  return upgradeState(initialState());
}
const uid = () => crypto.randomUUID();
function App() {
  const [state, setState] = useState(load),
    [page, setPage] = useState("Dashboard"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All patterns"),
    [onlySaved, setOnlySaved] = useState(false),
    [ready, setReady] = useState(false),
    [projectFilter, setProjectFilter] = useState("Active"),
    [mobile, setMobile] = useState(false),
    [selected, setSelected] = useState(null),
    [storageError, setStorageError] = useState(false),
    [stitchFilter, setStitchFilter] = useState("My stitches"),
    [difficulty, setDifficulty] = useState("All levels");
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  const notify = (t) => setToast(t);
  const go = (p) => {
    setPage(p);
    setSelected(null);
    setQuery("");
    setMobile(false);
    window.scrollTo(0, 0);
  };
  const patterns = allPatterns(state),
    term = state.profile?.terminology || "US";
  const active = activeProjects(state),
    short = shortages(state),
    mastered = stitches.filter((s) => state.skills[s.id] === "Mastered").length,
    completed = state.projects.filter((p) => p.status === "completed");
  const savePattern = (id) => {
    setState((s) => ({
      ...s,
      saved: s.saved.includes(id)
        ? s.saved.filter((x) => x !== id)
        : [...s.saved, id],
    }));
  };
  const updateProject = (id, change) =>
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...change } : p)),
    }));
  const openProject = (id) => {
    go("My projects");
    setSelected(id);
  };
  const startProject = (p) => setModal({ type: "start", pattern: p });
  const skillGap = (p) =>
    p.stitches.filter((id) => state.skills[id] !== "Mastered").length;
  const patternCard = (p) => (
    <article className="pattern-card" key={p.id}>
      <button
        className="pattern-image"
        style={{
          background: categoryVisual(p.category).background,
        }}
        onClick={() => setModal({ type: "pattern", pattern: p })}
        aria-label={`View ${p.name}`}
      >
        <PatternArt category={p.category} type={p.art} color={p.color} />
      </button>
      <button
        className={
          "save-button " + (state.saved.includes(p.id) ? "is-saved" : "")
        }
        aria-label={`${state.saved.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
        onClick={() => savePattern(p.id)}
      >
        <Heart
          size={17}
          fill={state.saved.includes(p.id) ? "currentColor" : "none"}
        />
      </button>
      <div className="pattern-content">
        <div className="eyebrow">
          {p.category} <span>·</span> {p.level}
        </div>
        <button
          className="title-button"
          onClick={() => setModal({ type: "pattern", pattern: p })}
        >
          {p.name}
        </button>
        <p>{p.subtitle}</p>
        <div className="pattern-meta">
          <span>
            {p.yards} yd <span className="dot">·</span> {p.hook}
          </span>
          {canMake(state, p) ? (
            <span className="ready-tag">
              <Check size={12} /> Stash ready
            </span>
          ) : (
            <span>
              {p.instructions.length} {p.unit}s
            </span>
          )}
        </div>
      </div>
    </article>
  );
  const projectCard = (p) => {
    const pattern = projectPattern(state, p),
      pct = Math.round((p.done.length / pattern.instructions.length) * 100),
      y = state.yarn.find((y) => y.id === p.yarnId);
    return (
      <button
        className="project-card"
        key={p.id}
        onClick={() => openProject(p.id)}
      >
        <div
          className="project-art"
          style={{
            background: categoryVisual(pattern.category).background,
          }}
        >
          <PatternArt
            category={pattern.category}
            type={pattern.art}
            color={y?.hex || pattern.color}
          />
        </div>
        <div className="project-body">
          <div className="project-top">
            <span className="eyebrow">{pattern.category}</span>
            <ArrowUpRight size={18} />
          </div>
          <h3>{p.name}</h3>
          <p>{pattern.name}</p>
          <div className="progress-text">
            <span>
              {p.status === "completed"
                ? "Completed"
                : `${p.done.length} of ${pattern.instructions.length} ${pattern.unit}s`}
            </span>
            <strong>{pct}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: pct + "%" }} />
          </div>
        </div>
      </button>
    );
  };
  function Dashboard() {
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">YOUR CREATIVE CORNER</div>
            <h1>
              A little progress, a lot of joy<span className="accent">.</span>
            </h1>
            <p>Make room for the things you love to make.</p>
          </div>
          <button
            className="button primary"
            onClick={() => setModal({ type: "pick" })}
          >
            <Plus size={17} /> New project
          </button>
        </div>
        {!state.profile?.onboarded ? (
          <section className="profile-invite">
            <div>
              <strong>What kind of crocheter are you?</strong>
              <p>
                Set your crochet rhythm, stitch familiarity, terminology, and
                optional supplies.
              </p>
            </div>
            <button
              className="button outline"
              onClick={() => setModal({ type: "profile" })}
            >
              Set up my crochet profile <ArrowRight size={15} />
            </button>
            <button
              className="icon-button"
              aria-label="Skip profile setup for now"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  profile: { ...s.profile, onboarded: true, level: "Beginner" },
                }))
              }
            >
              <X size={16} />
            </button>
          </section>
        ) : (
          <div className="profile-shortcut">
            <span>
              {state.profile.level || "Your pace"} · {term} terminology first
            </span>
            <button
              className="text-link"
              onClick={() => setModal({ type: "profile" })}
            >
              My crochet profile <Settings size={14} />
            </button>
          </div>
        )}
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              <Leaf size={13} /> MADE SLOWLY. MADE BY YOU.
            </span>
            <h2>
              Your next favorite thing
              <br />
              starts with a loop.
            </h2>
            <p>
              A pattern to fall in love with. Yarn you already have.
              <br className="desktop-break" /> Let’s see what you can make
              today.
            </p>
            <button className="button dark" onClick={() => go("Patterns")}>
              Find your next project <ArrowRight size={16} />
            </button>
          </div>
          <div className="hero-art">
            <HeroArt />
          </div>
        </section>
        <section className="stats">
          <Stat
            icon={FolderHeart}
            label="On your hook"
            value={active.length}
            note="projects in progress"
            color="peach"
            onClick={() => go("My projects")}
          />
          <Stat
            icon={Layers}
            label="In your yarn basket"
            value={state.yarn.length}
            note={`${state.yarn.reduce((n, y) => n + y.yards, 0).toLocaleString()} yards on hand`}
            color="sage"
            onClick={() => go("Yarn stash")}
          />
          <Stat
            icon={GraduationCap}
            label="In your skill set"
            value={mastered}
            note={`of ${stitches.length} stitches mastered`}
            color="lavender"
            onClick={() => go("Stitch library")}
          />
          <Stat
            icon={CheckCircle2}
            label="Made with love"
            value={completed.length}
            note="projects completed"
            color="yellow"
            onClick={() => {
              go("My projects");
              setProjectFilter("Completed");
            }}
          />
        </section>
        <div className="dashboard-columns">
          <div>
            <SectionTitle
              title="Pick up where you left off"
              subtitle="A few more stitches, whenever you’re ready."
              action="All projects"
              onClick={() => go("My projects")}
            />
            <div className="project-grid">
              {active.slice(0, 2).map(projectCard)}
              {!active.length && (
                <Empty
                  icon={FolderHeart}
                  title="A fresh start awaits"
                  text="Choose a pattern and put something lovely on your hook."
                  action="Explore patterns"
                  onClick={() => go("Patterns")}
                />
              )}
            </div>
            <SectionTitle
              title={
                state.profile?.onboarded
                  ? "Picked for your crochet rhythm"
                  : "A little inspiration"
              }
              subtitle={
                state.profile?.onboarded
                  ? `${state.profile.level} preference · ${state.profile.mood === "challenge" ? "Room to stretch" : "Familiar makes are always welcome"}`
                  : "Small projects. Big handmade happiness."
              }
              action="Explore patterns"
              onClick={() => go("Patterns")}
            />
            <div className="pattern-grid dashboard-patterns">
              {recommendations(state).slice(0, 3).map(patternCard)}
            </div>
          </div>
          <aside className="dashboard-aside">
            <section className="basket-card">
              <div className="aside-title">
                <span className="icon-tile peach">
                  <ShoppingBag size={19} />
                </span>
                <h3>Your basket check</h3>
              </div>
              {short.length ? (
                <>
                  <p>A little top-up for the projects you’re planning.</p>
                  {short.map((y) => (
                    <div className="shortage" key={y.id}>
                      <span className="swatch" style={{ background: y.hex }} />
                      <div>
                        <strong>{y.color}</strong>
                        <span>{y.name}</span>
                      </div>
                      <span className="short-amount">+{y.short} yd</span>
                    </div>
                  ))}
                  <div className="soft-note">
                    <Info size={14} />
                    <span>Includes yarn reserved for all active projects.</span>
                  </div>
                  <button
                    className="button outline full"
                    onClick={() => setModal({ type: "shopping" })}
                  >
                    View shopping list <ArrowRight size={15} />
                  </button>
                </>
              ) : (
                <>
                  <p>
                    Your planned projects have enough yarn. A lovely place to
                    be.
                  </p>
                  <button
                    className="text-link"
                    onClick={() => go("Yarn stash")}
                  >
                    Take a look at your stash <ArrowRight size={14} />
                  </button>
                </>
              )}
            </section>
            <section className="learning-card">
              <div className="eyebrow">
                <Sparkles size={13} /> ONE STITCH AT A TIME
              </div>
              <h3>
                Grow a little,
                <br />
                with every project.
              </h3>
              <p>
                {mastered} stitches in your toolkit. What will you learn next?
              </p>
              <div className="stitch-sample" aria-hidden="true">
                ∪ ∪ ∪ ∪ ∪<br /> ∪ ∪ ∪ ∪<br />∪ ∪ ∪ ∪ ∪
              </div>
              <button
                className="text-link"
                onClick={() => go("Stitch library")}
              >
                Visit your stitch library <ArrowRight size={15} />
              </button>
            </section>
            <div className="quiet-note">
              <Heart size={15} />
              <p>
                It doesn’t have to be perfect
                <br />
                to be made with love.
              </p>
            </div>
          </aside>
        </div>
      </>
    );
  }
  function PatternPage() {
    let list = patterns.filter(
      (p) =>
        (category === "All patterns" || p.category === category) &&
        (difficulty === "All levels" || p.level === difficulty) &&
        (!onlySaved || state.saved.includes(p.id)) &&
        (!ready || canMake(state, p)) &&
        `${p.name} ${p.subtitle} ${p.category} ${p.occasion} ${p.level}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return (
      <>
        <PageHeading
          eyebrow="A LITTLE INSPIRATION"
          title="Find your next favorite."
          text="Something cozy, something useful, something entirely yours."
          action="New project"
          onClick={() => setModal({ type: "pick" })}
        />
        <div className="library-banner">
          <BookOpen size={22} />
          <div>
            <strong>A small collection to grow with</strong>
            <p>
              {patterns.length} patterns · {term} terminology first · Yardage is
              an estimate
            </p>
          </div>
        </div>
        <div className="toolbar">
          <SearchInput
            query={query}
            setQuery={setQuery}
            placeholder="Search patterns, occasions, or ideas…"
          />
          <label className="difficulty-filter">
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>All levels</option>
              {[
                "Beginner",
                "Confident beginner",
                "Intermediate",
                "Advanced",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <button
            className={
              "button outline " + (onlySaved ? "selected-control" : "")
            }
            onClick={() => setOnlySaved(!onlySaved)}
          >
            <Heart size={16} /> Saved ({state.saved.length})
          </button>
          <label className="check-filter">
            <input
              type="checkbox"
              checked={ready}
              onChange={(e) => setReady(e.target.checked)}
            />{" "}
            Use my stash
          </label>
        </div>
        <div className="tabs">
          {["All patterns", "Plushies", "Clothing", "Home", "Accessories"].map(
            (c) => (
              <button
                key={c}
                className={category === c ? "active" : ""}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ),
          )}
        </div>
        <div className="results-line">
          {list.length} patterns to make your own{" "}
          <span>
            Materials checked against unreserved, matching-weight yarn
          </span>
        </div>
        <div className="pattern-grid">{list.map(patternCard)}</div>
        {!list.length && (
          <Empty
            icon={Search}
            title="No patterns just yet"
            text="Try another search or turn off a filter."
            action="Clear filters"
            onClick={() => {
              setQuery("");
              setCategory("All patterns");
              setDifficulty("All levels");
              setReady(false);
              setOnlySaved(false);
            }}
          />
        )}
        <p className="page-footnote">
          Patterns are sample or maker-supplied instructions and have not been
          independently test-crocheted. AI drafts require a connected server and
          human review. Check gauge, fit, and materials before making a gift.
        </p>
      </>
    );
  }
  function ProjectsPage() {
    const p = state.projects.find((p) => p.id === selected);
    if (p) return ProjectDetail({ project: p });
    const list = state.projects.filter(
      (p) =>
        p.status === projectFilter.toLowerCase() &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    );
    return (
      <>
        <PageHeading
          eyebrow="A STITCH HERE, A STITCH THERE"
          title="Your handmade stories."
          text="Every project starts somewhere. Keep your place, and enjoy the making."
          action="New project"
          onClick={() => setModal({ type: "pick" })}
        />
        <div className="toolbar">
          <SearchInput
            query={query}
            setQuery={setQuery}
            placeholder="Find a project…"
          />
        </div>
        <div className="tabs">
          {["Active", "Completed"].map((c) => (
            <button
              key={c}
              className={projectFilter === c ? "active" : ""}
              onClick={() => setProjectFilter(c)}
            >
              {c}{" "}
              <span>
                {
                  state.projects.filter((p) => p.status === c.toLowerCase())
                    .length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="project-grid large-projects">
          {list.map(projectCard)}
        </div>
        {!list.length && (
          <Empty
            icon={FolderHeart}
            title={
              query
                ? "No matching projects"
                : projectFilter === "Completed"
                  ? "Your future finish line"
                  : "Your hook is ready"
            }
            text={
              projectFilter === "Completed"
                ? "Finished projects will find a home here."
                : "Choose a pattern to start your next handmade story."
            }
            action="New project"
            onClick={() => setModal({ type: "pick" })}
          />
        )}
      </>
    );
  }
  function ProjectDetail({ project: p }) {
    const pat = projectPattern(state, p),
      y = state.yarn.find((y) => y.id === p.yarnId),
      done = p.done.length,
      all = done === pat.instructions.length;
    return (
      <>
        <button className="text-link back" onClick={() => setSelected(null)}>
          <ArrowLeft size={16} /> All projects
        </button>
        <PageHeading
          eyebrow={p.status === "completed" ? "MADE WITH LOVE" : "ON YOUR HOOK"}
          title={p.name}
          text={`${pat.name} · ${pat.hook} hook · ${term} terms first (source: ${pat.terminology || "US"})`}
          action={p.status === "active" ? "Edit project" : null}
          onClick={() => setModal({ type: "editProject", project: p })}
          secondaryAction="New project"
          onSecondaryClick={() => setModal({ type: "pick" })}
        />
        <div className="detail-layout">
          <div>
            <div className="project-summary">
              <div className="summary-art">
                <PatternArt
                  category={pat.category}
                  type={pat.art}
                  color={y?.hex || pat.color}
                />
              </div>
              <div>
                <span className="badge">
                  {p.status === "completed"
                    ? "Completed"
                    : `${done} of ${pat.instructions.length} ${pat.unit}s`}
                </span>
                <h2>
                  {Math.round((done / pat.instructions.length) * 100)}%{" "}
                  {pat.unit} progress
                </h2>
                <div className="progress-track">
                  <span
                    style={{
                      width: (done / pat.instructions.length) * 100 + "%",
                    }}
                  />
                </div>
                <p>
                  {p.status === "completed"
                    ? `${p.actualYards} yd used · Yarn deducted from stash`
                    : "Your place is saved automatically on this browser."}
                </p>
              </div>
            </div>
            <div className="info-box">
              <strong>Before you begin</strong>
              <p>{translateTerms(pat.setup, pat.terminology || "US", term)}</p>
            </div>
            <SectionTitle
              title="One stitch at a time"
              subtitle={`Check off each ${pat.unit} as you go.`}
            />
            <div className="instructions">
              {pat.instructions.map((r, i) => (
                <label
                  key={i}
                  className={
                    "instruction " + (p.done.includes(i) ? "done" : "")
                  }
                >
                  <input
                    type="checkbox"
                    checked={p.done.includes(i)}
                    disabled={p.status === "completed"}
                    onChange={() =>
                      updateProject(p.id, {
                        done: p.done.includes(i)
                          ? p.done.filter((x) => x !== i)
                          : [...p.done, i].sort((a, b) => a - b),
                      })
                    }
                  />
                  <span className="round-label">
                    {pat.unit} {i + 1}
                  </span>
                  <span className="round-text">
                    {translateTerms(r.text, pat.terminology || "US", term)}
                    {(pat.terminology || "US") !== term && (
                      <small className="source-terms">
                        {pat.terminology || "US"} original: {r.text}
                      </small>
                    )}
                    {r.count != null && <small>{r.count} stitches</small>}
                  </span>
                </label>
              ))}
            </div>
            <div className="info-box">
              <strong>Finishing touches</strong>
              <p>{translateTerms(pat.finish, pat.terminology || "US", term)}</p>
            </div>
            {p.status === "active" && (
              <div className="finish-area">
                <p>
                  {all
                    ? "All checked off? Record your actual yarn use to finish."
                    : "Finish all rows or rounds to complete this project."}
                </p>
                <button
                  className="button primary"
                  disabled={!all}
                  onClick={() => setModal({ type: "finish", project: p })}
                >
                  <CheckCircle2 size={16} /> Finish project
                </button>
              </div>
            )}
          </div>
          <aside>
            <section className="panel">
              <h3>Your materials</h3>
              {materialsFor(p).map((m, i) => {
                const yarn = state.yarn.find((y) => y.id === m.yarnId);
                return (
                  <div className="project-material" key={m.id}>
                    <div className="yarn-detail">
                      <span
                        className="swatch large"
                        style={{ background: yarn?.hex || "#e1d6bd" }}
                      />
                      <div>
                        <strong>
                          {m.role || `Color ${i + 1}`} ·{" "}
                          {yarn?.color || "Need to buy"}
                        </strong>
                        <small>{yarn?.name || "No stash yarn assigned"}</small>
                      </div>
                    </div>
                    <dl>
                      <div>
                        <dt>
                          {p.status === "active" ? "Reserved" : "Estimated"}
                        </dt>
                        <dd>{m.yards} yd</dd>
                      </div>
                      <div>
                        <dt>Yarn weight</dt>
                        <dd>{m.weight || pat.weight}</dd>
                      </div>
                    </dl>
                    {p.status === "active" &&
                      (!m.yarnId || available(state, m.yarnId) < 0) && (
                        <p className="material-warning">
                          {m.yarnId
                            ? `${-available(state, m.yarnId)} yd short across active projects`
                            : "Assign yarn in Edit project after buying it."}
                        </p>
                      )}
                  </div>
                );
              })}
              <dl>
                <div>
                  <dt>Hook</dt>
                  <dd>{pat.hook}</dd>
                </div>
              </dl>
              {p.additionalSupplies && (
                <p className="small-print">
                  Other supplies: {p.additionalSupplies}
                </p>
              )}
              {p.referenceImage && (
                <img
                  className="reference-photo"
                  src={p.referenceImage}
                  alt={`Reference for ${p.name}`}
                />
              )}
            </section>
            <section className="panel">
              <h3>Stitches in this pattern</h3>
              <p>Need a refresher? Take a peek.</p>
              <div className="stitch-links">
                {pat.stitches.map((id) => {
                  const s = stitches.find((x) => x.id === id);
                  return (
                    <div className="required-stitch" key={id}>
                      <button
                        key={id}
                        onClick={() => setModal({ type: "stitch", stitch: s })}
                      >
                        <span>
                          <strong>{stitchName(s, term)}</strong>
                          <small>
                            {s.name} · {s.abbr} · US
                          </small>
                        </span>
                        {state.skills[id] === "Mastered" ? (
                          <CheckCircle2 size={17} className="green" />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                      {(!state.skills[id] ||
                        state.skills[id] === "Want to learn") && (
                        <div className="new-stitch-prompt">
                          <p>New to you, or already familiar?</p>
                          <button
                            className="text-link"
                            aria-label={`Learn ${s.name}`}
                            onClick={() => {
                              setState((st) => ({
                                ...st,
                                skills: { ...st.skills, [id]: "Learning" },
                              }));
                              setModal({ type: "stitch", stitch: s });
                            }}
                          >
                            Learn this stitch
                          </button>
                          <button
                            className="text-link"
                            aria-label={`I know ${s.name}`}
                            onClick={() =>
                              setState((st) => ({
                                ...st,
                                skills: { ...st.skills, [id]: "Mastered" },
                              }))
                            }
                          >
                            I know this stitch
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
            <section className="panel">
              <h3>Little notes</h3>
              <textarea
                aria-label="Project notes"
                placeholder="A reminder, a color idea, a little win…"
                value={p.notes}
                onChange={(e) => updateProject(p.id, { notes: e.target.value })}
                rows={5}
              />
              <small className="muted">Saved as you type.</small>
            </section>
          </aside>
        </div>
      </>
    );
  }
  function StashPage() {
    const list = state.yarn.filter((y) =>
      `${y.name} ${y.color} ${y.fiber} ${y.weight}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
    return (
      <>
        <PageHeading
          eyebrow="GOOD THINGS IN YOUR BASKET"
          title="A stash full of possibilities."
          text="Know what you have. Make something you love."
          action="Add yarn"
          onClick={() => setModal({ type: "yarn" })}
        />
        <div className="stash-totals">
          <div>
            <span className="eyebrow">ON HAND</span>
            <strong>
              {state.yarn.reduce((n, y) => n + y.yards, 0).toLocaleString()}{" "}
              <small>yd</small>
            </strong>
          </div>
          <div>
            <span className="eyebrow">RESERVED FOR PROJECTS</span>
            <strong>
              {active.reduce((n, p) => n + p.yards, 0).toLocaleString()}{" "}
              <small>yd</small>
            </strong>
          </div>
          <div>
            <span className="eyebrow">TO TOP UP</span>
            <strong>
              {short.reduce((n, y) => n + y.short, 0)} <small>yd</small>
            </strong>
          </div>
          <button
            className="button outline"
            onClick={() => setModal({ type: "shopping" })}
          >
            <ShoppingBag size={16} /> Shopping list
          </button>
        </div>
        <div className="toolbar">
          <SearchInput
            query={query}
            setQuery={setQuery}
            placeholder="Search colors, fibers, or yarn names…"
          />
        </div>
        <div className="yarn-grid">
          {list.map((y) => {
            const r = reserved(state, y.id),
              a = available(state, y.id);
            return (
              <article className="yarn-card" key={y.id}>
                <div className="yarn-visual">
                  <Yarn color={y.hex} />
                  <button
                    className="icon-button"
                    aria-label={`Edit ${y.color}`}
                    onClick={() => setModal({ type: "yarn", yarn: y })}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <div className="yarn-content">
                  <span className="eyebrow">
                    {y.fiber} · {y.weight}
                  </span>
                  <h3>{y.color}</h3>
                  <p>{y.name}</p>
                  <dl>
                    <div>
                      <dt>On hand</dt>
                      <dd>{y.yards} yd</dd>
                    </div>
                    <div>
                      <dt>Reserved</dt>
                      <dd>{r} yd</dd>
                    </div>
                  </dl>
                  <div className={"availability " + (a < 0 ? "low" : "")}>
                    <span>
                      {a < 0 ? "Needs a top-up" : "Available to plan"}
                    </span>
                    <strong>
                      {a < 0 ? Math.abs(a) : a} yd {a < 0 ? "short" : ""}
                    </strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!list.length && (
          <Empty
            icon={Layers}
            title="Make room for some yarn"
            text="Add your yarn with its remaining yardage to start planning."
            action="Add yarn"
            onClick={() => setModal({ type: "yarn" })}
          />
        )}
        <div className="info-box inline-info">
          <Info size={18} />
          <p>
            “On hand” includes yarn set aside for active projects. Reservations
            are released when a project is canceled. Yarn is deducted only when
            you finish and confirm actual use.
          </p>
        </div>
      </>
    );
  }
  function StitchPage() {
    const filter = stitchFilter,
      setFilter = setStitchFilter;
    const list = stitches.filter(
      (s) =>
        `${s.name} ${s.abbr} ${s.kind}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        ((filter === "My stitches" && libraryIds(state).includes(s.id)) ||
          (filter === "Discover" && !libraryIds(state).includes(s.id)) ||
          (state.skills[s.id] || "Want to learn") === filter),
    );
    return (
      <>
        <PageHeading
          eyebrow="YOUR GROWING TOOLKIT"
          title="Every stitch is a new possibility."
          text="Learn it. Practice it. Come back whenever you need a little reminder."
        />
        <section className="skills-summary">
          <div
            className="skill-ring"
            style={{ "--pct": (mastered / stitches.length) * 100 + "%" }}
          >
            <span>
              {mastered}
              <small>of {stitches.length}</small>
            </span>
          </div>
          <div>
            <h2>Look how far you’ve come.</h2>
            <p>
              {libraryIds(state).length} stitches in your library · {mastered}{" "}
              mastered · {stitches.length} guides available. New projects add
              their required stitches automatically.
            </p>
            <span className="badge">Your pace. Your progress.</span>
          </div>
          <GraduationCap className="summary-cap" size={68} strokeWidth={1} />
        </section>
        <div className="toolbar">
          <SearchInput
            query={query}
            setQuery={setQuery}
            placeholder="Find a stitch or abbreviation…"
          />
        </div>
        <div className="tabs">
          {[
            "My stitches",
            "Discover",
            "Want to learn",
            "Learning",
            "Mastered",
          ].map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="stitch-grid">
          {list.map((s, i) => (
            <article className="stitch-card" key={s.id}>
              <div className="stitch-card-top">
                <span className={"stitch-glyph glyph-" + i} aria-hidden="true">
                  {{
                    ch: "∽",
                    sc: "×",
                    sl: "•",
                    hdc: "Ŧ",
                    dc: "Ŧ",
                    mr: "◎",
                    inc: "∨",
                    dec: "∧",
                    blo: "⌒",
                  }[s.id] || <Sparkles size={23} />}
                </span>
                <span
                  className={
                    "status-tag status-" +
                    (state.skills[s.id] || "Want to learn")
                      .split(" ")[0]
                      .toLowerCase()
                  }
                >
                  {state.skills[s.id] || "Want to learn"}
                </span>
              </div>
              <span className="eyebrow">
                {s.kind} · {s.abbr}
              </span>
              <h3>{stitchName(s, term)}</h3>
              <small className="muted">
                {term === "US"
                  ? translateTerms(s.name, "US", "UK") + " · UK"
                  : s.name + " · US"}
              </small>
              <p>{s.description}</p>
              <button
                className="text-link"
                onClick={() => setModal({ type: "stitch", stitch: s })}
              >
                Open stitch guide <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
        {!list.length && (
          <Empty
            icon={GraduationCap}
            title="A little room to grow"
            text="Try a different search or stitch status."
            action="Discover stitches"
            onClick={() => {
              setFilter("Discover");
              setQuery("");
            }}
          />
        )}
        <p className="page-footnote">
          Stitch guides retain their labeled US source; names show your
          preferred terminology. Statuses are yours to choose; finishing a
          project never marks a stitch mastered automatically.
        </p>
      </>
    );
  }
  return (
    <div className="app-shell" data-app-version={appInfo.version}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={"sidebar " + (mobile ? "open" : "")}>
        <button className="brand" onClick={() => go("Dashboard")}>
          <span className="brand-icon">
            <img src={brandMark} alt="" />
          </span>
          <span>
            loop <em>&</em> learn<small>YOUR CROCHET COMPANION</small>
          </span>
        </button>
        <div className="nav-label">YOUR STUDIO</div>
        <nav>
          {nav.map(([label, Icon]) => (
            <button
              key={label}
              className={page === label ? "active" : ""}
              onClick={() => go(label)}
            >
              <Icon size={19} strokeWidth={1.65} />
              <span>{label}</span>
              {label === "My projects" && <small>{active.length}</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-message">
            <div className="mini-flower" aria-hidden="true">
              <svg width="44" height="44" viewBox="0 0 44 44">
                {Array.from({ length: 8 }, (_, i) => (
                  <ellipse
                    key={i}
                    cx="22"
                    cy="12"
                    rx="2.5"
                    ry="10"
                    fill="currentColor"
                    transform={`rotate(${i * 45} 22 22)`}
                  />
                ))}
                <circle cx="22" cy="22" r="4" fill="#f5f3ed" />
              </svg>
            </div>
            <p>
              Good things
              <br />
              take a few stitches.
            </p>
            <span>A LITTLE EVERY DAY IS ENOUGH.</span>
          </div>
          <button
            className="profile"
            onClick={() => setModal({ type: "settings" })}
          >
            <span className="avatar">
              {state.maker.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{state.maker}’s studio</strong>
              <small>Make yourself at home</small>
            </span>
            <Settings size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span>My studio</span>
            <ChevronRight size={13} />
            <strong>{page}</strong>
          </div>
          <div className="topbar-right">
            <span className="save-status">
              <span />{" "}
              {storageError ? "Changes not saved" : "Saved on this device"}
            </span>
            <button
              className="avatar small"
              aria-label="Studio settings"
              onClick={() => setModal({ type: "settings" })}
            >
              {state.maker.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        <main id="main">
          {storageError && (
            <div className="error-banner">
              Your browser couldn’t save your changes. Export a backup in Studio
              settings before leaving.
            </div>
          )}
          {page === "Dashboard"
            ? Dashboard()
            : page === "Patterns"
              ? PatternPage()
              : page === "My projects"
                ? ProjectsPage()
                : page === "Yarn stash"
                  ? StashPage()
                  : StitchPage()}
          <footer>
            <span>loop & learn</span>
            <p>A little space for your next handmade thing.</p>
            <span>v{appInfo.version} · MADE ONE STITCH AT A TIME</span>
          </footer>
        </main>
      </div>
      {modal && (
        <Modal
          modal={modal}
          close={() => setModal(null)}
          state={state}
          setState={setState}
          notify={notify}
          startProject={startProject}
          openProject={openProject}
          openProfile={() => setModal({ type: "profile" })}
        />
      )}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast">
            <CheckCircle2 size={18} />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
