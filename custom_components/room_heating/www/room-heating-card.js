/* Room Heating Scheduler visual weekly card - v2.2.1 */

class RoomHeatingSchedulerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._schedule = {};
    this._dirty = false;
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
        ...p,
      }));
    }

    return out;
  }

  _escape(s) {
    return String(s ?? "")
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

    if (!this._dirty) {
      this._schedule = this._cloneSchedule(
        state.attributes.schedule
      );
    }

    const a = state.attributes;

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
                a.room_name || "Room Heating"
              )}
            </b>

            <div class="sub">
              Wochenplan ·
              ${this._escape(state.state)}
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
              value="${a.comfort_temperature ?? 21}"
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
              value="${a.eco_temperature ?? 17}"
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
              value="${a.vacation_temperature ?? 16}"
            >
            °C
          </label>

          <button id="vacbtn">
            ${a.vacation ? "Urlaub AUS" : "Urlaub AN"}
          </button>

        </div>

        <div class="days">
    `;

    days.forEach((day, idx) => {
      html += `
        <section>

          <div class="dayhead">

            <b>
              ${day}
            </b>

            <button
              class="add"
              data-day="${idx}"
            >
              + Phase
            </button>

          </div>
      `;

      (
        this._schedule[String(idx)] || []
      ).forEach((p, j) => {
        html += `
          <div class="period">

            <input
              class="start"
              data-day="${idx}"
              data-i="${j}"
              value="${this._escape(p.start)}"
              type="time"
            >

            <span>–</span>

            <input
              class="end"
              data-day="${idx}"
              data-i="${j}"
              value="${this._escape(p.end)}"
              type="time"
            >

            <input
              class="temp"
              data-day="${idx}"
              data-i="${j}"
              value="${this._escape(p.temperature)}"
              type="number"
              min="5"
              max="30"
              step="0.5"
            >

            <span>°C</span>

            <button
              class="del"
              data-day="${idx}"
              data-i="${j}"
            >
              ×
            </button>

          </div>
        `;
      });

      if (
        !(this._schedule[String(idx)] || []).length
      ) {
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
    const root = this.shadowRoot;

    if (!root) {
      return;
    }

    root.querySelectorAll(".add").forEach((button) => {
      button.onclick = () => {
        const day = button.dataset.day;

        (this._schedule[day] ||= []).push({
          start: "17:00",
          end: "22:00",
          temperature: 21,
        });

        this._dirty = true;
        this.render();
      };
    });

    root.querySelectorAll(".del").forEach((button) => {
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

    root.querySelectorAll("input[data-day]").forEach((input) => {
      input.onchange = () => {
        const day = input.dataset.day;
        const index = Number(input.dataset.i);

        const period = this._schedule[day]?.[index];

        if (!period) {
          return;
        }

        if (input.classList.contains("start")) {
          period.start = input.value;
        } else if (input.classList.contains("end")) {
          period.end = input.value;
        } else {
          period.temperature = Number(input.value);
        }

        this._dirty = true;
      };
    });

    const saveButton = root.getElementById("save");

    if (saveButton) {
      saveButton.onclick = () => this._save();
    }

    const vacationButton = root.getElementById("vacbtn");

    if (vacationButton) {
      vacationButton.onclick = async () => {
        const state = this._getEntity();

        if (!state) {
          return;
        }

        await this._hass.callService(
          "room_heating",
          "set_vacation",
          {
            entry_id: state.attributes.entry_id,
            enabled: !state.attributes.vacation,
          }
        );

        this._dirty = false;
        this.render();
      };
    }
  }
  async _save() {

    const s = this._getEntity();
    const a = s.attributes;

    for (
      const d of Object.keys(this._schedule)
    ) {

      for (
        const p of this._schedule[d]
      ) {

        if (
          !/^\d\d:\d\d$/.test(p.start) ||
          !/^\d\d:\d\d$/.test(p.end) ||
          p.start >= p.end ||
          Number(p.temperature) < 5 ||
          Number(p.temperature) > 30
        ) {

          alert(
            "Bitte Zeitbereiche und Temperaturen prüfen."
          );

          return;
        }
      }
    }

    await this._hass.callService(
      "room_heating",
      "set_schedule",
      {
        entry_id: a.entry_id,
        schedule: this._schedule,
      }
    );

    await this._hass.callService(
      "room_heating",
      "set_temperatures",
      {
        entry_id: a.entry_id,
        comfort_temperature:
          Number(
            this.shadowRoot
              .getElementById("comfort")
              .value
          ),
        eco_temperature:
          Number(
            this.shadowRoot
              .getElementById("eco")
              .value
          ),
        vacation_temperature:
          Number(
            this.shadowRoot
              .getElementById("vac")
              .value
          ),
      }
    );

    this._dirty = false;

    this.render();
  }
}

customElements.define(
  "room-heating-scheduler-card",
  RoomHeatingSchedulerCard
);

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
