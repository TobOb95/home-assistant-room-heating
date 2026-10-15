# Room Heating – Heizungspläne für Home Assistant

<p align="center">
  <img src="https://raw.githubusercontent.com/TobOb95/home-assistant-room-heating/main/assets/room-heating-logo.svg" alt="Room Heating Logo" width="180">
</p>

Room Heating ergänzt Home Assistant um eine Integration mit Wochenplänen und einer Dashboard-Karte. Du kannst vorhandene Thermostate aus Home Assistant verwenden, zum Beispiel Climate-Entitäten von Better Thermostat. Room Heating erstellt keine zusätzlichen Thermostate.

**Aktuelle Version: 1.0.3** · [Alle Releases ansehen](https://github.com/TobOb95/home-assistant-room-heating/releases)

## Was die Integration bietet

- Wochenpläne mit mehreren Heizphasen pro Tag
- Komfort-, Eco- und Urlaubstemperatur pro Raum
- Urlaubsmodus mit Statusanzeige
- Ist-Temperatur, Thermostat-Sollwert, Heizbetrieb und aktive Zeitplanphase auf der Karte
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
3. Wähle den Raum aus und speichere die Karte.

Wenn die Karte nicht in der Auswahl erscheint, prüfe **Einstellungen → Dashboards → Ressourcen**. Die JavaScript-Ressource soll einmal als **JavaScript-Modul** eingetragen sein:

```text
/api/room_heating/room-heating-card.js?v=1.0.3
```

Wenn bereits eine ältere Room-Heating-Ressource eingetragen ist, bearbeite sie und ersetze nur die Versionsnummer nach `v=` durch die installierte Version. Lege keinen doppelten Ressourceneintrag an. Lade danach das Dashboard neu (im Browser mit **Strg+F5**).

Eine YAML-Karte ist ebenfalls möglich. Ersetze die Beispiel-Entity durch den Heiz-Solltemperatursensor des gewünschten Room-Heating-Raums:

```yaml
type: custom:room-heating-scheduler-card
entity: sensor.wohnzimmer_heiz_solltemperatur
```

Ab Home Assistant 2026.6 kann der Karteneditor außerdem einen passenden Raum vorschlagen, wenn du zuerst dessen Heiz-Solltemperatursensor auswählst.

## Zeitplan und Temperaturen

- Während einer aktivierten Heizphase verwendet Room Heating die zugehörige Solltemperatur.
- Außerhalb der aktivierten Heizphasen gilt die Eco-Temperatur.
- Bei aktivem Urlaubsmodus gilt die Urlaubstemperatur.
- Room Heating übergibt den Sollwert an die ausgewählte Climate-Entität. Diese Entität beziehungsweise ihre Thermostat-Integration übernimmt die eigentliche Regelung.

Du kannst Zeitpläne, Temperaturen und den Urlaubsmodus auf der Karte bearbeiten. Änderungen werden erst übernommen, wenn du sie speicherst. Vermeide eine zusätzliche Automation, die gleichzeitig den Sollwert derselben Climate-Entität verändert.

## Aktualisierung

1. Öffne **HACS → Integrationen → Room Heating** und installiere das angebotene Update.
2. Warte, bis HACS den Download abgeschlossen hat, und starte Home Assistant neu.
3. Prüfe unter **Einstellungen → Dashboards → Ressourcen**, ob eine manuell eingetragene Room-Heating-Ressource noch die Versionsnummer der vorherigen Installation enthält. Aktualisiere sie bei Bedarf auf die Version aus HACS, zum Beispiel `v=1.0.3`.
4. Lade das Dashboard neu. Im Browser geht das mit **Strg+F5**; in der Home-Assistant-App kannst du die Oberfläche neu laden oder die App erneut starten.

Du musst die Integration oder Räume für ein normales Update nicht entfernen und erneut einrichten. Die gespeicherten Zeitpläne und Einstellungen bleiben erhalten.

## Version und Lizenz

HACS zeigt die neueste veröffentlichte GitHub-Version anhand des Release-Tags an, zum Beispiel `v1.0.3`. Die Versionsnummer in der Integrationsdatei allein veröffentlicht kein HACS-Update.

Die [individuelle Nutzungslizenz](LICENSE) erlaubt die private, nicht kommerzielle Nutzung der unveränderten Originalversion. Änderungen, die Nutzung veränderter Versionen und Weitergabe außerhalb der GitHub-Repository- und Fork-Funktionen sind nicht erlaubt. GitHub-Forks bleiben im Rahmen der GitHub-Nutzungsbedingungen möglich.
