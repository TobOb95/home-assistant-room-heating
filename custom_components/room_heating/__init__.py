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
from .validation import validate_schedule

PLATFORMS = ["sensor", "switch"]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up services."""
    hass.data.setdefault(DOMAIN, {})

    card_path = Path(__file__).parent / "www"
    await hass.http.async_register_static_paths([
        StaticPathConfig(
            "/api/room_heating",
            str(card_path),
            cache_headers=False,
        ),
    ])

    async def set_schedule(call: ServiceCall) -> None:
        coordinator = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if coordinator is None:
            return

        try:
            schedule = validate_schedule(call.data["schedule"])
        except (ValueError, TypeError, KeyError) as err:
            raise vol.Invalid(f"Invalid heating schedule: {err}") from err

        options = {
            **coordinator.entry.options,
            CONF_SCHEDULE: schedule,
        }

        coordinator.update_options(options)

        await coordinator.async_update()

    async def set_temperatures(call: ServiceCall) -> None:
        coordinator = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if coordinator is None:
            return

        options = {
            **coordinator.entry.options,
            CONF_COMFORT: float(call.data["comfort_temperature"]),
            CONF_ECO: float(call.data["eco_temperature"]),
            CONF_VACATION_TEMP: float(
                call.data.get("vacation_temperature", 16)
            ),
        }

        coordinator.update_options(options)

        await coordinator.async_update()

    async def set_settings(call: ServiceCall) -> None:
        """Validate and persist card changes together."""
        coordinator = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if coordinator is None:
            return
        try:
            schedule = validate_schedule(call.data["schedule"])
        except (ValueError, TypeError, KeyError) as err:
            raise vol.Invalid(f"Invalid heating schedule: {err}") from err
        options = {
            **coordinator.entry.options,
            CONF_SCHEDULE: schedule,
            CONF_COMFORT: call.data["comfort_temperature"],
            CONF_ECO: call.data["eco_temperature"],
            CONF_VACATION_TEMP: call.data["vacation_temperature"],
        }
        coordinator.update_options(options)
        await coordinator.async_update()

    async def set_manual_temperature(call: ServiceCall) -> None:
        """Apply a temporary thermostat target until the next schedule slot."""
        coordinator = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if coordinator is None:
            return

        climate_entity = coordinator.opts[CONF_CLIMATE]
        climate_state = hass.states.get(climate_entity)
        if climate_state is None or climate_state.state in ("unknown", "unavailable"):
            raise vol.Invalid("The selected thermostat is unavailable")

        temperature = float(call.data["temperature"])
        minimum = float(climate_state.attributes.get("min_temp", 5))
        maximum = float(climate_state.attributes.get("max_temp", 30))
        if not minimum <= temperature <= maximum:
            raise vol.Invalid(
                f"Temperature must be between {minimum:g} and {maximum:g}"
            )

        await coordinator.async_set_manual_temperature(temperature)

    async def set_vacation(call: ServiceCall) -> None:
        coordinator = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if coordinator is None:
            return

        enabled = bool(call.data["enabled"])

        options = {
            **coordinator.entry.options,
            CONF_VACATION: enabled,
        }

        coordinator.update_options(options)

        coordinator.vacation = enabled
        await coordinator.async_update()

    hass.services.async_register(
        DOMAIN,
        "set_schedule",
        set_schedule,
        schema=vol.Schema({
            vol.Required("entry_id"): str,
            vol.Required("schedule"): vol.Any(dict, str),
        }),
    )

    hass.services.async_register(
        DOMAIN,
        "set_temperatures",
        set_temperatures,
        schema=vol.Schema({
            vol.Required("entry_id"): str,
            vol.Required("comfort_temperature"): vol.All(vol.Coerce(float), vol.Range(min=5, max=30)),
            vol.Required("eco_temperature"): vol.All(vol.Coerce(float), vol.Range(min=5, max=30)),
            vol.Optional(
                "vacation_temperature",
                default=16,
            ): vol.All(vol.Coerce(float), vol.Range(min=5, max=25)),
        }),
    )

    hass.services.async_register(
        DOMAIN,
        "set_settings",
        set_settings,
        schema=vol.Schema({
            vol.Required("entry_id"): str,
            vol.Required("schedule"): vol.Any(dict, str),
            vol.Required("comfort_temperature"): vol.All(vol.Coerce(float), vol.Range(min=5, max=30)),
            vol.Required("eco_temperature"): vol.All(vol.Coerce(float), vol.Range(min=5, max=30)),
            vol.Required("vacation_temperature"): vol.All(vol.Coerce(float), vol.Range(min=5, max=25)),
        }),
    )

    hass.services.async_register(
        DOMAIN,
        "set_manual_temperature",
        set_manual_temperature,
        schema=vol.Schema({
            vol.Required("entry_id"): str,
            vol.Required("temperature"): vol.Coerce(float),
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


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Set up a room heating entry."""
    coordinator = RoomHeatingCoordinator(hass, entry)

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator

    await coordinator.async_update()
    await hass.config_entries.async_forward_entry_setups(
        entry,
        PLATFORMS,
    )

    unsub = async_track_time_change(
        hass,
        coordinator.async_update,
        second=0,
    )

    entry.async_on_unload(unsub)
    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))

    return True


async def _async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload after options are changed in the config flow."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.entry_id)
    if coordinator is None or coordinator.options_snapshot == dict(entry.options):
        return
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
) -> bool:
    """Unload a room heating entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(
        entry,
        PLATFORMS,
    )

    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)

    return unload_ok
