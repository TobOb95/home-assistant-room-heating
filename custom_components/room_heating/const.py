"""Constants for Room Heating Scheduler."""
DOMAIN = "room_heating"
CONF_ROOM = "room_name"
CONF_CLIMATE = "climate_entity"
CONF_COMFORT = "comfort_temperature"
CONF_ECO = "eco_temperature"
CONF_SCHEDULE = "schedule"
CONF_VACATION = "vacation"
CONF_VACATION_TEMP = "vacation_temperature"

DEFAULT_SCHEDULE = {
    str(i): [
        {"start": "06:30", "end": "08:30", "temperature": 21.0},
        {"start": "17:00", "end": "22:30", "temperature": 21.0},
    ]
    for i in range(5)
}
DEFAULT_SCHEDULE.update({
    "5": [{"start": "08:00", "end": "23:00", "temperature": 21.0}],
    "6": [{"start": "08:00", "end": "22:30", "temperature": 21.0}],
})
