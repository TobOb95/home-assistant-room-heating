"""Room schedule engine."""
from datetime import datetime
import logging
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator
from .const import *
_LOGGER=logging.getLogger(__name__)
class RoomHeatingCoordinator(DataUpdateCoordinator):
    def __init__(self,hass,entry):
        super().__init__(hass,_LOGGER,name=f"Room Heating {entry.data[CONF_ROOM]}")
        self.hass=hass; self.entry=entry; self.vacation=bool(entry.options.get(CONF_VACATION,False))
        self.last_target=None; self.status="unknown"
    @property
    def opts(self):
        return {**self.entry.data,**self.entry.options}
    def target_temperature(self,now=None):
        now=now or datetime.now().astimezone()
        o=self.opts
        if self.vacation:
            return float(o.get("vacation_temperature",16)), "vacation"
        schedule=o.get(CONF_SCHEDULE,DEFAULT_SCHEDULE)
        if isinstance(schedule, str):
            try:
                import json
                schedule=json.loads(schedule)
            except (ValueError, TypeError):
                schedule=DEFAULT_SCHEDULE
        for period in schedule.get(str(now.weekday()),[]):
            try:
                if period["start"] <= now.strftime("%H:%M") < period["end"]:
                    return float(period["temperature"]), "comfort"
            except (KeyError,TypeError,ValueError):
                continue
        return float(o.get(CONF_ECO,17)), "eco"
    async def async_update(self,now=None):
        target,status=self.target_temperature()
        entity=self.opts[CONF_CLIMATE]
        self.status=status
        state=self.hass.states.get(entity)
        if state is None or state.state in ("unknown","unavailable"):
            self.async_set_updated_data({"target":target,"status":"unavailable"})
            return
        try:
            if self.last_target is None or abs(self.last_target-target)>=0.1:
                await self.hass.services.async_call("climate","set_temperature",{"entity_id":entity,"temperature":target},blocking=True)
                self.last_target=target
            self.async_set_updated_data({"target":target,"status":status})
        except Exception:
            _LOGGER.exception("Could not set temperature on %s",entity)
            self.async_set_updated_data({"target":target,"status":"error"})
    async def async_set_vacation(self,enabled):
        self.vacation=enabled
        await self.async_update()
