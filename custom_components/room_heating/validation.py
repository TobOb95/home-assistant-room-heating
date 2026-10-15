"""Validation helpers shared by config flows and services."""
from __future__ import annotations

import json
from datetime import datetime


def validate_schedule(value):
    """Parse and validate a complete seven-day schedule."""
    schedule = json.loads(value) if isinstance(value, str) else value
    if not isinstance(schedule, dict) or set(schedule) - set("0123456"):
        raise ValueError("schedule must contain weekdays 0 through 6")

    normalized = {}
    for day in map(str, range(7)):
        periods = schedule.get(day, [])
        if not isinstance(periods, list):
            raise ValueError("periods must be a list")
        checked = []
        for period in periods:
            if not isinstance(period, dict):
                raise ValueError("period must be an object")
            start, end = period.get("start"), period.get("end")
            if not isinstance(start, str) or not isinstance(end, str):
                raise ValueError("period times must be strings")
            start_minutes = _time_minutes(start)
            end_minutes = _time_minutes(end)
            temperature = float(period["temperature"])
            if start_minutes >= end_minutes:
                raise ValueError("period end must follow its start")
            if not 5 <= temperature <= 30:
                raise ValueError("temperature must be between 5 and 30")
            enabled = period.get("enabled", True)
            if not isinstance(enabled, bool):
                raise ValueError("period enabled flag must be a boolean")
            checked.append({
                "start": start,
                "end": end,
                "temperature": temperature,
                "enabled": enabled,
            })

        checked.sort(key=lambda period: period["start"])
        previous_end = -1
        for period in checked:
            start = _time_minutes(period["start"])
            if start < previous_end:
                raise ValueError("periods cannot overlap")
            previous_end = _time_minutes(period["end"])
        normalized[day] = checked
    return normalized


def _time_minutes(value):
    """Return minutes after midnight for a strict HH:MM value."""
    if len(value) != 5 or value[2] != ":":
        raise ValueError("time must use HH:MM")
    try:
        hour, minute = map(int, value.split(":"))
    except ValueError as err:
        raise ValueError("invalid time") from err
    if not (0 <= hour <= 23 and 0 <= minute <= 59):
        raise ValueError("invalid time")
    return hour * 60 + minute


def target_for_schedule(
    schedule,
    now: datetime,
    eco_temperature: float,
    vacation: bool = False,
    vacation_temperature: float = 16,
):
    """Resolve the target for the current local date and time."""
    if vacation:
        return float(vacation_temperature), "vacation"

    day_periods = schedule.get(str(now.weekday()), [])
    current_time = now.strftime("%H:%M")
    for period in day_periods:
        if (
            period.get("enabled", True)
            and period["start"] <= current_time < period["end"]
        ):
            return float(period["temperature"]), "comfort"

    return float(eco_temperature), "eco"
