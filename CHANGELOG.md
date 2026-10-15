# Changelog

## 2.4.2
- Add Home Assistant integration icon assets for the integration and HACS.

## 2.4.1
- Disable long-lived caching for the custom card resource to make frontend updates available promptly.
- Document a versioned resource URL for manual Lovelace resource registration.

## 2.4.0
- Added a visual card editor with automatic room selection.
- Added Home Assistant card suggestions for Room Heating target sensors.

## 2.3.0
- Validate schedules and temperature limits consistently, including service calls.
- Reapply the scheduled setpoint when the thermostat is changed manually.
- Save card schedule and temperature edits in one service call.

## 2.2.0
- Visual weekly scheduler card added.
- Vacation mode is persisted in config entry options.
- Manifest documentation and issue tracker fixed.
- Room heating sensor exposes schedule and temperature settings to the card.
- Improved HACS-ready repository structure.
