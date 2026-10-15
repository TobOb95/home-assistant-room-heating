# Room Heating – Better Thermostat Wochenplan

<p align="center">
  <img src="assets/room-heating-logo.svg" alt="Eigenes Room-Heating-Hauslogo" width="160">
</p>

Eine eigenständige Home-Assistant-Integration mit eigener Wochenplan-Karte für vorhandene Climate-Geräte, zum Beispiel von [Better Thermostat](https://github.com/KartoffelToby/better_thermostat). Zeitpläne werden in der Karte erstellt und bearbeitet. Jeder Zeitblock hat einen eigenen Freigabe-Schalter.

## Funktionen

- vorhandene Climate-Entität pro Raum verwenden
- Wochenplan mit beliebig vielen Heizphasen pro Wochentag
- Startzeit, Endzeit und Solltemperatur direkt in der Karte bearbeiten
- jede Heizphase unabhängig aktivieren oder pausieren
- Komfort-, Eco- und Urlaubstemperatur
- Urlaubsmodus als Home-Assistant-Schalter
- Raum- und Solltemperatur sowie Heizstatus von Better Thermostat in der Karte
- Änderungen werden über Integration-Dienste geprüft und gespeichert

## Installation über HACS

1. Öffne **HACS → ⋮ → Benutzerdefinierte Repositories**.
2. Füge `TobOb95/home-assistant-room-heating` hinzu und wähle die Kategorie **Integration**.
3. Installiere **Room Heating Scheduler** und starte Home Assistant neu.
4. Füge die Integration unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** hinzu.
5. Wähle einen Namen und die vorhandene Better-Thermostat-Climate-Entität.
6. Füge die Kartendatei als Dashboard-Ressource hinzu, falls sie nicht bereits registriert wurde:

   `/api/room_heating/room-heating-card.js?v=1.0.0`

   Ressourcentyp: **JavaScript-Modul**.

## Karte hinzufügen

Füge in einem Dashboard eine **Manuelle Karte** mit folgender Konfiguration ein. Ersetze die Entity-ID durch den Heiz-Solltemperatur-Sensor des Raums:

```yaml
type: custom:room-heating-scheduler-card
entity: sensor.wohnzimmer_heiz_solltemperatur
```

Beim visuellen Hinzufügen der Karte kannst du den Raum im Editor auswählen. Der Editor zeigt Better-Thermostat-Raumtemperatur und Sollwert; darunter lassen sich Wochentage und Heizphasen einrichten. Mit **+ Phase** fügst du eine weitere Phase hinzu. Der Schiebeschalter in einer Zeile pausiert nur diese Heizphase. **Speichern** übernimmt Zeitplan und Temperaturen gemeinsam.

Ab Home Assistant 2026.6 kann die Karte beim Hinzufügen aus einer Climate-Entität als Vorschlag erscheinen, wenn dieses Thermostat bereits in Room Heating eingerichtet ist. Bei älteren Home-Assistant-Versionen kannst du den Raum weiterhin im Karteneditor auswählen. Nicht zugeordnete Climate-Entitäten können noch keinen Room-Heating-Wochenplan öffnen.

## Verhalten des Zeitplans

Die aktive Heizphase mit passendem Wochentag und aktueller Uhrzeit bestimmt den Sollwert. Außerhalb aktivierter Phasen gilt die Eco-Temperatur. Bei eingeschaltetem Urlaubsmodus gilt die Urlaubstemperatur. Better Thermostat bleibt für Regelung und Thermostatfunktionen zuständig; Room Heating übergibt nur den Sollwert an die gewählte Climate-Entität.

> Verwende nicht gleichzeitig eine zweite Automation oder Integration, die denselben Thermostat-Sollwert steuert.

## Migration von der bisherigen Version

Room Heating speichert die vorhandenen Einstellungen in der Integration. Die neue Entwicklungsbasis beginnt mit Version 1.0.0; vorhandene Konfigurationen werden weiterverwendet. Ältere Heizphasen ohne Freigabe-Feld gelten automatisch als aktiviert. Ein Zeitblock mit `enabled: false` bleibt pausiert.

Falls zusätzlich Scheduler Card oder Scheduler Component installiert sind, entferne oder deaktiviere deren Zeitpläne für dieselben Thermostate, bevor Room Heating den Sollwert übernimmt.

## Herkunft

Die Integration, Wochenplan-Karte und das Logo in diesem Repository sind eigenständige Bestandteile dieses Projekts. Scheduler Card und Scheduler Component werden nicht benötigt und ihr Code oder Design wird nicht verwendet. Better Thermostat ist eine separate Integration; Room Heating nutzt lediglich die von Home Assistant bereitgestellte Climate-Schnittstelle.
