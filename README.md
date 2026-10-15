# Room Heating Scheduler

Raumweise Heizungssteuerung für Home Assistant mit Wochenplan, Komfort-/Eco-/Urlaubstemperatur und visueller Lovelace-Karte.

## Status
Version 2.4.0 – Community-Projekt.

## Installation über HACS
1. HACS öffnen.
2. **Benutzerdefinierte Repositories** auswählen.
3. `TobOb95/home-assistant-room-heating` als Repository hinzufügen.
4. Typ **Integration** wählen.
5. **Room Heating Scheduler** installieren.
6. Home Assistant neu starten.
7. **Einstellungen → Geräte & Dienste → Integration hinzufügen** und nach „Room Heating Scheduler“ suchen.

## Visuelle Karte
Nach der Installation die Datei `room-heating-card.js` als Lovelace-Ressource vom Pfad
`/api/room_heating/room-heating-card.js` einbinden, falls HACS sie nicht automatisch registriert.
### Raum beim Hinzufügen auswählen

1. Öffne das Dashboard und wähle **Bearbeiten → Karte hinzufügen**.
2. Suche nach **Room Heating Wochenplan** und füge die Karte hinzu.
3. Der alphabetisch erste eingerichtete Heizungsraum wird automatisch vorausgewählt. Im Feld **Heizungsraum** kannst du stattdessen einen anderen Raum auswählen.
4. Speichere die Karte.

Alternativ kannst du beim Hinzufügen direkt den Sensor **Heiz-Solltemperatur** eines Raums auswählen. Home Assistant kann dann die Wochenplan-Karte für diesen Sensor vorschlagen.

Bei manueller YAML-Konfiguration muss `entity` auf den **Heiz-Solltemperatur**-Sensor des gewünschten Raums zeigen. Die tatsächliche Entity-ID hängt vom Raum und der Entity-ID-Konfiguration ab.

## Funktionen
- ein Climate-Thermostat pro Raum
- Wochenplan mit mehreren Heizphasen pro Tag
- Komfort-, Eco- und Urlaubstemperatur
- dauerhafter Urlaubsmodus
- Solltemperatur- und Profil-Sensor
- visuelle Wochenplan-Karte
