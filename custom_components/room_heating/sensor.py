"""Room status sensors."""
from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.helpers.entity import DeviceInfo
from .const import DOMAIN,CONF_ROOM
async def async_setup_entry(hass,entry,async_add_entities):
    c=hass.data[DOMAIN][entry.entry_id]
    async_add_entities([TargetSensor(c),ModeSensor(c)])
class Base(CoordinatorEntity,SensorEntity):
    _attr_has_entity_name=True
    def __init__(self,c):
        super().__init__(c); self.c=c
        self._attr_device_info=DeviceInfo(identifiers={(DOMAIN,c.entry.entry_id)},name=c.entry.data[CONF_ROOM],manufacturer="Room Heating",model="Schedule controller")
class TargetSensor(Base):
    _attr_name="Heiz-Solltemperatur"; _attr_native_unit_of_measurement="°C"; _attr_icon="mdi:thermometer"
    @property
    def unique_id(self): return self.c.entry.entry_id+"_target"
    @property
    def native_value(self): return (self.c.data or {}).get("target")
class ModeSensor(Base):
    _attr_name="Aktives Heizprofil"; _attr_icon="mdi:calendar-clock"
    @property
    def unique_id(self): return self.c.entry.entry_id+"_mode"
    @property
    def native_value(self): return (self.c.data or {}).get("status","unknown")
