"""
Pascal VOC XML format parser.
Extracts object annotations from XML files.
"""

import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List


def parse_xml(file_path: str) -> Dict[str, List[str]]:
    """
    Parse Pascal VOC format XML file.
    
    Args:
        file_path: Path to the XML file
        
    Returns:
        Dictionary mapping class names to list of bounding boxes
        Format: {class_name: [bbox_info, ...]}
    """
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        annotations = {}
        
        # Extract all objects
        for obj in root.findall('object'):
            name_elem = obj.find('name')
            if name_elem is not None and name_elem.text:
                class_name = name_elem.text.strip()
                
                # Get bounding box if available
                bbox_elem = obj.find('bndbox')
                bbox_info = ""
                if bbox_elem is not None:
                    xmin = bbox_elem.find('xmin')
                    ymin = bbox_elem.find('ymin')
                    xmax = bbox_elem.find('xmax')
                    ymax = bbox_elem.find('ymax')
                    
                    if all(elem is not None for elem in [xmin, ymin, xmax, ymax]):
                        bbox_info = f"{xmin.text},{ymin.text},{xmax.text},{ymax.text}"
                
                if class_name not in annotations:
                    annotations[class_name] = []
                annotations[class_name].append(bbox_info)
        
        return annotations
    
    except Exception as e:
        print(f"Error parsing XML file {file_path}: {e}")
        return {}


def is_xml_file(file_path: str) -> bool:
    """Check if file is an XML file."""
    return Path(file_path).suffix.lower() == '.xml'
