/* Room Heating Scheduler: eigene Better-Thermostat-Wochenkarte */

class RoomHeatingSchedulerCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._renderedOptions = null;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render(true);
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _rooms() {
    return Object.entries(this._hass?.states || {})
      .filter(([, state]) =>
        state.attributes?.entry_id &&
        state.attributes?.room_name &&
        state.attributes?.climate_entity
      )
      .map(([entityId, state]) => ({
        entityId,
        roomName: state.attributes.room_name,
      }))
      .sort((a, b) => a.roomName.localeCompare(b.roomName));
  }

  _render(force = false) {
    if (!this._hass) return;

    const rooms = this._rooms();
    const options = rooms.map(({ entityId, roomName }) => ({
      value: entityId,
      label: roomName,
    }));

    if (this._config.entity && !options.some((option) => option.value === this._config.entity)) {
      options.push({ value: this._config.entity, label: this._config.entity });
    }

    const optionsKey = JSON.stringify(options);
    if (!force && optionsKey === this._renderedOptions) return;
    this._renderedOptions = optionsKey;

    const selectedEntity = this._config.entity || options[0]?.value || "";
    this.shadowRoot.innerHTML = "<ha-form></ha-form>";

    if (!options.length) {
      this.shadowRoot.innerHTML = `
        <p>Es wurde noch kein Room-Heating-Raum gefunden. Richte zuerst mindestens einen Raum in der Integration ein.</p>
      `;
      return;
    }

    const form = this.shadowRoot.querySelector("ha-form");
    form.hass = this._hass;
    form.schema = [
      {
        name: "entity",
        required: true,
        selector: {
          select: {
            mode: "dropdown",
            options,
          },
        },
      },
      {
        name: "window_entities",
        selector: {
          entity: {
            multiple: true,
            filter: [
              { domain: "binary_sensor", device_class: "window" },
              { domain: "binary_sensor", device_class: "opening" },
            ],
          },
        },
      },
    ];
    form.data = {
      entity: selectedEntity,
      window_entities: this._config.window_entities || [],
    };
    form.computeLabel = (schema) => schema.name === "entity"
      ? "Heizungsraum"
      : schema.name === "window_entities"
        ? "Fensterkontakte (optional)"
        : undefined;
    form.computeHelper = (schema) => schema.name === "entity"
      ? "Wähle den Raum, dessen Wochenplan diese Karte anzeigen und bearbeiten soll."
      : schema.name === "window_entities"
        ? "Wähle Fensterkontakte aus. Die Karte zeigt an, wenn mindestens ein ausgewähltes Fenster offen ist."
        : undefined;

    form.addEventListener("value-changed", (event) => {
      const config = { ...this._config, ...event.detail.value };
      this._config = config;
      const changed = new Event("config-changed", {
        bubbles: true,
        composed: true,
      });
      changed.detail = { config };
      this.dispatchEvent(changed);
    });

    if (!this._config.entity && selectedEntity) {
      this._config = { ...this._config, entity: selectedEntity };
      const changed = new Event("config-changed", {
        bubbles: true,
        composed: true,
      });
      changed.detail = { config: this._config };
      this.dispatchEvent(changed);
    }
  }
}

if (!customElements.get("room-heating-scheduler-card-editor")) {
  customElements.define(
    "room-heating-scheduler-card-editor",
    RoomHeatingSchedulerCardEditor
  );
}

class RoomHeatingSchedulerCard extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._config = {};
    this._schedule = {};
    this._dirty = false;
    this._hass = null;
    this._groupOpenState = [false, false];
  }

  static getConfigElement() {
    return document.createElement("room-heating-scheduler-card-editor");
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = config || {};

    this.render();
  }

  set hass(hass) {
    this._hass = hass;

    this.render();
  }

  getCardSize() {
    return 8;
  }

  _getEntity() {
    return this._hass?.states?.[this._config.entity];
  }

  _cloneSchedule(schedule) {
    const out = {};

    for (let i = 0; i < 7; i++) {
      out[String(i)] = (schedule?.[String(i)] || []).map((p) => ({
        start: p.start,
        end: p.end,
        temperature: Number(p.temperature),
        enabled: p.enabled !== false,
      }));
    }

    return out;
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  render() {
    const openGroups = [...this.shadowRoot.querySelectorAll("details.day-group")]
      .map((group) => group.open);
    if (openGroups.length) {
      this._groupOpenState = openGroups;
    }

    if (!this._hass) {
      return;
    }

    if (!this._config.entity) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div class="pad">Bitte Karte bearbeiten und einen Heizungsraum auswählen.</div>
        </ha-card>
      `;
      return;
    }

    const state = this._getEntity();

    if (!state) {
      this.shadowRoot.innerHTML = `
        <ha-card>
          <div class="pad">
            Entität nicht gefunden:
            ${this._escape(this._config.entity)}
          </div>
        </ha-card>
      `;

      return;
    }

    /*
     * Nur beim ersten Rendern bzw. wenn nichts ungespeichert ist,
     * den Zeitplan aus der HA-Entity übernehmen.
     */
    if (!this._dirty) {
      this._schedule = this._cloneSchedule(
        state.attributes?.schedule
      );
    }

    const attributes = state.attributes || {};
    const climate = this._hass.states[attributes.climate_entity];
    const climateAttributes = climate?.attributes || {};
    const configuredWindowEntities = Array.isArray(this._config.window_entities)
      ? this._config.window_entities
      : [];
    const windowStates = configuredWindowEntities.map((entityId) => ({
      entityId,
      state: this._hass.states[entityId],
    }));
    const openWindowNames = windowStates
      .filter(({ state }) => state?.state === "on")
      .map(({ entityId, state }) => state.attributes?.friendly_name || entityId);
    const windowStatusUnknown = windowStates.some(({ state }) =>
      !state || state.state === "unknown" || state.state === "unavailable"
    );
    const windowStatusText = openWindowNames.length
      ? `Fenster offen: ${openWindowNames.join(", ")}`
      : windowStatusUnknown
        ? "Fensterstatus nicht verfügbar"
        : configuredWindowEntities.length
          ? "Alle Fenster geschlossen"
          : "";
    const windowStatusClass = openWindowNames.length ? "open" : "";
    const setpoint = climateAttributes.temperature;
    const minimumTarget = Number(climateAttributes.min_temp ?? 5);
    const maximumTarget = Number(climateAttributes.max_temp ?? 30);
    const manualOverride = Boolean(attributes.manual_override);
    const action = climateAttributes.hvac_action;
    const heating = action === "heating";
    const currentTemperature = climateAttributes.current_temperature;
    const actionLabels = {
      heating: "Heizt gerade",
      idle: "Heizt aktuell nicht",
      cooling: "Kühlt gerade",
      drying: "Entfeuchtet",
      fan: "Lüftet",
      preheating: "Heizt vor",
      defrosting: "Enteist",
      off: "Thermostat ausgeschaltet",
    };
    const heatingStatus = actionLabels[action] || (
      !climate
        ? "Thermostat nicht verfügbar"
        : climate.state === "off"
          ? "Thermostat ausgeschaltet"
          : "Betriebsstatus nicht gemeldet"
    );
    const profileLabels = {
      comfort: "Komfortphase",
      eco: "Eco-Zeit",
      vacation: "Urlaubsmodus aktiv",
      unavailable: "Thermostat nicht verfügbar",
      error: "Fehler bei der Sollwertübergabe",
      unknown: "Zeitplanstatus unbekannt",
    };
    const profileStatus = profileLabels[attributes.schedule_status] || "Zeitplanstatus unbekannt";
    const scheduleTemperature = attributes.vacation
      ? attributes.vacation_temperature
      : attributes.schedule_status === "comfort"
        ? attributes.comfort_temperature
        : attributes.schedule_status === "eco"
          ? attributes.eco_temperature
          : climateAttributes.temperature;
    const scheduleTemperatureLabel = scheduleTemperature == null
      ? ""
      : ` · ${Number(scheduleTemperature).toLocaleString("de-DE", { maximumFractionDigits: 1 })} °C`;

    const days = [
      "Montag",
      "Dienstag",
      "Mittwoch",
      "Donnerstag",
      "Freitag",
      "Samstag",
      "Sonntag",
    ];

    let html = `
      <ha-card>

        <div class="header">
          <div>
              <b>${this._escape(attributes.room_name || "Room Heating")}</b>
            <div class="status-block">
              <span class="status-label">Aktueller Heizbetrieb</span>
              <div class="status-row">
                <span class="heating-status ${heating ? "heating" : ""}">
                  <span class="status-dot"></span>${this._escape(heatingStatus)}
                </span>
                <span class="schedule-status">${this._escape(profileStatus)}${this._escape(scheduleTemperatureLabel)}</span>
                ${windowStatusText ? `<span class="window-status ${windowStatusClass}">${this._escape(windowStatusText)}</span>` : ""}
              </div>
            </div>
          </div>
          <div class="hero-temp">
            <span>Ist-Temperatur</span><strong>${currentTemperature == null ? "—" : Number(currentTemperature).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " °C"}</strong>
            <div class="target-control">
              <button class="adjust" data-delta="-1" aria-label="Solltemperatur senken" ${setpoint == null || Number(setpoint) <= minimumTarget ? "disabled" : ""}>−</button>
              <span class="target">Sollwert ${setpoint == null ? "—" : Number(setpoint).toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " °C"}</span>
              <button class="adjust" data-delta="1" aria-label="Solltemperatur erhöhen" ${setpoint == null || Number(setpoint) >= maximumTarget ? "disabled" : ""}>+</button>
            </div>
            ${manualOverride ? `<span class="manual-hint">${attributes.vacation ? "Manuell bis Urlaubsmodus endet" : "Manuell bis zur nächsten Phase"}</span>` : ""}
          </div>
          <button id="save" class="save" ${this._dirty ? "" : "disabled"}>${this._dirty ? "Änderungen speichern" : "Gespeichert"}</button>
        </div>

        <div class="temps">

          <label>
            Komfort
            <input
              id="comfort"
              type="number"
              min="5"
              max="30"
              step="0.5"
              value="${attributes.comfort_temperature ?? 21}"
            >
            °C
          </label>

          <label>
            Eco
            <input
              id="eco"
              type="number"
              min="5"
              max="30"
              step="0.5"
              value="${attributes.eco_temperature ?? 17}"
            >
            °C
          </label>

          <label>
            Urlaub
            <input
              id="vac"
              type="number"
              min="5"
              max="25"
              step="0.5"
              value="${attributes.vacation_temperature ?? 16}"
            >
            °C
          </label>

          <div class="vacation-control">
            <span class="vacation-state ${attributes.vacation ? "active" : ""}">
              Urlaubsmodus ${attributes.vacation ? "aktiv" : "inaktiv"}
            </span>
            <button
              id="vacbtn"
              aria-label="${attributes.vacation ? "Urlaubsmodus deaktivieren" : "Urlaubsmodus aktivieren"}"
            >
              ${attributes.vacation ? "Deaktivieren" : "Aktivieren"}
            </button>
          </div>

        </div>

        <div class="days">
    `;

    const groupSummary = (indices, label) => {
      const first = this._schedule[String(indices[0])] || [];
      const allMatch = indices.every((index) =>
        JSON.stringify(this._schedule[String(index)] || []) === JSON.stringify(first)
      );
      const enabled = first.filter((period) => period.enabled !== false);
      const preview = allMatch && enabled.length
        ? enabled.map((period) => `${period.start}–${period.end} · ${Number(period.temperature).toLocaleString("de-DE")} °C`).join("  /  ")
        : allMatch
          ? "Keine Komfortphase · Eco aktiv"
          : "Tagespläne individuell";
      return `${label} <span class="group-preview">${this._escape(preview)}</span>`;
    };

    days.forEach((day, idx) => {
      if (idx === 0) {
        html += `<details class="day-group" ${this._groupOpenState[0] ? "open" : ""}><summary>${groupSummary([0, 1, 2, 3, 4], "Montag–Freitag")}</summary><div class="group-days">`;
      } else if (idx === 5) {
        html += `</div></details><details class="day-group" ${this._groupOpenState[1] ? "open" : ""}><summary>${groupSummary([5, 6], "Wochenende")}</summary><div class="group-days">`;
      }

      html += `
        <section>

          <div class="dayhead">
            <b>${day}</b>

            <button
              class="add"
              data-day="${idx}"
            >
              + Phase
            </button>
          </div>
      `;

      const periods = this._schedule[String(idx)] || [];

      periods.forEach((period, index) => {
        html += `
          <div class="period">

            <input
              class="start"
              data-day="${idx}"
              data-i="${index}"
              value="${this._escape(period.start)}"
              type="time"
            >

            <span>–</span>

            <input
              class="end"
              data-day="${idx}"
              data-i="${index}"
              value="${this._escape(period.end)}"
              type="time"
            >

            <input
              class="temp"
              data-day="${idx}"
              data-i="${index}"
              value="${this._escape(period.temperature)}"
              type="number"
              min="5"
              max="30"
              step="0.5"
            >

            <span>°C</span>

            <label class="switch" title="Diese Heizphase aktivieren">
              <input class="enabled" type="checkbox" data-day="${idx}" data-i="${index}" ${period.enabled ? "checked" : ""}>
              <span class="track"></span>
            </label>

            <button
              class="del"
              data-day="${idx}"
              data-i="${index}"
              title="Phase löschen"
            >
              ×
            </button>

          </div>
        `;
      });

      if (!periods.length) {
        html += `
          <div class="empty">
            Keine Komfortphase (Eco aktiv)
          </div>
        `;
      }

      html += `
        </section>
      `;
    });

    html += `
        </div></details>

      </ha-card>
    `;

    /*
     * WICHTIG:
     * Hier muss ${html} verwendet werden.
     *
     * Die alte Version verwendete:
     * ${this.shadowRoot.innerHTML}
     *
     * Dadurch konnten die Buttons fehlen und
     * getElementById("save") null zurückgeben.
     */
    this.shadowRoot.innerHTML = `
      <style>

        :host {
          display: block;
        }

        .pad {
          padding: 16px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 16px;
          font-size: 18px;
          background: linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 11%, var(--ha-card-background, var(--card-background-color))), var(--ha-card-background, var(--card-background-color)) 68%);
        }

        .status-block { display:flex; flex-direction:column; gap:5px; margin-top:7px; }
        .status-label { color:var(--secondary-text-color); font-size:11px; }
        .status-row { display:flex; flex-wrap:wrap; align-items:center; gap:7px; }
        .heating-status { display:inline-flex; align-items:center; gap:6px; font-size:13px; font-weight:600; }
        .status-dot { width:8px; height:8px; border-radius:50%; background:var(--disabled-text-color); }
        .heating-status.heating .status-dot { background:var(--success-color, #43a047); box-shadow:0 0 0 3px color-mix(in srgb, var(--success-color, #43a047) 20%, transparent); }
        .schedule-status { color:var(--primary-color); font-size:12px; font-weight:600; padding:4px 8px; border-radius:999px; background:color-mix(in srgb, var(--primary-color) 12%, transparent); }
        .window-status { color:var(--success-color, #2e7d32); font-size:12px; font-weight:600; padding:4px 8px; border-radius:999px; background:color-mix(in srgb, var(--success-color, #2e7d32) 12%, transparent); }
        .window-status.open { color:var(--error-color, #c62828); background:color-mix(in srgb, var(--error-color, #c62828) 14%, transparent); }
        .day-group { border-bottom:1px solid var(--divider-color); }
        .day-group > summary { display:flex; align-items:center; gap:12px; padding:14px 10px; cursor:pointer; font-weight:600; list-style:none; }
        .day-group > summary::-webkit-details-marker { display:none; }
        .day-group > summary::before { content:"›"; color:var(--primary-color); font-size:20px; transition:transform .15s ease; }
        .day-group[open] > summary::before { transform:rotate(90deg); }
        .group-preview { color:var(--secondary-text-color); font-size:12px; font-weight:400; }
        .group-days { padding:0 8px 8px; }
        .vacation-control { display:flex; align-items:center; gap:8px; margin-left:auto; }
        .vacation-state { color:var(--secondary-text-color); font-size:12px; white-space:nowrap; }
        .vacation-state.active { color:var(--primary-color); font-weight:600; }

        .hero-temp { display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
        .hero-temp span { color:var(--secondary-text-color); font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
        .hero-temp strong { color:var(--primary-text-color); font-size:22px; }
        .target-control { display:flex; align-items:center; justify-content:flex-end; gap:8px; }
        .hero-temp .target { color:var(--secondary-text-color); font-size:12px; text-transform:none; letter-spacing:0; }
        button.adjust { display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; padding:0; border-radius:50%; font-size:21px; line-height:1; }
        button.adjust:disabled { opacity:.35; cursor:default; }
        .manual-hint { color:var(--primary-color); font-size:11px; }
        .save { align-self:flex-start; }
        .save:disabled { opacity:.62; cursor:default; }

        button {
          border: 0;
          border-radius: 8px;
          padding: 8px 11px;
          background: var(--primary-color);
          color: var(--text-primary-color);
          cursor: pointer;
        }

        button:hover {
          opacity: 0.85;
        }

        .temps {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 0 16px 14px;
          border-bottom: 1px solid var(--divider-color);
        }

        label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
        }

        input {
          box-sizing: border-box;
          border: 1px solid var(--divider-color);
          border-radius: 6px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
          padding: 6px;
        }

        .days {
          padding: 8px 12px;
        }

        .dayhead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin: 8px 0;
        }

        .dayhead button {
          font-size: 12px;
          padding: 5px 8px;
        }

        section {
          border-bottom: 1px solid var(--divider-color);
          padding-bottom: 8px;
        }

        .period {
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 5px 0;
          padding: 5px 7px;
          border-radius: 10px;
          background: var(--secondary-background-color);
        }
        .period:has(.enabled:not(:checked)) { opacity:.55; }

        .period .start,
        .period .end {
          width: 105px;
        }

        .period .temp {
          width: 70px;
        }

        .del {
          background: transparent;
          color: var(--error-color, #db4437);
          font-size: 18px;
          padding: 2px 7px;
        }

        .switch { position:relative; display:inline-flex; width:38px; height:22px; margin-left:auto; cursor:pointer; }
        .switch input { position:absolute; opacity:0; width:1px; height:1px; }
        .track { position:absolute; inset:0; border-radius:99px; background:var(--disabled-text-color); transition:background .18s ease; }
        .track:after { content:""; position:absolute; width:16px; height:16px; left:3px; top:3px; border-radius:50%; background:white; transition:transform .18s ease; box-shadow:0 1px 3px #0003; }
        .switch input:checked + .track { background:var(--primary-color); }
        .switch input:checked + .track:after { transform:translateX(16px); }
        .switch input:focus-visible + .track { outline:2px solid var(--primary-color); outline-offset:2px; }

        .empty {
          font-size: 12px;
          opacity: 0.55;
          padding: 4px 0 7px;
        }

        @media (max-width: 600px) {
          .header { align-items:flex-start; flex-wrap:wrap; }
          .hero-temp { align-items:flex-start; }
          .day-group > summary { align-items:flex-start; flex-wrap:wrap; gap:5px 10px; }
          .group-preview { width:100%; padding-left:28px; }

          .period .start,
          .period .end {
            width: 90px;
          }

          .temps {
            flex-direction: column;
          }

        }

      </style>

      ${html}
    `;

    this._bind();
  }

  _bind() {
    /*
     * + Phase
     */
    this.shadowRoot
      .querySelectorAll(".add")
      .forEach((button) => {
        button.onclick = () => {
          const day = button.dataset.day;

          if (!this._schedule[day]) {
            this._schedule[day] = [];
          }

          this._schedule[day].push({
            start: "17:00",
            end: "22:00",
            temperature: 21,
            enabled: true,
          });

          this._dirty = true;

          this.render();
        };
      });

    /*
     * Phase löschen
     */
    this.shadowRoot
      .querySelectorAll(".del")
      .forEach((button) => {
        button.onclick = () => {
          const day = button.dataset.day;
          const index = Number(button.dataset.i);

          if (!this._schedule[day]) {
            return;
          }

          this._schedule[day].splice(index, 1);

          this._dirty = true;

          this.render();
        };
      });

    /*
     * Eingaben in den Zeitplan
     */
    this.shadowRoot
      .querySelectorAll("input[data-day]")
      .forEach((input) => {
        input.oninput = input.onchange = () => {
          const day = input.dataset.day;
          const index = Number(input.dataset.i);

          if (!this._schedule[day]) {
            return;
          }

          const period = this._schedule[day][index];

          if (!period) {
            return;
          }

          if (input.classList.contains("enabled")) {
            period.enabled = input.checked;
          } else if (input.classList.contains("start")) {
            period.start = input.value;
          } else if (input.classList.contains("end")) {
            period.end = input.value;
          } else if (input.classList.contains("temp")) {
            period.temperature = Number(input.value);
          }

          this._dirty = true;
          this._updateSaveButton();
        };
      });

    this.shadowRoot.querySelectorAll(".temps input").forEach((input) => {
      input.oninput = input.onchange = () => {
        this._dirty = true;
        this._updateSaveButton();
      };
    });

    this.shadowRoot.querySelectorAll(".adjust").forEach((button) => {
      button.onclick = () => this._adjustTarget(Number(button.dataset.delta));
    });

    /*
     * Speichern
     *
     * Null-sicher, damit kein Fehler wie
     * "Cannot set properties of null"
     * entstehen kann.
     */
    const saveButton =
      this.shadowRoot.getElementById("save");

    if (saveButton) {
      saveButton.onclick = () => this._save();
    }

    /*
     * Urlaub AN/AUS
     */
    const vacationButton =
      this.shadowRoot.getElementById("vacbtn");

    if (vacationButton) {
      vacationButton.onclick = async () => {
        const state = this._getEntity();

        if (!state) {
          return;
        }

        const entryId =
          state.attributes?.entry_id;

        if (!entryId) {
          alert(
            "Keine Room-Heating entry_id gefunden."
          );

          return;
        }

        try {
          await this._hass.callService(
            "room_heating",
            "set_vacation",
            {
              entry_id: entryId,
              enabled:
                !state.attributes?.vacation,
            }
          );

          this._dirty = false;

          this.render();
        } catch (error) {
          console.error(
            "Room Heating: Urlaub konnte nicht geändert werden.",
            error
          );

          alert(
            "Urlaubsmodus konnte nicht geändert werden."
          );
        }
      };
    }
  }

  async _adjustTarget(delta) {
    const state = this._getEntity();
    const climateId = state?.attributes?.climate_entity;
    const climate = this._hass?.states?.[climateId];
    const climateAttributes = climate?.attributes || {};
    if (!state || climateAttributes.temperature == null) return;

    const current = Number(climateAttributes.temperature);
    const step = Number(climateAttributes.target_temp_step) || 0.5;
    const minimum = Number(climateAttributes.min_temp ?? 5);
    const maximum = Number(climateAttributes.max_temp ?? 30);
    const target = Math.min(
      maximum,
      Math.max(minimum, Math.round((current + delta * step) * 100) / 100)
    );
    if (Math.abs(target - current) < 0.01) return;

    const entryId = state.attributes?.entry_id;
    if (!entryId) return;

    try {
      await this._hass.callService("room_heating", "set_manual_temperature", {
        entry_id: entryId,
        temperature: target,
      });
    } catch (error) {
      console.error("Room Heating: Temperatur konnte nicht angepasst werden.", error);
      alert("Die Solltemperatur konnte nicht angepasst werden.");
    }
  }

  _updateSaveButton() {
    const saveButton = this.shadowRoot.getElementById("save");
    if (!saveButton) return;
    saveButton.disabled = !this._dirty;
    saveButton.textContent = this._dirty ? "Änderungen speichern" : "Gespeichert";
  }

  async _save() {
    const state = this._getEntity();

    if (!state) {
      alert(
        "Room-Heating-Sensor wurde nicht gefunden."
      );

      return;
    }

    const attributes = state.attributes || {};

    /*
     * Zeitplan validieren
     */
    for (const day of Object.keys(this._schedule)) {
      for (const period of this._schedule[day]) {

        const validStart =
          /^\d{2}:\d{2}$/.test(period.start);

        const validEnd =
          /^\d{2}:\d{2}$/.test(period.end);

        const startMinutes =
          this._timeToMinutes(period.start);

        const endMinutes =
          this._timeToMinutes(period.end);

        const temperature =
          Number(period.temperature);

        if (
          !validStart ||
          !validEnd ||
          startMinutes === null ||
          endMinutes === null ||
          startMinutes >= endMinutes ||
          Number.isNaN(temperature) ||
          temperature < 5 ||
          temperature > 30
        ) {
          alert(
            "Bitte Zeitbereiche und Temperaturen prüfen."
          );

          return;
        }
      }
    }

    /*
     * Temperaturen aus den Eingabefeldern lesen
     */
    const comfortInput =
      this.shadowRoot.getElementById("comfort");

    const ecoInput =
      this.shadowRoot.getElementById("eco");

    const vacationInput =
      this.shadowRoot.getElementById("vac");

    if (
      !comfortInput ||
      !ecoInput ||
      !vacationInput
    ) {
      alert(
        "Temperatureinstellungen konnten nicht gelesen werden."
      );

      return;
    }

    const comfortTemperature =
      Number(comfortInput.value);

    const ecoTemperature =
      Number(ecoInput.value);

    const vacationTemperature =
      Number(vacationInput.value);

    /*
     * Temperaturwerte validieren
     */
    if (
      Number.isNaN(comfortTemperature) ||
      comfortTemperature < 5 ||
      comfortTemperature > 30
    ) {
      alert(
        "Die Komforttemperatur muss zwischen 5 und 30 °C liegen."
      );

      return;
    }

    if (
      Number.isNaN(ecoTemperature) ||
      ecoTemperature < 5 ||
      ecoTemperature > 30
    ) {
      alert(
        "Die Eco-Temperatur muss zwischen 5 und 30 °C liegen."
      );

      return;
    }

    if (
      Number.isNaN(vacationTemperature) ||
      vacationTemperature < 5 ||
      vacationTemperature > 25
    ) {
      alert(
        "Die Urlaubstemperatur muss zwischen 5 und 25 °C liegen."
      );

      return;
    }

    const entryId =
      attributes.entry_id;

    if (!entryId) {
      alert(
        "Keine Room-Heating entry_id gefunden."
      );

      return;
    }

    /*
     * Änderungen an Home Assistant senden
     */
    try {
      await this._hass.callService(
        "room_heating",
        "set_settings",
        {
          entry_id: entryId,
          schedule: this._schedule,
          comfort_temperature:
            comfortTemperature,
          eco_temperature:
            ecoTemperature,
          vacation_temperature:
            vacationTemperature,
        }
      );

      this._dirty = false;

      this.render();

    } catch (error) {
      console.error(
        "Room Heating: Speichern fehlgeschlagen.",
        error
      );

      alert(
        "Die Einstellungen konnten nicht gespeichert werden."
      );
    }
  }

  _timeToMinutes(value) {
    if (
      typeof value !== "string" ||
      !/^\d{2}:\d{2}$/.test(value)
    ) {
      return null;
    }

    const [hours, minutes] =
      value.split(":").map(Number);

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  }
}

if (
  !customElements.get(
    "room-heating-scheduler-card"
  )
) {
  customElements.define(
    "room-heating-scheduler-card",
    RoomHeatingSchedulerCard
  );
}

window.customCards =
  window.customCards || [];

window.customCards.push({
  type: "room-heating-scheduler-card",

  name: "Room Heating Wochenplan",

  description:
    "Visueller Wochenplan für Room Heating Scheduler",

  preview: true,

  documentationURL:
    "https://github.com/TobOb95/home-assistant-room-heating",

  getEntitySuggestion: (hass, entityId) => {
    const state = hass.states[entityId];
    if (
      !state?.attributes?.entry_id ||
      !state.attributes?.room_name ||
      !state.attributes?.climate_entity
    ) {
      return null;
    }
    return {
      config: {
        type: "custom:room-heating-scheduler-card",
        entity: entityId,
      },
    };
  },
});
