# Room Heating – Wochenplan für Home Assistant

<p align="center">
  <img src="https://raw.githubusercontent.com/TobOb95/home-assistant-room-heating/main/assets/room-heating-logo.svg" alt="Room Heating Logo" width="180">
</p>

Room Heating ergänzt Home Assistant um eine eigene Heizungsintegration mit Wochenplan und Dashboard-Karte. Die Integration verwendet vorhandene Climate-Entitäten, zum Beispiel von Better Thermostat.

**Integrationsversion: 1.0.3**

## Funktionen

- vorhandene Climate-Entitäten für einzelne Räume verwenden
- Wochenpläne mit mehreren Heizphasen pro Tag bearbeiten
- Komfort-, Eco- und Urlaubstemperatur festlegen
- Urlaubsmodus in der Karte schalten und dessen Status sehen
- Ist-Temperatur, Thermostat-Sollwert, Heizbetrieb und aktive Zeitplanphase anzeigen
- Zeitpläne und Temperaturen gemeinsam speichern

## Voraussetzungen

- Home Assistant 2024.11 oder neuer
- HACS
- Für lokale Markenbilder in Home Assistant: Home Assistant 2026.3 oder neuer
- Für automatische Raumvorschläge im Karteneditor: Home Assistant 2026.6 oder neuer

## Erstinstallation

1. Öffne **HACS → ⋮ → Benutzerdefinierte Repositories**.
2. Füge `TobOb95/home-assistant-room-heating` als Repository der Kategorie **Integration** hinzu. Wenn das Repository bereits in HACS vorhanden ist, überspringe diesen Schritt.
3. Öffne das Repository in HACS und wähle **Herunterladen**.
4. Starte Home Assistant neu.
5. Öffne **Einstellungen → Geräte & Dienste → Integration hinzufügen** und suche nach **Room Heating**.
6. Wähle einen Raumnamen, das dazugehörige Thermostat und die gewünschten Komfort- und Eco-Temperaturen.

Richte für jedes Thermostat einen eigenen Raum ein. Pro Raum verwendest du eine eigene Karteninstanz. Bereits eingerichtete Räume und ihre Zeitpläne müssen bei einem Update nicht neu angelegt werden.

## Karte zum Dashboard hinzufügen

Die Integration stellt die Kartendatei bereit. Prüfe zunächst unter **Einstellungen → Dashboards → Ressourcen**, ob die Room-Heating-Ressource bereits eingetragen ist. Falls nicht, füge sie als **JavaScript-Modul** hinzu:

```text
/api/room_heating/room-heating-card.js?v=1.0.3
```

Wenn dort schon eine ältere Room-Heating-URL eingetragen ist, bearbeite den vorhandenen Eintrag und aktualisiere nur den Wert hinter `v=` auf die installierte Version. Lege keinen zweiten Eintrag für dieselbe Kartendatei an.

Danach:

1. Öffne das gewünschte Dashboard und wähle **Bearbeiten → Karte hinzufügen**.
2. Wähle **Room Heating Wochenplan**.
3. Wähle im Karteneditor den Raum aus und speichere die Karte.

Home Assistant kann ab Version 2026.6 beim Hinzufügen außerdem einen passenden Room-Heating-Raum vorschlagen, wenn du zuerst dessen Heiz-Solltemperatursensor auswählst.

Eine manuelle YAML-Konfiguration ist optional:

```yaml
type: custom:room-heating-scheduler-card
entity: sensor.wohnzimmer_heiz_solltemperatur
```

Ersetze die Beispiel-Entity durch den automatisch angelegten Heiz-Solltemperatursensor deines Raums.

## Room Heating aktualisieren

1. Öffne **HACS → Integrationen → Room Heating**.
2. Wähle **Aktualisieren**. Wenn kein Update angeboten wird, öffne das Menü **⋮** des Repositorys und wähle **Erneut herunterladen** beziehungsweise lade die neueste Version herunter.
3. Warte, bis HACS den Download abgeschlossen hat.
4. Starte Home Assistant neu, damit Integration und Karten-Datei aus der aktualisierten Version geladen werden.
5. Öffne **Einstellungen → Dashboards → Ressourcen** und ändere bei Bedarf die vorhandene Karten-URL auf die neue Versionsnummer hinter `v=` (zum Beispiel `v=1.0.3`). Die Versionsnummer in der URL leert den Browsercache für die Karten-Datei.
6. Lade das Dashboard im Browser mit **Strg+F5** neu. In der Home-Assistant-App lade die Oberfläche neu oder starte die App erneut.

Du musst die Integration oder Räume nach einem normalen Update nicht entfernen und neu einrichten. Die gespeicherten Zeitpläne bleiben erhalten.

## Versionsnummer in HACS

HACS zeigt als verfügbare Version die neueste veröffentlichte GitHub-Release-Version mit ihrem Tag an. Die Versionsnummer in der Integrationsdatei allein veröffentlicht noch keine HACS-Version. Dieses Projekt verwendet Tags im Format `vMAJOR.MINOR.PATCH`, zum Beispiel `v1.0.3`. Ohne GitHub-Release zeigt HACS stattdessen eine kurze Commit-Kennung an.

## Logo in Home Assistant und HACS

Das SVG-Logo wird oben in dieser HACS-Repositorybeschreibung angezeigt. Die Integration enthält zusätzlich Markenbilder unter `custom_components/room_heating/brand/`, damit Home Assistant sie an den unterstützten Stellen verwenden kann.

Falls das Symbol auf der HACS-Repository-Kachel trotz aktualisierter Integration noch als Platzhalter erscheint, kann HACS das lokale Markenbild derzeit möglicherweise nicht in dieser Kachel anzeigen. Das Logo bleibt in der Repositorybeschreibung und – ab Home Assistant 2026.3 – an den von Home Assistant unterstützten Integrationsstellen verfügbar. Nach einem Update kannst du HACS neu laden; du musst die Integration dafür nicht neu konfigurieren.

## Zeitplanverhalten

Während einer aktiven Heizphase wird deren Solltemperatur verwendet. Außerhalb aktivierter Komfortphasen gilt die Eco-Temperatur. Bei eingeschaltetem Urlaubsmodus gilt die Urlaubstemperatur. Room Heating übergibt den Sollwert an die ausgewählte Climate-Entität; deren Thermostat-Integration übernimmt die Regelung.

Vermeide eine zusätzliche Automation, die gleichzeitig denselben Thermostat-Sollwert verändert.
