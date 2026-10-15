"""Room Heating Scheduler integration."""
from __future__ import annotations

from pathlib import Path
import voluptuous as vol
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.event import async_track_time_change

from .const import (
    CONF_CLIMATE,
    CONF_COMFORT,
    CONF_ECO,
    CONF_ROOM,
    CONF_SCHEDULE,
    CONF_VACATION,
    CONF_VACATION_TEMP,
    DOMAIN,
)
from .coordinator import RoomHeatingCoordinator

PLATFORMS = ["sensor", "switch"]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up services."""
    hass.data.setdefault(DOMAIN, {})
    card_path = Path(__file__).parent / "www"
    await hass.http.async_register_static_paths([
        StaticPathConfig("/api/room_heating", str(card_path), cache_headers=True),
    ])

    async def set_schedule(call: ServiceCall) -> None:
        coordinator = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if coordinator is None:
            return
        hass.config_entries.async_update_entry(
            coordinator.entry,
            options={
                **coordinator.entry.options,
                CONF_SCHEDULE: call.data["schedule"],
            },
        )
        coordinator.entry.options = {
            **coordinator.entry.options,
            CONF_SCHEDULE: call.data["schedule"],
        }
        await coordinator.async_update()

    async def set_temperatures(call: ServiceCall) -> None:
        coordinator = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if coordinator is None:
            return
        options = {
            **coordinator.entry.options,
            CONF_COMFORT: float(call.data["comfort_temperature"]),
            CONF_ECO: float(call.data["eco_temperature"]),
            CONF_VACATION_TEMP: float(call.data.get("vacation_temperature", 16)),
        }
        hass.config_entries.async_update_entry(coordinator.entry, options=options)
        coordinator.entry.options = options
        await coordinator.async_update()

    async def set_vacation(call: ServiceCall) -> None:
        coordinator = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if coordinator is None:
            return
        enabled = bool(call.data["enabled"])
        options = {**coordinator.entry.options, CONF_VACATION: enabled}
        hass.config_entries.async_update_entry(coordinator.entry, options=options)
        coordinator.entry.options = options
        coordinator.vacation = enabled
        await coordinator.async_update()

    hass.services.async_register(
        DOMAIN,
        "set_schedule",
        set_schedule,
        schema=vol.Schema({
            vol.Required("entry_id"): str,
            vol.Required("schedule"): dict,
        }),
    )
    hass.services.async_register(
        DOMAIN,
        "set_temperatures",
        set_temperatures,
        schema=vol.Schema({
            vol.Required("entry_id"): str,
            vol.Required("comfort_temperature"): vol.Coerce(float),
            vol.Required("eco_temperature"): vol.Coerce(float),
            vol.Optional("vacation_temperature", default=16): vol.Coerce(float),
        }),
    )
    hass.services.async_register(
        DOMAIN,
        "set_vacation",
        set_vacation,
        schema=vol.Schema({
            vol.Required("entry_id"): str,
            vol.Required("enabled"): bool,
        }),
    )
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up a room heating entry."""
    coordinator = RoomHeatingCoordinator(hass, entry)
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator
    await coordinator.async_update()
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    unsub = async_track_time_change(hass, coordinator.async_update, second=0)
    entry.async_on_unload(unsub)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a room heating entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return unload_ok
