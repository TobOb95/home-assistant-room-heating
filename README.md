# Better Thermostat Heizplan-Karte

<p align="center">
  <img src="assets/room-heating-logo.svg" alt="Haus mit Wärmezeichen und Wochenplan" width="180">
</p>

Eine schlanke Home-Assistant-Dashboard-Karte für [Better Thermostat](https://github.com/KartoffelToby/better_thermostat) und die eingebauten Schedule-Helfer. Sie zeigt Raum- und Solltemperatur, Heizstatus, optional Luftfeuchte/Fensterstatus und bietet eine Freigabe pro Raum.

Die Karte steuert selbst keinen Zeitplan im Hintergrund. Home Assistant führt den Schedule-Helfer und die Automation dauerhaft aus; die Karte ist die komfortable Bedienoberfläche.

## Voraussetzungen

- Home Assistant mit Better Thermostat
- HACS
- Pro Raum ein Schedule-Helfer
- Pro Raum ein Helfer vom Typ **Eingabe-Schalter** (<code>input_boolean</code>)
- Eine Automation pro Raum aus der mitgelieferten Blueprint-Vorlage

## Installation über HACS

1. Öffne **HACS → ⋮ → Benutzerdefinierte Repositories**.
2. Füge <code>TobOb95/home-assistant-room-heating</code> hinzu und wähle **Dashboard** als Kategorie.
3. Installiere **Better Thermostat Heizplan-Karte**.
4. Lade das Home-Assistant-Frontend neu.

Falls HACS die Ressource nicht automatisch registriert, füge unter **Einstellungen → Dashboards → Ressourcen** die JavaScript-Datei als Modul hinzu. Der Pfad lautet:

    /hacsfiles/home-assistant-room-heating/home-assistant-room-heating.js

## Einrichten eines Raums

### 1. Schedule-Helfer

Erstelle in **Einstellungen → Geräte & Dienste → Helfer → Helfer erstellen → Zeitplan** einen Zeitplan. Lege die gewünschten Zeitblöcke an und füge bei jedem Block unter **Zusätzliche Daten** diesen Wert hinzu:

    temperature: 21

Passe den Wert je Block an. Der Schedule-Helfer selbst schaltet nur seinen Zustand zwischen aktiv und inaktiv. Die Temperatur setzt die Blueprint-Automation am Better-Thermostat-Gerät.

### 2. Freigabe-Schalter

Erstelle pro Raum einen **Eingabe-Schalter** (zum Beispiel <code>input_boolean.heizplan_wohnzimmer</code>). Ist der Schalter aus, setzt die Automation die Eco-Temperatur. Ist er an, folgt Better Thermostat dem aktiven Zeitblock.

### 3. Automation

Importiere die [Blueprint-Vorlage für Better Thermostat und Schedule](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FTobOb95%2Fhome-assistant-room-heating%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Froom_heating%2Fbetter_thermostat_schedule.yaml) und erstelle eine Automation pro Raum. Wähle das passende Climate-Gerät, den Schedule-Helfer, den Freigabe-Schalter und die Eco-Temperatur aus.

### 4. Dashboard-Karte

Füge die Karte **Better Thermostat Heizplan** hinzu und wähle im Editor:

- das Better-Thermostat-Gerät des Raums,
- den zugehörigen Schedule-Helfer,
- den Freigabe-Schalter.

Die Karte zeigt Ist- und Solltemperatur sowie Heizstatus. Über **− / +** kann der Sollwert in 0,5-°C-Schritten angepasst werden. Der Wochenplan-Schalter pausiert den Plan für diesen Raum. Der Button am Kartenende öffnet die Zeitplan-Entität in Home Assistant.

## Wechsel von der bisherigen Room-Heating-Integration

Die bisherige Integration und die neue Automation dürfen nicht gleichzeitig Solltemperaturen für denselben Raum setzen.

1. Lege Schedule-Helfer, Freigabe-Schalter und Automation an. Lass den Freigabe-Schalter zunächst ausgeschaltet.
2. Deinstalliere **Room Heating Scheduler** in HACS und entferne die Integration unter **Einstellungen → Geräte & Dienste**. Starte Home Assistant neu.
3. Prüfe, dass die alte Integration keine Solltemperaturen mehr setzt.
4. Aktiviere die neue Automation und füge die Karte hinzu.
5. Teste die Freigabe zunächst an einem Raum und prüfe im Aktivitätsprotokoll die Temperaturänderungen.

Die alte Integration speichert ihre Zeitpläne in den Integrationsoptionen. Sichere oder übertrage diese Zeiten vor der Deinstallation in den neuen Schedule-Helfer.

## Hinweise

- Die Zeitblöcke werden in Home Assistant unter **Helfer → Zeitplan** bearbeitet, nicht direkt in der Karte.
- Jeder aktive Zeitblock braucht das zusätzliche Datenfeld <code>temperature</code>.
- Die optionale Anzeige von Fensterstatus und Luftfeuchte erscheint, wenn Better Thermostat die Attribute <code>window_open</code> beziehungsweise <code>humidity</code> bereitstellt.
- Manuelle Sollwertänderungen über die Karte bleiben bis zur nächsten Änderung des Zeitplans oder der Freigabe bestehen.

## Lizenz

MIT
