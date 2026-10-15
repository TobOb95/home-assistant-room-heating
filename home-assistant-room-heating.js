/* Eigenständige Raumübersicht für Better Thermostat.
 * Zeitpläne werden von der separat installierten Scheduler Card verwaltet.
 */
class BetterThermostatRoomCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) {
    this._hass = hass;
    const form = this.shadowRoot.querySelector("ha-form");
    if (form) form.hass = hass;
    else this._render();
  }
  _render() {
    if (!this._hass) return;
    const form = document.createElement("ha-form");
    form.hass = this._hass;
    form.schema = [
      { name: "entity", required: true, selector: { entity: { domain: "climate" } } },
      { name: "name", selector: { text: {} } },
    ];
    form.data = { entity: this._config.entity || "", name: this._config.name || "" };
    form.computeLabel = (schema) => ({
      entity: "Better-Thermostat-Klima",
      name: "Raumname (optional)",
    })[schema.name];
    form.computeHelper = (schema) => ({
      entity: "Wähle das vorhandene Climate-Gerät von Better Thermostat.",
      name: "Ohne eigenen Namen wird der Name der Entität angezeigt.",
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
if (!customElements.get("better-thermostat-room-card-editor")) {
  customElements.define("better-thermostat-room-card-editor", BetterThermostatRoomCardEditor);
}
class BetterThermostatRoomCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
  }
  static getConfigElement() { return document.createElement("better-thermostat-room-card-editor"); }
  static getStubConfig() { return {}; }
  setConfig(config) { this._config = { ...config }; this.render(); }
  set hass(hass) { this._hass = hass; this.render(); }
  getCardSize() { return 3; }
  _escape(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }
  _temperature(value) {
    if (value === null || value === undefined || value === "") return "—";
    const number = Number(value);
    return Number.isFinite(number)
      ? number.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " °C" : "—";
  }
  render() {
    if (!this._hass) return;
    const entityId = this._config.entity;
    const climate = entityId && this._hass.states[entityId];
    if (!climate) {
      this.shadowRoot.innerHTML = "<ha-card><div class='message'>Bitte im Karteneditor ein Better-Thermostat-Klima auswählen.</div></ha-card>";
      return;
    }
    const attrs = climate.attributes || {};
    const state = climate.state;
    const action = attrs.hvac_action;
    let status = "Aktiv", statusClass = "idle";
    if (action === "heating") [status, statusClass] = ["Heizt", "heating"];
    else if (action === "cooling") [status, statusClass] = ["Kühlt", "cooling"];
    else if (state === "off") [status, statusClass] = ["Aus", "off"];
    else if (state === "unavailable" || state === "unknown") [status, statusClass] = ["Nicht verfügbar", "off"];
    else if (action === "idle") [status, statusClass] = ["Bereit", "idle"];
    const title = this._escape(this._config.name || attrs.friendly_name || entityId);
    const current = this._temperature(attrs.current_temperature);
    const target = this._temperature(attrs.temperature);
    const humidity = attrs.humidity === null || attrs.humidity === undefined || attrs.humidity === "" ? NaN : Number(attrs.humidity);
    const details = [];
    if (attrs.window_open === true) details.push("<span class='chip warning'>Fenster offen</span>");
    if (Number.isFinite(humidity)) details.push("<span class='chip'>Luftfeuchte " + Math.round(humidity) + " %</span>");
    this.shadowRoot.innerHTML =
      "<style>" +
      ":host{display:block}.message{padding:18px;color:var(--secondary-text-color)}" +
      ".card{overflow:hidden;border-radius:var(--ha-card-border-radius,12px)}" +
      ".head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 18px 10px}" +
      ".room{font-size:18px;font-weight:600;color:var(--primary-text-color)}" +
      ".sub{font-size:11px;color:var(--secondary-text-color);margin-top:3px}" +
      ".status{display:flex;align-items:center;gap:7px;padding:7px 10px;border-radius:99px;background:var(--secondary-background-color);font-size:12px;color:var(--secondary-text-color);white-space:nowrap}" +
      ".dot{width:8px;height:8px;border-radius:50%;background:var(--disabled-text-color)}" +
      ".status.heating{color:var(--deep-orange-color,#e65100)}.status.heating .dot{background:var(--deep-orange-color,#e65100)}" +
      ".temps{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 18px 16px}" +
      ".reading{padding:13px;border-radius:12px;background:var(--secondary-background-color)}" +
      ".label{display:block;color:var(--secondary-text-color);font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px}" +
      ".value{font-size:28px;font-weight:600;line-height:1.1;color:var(--primary-text-color)}" +
      ".target .value{font-size:23px}.adjust{display:flex;align-items:center;gap:7px;margin-top:10px}" +
      ".adjust button{width:30px;height:30px;border:0;border-radius:50%;background:var(--card-background-color);color:var(--primary-text-color);font-size:18px;cursor:pointer}" +
      ".adjust button:disabled{opacity:.4;cursor:default}.adjust span{font-size:10px;color:var(--secondary-text-color)}" +
      ".details{display:flex;gap:7px;flex-wrap:wrap;padding:0 18px 15px}" +
      ".chip{padding:6px 9px;border-radius:99px;background:var(--secondary-background-color);font-size:11px;color:var(--secondary-text-color)}" +
      ".warning{color:var(--warning-color,#d98b00)}" +
      "@media(max-width:420px){.head{padding-left:14px;padding-right:14px}.temps{gap:8px;padding:10px 14px 14px}.reading{padding:11px}.value{font-size:25px}.details{padding-left:14px;padding-right:14px}}" +
      "</style><ha-card class='card'><div class='head'><div><div class='room'>" + title +
      "</div><div class='sub'>Better Thermostat</div></div><span class='status " + statusClass +
      "'><i class='dot'></i>" + status + "</span></div><div class='temps'>" +
      "<section class='reading'><span class='label'>Raumtemperatur</span><div class='value'>" + current +
      "</div></section><section class='reading target'><span class='label'>Solltemperatur</span><div class='value'>" +
      target + "</div><div class='adjust'><button id='down' aria-label='Solltemperatur senken'>−</button>" +
      "<button id='up' aria-label='Solltemperatur erhöhen'>+</button><span>0,5 °C je Schritt</span></div></section></div>" +
      (details.length ? "<div class='details'>" + details.join("") + "</div>" : "") + "</ha-card>";
    for (const [id, delta] of [["down", -0.5], ["up", 0.5]]) {
      this.shadowRoot.getElementById(id).onclick = async () => {
        const value = Number(attrs.temperature);
        if (!Number.isFinite(value)) return;
        try {
          await this._hass.callService("climate", "set_temperature", {
            entity_id: entityId, temperature: Math.round((value + delta) * 2) / 2,
          });
        } catch (error) {
          console.error("Solltemperatur konnte nicht geändert werden", error);
        }
      };
    }
  }
}
if (!customElements.get("better-thermostat-room-card")) {
  customElements.define("better-thermostat-room-card", BetterThermostatRoomCard);
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: "better-thermostat-room-card",
  name: "Better Thermostat Raumkarte",
  description: "Eigene Raumübersicht mit Temperaturen und Heizstatus für Better Thermostat",
  preview: true,
  documentationURL: "https://github.com/TobOb95/home-assistant-room-heating",
});
