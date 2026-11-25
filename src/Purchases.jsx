import React, { useState } from "react";
import { Clock, CheckCircle2, Plus, ShoppingBag } from "lucide-react";
import { Field, ErrorMessage } from "./ProjectForms.jsx";
import { weights } from "./yarn.js";
import { YarnPhotoInput } from "./YarnPhoto.jsx";
import {
  localDay,
  nextDay,
  deliveryDue,
  recordPurchase,
  purchaseQuantity,
  receivePurchase,
  updateDelivery,
} from "./purchases.js";

export const displayDate = (day) =>
  day
    ? new Date(`${day}T12:00:00`).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not set";

export function PurchaseForm({ state, setState, yarnId, close, notify }) {
  const original = state.yarn.find((y) => y.id === yarnId);
  const [status, setStatus] = useState("received");
  const [selected, setSelected] = useState(original?.id || "");
  const [name, setName] = useState(original?.name || "");
  const [unit, setUnit] = useState("yards");
  const [skeins, setSkeins] = useState("");
  const [yardsPerSkein, setYardsPerSkein] = useState("");
  const [purchasedOn, setPurchasedOn] = useState(localDay());
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  // Stable IDs make new-yarn creation and repeated submits one operation.
  const [id] = useState(() => crypto.randomUUID());
  const [newYarnId] = useState(() => crypto.randomUUID());
  const yarn = state.yarn.find((y) => y.id === selected);
  const matches =
    !yarn && name.trim()
      ? state.yarn.filter((y) =>
          `${y.name} ${y.color}`
            .toLowerCase()
            .includes(name.trim().toLowerCase()),
        )
      : [];
  const total = Number(skeins) * Number(yardsPerSkein);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        if (photoBusy) {
          setError("Wait for your photo to finish preparing.");
          return;
        }
        const f = new FormData(e.currentTarget);
        try {
          const quantity = purchaseQuantity({
            unit,
            yards: Number(f.get("yards")),
            skeins: f.get("skeins") ? Number(f.get("skeins")) : null,
            yardsPerSkein: Number(f.get("yardsPerSkein")),
          });
          const newYarn = yarn
            ? null
            : {
                id: newYarnId,
                name: name.trim(),
                color: String(f.get("color") || "").trim(),
                fiber: String(f.get("fiber") || "").trim() || "Not specified",
                weight: f.get("weight"),
                hex: f.get("hex"),
                yards: 0,
                photo,
              };
          const purchase = {
            id,
            yarnId: yarn?.id || newYarnId,
            ...quantity,
            status,
            purchasedOn,
            receivedOn: status === "received" ? f.get("receivedOn") : null,
            expectedOn:
              status === "awaiting" ? f.get("expectedOn") || null : null,
            remindAfter: null,
            store: String(f.get("store") || "").trim(),
            notes: String(f.get("notes") || "").trim(),
          };
          const today = localDay();
          recordPurchase(state, purchase, today, newYarn);
          setState((s) => recordPurchase(s, purchase, today, newYarn));
          close();
          notify(
            status === "received"
              ? "Purchase recorded. Your stock is updated."
              : "Purchase recorded as awaiting delivery. Stock is unchanged.",
          );
        } catch (err) {
          setError(err.message);
        }
      }}
    >
      <p className="modal-intro">
        Bought a new yarn or more of a favorite? Record either here.
      </p>
      <Field
        label="Yarn purchased"
        hint="Type a new yarn name, or choose an existing match below to add to that yarn."
      >
        <input
          name="yarnName"
          value={name}
          maxLength={120}
          required
          autoComplete="off"
          placeholder="Type the brand or yarn name"
          onChange={(e) => {
            setName(e.target.value);
            setSelected("");
          }}
        />
      </Field>
      {matches.length > 0 && (
        <div className="purchase-yarn-matches">
          <p>Matching yarn in your stash</p>
          <ul>
            {matches.map((y) => (
              <li key={y.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(y.id);
                    setName(y.name);
                  }}
                >
                  <span>
                    <strong>
                      {y.name} — {y.color}
                    </strong>
                    <small>
                      {y.fiber} · {y.weight} · {y.yards} yd on hand
                    </small>
                  </span>
                  <span>Use this yarn</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {yarn ? (
        <div className="purchase-stock-note">
          {yarn.photo && (
            <img
              className="yarn-photo-preview"
              src={yarn.photo}
              alt={`${yarn.name} — ${yarn.color}`}
            />
          )}
          <strong>
            {yarn.color} — {yarn.name}
          </strong>
          <br />
          Currently on hand: {yarn.yards} yd. This purchase will use the same
          yarn record.
        </div>
      ) : (
        <fieldset className="purchase-new-yarn">
          <legend>New yarn details</legend>
          <Field label="Color name">
            <input
              name="color"
              required
              maxLength={120}
              placeholder="e.g. Forest green"
            />
          </Field>
          <YarnPhotoInput
            photo={photo}
            onChange={setPhoto}
            onBusyChange={setPhotoBusy}
          />
          <details className="yarn-fallback-color">
            <summary>Optional fallback color</summary>
            <Field label="Fallback color">
              <input name="hex" type="color" defaultValue="#93a38b" />
            </Field>
          </details>
          <div className="form-columns">
            <Field label="Fiber (optional)">
              <input
                name="fiber"
                maxLength={120}
                placeholder="e.g. Wool blend"
              />
            </Field>
            <Field label="Yarn weight">
              <select name="weight" defaultValue="" required>
                <option value="" disabled>
                  Choose the label’s weight
                </option>
                {weights.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p>
            This yarn will be saved with the purchase. Yarn awaiting delivery
            starts at 0 yards on hand.
          </p>
        </fieldset>
      )}
      <Field label="Measure purchase in">
        <select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="yards">Total yards</option>
          <option value="skeins">Skeins</option>
        </select>
      </Field>
      {unit === "yards" ? (
        <div className="form-columns">
          <Field
            label="Yards purchased"
            hint="Additional yards purchased, not your new stock total."
          >
            <input name="yards" type="number" min="1" step="1" required />
          </Field>
          <Field label="Skeins purchased (optional)">
            <input
              name="skeins"
              type="number"
              min="1"
              step="1"
              value={skeins}
              onChange={(e) => setSkeins(e.target.value)}
            />
          </Field>
        </div>
      ) : (
        <>
          <div className="form-columns">
            <Field label="Skeins purchased">
              <input
                name="skeins"
                type="number"
                min="1"
                step="1"
                required
                value={skeins}
                onChange={(e) => setSkeins(e.target.value)}
              />
            </Field>
            <Field
              label="Yards per skein"
              hint="Use the yardage printed on the label."
            >
              <input
                name="yardsPerSkein"
                type="number"
                min="1"
                step="1"
                required
                value={yardsPerSkein}
                onChange={(e) => setYardsPerSkein(e.target.value)}
              />
            </Field>
          </div>
          <p className="purchase-stock-note" aria-live="polite">
            {Number.isSafeInteger(total) && total > 0
              ? `${skeins} × ${yardsPerSkein} = ${total} yards purchased`
              : "Enter skein count and yards per skein to calculate total yards."}
          </p>
        </>
      )}
      <Field label="Purchase date">
        <input
          type="date"
          value={purchasedOn}
          max={localDay()}
          required
          onChange={(e) => setPurchasedOn(e.target.value)}
        />
      </Field>
      <Field label="Purchase status">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="received">Purchased — I have it</option>
          <option value="awaiting">Purchased — awaiting delivery</option>
        </select>
      </Field>
      {status === "awaiting" ? (
        <Field
          label="Expected delivery (optional)"
          hint="We’ll ask about delivery when you open the app on or after this date. Stock changes only when you confirm receipt."
        >
          <input
            key="expected"
            name="expectedOn"
            type="date"
            min={purchasedOn}
          />
        </Field>
      ) : (
        <Field
          label="Date received"
          hint="When did you receive this yarn? Expected delivery is only asked for yarn still on its way."
        >
          <input
            key="received"
            name="receivedOn"
            type="date"
            defaultValue={localDay()}
            min={purchasedOn}
            max={localDay()}
            required
          />
        </Field>
      )}
      <Field label="Store (optional)">
        <input name="store" maxLength={120} autoComplete="off" />
      </Field>
      <Field label="Purchase notes (optional)">
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          placeholder="Order number, dye lot, or anything you want to remember"
        />
      </Field>
      <ErrorMessage error={error} />
      <button
        className="button primary full"
        type="submit"
        disabled={photoBusy}
      >
        <Plus size={16} /> Record purchase
      </button>
    </form>
  );
}

export function DeliveryForm({
  state,
  setState,
  purchaseId,
  mode,
  close,
  notify,
}) {
  const p = state.purchases.find((p) => p.id === purchaseId);
  const [error, setError] = useState("");
  if (!p || p.status !== "awaiting")
    return <p>This purchase is no longer awaiting delivery.</p>;
  const yarn = state.yarn.find((y) => y.id === p.yarnId);
  const receiving = mode === "receive";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const change = receiving
          ? (s) => receivePurchase(s, p.id, f.get("date"))
          : (s) => updateDelivery(s, p.id, f.get("date") || null);
        try {
          change(state);
          setState(change);
          close();
          notify(
            receiving
              ? "Receipt recorded. Your stock is updated."
              : "Expected delivery updated.",
          );
        } catch (err) {
          setError(err.message);
        }
      }}
    >
      <p className="modal-intro">
        {yarn?.color} · {yarn?.name} · {p.yards} yd
      </p>
      <p className="purchase-stock-note">
        Purchased {displayDate(p.purchasedOn)}
        {p.store ? ` from ${p.store}` : ""}.
      </p>
      <Field
        label={receiving ? "Date received" : "Expected delivery (optional)"}
        hint={
          receiving
            ? `Confirming adds ${p.yards} yards to stock once. Confirm only after the full purchase arrives.`
            : "Leave blank to turn off arrival-date reminders. The purchase will stay in your awaiting list."
        }
      >
        <input
          name="date"
          type="date"
          min={p.purchasedOn}
          max={receiving ? localDay() : undefined}
          defaultValue={receiving ? localDay() : p.expectedOn || ""}
          required={receiving}
        />
      </Field>
      <ErrorMessage error={error} />
      <button className="button primary full" type="submit">
        {receiving ? "Confirm receipt and add stock" : "Save expected delivery"}
      </button>
    </form>
  );
}

export function PurchaseHistory({ state, yarnId, openModal }) {
  const [filter, setFilter] = useState("all");
  const purchases = [...(state.purchases || [])]
    .filter(
      (p) =>
        (!yarnId || p.yarnId === yarnId) &&
        (filter === "all" || p.status === filter),
    )
    .sort((a, b) => b.purchasedOn.localeCompare(a.purchasedOn));
  const yarn = state.yarn.find((y) => y.id === yarnId);
  return (
    <>
      <p className="modal-intro">
        {yarn ? `${yarn.color} — ${yarn.name}. ` : "Your yarn purchases. "}
        Awaiting deliveries do not count as on-hand stock.
      </p>
      <div className="purchase-history-toolbar">
        <Field label="Show purchases">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All purchases</option>
            <option value="awaiting">Awaiting delivery</option>
            <option value="received">Received</option>
          </select>
        </Field>
        <button
          className="button outline"
          onClick={() => openModal({ type: "purchase", yarnId })}
        >
          <Plus size={15} /> Record a purchase
        </button>
      </div>
      {!purchases.length && (
        <p className="purchase-empty">
          No{" "}
          {filter === "all"
            ? ""
            : filter === "awaiting"
              ? "awaiting "
              : "received "}
          purchases recorded{yarn ? " for this yarn" : ""}.
        </p>
      )}
      <div className="purchase-list">
        {purchases.map((p) => {
          const y = state.yarn.find((y) => y.id === p.yarnId);
          return (
            <article className="purchase-entry" key={p.id}>
              <div className="purchase-entry-heading">
                <h3>{y?.color}</h3>
                <span className={`purchase-status ${p.status}`}>
                  {p.status === "received" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Clock size={14} />
                  )}
                  {p.status === "received" ? "Received" : "Awaiting delivery"}
                </span>
              </div>
              <p>
                {y?.name} · {p.yards} yd
                {p.skeins
                  ? ` · ${p.skeins} skein${p.skeins === 1 ? "" : "s"}`
                  : ""}
              </p>
              {p.quantityUnit === "skeins" && (
                <p className="purchase-text">{p.yardsPerSkein} yd per skein</p>
              )}
              <dl className="purchase-dates">
                <div>
                  <dt>Purchased</dt>
                  <dd>{displayDate(p.purchasedOn)}</dd>
                </div>
                <div>
                  <dt>
                    {p.status === "received" ? "Received" : "Expected delivery"}
                  </dt>
                  <dd>
                    {displayDate(
                      p.status === "received" ? p.receivedOn : p.expectedOn,
                    )}
                  </dd>
                </div>
              </dl>
              {p.store && <p className="purchase-text">Store: {p.store}</p>}
              {p.notes && <p className="purchase-text">{p.notes}</p>}
              {p.status === "awaiting" && (
                <div className="purchase-actions">
                  <button
                    className="button outline"
                    onClick={() =>
                      openModal({ type: "receivePurchase", purchaseId: p.id })
                    }
                  >
                    Mark received
                  </button>
                  <button
                    className="text-link"
                    onClick={() =>
                      openModal({ type: "deliveryDate", purchaseId: p.id })
                    }
                  >
                    Change expected delivery
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

export function DeliveryReminders({
  state,
  setState,
  today,
  openModal,
  notify,
}) {
  const due = (state.purchases || []).filter((p) => deliveryDue(p, today));
  if (!due.length) return null;
  return (
    <section
      className="basket-card delivery-reminders"
      aria-label="Delivery reminders"
    >
      <div className="aside-title">
        <span className="icon-tile sage">
          <ShoppingBag size={19} />
        </span>
        <h3>Has your yarn arrived?</h3>
      </div>
      <p>
        These purchases were expected by today. Confirm receipt before adding
        them to stock.
      </p>
      {due.map((p) => {
        const yarn = state.yarn.find((y) => y.id === p.yarnId);
        return (
          <article className="delivery-reminder" key={p.id}>
            <strong>
              {yarn?.color} · {p.yards} yd
            </strong>
            <p>
              {yarn?.name} · Expected {displayDate(p.expectedOn)}
            </p>
            <div className="purchase-actions">
              <button
                className="button outline"
                onClick={() =>
                  openModal({ type: "receivePurchase", purchaseId: p.id })
                }
              >
                Mark received
              </button>
              <button
                className="text-link"
                onClick={() => {
                  setState((s) =>
                    updateDelivery(s, p.id, p.expectedOn, nextDay(today)),
                  );
                  notify(
                    "Still awaiting delivery. We’ll remind you tomorrow when you open the app.",
                  );
                }}
              >
                Still waiting
              </button>
              <button
                className="text-link"
                onClick={() =>
                  openModal({ type: "deliveryDate", purchaseId: p.id })
                }
              >
                Change expected delivery
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
