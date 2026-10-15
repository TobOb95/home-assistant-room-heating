"""Room heating sensors."""
from homeassistant.components.sensor import SensorEntity
from homeassistant.helpers.entity import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import CONF_COMFORT, CONF_ECO, CONF_ROOM, CONF_SCHEDULE, CONF_VACATION_TEMP, DOMAIN

async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.entry_id]
    async_add_entities([TargetSensor(coordinator), ModeSensor(coordinator)])

class Base(CoordinatorEntity, SensorEntity):
    _attr_has_entity_name = True
    def __init__(self, coordinator):
        super().__init__(coordinator)
        self.coordinator = coordinator
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, coordinator.entry.entry_id)},
            name=coordinator.entry.data[CONF_ROOM],
            manufacturer="Room Heating",
            model="Schedule controller",
        )

class TargetSensor(Base):
    _attr_name = "Heiz-Solltemperatur"
    _attr_native_unit_of_measurement = "°C"
    _attr_icon = "mdi:thermometer"
    @property
    def unique_id(self): return self.coordinator.entry.entry_id + "_target"
    @property
    def native_value(self): return (self.coordinator.data or {}).get("target")
    @property
    def extra_state_attributes(self):
        o = self.coordinator.opts
        return {
            "entry_id": self.coordinator.entry.entry_id,
            "room_name": o.get(CONF_ROOM),
            "climate_entity": o.get("climate_entity"),
            "comfort_temperature": o.get(CONF_COMFORT, 21),
            "eco_temperature": o.get(CONF_ECO, 17),
            "vacation_temperature": o.get(CONF_VACATION_TEMP, 16),
            "vacation": self.coordinator.vacation,
            "schedule_status": self.coordinator.status,
            "schedule": self.coordinator.schedule(),
        }

class ModeSensor(Base):
    _attr_name = "Aktives Heizprofil"
    _attr_icon = "mdi:calendar-clock"
    @property
    def unique_id(self): return self.coordinator.entry.entry_id + "_mode"
    @property
    def native_value(self): return (self.coordinator.data or {}).get("status", "unknown")
