# Installationshinweise für Maintainer

Dieses Paket ist als HACS-Integration-Repository strukturiert. Vor einer Veröffentlichung muss die automatische Registrierung der eingebetteten Lovelace-Ressource (`www/room-heating-card.js`) in der Integration implementiert und gegen die Zielversion von Home Assistant getestet werden. Das Hinzufügen von `frontend`/`http` als Manifest-Abhängigkeit allein registriert die Ressource nicht automatisch. In YAML-Modus muss die Ressource grundsätzlich über `lovelace.resources` eingebunden werden.

Außerdem sollte vor einem Release ein End-to-End-Test durchgeführt werden:
1. HACS-Installation auf einer Testinstanz.
2. Integration hinzufügen, zwei Räume konfigurieren.
3. Dashboard-Ressource laden und Karte anlegen.
4. Zeitplan ändern, speichern, Home Assistant neu starten und prüfen, ob der gespeicherte Zeitplan wieder in der Karte erscheint.
5. Prüfen, ob Config-Entry-ID und Karten-Konfiguration ohne manuelle YAML-Fummelei ermittelt/erstellt werden können.
