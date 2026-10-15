# Room Heating Scheduler for Home Assistant

Raumweise Heizungssteuerung mit Wochenplan und visueller Lovelace-Karte.

## Funktionen
- Ein `climate`-Thermostat pro Raum
- Wochenplan Montag bis Sonntag mit mehreren Heizphasen
- Komfort-, Absenk- und Urlaubstemperatur
- Dashboard-Karte mit Zeitblock-Editor, Verschieben und Resize
- Urlaubsschalter und Sensoren für Solltemperatur / aktives Profil

## Status
Dies ist ein Community-Projekt in Entwicklung. Vor einem produktiven Einsatz in einer laufenden Home-Assistant-Installation sind Laufzeit- und Kompatibilitätstests erforderlich.

## Installation über HACS
1. Veröffentliche dieses Repository auf GitHub.
2. In Home Assistant HACS öffnen.
3. Über das Drei-Punkte-Menü **Benutzerdefinierte Repositories** wählen.
4. GitHub-Repository-URL einfügen und Typ **Integration** wählen.
5. Room Heating Scheduler installieren und Home Assistant neu starten.
6. Unter **Einstellungen → Geräte & Dienste → Integration hinzufügen** die Integration Room Heating hinzufügen.

## Dashboard-Karte
Die Karte ist im Integrationspaket unter `custom_components/room_heating/www/room-heating-card.js` enthalten. Die Integration muss sie über Home Assistant HTTP als statische Ressource bereitstellen und die Ressource im Lovelace-Storage-Modus registrieren. Für YAML-Modus ist eine manuelle Ressourcenregistrierung erforderlich.

## Raumkarte konfigurieren
Beispiel für die Karte, nachdem die Ressource verfügbar ist:

```yaml
type: custom:room-heating-card
title: Wohnzimmer
entry_id: DEINE_CONFIG_ENTRY_ID
climate_entity: climate.wohnzimmer
comfort_temperature: 21
eco_temperature: 17
vacation_temperature: 16
schedule:
  "0":
    - start: "06:30"
      end: "08:30"
      temperature: 21
    - start: "17:00"
      end: "22:30"
      temperature: 21
  "1": []
  "2": []
  "3": []
  "4": []
  "5":
    - start: "08:00"
      end: "23:00"
      temperature: 21
  "6":
    - start: "08:00"
      end: "22:30"
      temperature: 21
```

## Entwicklung und Sicherheit
- Keine Verbindung zu externen Diensten erforderlich.
- Vor Updates ein Home-Assistant-Backup erstellen.
- Thermostat und Heizpläne zunächst mit einem einzelnen Raum testen.
- Noch nicht als produktionsreif zertifiziert.
