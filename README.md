# Room Heating Scheduler

Raumweise Heizungssteuerung für Home Assistant mit Wochenplan, Komfort-/Eco-/Urlaubstemperatur und visueller Lovelace-Karte.

## Status
Version 2.2.0 – Community-Projekt.

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
Alternativ kann die Karte über den Dashboard-Karten-Editor als `custom:room-heating-scheduler-card` hinzugefügt werden.

Die Karte verwendet als `entity` den Sensor **Heiz-Solltemperatur** eines Raums, z. B.:
`room_heating.raum_heiz_solltemperatur` (die tatsächliche Entity-ID hängt vom Raum ab).

## Funktionen
- ein Climate-Thermostat pro Raum
- Wochenplan mit mehreren Heizphasen pro Tag
- Komfort-, Eco- und Urlaubstemperatur
- dauerhafter Urlaubsmodus
- Solltemperatur- und Profil-Sensor
- visuelle Wochenplan-Karte
