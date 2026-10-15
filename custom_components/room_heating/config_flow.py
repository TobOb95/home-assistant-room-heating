"""Config and options flows for Room Heating Scheduler."""
from __future__ import annotations

import json
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers import selector

from .const import (
    CONF_CLIMATE, CONF_COMFORT, CONF_ECO, CONF_SCHEDULE,
    CONF_VACATION_TEMP, DEFAULT_SCHEDULE, DOMAIN
)
from .validation import validate_schedule

DAY_NAMES = {
    "0": "Montag", "1": "Dienstag", "2": "Mittwoch",
    "3": "Donnerstag", "4": "Freitag", "5": "Samstag", "6": "Sonntag"
}

def _schedule_from_input(user_input):
    return validate_schedule({
        day: json.loads(user_input[f"day_{day}"]) for day in DAY_NAMES
    })

def _schedule_text(schedule, day):
    return json.dumps(schedule.get(day, []), ensure_ascii=False, separators=(",", ":"))

class RoomHeatingConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        errors = {}
        if user_input:
            try:
                schedule = validate_schedule(user_input[CONF_SCHEDULE])
            except (ValueError, TypeError, KeyError, json.JSONDecodeError):
                errors["base"] = "invalid_schedule"
            else:
                if not user_input[CONF_CLIMATE].startswith("climate."):
                    errors["base"] = "invalid_climate"
                else:
                    await self.async_set_unique_id(
                        user_input["room_name"].strip().lower() + "_" + user_input[CONF_CLIMATE]
                    )
                    self._abort_if_unique_id_configured()
                    return self.async_create_entry(
                        title=user_input["room_name"],
                        data={**user_input, CONF_SCHEDULE: schedule},
                    )

        schema = vol.Schema({
            vol.Required("room_name"): str,
            vol.Required(CONF_CLIMATE): selector.EntitySelector(
                selector.EntitySelectorConfig(domain="climate")
            ),
            vol.Required(CONF_COMFORT, default=21.0): vol.All(vol.Coerce(float), vol.Range(min=5, max=30)),
            vol.Required(CONF_ECO, default=17.0): vol.All(vol.Coerce(float), vol.Range(min=5, max=30)),
            vol.Required(CONF_SCHEDULE, default=json.dumps(DEFAULT_SCHEDULE, ensure_ascii=False)): str,
        })
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    @staticmethod
    def async_get_options_flow(config_entry):
        return RoomHeatingOptionsFlow(config_entry)

class RoomHeatingOptionsFlow(config_entries.OptionsFlow):
    def __init__(self, config_entry):
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        current = {**self.config_entry.data, **self.config_entry.options}
        schedule = current.get(CONF_SCHEDULE, DEFAULT_SCHEDULE)
        if user_input:
            try:
                parsed = _schedule_from_input(user_input)
            except (ValueError, TypeError, KeyError, json.JSONDecodeError):
                return self.async_show_form(
                    step_id="init", data_schema=self._schema(current, schedule),
                    errors={"base": "invalid_schedule"}
                )
            return self.async_create_entry(data={
                CONF_COMFORT: float(user_input[CONF_COMFORT]),
                CONF_ECO: float(user_input[CONF_ECO]),
                CONF_VACATION_TEMP: float(user_input[CONF_VACATION_TEMP]),
                CONF_SCHEDULE: parsed,
            })
        return self.async_show_form(step_id="init", data_schema=self._schema(current, schedule))

    def _schema(self, current, schedule):
        fields = {
            vol.Required(CONF_COMFORT, default=current.get(CONF_COMFORT, 21.0)): vol.All(vol.Coerce(float), vol.Range(min=5, max=30)),
            vol.Required(CONF_ECO, default=current.get(CONF_ECO, 17.0)): vol.All(vol.Coerce(float), vol.Range(min=5, max=30)),
            vol.Required(CONF_VACATION_TEMP, default=current.get(CONF_VACATION_TEMP, 16.0)): vol.All(vol.Coerce(float), vol.Range(min=5, max=25)),
        }
        for day, name in DAY_NAMES.items():
            fields[vol.Required(f"day_{day}", default=_schedule_text(schedule, day))] = str
        return vol.Schema(fields)
