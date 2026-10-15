# Room Heating Scheduler

<p align="center">
  <img src="assets/room-heating-logo.svg" alt="Logo: Haus mit Wärmezeichen und Wochenplan" width="180">
</p>

Raumweise Heizungssteuerung für Home Assistant mit Wochenplan, Komfort-/Eco-/Urlaubstemperatur und visueller Lovelace-Karte.

## Status
Version 2.4.2 – Community-Projekt.

## Installation über HACS
1. HACS öffnen.
2. **Benutzerdefinierte Repositories** auswählen.
3. `TobOb95/home-assistant-room-heating` als Repository hinzufügen.
4. Typ **Integration** wählen.
5. **Room Heating Scheduler** installieren.
6. Home Assistant neu starten.
7. **Einstellungen → Geräte & Dienste → Integration hinzufügen** und nach „Room Heating Scheduler“ suchen.

Das Integrationssymbol wird bei Home Assistant 2026.3 und neuer direkt aus dem Integrationspaket geladen.

## Visuelle Karte
Nach der Installation die Datei `room-heating-card.js` als Lovelace-Ressource vom Pfad
`/api/room_heating/room-heating-card.js?v=2.4.2` einbinden, falls HACS sie nicht automatisch registriert. Der Versionsparameter sorgt nach Updates dafür, dass der Browser die aktuelle Kartendatei lädt.
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
