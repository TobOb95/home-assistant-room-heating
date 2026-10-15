# Better Thermostat Raumkarte

<p align="center">
  <img src="assets/room-heating-logo.svg" alt="Eigenständiges Haus- und Heizsymbol" width="180">
</p>

Eine eigenständige Home-Assistant-Dashboard-Karte für Räume mit [Better Thermostat](https://github.com/KartoffelToby/better_thermostat). Sie zeigt Raum- und Solltemperatur, Heizstatus und – sofern von der Climate-Entität bereitgestellt – Luftfeuchte und Fensterstatus. Der Sollwert lässt sich in 0,5-°C-Schritten anpassen.

Zeitpläne werden über die separat installierten Projekte **Scheduler Component** und **Scheduler Card** erstellt und verwaltet. Diese Repository enthält keinen Scheduler-Quellcode. Die Raumkarte und die beiden Drittanbieter-Projekte bleiben getrennte Komponenten.

## Voraussetzungen

- Home Assistant mit einer vorhandenen Better-Thermostat-Climate-Entität
- HACS
- [Scheduler Component](https://github.com/nielsfaber/scheduler-component) als Backend für Schedule-Entitäten
- [Scheduler Card](https://github.com/nielsfaber/scheduler-card) als Zeitplan-Editor im Dashboard

## Installation

### Better Thermostat Raumkarte

1. Öffne **HACS → ⋮ → Benutzerdefinierte Repositories**.
2. Füge `TobOb95/home-assistant-room-heating` hinzu und wähle **Dashboard** als Kategorie.
3. Installiere **Better Thermostat Raumkarte**.
4. Lade das Home-Assistant-Frontend neu.

Falls HACS die Ressource nicht automatisch registriert, füge unter **Einstellungen → Dashboards → Ressourcen** die JavaScript-Datei als Modul hinzu:

    /hacsfiles/home-assistant-room-heating/home-assistant-room-heating.js

### Scheduler Component und Scheduler Card

Installiere beide Projekte getrennt nach ihren jeweiligen Anleitungen:

1. Füge [Scheduler Component](https://github.com/nielsfaber/scheduler-component) in HACS als **Integration** hinzu.
2. Installiere die Integration, starte Home Assistant neu und füge **Scheduler** unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** hinzu.
3. Füge [Scheduler Card](https://github.com/nielsfaber/scheduler-card) in HACS als **Dashboard** hinzu und installiere sie.
4. Lade das Frontend neu. Die Scheduler Card braucht die Scheduler Component als Backend.

Folge bei Versions- oder Installationsfragen den offiziellen Anleitungen der jeweiligen Projekte.

## Dashboard einrichten

Füge eine native `vertical-stack`-Karte mit einer Better-Thermostat-Raumkarte und darunter einer Scheduler Card ein. Ersetze `climate.better_thermostat_wohnzimmer` durch deine tatsächliche Climate-Entität:

```yaml
type: vertical-stack
cards:
  - type: custom:better-thermostat-room-card
    entity: climate.better_thermostat_wohnzimmer
    name: Wohnzimmer
  - type: custom:scheduler-card
    include:
      - climate.better_thermostat_wohnzimmer
    discover_existing: false
    title: Heizplan Wohnzimmer
```

Du kannst die Karten auch über den Dashboard-Editor hinzufügen: erst **Better Thermostat Raumkarte**, danach **Scheduler Card**. In der Scheduler Card kannst du Zeitpläne erstellen, bearbeiten, kopieren, löschen und einzeln aktivieren oder pausieren. Wähle bei einer neuen Regel als Ziel die Better-Thermostat-Climate-Entität und als Aktion das Setzen der Temperatur.

Die Scheduler Card ist ein eigenständiges Drittanbieterprojekt. Ihre Oberfläche und Bedienung stammen aus diesem Projekt und werden hier weder kopiert noch verändert. Für deren Optionen gelten die Dokumentation und Lizenz des jeweiligen Projekts.

## Wechsel von Room Heating Scheduler

Die alte Integration und Scheduler Component dürfen nicht gleichzeitig Sollwerte für denselben Thermostat setzen.

1. Notiere oder sichere die bisherigen Zeitpläne.
2. Deinstalliere **Room Heating Scheduler** in HACS und entferne die Integration unter **Einstellungen → Geräte & Dienste**.
3. Starte Home Assistant neu und prüfe, dass keine alte Automation mehr denselben Thermostat steuert.
4. Installiere Scheduler Component und Scheduler Card wie oben beschrieben.
5. Erstelle zunächst einen einzelnen Zeitplan für einen Thermostat, kontrolliere Auslöser und Solltemperatur und übertrage danach die übrigen Pläne.

## Hinweise

- Diese Karte speichert oder steuert keine Zeitpläne. Die Scheduler Card verwaltet die Zeitpläne über Scheduler Component.
- Die +/- Tasten rufen `climate.set_temperature` für die ausgewählte Better-Thermostat-Entität auf.
- Better Thermostat kann einen Sollwert durch eigene Fenster-, Präsenz- oder Betriebslogik später verändern. Prüfe deshalb eine Regel zunächst mit einem einzelnen Raum.
- Die angezeigten optionalen Werte richten sich nach den Attributen, die deine Better-Thermostat-Climate-Entität bereitstellt.

## Lizenzen und Herkunft

Scheduler Card und Scheduler Component werden als separate Drittanbieterprojekte installiert. Ihr Quellcode, ihre Oberfläche und ihre Assets werden hier nicht eingebettet oder übernommen. Die jeweiligen Lizenzbedingungen gelten im Original-Repository. Better Thermostat bleibt ebenfalls ein separates Projekt mit eigenen Lizenzbedingungen. In diesem Repository liegt derzeit keine LICENSE-Datei; es wird daher hier keine Lizenz für fremde Projekte beansprucht. Vor einer öffentlichen Weiterverwendung dieses Karten-Codes sollte der Repository-Eigentümer die gewünschte Lizenz festlegen.
