# Room Heating – Heizungspläne für Home Assistant

<p align="center">
  <img src="https://raw.githubusercontent.com/TobOb95/home-assistant-room-heating/main/assets/room-heating-logo.svg" alt="Room Heating Logo" width="180">
</p>

Room Heating ergänzt Home Assistant um eine Integration mit Wochenplänen und einer Dashboard-Karte. Du kannst vorhandene Thermostate aus Home Assistant verwenden, zum Beispiel Climate-Entitäten von Better Thermostat. Room Heating erstellt keine zusätzlichen Thermostate.

**Aktuelle Version: 1.0.5** · [Alle Releases ansehen](https://github.com/TobOb95/home-assistant-room-heating/releases)

## Was die Integration bietet

- Wochenpläne mit mehreren Heizphasen pro Tag
- Komfort-, Eco- und Urlaubstemperatur pro Raum
- Urlaubsmodus mit Statusanzeige
- Ist-Temperatur, Thermostat-Sollwert, Heizbetrieb und aktive Zeitplanphase auf der Karte
- Solltemperatur direkt auf der Karte mit Plus/Minus anpassen (temporär bis zum nächsten Zeitplanwechsel)
- Optional ausgewählte Fensterkontakte mit Offen-/Geschlossen-Status anzeigen
- Mehrere Räume und Thermostate in einem Dashboard

Für jeden Raum richtest du einen eigenen Room-Heating-Eintrag ein und fügst eine eigene Karte hinzu. Der Raum verwendet die von dir ausgewählte Climate-Entität.

## Voraussetzungen

- Home Assistant 2024.11 oder neuer
- [HACS](https://www.hacs.xyz/)
- Eine vorhandene Climate-Entität für jeden Raum, den du einrichten möchtest

Zusätzliche Home-Assistant-Funktionen: Lokale Markenbilder werden ab Home Assistant 2026.3 unterstützt. Automatische Raumvorschläge im Karteneditor gibt es ab Home Assistant 2026.6. Die Integration und Karte lassen sich auch ohne diese Komfortfunktionen verwenden.

## Installation über HACS

Room Heating ist ein öffentliches GitHub-Repository. Es ist derzeit nicht Teil der standardmäßig durchsuchbaren HACS-Auswahl. Füge es einmal als benutzerdefiniertes Repository hinzu:

1. Öffne **HACS**.
2. Öffne das Menü **⋮** und wähle **Benutzerdefinierte Repositories**.
3. Füge `TobOb95/home-assistant-room-heating` hinzu und wähle als Kategorie **Integration**.
4. Öffne Room Heating in HACS und wähle **Herunterladen**.
5. Starte Home Assistant neu.
6. Öffne **Einstellungen → Geräte & Dienste → Integration hinzufügen**, suche nach **Room Heating** und wähle die Integration aus.
7. Vergib einen Raumnamen, wähle das passende Thermostat und lege Komfort- und Eco-Temperatur fest.

Wiederhole die Einrichtung für jeden Raum, den du verwalten möchtest. Wähle dabei jeweils die Climate-Entität, die diesen Raum steuert.

## Karte zum Dashboard hinzufügen

1. Öffne das gewünschte Dashboard und wähle **Bearbeiten → Karte hinzufügen**.
2. Suche nach **Room Heating Wochenplan**.
3. Wähle den Raum aus und speichere die Karte. Im Karteneditor kannst du zusätzlich passende Fensterkontakte auswählen; das ist optional.

Wenn die Karte nicht in der Auswahl erscheint, prüfe **Einstellungen → Dashboards → Ressourcen**. Die JavaScript-Ressource soll einmal als **JavaScript-Modul** eingetragen sein:

```text
/api/room_heating/room-heating-card.js
```

Wenn bereits eine ältere Room-Heating-Ressource mit einem Versionszusatz wie `?v=1.0.5` eingetragen ist, bearbeite sie und entferne den gesamten Zusatz ab `?`. Lege keinen doppelten Ressourceneintrag an. Die feste Adresse bleibt auch nach künftigen Updates gleich. Lade danach das Dashboard neu.

Eine YAML-Karte ist ebenfalls möglich. Ersetze die Beispiel-Entity durch den Heiz-Solltemperatursensor des gewünschten Room-Heating-Raums:

```yaml
type: custom:room-heating-scheduler-card
entity: sensor.wohnzimmer_heiz_solltemperatur
window_entities:
  - binary_sensor.wohnzimmer_fenster
```

Ab Home Assistant 2026.6 kann der Karteneditor außerdem einen passenden Raum vorschlagen, wenn du zuerst dessen Heiz-Solltemperatursensor auswählst.

## Zeitplan und Temperaturen

- Während einer aktivierten Heizphase verwendet Room Heating die zugehörige Solltemperatur.
- Außerhalb der aktivierten Heizphasen gilt die Eco-Temperatur.
- Bei aktivem Urlaubsmodus gilt die Urlaubstemperatur.
- Room Heating übergibt den Sollwert an die ausgewählte Climate-Entität. Diese Entität beziehungsweise ihre Thermostat-Integration übernimmt die eigentliche Regelung.
- Mit Plus/Minus gesetzte manuelle Sollwerte gelten bis zum nächsten Wechsel der aktiven Zeitplanphase. Bei aktivem Urlaubsmodus gelten sie bis der Urlaubsmodus beendet wird. Danach übernimmt wieder der Zeitplan.
- Fensterkontakte dienen nur der Statusanzeige. Sie pausieren die Heizung nicht automatisch.

Du kannst Zeitpläne, Temperaturen und den Urlaubsmodus auf der Karte bearbeiten. Änderungen werden erst übernommen, wenn du sie speicherst. Vermeide eine zusätzliche Automation, die gleichzeitig den Sollwert derselben Climate-Entität verändert.

## Aktualisierung

1. Öffne **HACS → Integrationen → Room Heating** und installiere das angebotene Update.
2. Warte, bis HACS den Download abgeschlossen hat, und starte Home Assistant neu.
3. Lade das Dashboard neu. Die Resource-Adresse bleibt bei der festen URL unverändert; sie muss nach einem Update nicht angepasst werden.
4. Wird noch die alte Kartenversion angezeigt oder erscheint „Custom element doesn't exist“, schließe zuerst alle Home-Assistant-Tabs und App-Fenster und öffne Home Assistant erneut. Falls nötig, erzwinge einen harten Reload: im Browser unter Windows/Linux **Strg+F5** oder **Strg+Umschalt+R**, unter macOS **Cmd+Umschalt+R**. In der Companion App kannst du unter **Einstellungen** den **Frontend-Cache zurücksetzen**. [Weitere Hinweise zur Cache-Aktualisierung](https://www.home-assistant.io/faq/browser/).

Du musst die Integration oder Räume für ein normales Update nicht entfernen und erneut einrichten. Die gespeicherten Zeitpläne und Einstellungen bleiben erhalten.

## Version und Lizenz

HACS zeigt die neueste veröffentlichte GitHub-Version anhand des Release-Tags an, zum Beispiel `v1.0.5`. Die Versionsnummer in der Integrationsdatei allein veröffentlicht kein HACS-Update.

Die [individuelle Nutzungslizenz](LICENSE) erlaubt die private, nicht kommerzielle Nutzung der unveränderten Originalversion. Änderungen, die Nutzung veränderter Versionen und Weitergabe außerhalb der GitHub-Repository- und Fork-Funktionen sind nicht erlaubt. GitHub-Forks bleiben im Rahmen der GitHub-Nutzungsbedingungen möglich.
