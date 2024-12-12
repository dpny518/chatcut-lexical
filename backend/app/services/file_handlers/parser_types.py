import re
from abc import ABC, abstractmethod

class BaseParser(ABC):
    @abstractmethod
    def parse(self, content):
        pass

    @classmethod
    @abstractmethod
    def is_matching_format(cls, content):
        pass
class AsteriskSpeakerTimeParser(BaseParser):
    @classmethod
    def is_matching_format(cls, content):
        lines = content.split('\n')[:10]
        pattern = r'^\*\*[^*]+\*\*:\s*\d{2}:\d{2}'
        return any(re.match(pattern, line) for line in lines)

    def parse(self, content):
        segments = []
        for line in content.split('\n'):
            match = re.match(r'^\*\*([^*]+)\*\*:\s*(\d{2}:\d{2})\s*(.*)', line)
            if match:
                speaker, time, text = match.groups()
                segments.append({
                    "speaker": speaker.strip(),
                    "time": time.strip(),
                    "text": text.strip()
                })
        return segments


class AsteriskTimeParser(BaseParser):
    @classmethod
    def is_matching_format(cls, content):
        lines = content.split('\n')[:10]  # Check first 10 lines
        pattern = r'^\*\*[^*]+\*\*:\s*\d{2}:\d{2}'
        return any(re.match(pattern, line) for line in lines)

    def parse(self, content):
        segments = []
        for line in content.split('\n'):
            match = re.match(r'^\*\*([^*]+)\*\*:\s*(\d{2}:\d{2})\s*(.*)', line)
            if match:
                speaker, time, text = match.groups()
                segments.append({"speaker": speaker.strip(), "time": time, "text": text.strip()})
        return segments

class ChineseParser(BaseParser):
    @classmethod
    def is_matching_format(cls, content):
        lines = content.split('\n')[:10]
        pattern = r'^说话人\d+\s+\d{2}:\d{2}'
        return any(re.match(pattern, line) for line in lines)

    def parse(self, content):
        segments = []
        for line in content.split('\n'):
            match = re.match(r'^(说话人\d+)\s+(\d{2}:\d{2})\s*(.*)', line)
            if match:
                speaker, time, text = match.groups()
                segments.append({"speaker": speaker, "time": time, "text": text.strip()})
        return segments

class NoTimeParser(BaseParser):
    @classmethod
    def is_matching_format(cls, content):
        lines = content.split('\n')[:10]
        pattern = r'^\*\*[^*]+\*\*:'
        return any(re.match(pattern, line) for line in lines) and not any(':' in line and re.search(r'\d{2}:\d{2}', line) for line in lines)

    def parse(self, content):
        segments = []
        for line in content.split('\n'):
            match = re.match(r'^\*\*([^*]+)\*\*:\s*(.*)', line)
            if match:
                speaker, text = match.groups()
                segments.append({"speaker": speaker.strip(), "time": None, "text": text.strip()})
        return segments

class NameColonTimeParser(BaseParser):
    @classmethod
    def is_matching_format(cls, content):
        lines = content.split('\n')[:10]
        pattern = r'^[^:]+:\s*\d{2}:\d{2}'
        return any(re.match(pattern, line) for line in lines)

    def parse(self, content):
        segments = []
        for line in content.split('\n'):
            match = re.match(r'^([^:]+):\s*(\d{2}:\d{2})\s*(.*)', line)
            if match:
                speaker, time, text = match.groups()
                segments.append({"speaker": speaker.strip(), "time": time, "text": text.strip()})
        return segments

class NameTimeParser(BaseParser):
    @classmethod
    def is_matching_format(cls, content):
        lines = content.split('\n')[:10]
        pattern = r'^[^:]+\s+\d{2}:\d{2}'
        return any(re.match(pattern, line) for line in lines)

    def parse(self, content):
        segments = []
        for line in content.split('\n'):
            match = re.match(r'^([^:]+)\s+(\d{2}:\d{2})\s*(.*)', line)
            if match:
                speaker, time, text = match.groups()
                segments.append({"speaker": speaker.strip(), "time": time, "text": text.strip()})
        return segments

class MixedChineseEnglishParser(BaseParser):
    @classmethod
    def is_matching_format(cls, content):
        lines = content.split('\n')[:10]
        chinese_pattern = r'^说话人\d+\s+\d{2}:\d{2}'
        english_pattern = r'^[^:]+:\s*\d{2}:\d{2}'
        return any(re.match(chinese_pattern, line) or re.match(english_pattern, line) for line in lines)

    def parse(self, content):
        segments = []
        for line in content.split('\n'):
            chinese_match = re.match(r'^(说话人\d+)\s+(\d{2}:\d{2})\s*(.*)', line)
            english_match = re.match(r'^([^:]+):\s*(\d{2}:\d{2})\s*(.*)', line)
            if chinese_match:
                speaker, time, text = chinese_match.groups()
                segments.append({"speaker": speaker, "time": time, "text": text.strip()})
            elif english_match:
                speaker, time, text = english_match.groups()
                segments.append({"speaker": speaker.strip(), "time": time, "text": text.strip()})
        return segments

class ParagraphParser(BaseParser):
    @classmethod
    def is_matching_format(cls, content):
        paragraphs = content.split('\n\n')
        return len(paragraphs) > 1 and all(p.strip() for p in paragraphs[:5])

    def parse(self, content):
        segments = []
        paragraphs = content.split('\n\n')
        for paragraph in paragraphs:
            lines = paragraph.split('\n')
            if lines:
                first_line = lines[0]
                match = re.match(r'^([^:]+):\s*(\d{2}:\d{2})?\s*(.*)', first_line)
                if match:
                    speaker, time, text = match.groups()
                    text = ' '.join([text] + lines[1:])
                    segments.append({"speaker": speaker.strip(), "time": time, "text": text.strip()})
                else:
                    segments.append({"speaker": None, "time": None, "text": paragraph.strip()})
        return segments