"""
Annotation parsers for different dataset formats.
"""

from .xml_parser import parse_xml
from .json_parser import parse_json
from .txt_parser import parse_txt

__all__ = ['parse_xml', 'parse_json', 'parse_txt']
