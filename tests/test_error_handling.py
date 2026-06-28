import unittest
from unittest.mock import patch, MagicMock
import json
import os
from main import (
    participants, choose_speaker, choose_target, choose_intent, update_relationships, relationships,
    get_phase, save_history, get_voice_input
)

class TestCustomParticipants(unittest.TestCase):
    def setUp(self):
        self.custom_participants = {
            "P1": {"role": "Aggressive Dominator", "weight": 40},
            "P2": {"role": "Logical Analyst", "weight": 25},
            "P3": {"role": "Data Driven Speaker", "weight": 20},
            "P4": {"role": "Corporate Professional", "weight": 10},
            "P5": {"role": "Introvert", "weight": 5},
            "P6": {"role": "Controversial Speaker", "weight": 15}
        }

    def test_load_custom_participants_success(self):
        with patch('builtins.open', unittest.mock.mock_open(
            read_data='{
                "P1": {"role": "Aggressive Dominator", "weight": 40},
                "P2": {"role": "Logical Analyst", "weight": 25}
            }'
        )):
            with patch('main.get_default_participants') as mock_default:
                mock_default.return_value = self.custom_participants
                from importlib import reload
                import main
                reload(main)
                self.assertIn("P1", main.participants)
                self.assertIn("P2", main.participants)
                self.assertEqual(main.participants["P1"]["role"], "Aggressive Dominator")

    def test_load_custom_participants_file_not_found_uses_default(self):
        with patch('os.path.exists', return_value=False):
            with patch('main.get_default_participants') as mock_default:
                mock_default.return_value = self.custom_participants
                from importlib import reload
                import main
                reload(main)
                self.assertEqual(len(main.participants), len(self.custom_participants))

    def test_load_custom_participants_invalid_json_uses_default(self):
        with patch('builtins.open', side_effect=json.JSONDecodeError('Invalid JSON', '', 0)):
            with patch('main.get_default_participants') as mock_default:
                mock_default.return_value = self.custom_participants
                from importlib import reload
                import main
                reload(main)
                self.assertEqual(len(main.participants), len(self.custom_participants))

    def test_voice_input_success(self):
        with patch('sr.Recognizer') as mock_recognizer:
            mock_instance = MagicMock()
            mock_instance.recognize_google.return_value = "Hello"
            mock_recognizer.return_value = mock_instance

            with patch('pygame.mixer.init'):
                import main
                result = main.get_voice_input()
                self.assertEqual(result, "Hello")

    def test_voice_input_failure(self):
        with patch('sr.Recognizer') as mock_recognizer:
            mock_instance = MagicMock()
            mock_instance.recognize_google.side_effect = Exception("Error")
            mock_recognizer.return_value = mock_instance

            with patch('pygame.mixer.init'):
                import main
                result = main.get_voice_input()
                self.assertEqual(result, "")

if __name__ == "__main__":
    unittest.main()