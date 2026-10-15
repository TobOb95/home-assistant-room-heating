"""Vacation mode switch."""
from homeassistant.components.switch import SwitchEntity
from homeassistant.helpers.entity import DeviceInfo
from .const import CONF_ROOM, DOMAIN

async def async_setup_entry(hass, entry, async_add_entities):
    async_add_entities([VacationSwitch(hass.data[DOMAIN][entry.entry_id])])

class VacationSwitch(SwitchEntity):
    _attr_has_entity_name = True
    _attr_name = "Urlaubsmodus"
    _attr_icon = "mdi:beach"
    def __init__(self, coordinator):
        self.coordinator = coordinator
        self._attr_unique_id = coordinator.entry.entry_id + "_vacation"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.entry.data[CONF_ROOM],
            manufacturer="Room Heating",
            model="Schedule controller",
        )
    @property
    def is_on(self): return self.coordinator.vacation
    async def async_turn_on(self, **kwargs):
        await self.coordinator.async_set_vacation(True)
        self.async_write_ha_state()
    async def async_turn_off(self, **kwargs):
        await self.coordinator.async_set_vacation(False)
        self.async_write_ha_state()
