/* Better Thermostat Heizplan-Karte */
class BetterThermostatScheduleCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _render() {
    if (!this._hass) return;
    const form = document.createElement("ha-form");
    form.hass = this._hass;
    form.schema = [
      { name: "climate_entity", required: true, selector: { entity: { domain: "climate" } } },
      { name: "schedule_entity", required: true, selector: { entity: { domain: "schedule" } } },
      { name: "enabled_entity", required: true, selector: { entity: { domain: "input_boolean" } } },
      { name: "name", selector: { text: {} } },
    ];
    form.data = {
      climate_entity: this._config.climate_entity || "",
      schedule_entity: this._config.schedule_entity || "",
      enabled_entity: this._config.enabled_entity || "",
      name: this._config.name || "",
    };
    form.computeLabel = (schema) => ({
      climate_entity: "Better-Thermostat-Gerät",
      schedule_entity: "Schedule-Helfer",
      enabled_entity: "Freigabe-Schalter",
      name: "Raumname (optional)",
    })[schema.name];
    form.computeHelper = (schema) => ({
      climate_entity: "Das bereits eingerichtete Better-Thermostat-Klima dieses Raums.",
      schedule_entity: "Der Home-Assistant-Zeitplan mit Temperaturdaten pro Zeitblock.",
      enabled_entity: "Ein input_boolean, der den Zeitplan für diesen Raum freigibt.",
      name: "Wird leer gelassen der Name des Climate-Geräts verwendet.",
    })[schema.name];
    form.addEventListener("value-changed", (event) => {
      this._config = { ...this._config, ...event.detail.value };
      this.dispatchEvent(new CustomEvent("config-changed", {
        bubbles: true, composed: true, detail: { config: this._config },
      }));
    });
    this.shadowRoot.replaceChildren(form);
  }
}
if (!customElements.get("better-thermostat-schedule-card-editor")) {
  customElements.define("better-thermostat-schedule-card-editor", BetterThermostatScheduleCardEditor);
}

class BetterThermostatScheduleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }
  static getConfigElement() { return document.createElement("better-thermostat-schedule-card-editor"); }
  static getStubConfig() { return {}; }
  setConfig(config) { this._config = { ...config }; this.render(); }
  set hass(hass) { this._hass = hass; this.render(); }
  getCardSize() { return 4; }
  _escape(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  _temperature(value) {
    if (value === null || value === undefined || value === "") return "—";
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " °C" : "—";
  }
  _status(climate) {
    const action = climate?.attributes?.hvac_action;
    if (action === "heating") return ["Heizt", "heating"];
    if (action === "idle") return ["Bereit", "idle"];
    if (action === "cooling") return ["Kühlt", "cooling"];
    if (climate?.state === "off") return ["Aus", "off"];
    if (climate?.state === "unavailable" || climate?.state === "unknown") return ["Nicht verfügbar", "off"];
    return ["Aktiv", "idle"];
  }
  _eventLabel(value) {
    if (!value) return "Kein nächster Wechsel bekannt";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Nächster Wechsel: " + this._escape(value)
      : "Nächster Wechsel " + date.toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" });
  }
  render() {
    if (!this._hass) return;
    const cfg = this._config;
    const climate = this._hass.states[cfg.climate_entity];
    const schedule = this._hass.states[cfg.schedule_entity];
    const enabled = this._hass.states[cfg.enabled_entity];
    if (!cfg.climate_entity || !cfg.schedule_entity || !cfg.enabled_entity) {
      this.shadowRoot.innerHTML = "<ha-card><div class='message'>Bitte Better Thermostat, Schedule-Helfer und Freigabe-Schalter im Karteneditor auswählen.</div></ha-card>";
      return;
    }
    if (!climate || !schedule || !enabled) {
      this.shadowRoot.innerHTML = "<ha-card><div class='message'>Eine ausgewählte Entität wurde nicht gefunden. Bitte prüfe die Karteneinstellungen.</div></ha-card>";
      return;
    }
    const attrs = climate.attributes || {};
    const isEnabled = enabled.state === "on";
    const isScheduled = schedule.state === "on";
    const [status, statusClass] = this._status(climate);
    const title = this._escape(cfg.name || attrs.friendly_name || cfg.climate_entity);
    const current = this._temperature(attrs.current_temperature);
    const target = this._temperature(attrs.temperature);
    const humidity = attrs.humidity === null || attrs.humidity === undefined || attrs.humidity === "" ? NaN : Number(attrs.humidity);
    const extras = [];
    if (attrs.window_open === true) extras.push("<span class='tag warning'>Fenster offen</span>");
    if (Number.isFinite(humidity)) extras.push("<span class='tag'>Luftfeuchte " + Math.round(humidity) + " %</span>");
    const activeTemperature = isScheduled && schedule.attributes
      ? this._temperature(schedule.attributes.temperature) : "—";
    const nextEvent = this._eventLabel(schedule.attributes?.next_event);
    const scheduleName = this._escape(schedule.attributes?.friendly_name || cfg.schedule_entity);
    this.shadowRoot.innerHTML =
      "<style>" +
      ":host{display:block}.message{padding:20px;color:var(--secondary-text-color)}" +
      ".card{overflow:hidden;border-radius:var(--ha-card-border-radius,12px)}" +
      ".head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 18px 10px}" +
      ".room{font-size:18px;font-weight:600;color:var(--primary-text-color)}" +
      ".entity{font-size:11px;color:var(--secondary-text-color);margin-top:3px}" +
      ".status{display:inline-flex;align-items:center;gap:7px;border-radius:99px;padding:7px 10px;background:var(--secondary-background-color);font-size:12px;color:var(--secondary-text-color);white-space:nowrap}" +
      ".dot{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color)}" +
      ".status.heating{color:var(--deep-orange-color,#e65100)}.status.heating .dot{background:var(--deep-orange-color,#e65100);box-shadow:0 0 0 4px color-mix(in srgb,var(--deep-orange-color,#e65100) 15%,transparent)}" +
      ".temps{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:12px 18px 18px}" +
      ".reading{padding:14px;border-radius:12px;background:var(--secondary-background-color)}" +
      ".label{display:block;color:var(--secondary-text-color);font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}" +
      ".value{font-size:30px;font-weight:600;line-height:1.1;color:var(--primary-text-color)}.target .value{font-size:24px}" +
      ".adjust{display:flex;align-items:center;gap:8px;margin-top:11px}.adjust button{width:30px;height:30px;border:0;border-radius:50%;background:var(--card-background-color);color:var(--primary-text-color);font-size:18px;cursor:pointer}" +
      ".adjust button:disabled{opacity:.4;cursor:default}.adjust span{font-size:11px;color:var(--secondary-text-color)}" +
      ".extras{display:flex;gap:7px;flex-wrap:wrap;padding:0 18px 14px}.tag{padding:6px 9px;border-radius:99px;background:var(--secondary-background-color);font-size:11px;color:var(--secondary-text-color)}.warning{color:var(--warning-color,#d98b00)}" +
      ".schedule{border-top:1px solid var(--divider-color);padding:14px 18px 16px}" +
      ".schedule-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.schedule-name{font-size:14px;font-weight:600}.toggle{position:relative;width:46px;height:26px;flex:0 0 auto}.toggle input{opacity:0;width:0;height:0}.slider{position:absolute;inset:0;border-radius:99px;background:var(--disabled-text-color);cursor:pointer;transition:.2s}.slider:before{content:'';position:absolute;width:20px;height:20px;left:3px;top:3px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px #0003}.toggle input:checked+.slider{background:var(--primary-color)}.toggle input:checked+.slider:before{transform:translateX(20px)}.toggle input:focus-visible+.slider{outline:2px solid var(--primary-color);outline-offset:2px}" +
      ".schedule-state{display:flex;align-items:center;gap:7px;margin-top:11px;color:var(--secondary-text-color);font-size:12px}.schedule-state strong{color:var(--primary-text-color);font-weight:500}.next{margin-top:5px;font-size:11px;color:var(--secondary-text-color)}" +
      ".footer{display:flex;justify-content:flex-end;padding:0 18px 14px}.link{border:0;background:none;color:var(--primary-color);font:inherit;font-size:12px;cursor:pointer}" +
      "@media(max-width:420px){.head{align-items:flex-start}.value{font-size:27px}.temps{gap:8px;padding:10px 12px 14px}.head,.extras,.schedule,.footer{padding-left:14px;padding-right:14px}.reading{padding:11px}}" +
      "</style>" +
      "<ha-card class='card'><div class='head'><div><div class='room'>" + title + "</div><div class='entity'>Better Thermostat</div></div>" +
      "<span class='status " + statusClass + "'><i class='dot'></i>" + status + "</span></div>" +
      "<div class='temps'><section class='reading'><span class='label'>Raumtemperatur</span><div class='value'>" + current + "</div></section>" +
      "<section class='reading target'><span class='label'>Solltemperatur</span><div class='value'>" + target + "</div>" +
      "<div class='adjust'><button id='down' aria-label='Solltemperatur senken'>−</button><button id='up' aria-label='Solltemperatur erhöhen'>+</button><span>in 0,5 °C-Schritten</span></div></section></div>" +
      (extras.length ? "<div class='extras'>" + extras.join("") + "</div>" : "") +
      "<section class='schedule'><div class='schedule-head'><div><div class='schedule-name'>Wochenplan</div><div class='entity'>" + scheduleName + "</div></div>" +
      "<label class='toggle' title='Wochenplan freigeben'><input id='enabled' type='checkbox' role='switch' " + (isEnabled ? "checked" : "") + "><span class='slider'></span></label></div>" +
      "<div class='schedule-state'><i class='dot'></i><span>" + (isEnabled ? (isScheduled ? "Aktive Phase · " + activeTemperature : "Freigegeben · aktuell keine Heizphase") : "Pausiert") + "</span></div>" +
      "<div class='next'>" + nextEvent + "</div></section>" +
      "<div class='footer'><button class='link' id='open-schedule'>Zeitplan in Home Assistant öffnen</button></div></ha-card>";
    this.shadowRoot.getElementById("enabled").onchange = async (event) => {
      const service = event.target.checked ? "turn_on" : "turn_off";
      event.target.disabled = true;
      try {
        await this._hass.callService("input_boolean", service, { entity_id: cfg.enabled_entity });
      } catch (error) {
        event.target.checked = !event.target.checked;
        console.error("Heizplan-Freigabe konnte nicht geändert werden", error);
      } finally {
        event.target.disabled = false;
      }
    };
    for (const [id, delta] of [["down", -0.5], ["up", 0.5]]) {
      this.shadowRoot.getElementById(id).onclick = async () => {
        const value = Number(attrs.temperature);
        if (!Number.isFinite(value)) return;
        await this._hass.callService("climate", "set_temperature", {
          entity_id: cfg.climate_entity,
          temperature: Math.round((value + delta) * 2) / 2,
        });
      };
    }
    this.shadowRoot.getElementById("open-schedule").onclick = () => {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        bubbles: true, composed: true, detail: { entityId: cfg.schedule_entity },
      }));
    };
  }
}
if (!customElements.get("better-thermostat-schedule-card")) {
  customElements.define("better-thermostat-schedule-card", BetterThermostatScheduleCard);
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: "better-thermostat-schedule-card",
  name: "Better Thermostat Heizplan",
  description: "Better-Thermostat-Raumübersicht mit Wochenplan-Freigabe",
  preview: true,
  documentationURL: "https://github.com/TobOb95/home-assistant-room-heating",
});
