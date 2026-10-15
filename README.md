# Room Heating – Better Thermostat Wochenplan

<p align="center">
  <img src="assets/room-heating-logo.svg" alt="Room Heating Logo" width="160">
</p>

Room Heating ergänzt Home Assistant um eine eigene Wochenplan-Integration und eine passende Dashboard-Karte. Bestehende Climate-Entitäten können direkt verwendet werden, zum Beispiel Thermostate von Better Thermostat.

## Funktionen

- vorhandene Climate-Entität pro Raum verwenden
- Wochenplan mit mehreren Heizphasen pro Wochentag
- Startzeit, Endzeit und Solltemperatur in der Karte bearbeiten
- einzelne Heizphasen unabhängig aktivieren oder pausieren
- Komfort-, Eco- und Urlaubstemperatur festlegen
- Urlaubsmodus über die Karte schalten
- Raumtemperatur, Sollwert und Heizstatus anzeigen
- Zeitpläne und Temperaturen gemeinsam speichern und validieren

## Installation über HACS

1. Öffne **HACS → ⋮ → Benutzerdefinierte Repositories**.
2. Füge `TobOb95/home-assistant-room-heating` hinzu und wähle die Kategorie **Integration**.
3. Installiere **Room Heating** und starte Home Assistant neu.
4. Füge die Integration unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** hinzu.
5. Wähle einen Raumnamen und eine vorhandene Climate-Entität.

## Karte hinzufügen

Füge die Kartendatei als Dashboard-Ressource hinzu, falls Home Assistant sie nicht bereits registriert hat:

`/api/room_heating/room-heating-card.js?v=1.0.0`

Ressourcentyp: **JavaScript-Modul**.

Füge anschließend in einem Dashboard eine manuelle Karte ein. Ersetze die Entity-ID durch den von Room Heating erstellten Sensor des Raums:

```yaml
type: custom:room-heating-scheduler-card
entity: sensor.wohnzimmer_heiz_solltemperatur
```

Beim visuellen Hinzufügen der Karte kann ein eingerichteter Raum im Editor ausgewählt werden. Mit **+ Phase** fügst du eine Heizphase hinzu. Der Schalter in einer Zeile aktiviert oder pausiert nur diese Phase. **Speichern** übernimmt den Zeitplan und die Temperaturen.

## Verhalten

Während einer aktiven Heizphase gilt deren Solltemperatur. Außerhalb aktivierter Phasen wird die Eco-Temperatur verwendet. Bei eingeschaltetem Urlaubsmodus gilt die Urlaubstemperatur. Room Heating übergibt den Sollwert an die ausgewählte Climate-Entität; die Thermostat-Integration bleibt für die Regelung zuständig.

Verwende nicht gleichzeitig eine weitere Automation, die denselben Thermostat-Sollwert steuert.

## Herkunft

Die Integration, der Wochenplan und das Logo sind eigenständige Bestandteile dieses Projekts. Die Anbindung an Thermostate erfolgt über die von Home Assistant bereitgestellte Climate-Schnittstelle.