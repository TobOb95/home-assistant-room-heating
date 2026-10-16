"""Schedule engine for Room Heating Scheduler."""
from __future__ import annotations

from datetime import datetime
import json
import logging

from homeassistant.util import dt as dt_util
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import (
    CONF_CLIMATE,
    CONF_ECO,
    CONF_SCHEDULE,
    CONF_VACATION,
    CONF_VACATION_TEMP,
    DEFAULT_SCHEDULE,
)
from .validation import validate_schedule
from .validation import target_for_schedule

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
        self.options_snapshot = dict(entry.options)
        self.last_target = None
        self.manual_target = None
        self.manual_context = None
        self.status = "unknown"

    @property
    def opts(self):
        return {**self.entry.data, **self.entry.options}

    def update_options(self, options):
        """Persist service changes and mark them as already applied live."""
        self.options_snapshot = dict(options)
        self.hass.config_entries.async_update_entry(self.entry, options=options)

    def schedule(self):
        schedule = self.opts.get(CONF_SCHEDULE, DEFAULT_SCHEDULE)

        if isinstance(schedule, str):
            try:
                schedule = json.loads(schedule)
            except (ValueError, TypeError):
                schedule = DEFAULT_SCHEDULE

        try:
            return validate_schedule(schedule)
        except (ValueError, TypeError, KeyError):
            _LOGGER.error("Invalid schedule stored for %s; using default", self.entry.entry_id)
            return DEFAULT_SCHEDULE

    def target_temperature(self, now=None):
        now = now or dt_util.now()
        options = self.opts
        return target_for_schedule(
            self.schedule(),
            now,
            options.get(CONF_ECO, 17),
            self.vacation,
            options.get(CONF_VACATION_TEMP, 16),
        )

    def _target_context(self, now=None):
        """Identify the current schedule slot so manual changes expire at its end."""
        now = now or dt_util.now()
        options = self.opts
        if self.vacation:
            return ("vacation", float(options.get(CONF_VACATION_TEMP, 16)))

        day_periods = self.schedule().get(str(now.weekday()), [])
        current_time = now.strftime("%H:%M")
        for index, period in enumerate(day_periods):
            if (
                period.get("enabled", True)
                and period["start"] <= current_time < period["end"]
            ):
                return (
                    "comfort",
                    now.weekday(),
                    index,
                    period["start"],
                    period["end"],
                    float(period["temperature"]),
                )

        return ("eco", float(options.get(CONF_ECO, 17)))

    async def async_set_manual_temperature(self, temperature):
        """Apply a temporary target until the active schedule slot changes."""
        self.manual_target = float(temperature)
        self.manual_context = self._target_context()
        await self.async_update()

    async def async_update(self, now=None):
        now = now or dt_util.now()
        scheduled_target, status = self.target_temperature(now)
        context = self._target_context(now)
        if self.manual_target is not None and context != self.manual_context:
            self.manual_target = None
            self.manual_context = None
        target = self.manual_target if self.manual_target is not None else scheduled_target
        climate_entity = self.opts[CONF_CLIMATE]
        state = self.hass.states.get(climate_entity)

        if state is None or state.state in ("unknown", "unavailable"):
            self.status = "unavailable"
            self.async_set_updated_data({
                "target": target,
                "status": "unavailable",
                "manual_override": self.manual_target is not None,
            })
            return

        try:
            current_target = state.attributes.get("temperature")
            if (
                self.last_target is None
                or abs(self.last_target - target) >= 0.1
                or not isinstance(current_target, (int, float))
                or abs(float(current_target) - target) >= 0.1
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
                "manual_override": self.manual_target is not None,
            })
            self.status = status

        except Exception:
            _LOGGER.exception(
                "Could not set temperature on %s",
                climate_entity,
            )
            self.async_set_updated_data({
                "target": target,
                "status": "error",
                "manual_override": self.manual_target is not None,
            })
            self.status = "error"

    async def async_set_vacation(self, enabled):
        """Set vacation mode and persist it."""
        enabled = bool(enabled)

        options = {
            **self.entry.options,
            CONF_VACATION: enabled,
        }

        self.update_options(options)

        self.vacation = enabled
        await self.async_update()
