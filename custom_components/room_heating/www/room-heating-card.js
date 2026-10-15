/* Room Heating Scheduler visual weekly card - v2.2.2 */

class RoomHeatingSchedulerCard extends HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this._config = {};
    this._schedule = {};
    this._dirty = false;
    this._hass = null;
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error(
        "Bitte eine Room-Heating-Sensor-Entität angeben."
      );
    }

    this._config = config;

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
    if (!this._hass || !this._config.entity) {
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
            <b>
              ${this._escape(
                attributes.room_name || "Room Heating"
              )}
            </b>

            <div class="sub">
              Wochenplan · ${this._escape(state.state)}
            </div>
          </div>

          <button id="save">
            Speichern
          </button>
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

          <button id="vacbtn">
            ${
              attributes.vacation
                ? "Urlaub AUS"
                : "Urlaub AN"
            }
          </button>

        </div>

        <div class="days">
    `;

    days.forEach((day, idx) => {
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
        </div>

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
        }

        .sub {
          font-size: 12px;
          opacity: 0.65;
          margin-top: 4px;
        }

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
        }

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

        .empty {
          font-size: 12px;
          opacity: 0.55;
          padding: 4px 0 7px;
        }

        @media (max-width: 600px) {

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
        input.onchange = () => {
          const day = input.dataset.day;
          const index = Number(input.dataset.i);

          if (!this._schedule[day]) {
            return;
          }

          const period = this._schedule[day][index];

          if (!period) {
            return;
          }

          if (input.classList.contains("start")) {
            period.start = input.value;
          } else if (input.classList.contains("end")) {
            period.end = input.value;
          } else if (input.classList.contains("temp")) {
            period.temperature = Number(input.value);
          }

          this._dirty = true;
        };
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
        "set_schedule",
        {
          entry_id: entryId,
          schedule: this._schedule,
        }
      );

      await this._hass.callService(
        "room_heating",
        "set_temperatures",
        {
          entry_id: entryId,
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
});
