"""Room Heating integration."""
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.event import async_track_time_change
from .const import DOMAIN
from .coordinator import RoomHeatingCoordinator
PLATFORMS=["sensor","switch"]
async def async_setup(hass: HomeAssistant, config):
    hass.data.setdefault(DOMAIN,{})
    import voluptuous as vol
    async def set_schedule(call):
        c = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if c is None:
            return
        schedule = call.data["schedule"]
        hass.config_entries.async_update_entry(c.entry, options={**c.entry.options, "schedule": schedule})
        await c.async_update()
    async def set_temperatures(call):
        c = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if c is None:
            return
        options = {**c.entry.options, "comfort_temperature": float(call.data["comfort_temperature"]),
                   "eco_temperature": float(call.data["eco_temperature"]),
                   "vacation_temperature": float(call.data.get("vacation_temperature", 16))}
        hass.config_entries.async_update_entry(c.entry, options=options)
        await c.async_update()
    async def set_vacation(call):
        c = hass.data.get(DOMAIN, {}).get(call.data["entry_id"])
        if c is not None:
            await c.async_set_vacation(bool(call.data["enabled"]))
    hass.services.async_register(DOMAIN, "set_schedule", set_schedule,
        schema=vol.Schema({vol.Required("entry_id"): str, vol.Required("schedule"): dict}))
    hass.services.async_register(DOMAIN, "set_temperatures", set_temperatures,
        schema=vol.Schema({vol.Required("entry_id"): str, vol.Required("comfort_temperature"): vol.Coerce(float),
                           vol.Required("eco_temperature"): vol.Coerce(float),
                           vol.Optional("vacation_temperature", default=16): vol.Coerce(float)}))
    hass.services.async_register(DOMAIN, "set_vacation", set_vacation,
        schema=vol.Schema({vol.Required("entry_id"): str, vol.Required("enabled"): bool}))
    return True
async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry):
    coordinator=RoomHeatingCoordinator(hass,entry)
    hass.data.setdefault(DOMAIN,{})[entry.entry_id]=coordinator
    await coordinator.async_update()
    await hass.config_entries.async_forward_entry_setups(entry,PLATFORMS)
    unsub=async_track_time_change(hass,coordinator.async_update,second=0)
    entry.async_on_unload(unsub)
    entry.async_on_unload(entry.add_update_listener(async_reload_entry))
    return True
async def async_unload_entry(hass,entry):
    hass.data[DOMAIN].pop(entry.entry_id,None)
    return await hass.config_entries.async_unload_platforms(entry,PLATFORMS)
async def async_reload_entry(hass,entry):
    await hass.config_entries.async_reload(entry.entry_id)
