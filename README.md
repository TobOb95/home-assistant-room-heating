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

Beim Einrichten eines Raums erstellt die Integration die zugehörigen Room-Heating-Sensoren automatisch.

## Karte im Dashboard

Die Integration stellt die Kartendatei bereit. Damit Home Assistant sie im Dashboard-Editor laden kann, füge sie einmalig unter **Einstellungen → Dashboards → Ressourcen** als **JavaScript-Modul** hinzu:

`/api/room_heating/room-heating-card.js?v=1.0.0`

Anschließend brauchst du die Entity-ID nicht in YAML einzutragen:

1. Öffne das Dashboard und wähle **Bearbeiten → Karte hinzufügen**.
2. Wähle **Room Heating Wochenplan**.
3. Wähle im Karteneditor den gewünschten Raum aus und speichere.

Ab Home Assistant 2026.6 kann Home Assistant die Karte zusätzlich vorschlagen, wenn du beim Hinzufügen zuerst den Room-Heating-Heiz-Solltemperatursensor des Raums auswählst.

YAML ist nur eine Alternative, wenn du die Karte manuell konfigurierst. Ersetze dabei die Beispiel-Entity durch den automatisch erstellten Heiz-Solltemperatursensor deines Raums:

```yaml
type: custom:room-heating-scheduler-card
entity: sensor.wohnzimmer_heiz_solltemperatur
```

Mit **+ Phase** fügst du im Karteneditor eine Heizphase hinzu. Der Schalter in einer Zeile aktiviert oder pausiert nur diese Phase. **Speichern** übernimmt den Zeitplan und die Temperaturen.

## Verhalten

Während einer aktiven Heizphase gilt deren Solltemperatur. Außerhalb aktivierter Phasen wird die Eco-Temperatur verwendet. Bei eingeschaltetem Urlaubsmodus gilt die Urlaubstemperatur. Room Heating übergibt den Sollwert an die ausgewählte Climate-Entität; die Thermostat-Integration bleibt für die Regelung zuständig.

Verwende nicht gleichzeitig eine weitere Automation, die denselben Thermostat-Sollwert steuert.

## Herkunft

Die Integration, der Wochenplan und das Logo sind eigenständige Bestandteile dieses Projekts. Die Anbindung an Thermostate erfolgt über die von Home Assistant bereitgestellte Climate-Schnittstelle.