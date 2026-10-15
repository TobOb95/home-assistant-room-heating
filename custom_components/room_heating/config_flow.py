"""Configuration flow with visual weekly schedule options."""
import json
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers import selector
from .const import *

DAY_NAMES = {
    "0": "Montag", "1": "Dienstag", "2": "Mittwoch", "3": "Donnerstag",
    "4": "Freitag", "5": "Samstag", "6": "Sonntag"
}
def _periods_to_text(schedule, day):
    return json.dumps(schedule.get(day, []), ensure_ascii=False, separators=(",", ":"))
def _parse_periods(value):
    parsed = json.loads(value)
    if not isinstance(parsed, list):
        raise ValueError("expected list")
    for period in parsed:
        start, end = period["start"], period["end"]
        if not (len(start) == 5 and start[2] == ":" and len(end) == 5 and end[2] == ":"):
            raise ValueError("time must be HH:MM")
        sh, sm = map(int, start.split(":")); eh, em = map(int, end.split(":"))
        if not (0 <= sh <= 23 and 0 <= eh <= 23 and 0 <= sm <= 59 and 0 <= em <= 59):
            raise ValueError("invalid time")
        if start >= end:
            raise ValueError("end must be after start")
        temp = float(period["temperature"])
        if not 5 <= temp <= 30:
            raise ValueError("invalid temperature")
    return parsed
def _schedule_schema(schedule):
    fields = {}
    for day, name in DAY_NAMES.items():
        fields[vol.Required("day_" + day, description={"suggested_value": name})] = str
    return fields
def _schedule_from_input(user_input):
    result = {}
    for day in DAY_NAMES:
        result[day] = _parse_periods(user_input["day_" + day])
    return result
def _schedule_fields(schedule):
    return {("day_" + day): _periods_to_text(schedule, day) for day in DAY_NAMES}

class RoomHeatingConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1
    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input:
            try:
                schedule = json.loads(user_input[CONF_SCHEDULE])
                if not isinstance(schedule, dict): raise ValueError()
                for day, periods in schedule.items():
                    if day not in DAY_NAMES: raise ValueError()
                    _parse_periods(json.dumps(periods))
            except (ValueError, TypeError, KeyError, json.JSONDecodeError):
                errors["base"] = "invalid_schedule"
            else:
                if not user_input[CONF_CLIMATE].startswith("climate."):
                    errors["base"] = "invalid_climate"
                else:
                    await self.async_set_unique_id(user_input[CONF_ROOM].strip().lower()+"_"+user_input[CONF_CLIMATE])
                    self._abort_if_unique_id_configured()
                    return self.async_create_entry(title=user_input[CONF_ROOM], data=user_input)
        schema=vol.Schema({
            vol.Required(CONF_ROOM):str,
            vol.Required(CONF_CLIMATE):selector.EntitySelector(selector.EntitySelectorConfig(domain="climate")),
            vol.Required(CONF_COMFORT,default=21.0):vol.All(vol.Coerce(float),vol.Range(min=5,max=30)),
            vol.Required(CONF_ECO,default=17.0):vol.All(vol.Coerce(float),vol.Range(min=5,max=30)),
            vol.Required(CONF_SCHEDULE,default=json.dumps(DEFAULT_SCHEDULE,ensure_ascii=False)):str})
        return self.async_show_form(step_id="user",data_schema=schema,errors=errors)
    @staticmethod
    def async_get_options_flow(config_entry):
        return RoomHeatingOptionsFlow(config_entry)

class RoomHeatingOptionsFlow(config_entries.OptionsFlow):
    def __init__(self, config_entry):
        self.config_entry = config_entry
    async def async_step_init(self, user_input=None):
        current={**self.config_entry.data,**self.config_entry.options}
        schedule=current.get(CONF_SCHEDULE,DEFAULT_SCHEDULE)
        if user_input:
            try:
                parsed=_schedule_from_input(user_input)
            except (ValueError,TypeError,KeyError,json.JSONDecodeError):
                return self.async_show_form(step_id="init",data_schema=self._schema(current,schedule),errors={"base":"invalid_schedule"})
            data={CONF_COMFORT:user_input[CONF_COMFORT],CONF_ECO:user_input[CONF_ECO],
                  CONF_SCHEDULE:parsed,"vacation_temperature":user_input["vacation_temperature"]}
            return self.async_create_entry(title="",data=data)
        return self.async_show_form(step_id="init",data_schema=self._schema(current,schedule))
    def _schema(self,current,schedule):
        fields={
          vol.Required(CONF_COMFORT,default=current.get(CONF_COMFORT,21.0)):vol.All(vol.Coerce(float),vol.Range(min=5,max=30)),
          vol.Required(CONF_ECO,default=current.get(CONF_ECO,17.0)):vol.All(vol.Coerce(float),vol.Range(min=5,max=30)),
          vol.Required("vacation_temperature",default=current.get("vacation_temperature",16.0)):vol.All(vol.Coerce(float),vol.Range(min=5,max=25)),
        }
        for day,name in DAY_NAMES.items():
            fields[vol.Required("day_"+day, default=_periods_to_text(schedule, day))] = str
        # Keep a friendly day label in each field's placeholder; each day is edited separately.
        return vol.Schema(fields)
