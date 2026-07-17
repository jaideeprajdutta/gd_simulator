import unittest
from unittest.mock import patch, MagicMock, mock_open
import json


class TestCustomParticipants(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch('builtins.input', return_value='test'):
            with patch('pygame.mixer.init'):
                import main
                cls.main = main

    def test_get_default_participants(self):
        result = self.main.get_default_participants()
        self.assertEqual(len(result), 5)
        self.assertEqual(result["P1"]["role"], "Aggressive Dominator")

    def test_load_participants_success(self):
        test_data = {"P1": {"role": "Test", "weight": 50}}
        with patch('builtins.open', mock_open(read_data=json.dumps(test_data))):
            result = self.main.load_participants()
            self.assertEqual(result, test_data)

    def test_load_participants_file_not_found(self):
        with patch('builtins.open', side_effect=FileNotFoundError):
            result = self.main.load_participants()
            self.assertEqual(len(result), 5)

    def test_load_participants_invalid_json(self):
        with patch('builtins.open', mock_open(read_data="invalid")):
            result = self.main.load_participants()
            self.assertEqual(len(result), 5)

    def test_voice_input_success(self):
        with patch('main.sr.Recognizer') as mock_recognizer:
            mock_instance = MagicMock()
            mock_instance.recognize_google.return_value = "Hello"
            mock_recognizer.return_value = mock_instance
            result = self.main.get_voice_input()
            self.assertEqual(result, "Hello")

    def test_voice_input_failure(self):
        with patch('main.sr.Recognizer') as mock_recognizer:
            mock_instance = MagicMock()
            mock_instance.recognize_google.side_effect = Exception("Error")
            mock_recognizer.return_value = mock_instance
            result = self.main.get_voice_input()
            self.assertEqual(result, "")


if __name__ == "__main__":
    unittest.main()
