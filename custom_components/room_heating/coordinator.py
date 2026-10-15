"""Schedule engine for Room Heating Scheduler."""
from __future__ import annotations

from datetime import datetime
import json
import logging

from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import (
    CONF_CLIMATE,
    CONF_ECO,
    CONF_SCHEDULE,
    CONF_VACATION,
    CONF_VACATION_TEMP,
    DEFAULT_SCHEDULE,
)

_LOGGER = logging.getLogger(__name__)


class RoomHeatingCoordinator(DataUpdateCoordinator):
    """Coordinate one room heating schedule."""

    def __init__(self, hass, entry):
        super().__init__(
            hass,
            _LOGGER,
            name=f"Room Heating {entry.data.get('room_name', entry.title)}",
        )
        self.hass = hass
        self.entry = entry
        self.vacation = bool(entry.options.get(CONF_VACATION, False))
        self.last_target = None
        self.status = "unknown"

    @property
    def opts(self):
        return {**self.entry.data, **self.entry.options}

    def schedule(self):
        schedule = self.opts.get(CONF_SCHEDULE, DEFAULT_SCHEDULE)

        if isinstance(schedule, str):
            try:
                schedule = json.loads(schedule)
            except (ValueError, TypeError):
                schedule = DEFAULT_SCHEDULE

        return schedule if isinstance(schedule, dict) else DEFAULT_SCHEDULE

    def target_temperature(self, now=None):
        now = now or datetime.now().astimezone()
        options = self.opts

        if self.vacation:
            return float(
                options.get(CONF_VACATION_TEMP, 16)
            ), "vacation"

        for period in self.schedule().get(str(now.weekday()), []):
            try:
                if period["start"] <= now.strftime("%H:%M") < period["end"]:
                    return float(period["temperature"]), "comfort"
            except (KeyError, TypeError, ValueError):
                continue

        return float(options.get(CONF_ECO, 17)), "eco"

    async def async_update(self, now=None):
        target, status = self.target_temperature(now)
        climate_entity = self.opts[CONF_CLIMATE]
        self.status = status

        state = self.hass.states.get(climate_entity)

        if state is None or state.state in ("unknown", "unavailable"):
            self.async_set_updated_data({
                "target": target,
                "status": "unavailable",
            })
            return

        try:
            if (
                self.last_target is None
                or abs(self.last_target - target) >= 0.1
            ):
                await self.hass.services.async_call(
                    "climate",
                    "set_temperature",
                    {
                        "entity_id": climate_entity,
                        "temperature": target,
                    },
                    blocking=True,
                )
                self.last_target = target

            self.async_set_updated_data({
                "target": target,
                "status": status,
            })

        except Exception:
            _LOGGER.exception(
                "Could not set temperature on %s",
                climate_entity,
            )
            self.async_set_updated_data({
                "target": target,
                "status": "error",
            })

    async def async_set_vacation(self, enabled):
        """Set vacation mode and persist it."""
        enabled = bool(enabled)

        options = {
            **self.entry.options,
            CONF_VACATION: enabled,
        }

        self.hass.config_entries.async_update_entry(
            self.entry,
            options=options,
        )

        self.vacation = enabled
        await self.async_update()
