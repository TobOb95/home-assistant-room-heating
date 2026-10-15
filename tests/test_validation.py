"""Tests for room heating schedule validation."""
import json
from datetime import datetime
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import unittest

_MODULE_PATH = (
    Path(__file__).parents[1]
    / "custom_components"
    / "room_heating"
    / "validation.py"
)
_SPEC = spec_from_file_location("room_heating_validation", _MODULE_PATH)
_VALIDATION = module_from_spec(_SPEC)
_SPEC.loader.exec_module(_VALIDATION)
validate_schedule = _VALIDATION.validate_schedule
target_for_schedule = _VALIDATION.target_for_schedule


class ValidateScheduleTests(unittest.TestCase):
    def test_normalizes_all_weekdays(self):
        schedule = validate_schedule({"0": [
            {"start": "06:00", "end": "08:00", "temperature": "20.5"},
        ]})

        self.assertEqual(schedule["0"], [
            {"start": "06:00", "end": "08:00", "temperature": 20.5, "enabled": True},
        ])
        self.assertTrue(all(schedule[day] == [] for day in map(str, range(1, 7))))

    def test_accepts_json_and_touching_periods(self):
        schedule = {"1": [
            {"start": "06:00", "end": "08:00", "temperature": 20},
            {"start": "08:00", "end": "09:00", "temperature": 19},
        ]}

        self.assertEqual(len(validate_schedule(json.dumps(schedule))["1"]), 2)

    def test_preserves_disabled_period(self):
        schedule = validate_schedule({"0": [
            {"start": "06:00", "end": "08:00", "temperature": 20, "enabled": False},
        ]})
        self.assertFalse(schedule["0"][0]["enabled"])

    def test_rejects_non_boolean_enabled_flag(self):
        with self.assertRaises(ValueError):
            validate_schedule({"0": [
                {"start": "06:00", "end": "08:00", "temperature": 20, "enabled": "false"},
            ]})

    def test_resolves_only_enabled_periods(self):
        now = datetime(2026, 10, 12, 7, 0)
        schedule = validate_schedule({"0": [
            {"start": "06:00", "end": "08:00", "temperature": 21, "enabled": False},
        ]})
        self.assertEqual(target_for_schedule(schedule, now, 17), (17.0, "eco"))

        schedule["0"][0]["enabled"] = True
        self.assertEqual(target_for_schedule(schedule, now, 17), (21.0, "comfort"))

    def test_vacation_temperature_takes_precedence(self):
        now = datetime(2026, 10, 12, 7, 0)
        schedule = validate_schedule({"0": [
            {"start": "06:00", "end": "08:00", "temperature": 21},
        ]})
        self.assertEqual(
            target_for_schedule(schedule, now, 17, vacation=True, vacation_temperature=16),
            (16.0, "vacation"),
        )

    def test_rejects_invalid_input(self):
        schedules = [
            {"7": []},
            {"0": "not a list"},
            {"0": [{"start": "6:00", "end": "08:00", "temperature": 20}]},
            {"0": [{"start": "06:00", "end": "08:00", "temperature": 31}]},
            {"0": [
                {"start": "06:00", "end": "08:00", "temperature": 20},
                {"start": "07:30", "end": "09:00", "temperature": 19},
            ]},
        ]
        for schedule in schedules:
            with self.subTest(schedule=schedule):
                with self.assertRaises((ValueError, TypeError, KeyError)):
                    validate_schedule(schedule)

    def test_rejects_invalid_json(self):
        with self.assertRaises(json.JSONDecodeError):
            validate_schedule("{")
