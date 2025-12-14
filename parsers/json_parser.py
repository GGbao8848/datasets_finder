"""
JSON format parser for COCO and LabelMe formats.
"""

import json
from pathlib import Path
from typing import Dict, List


def parse_json(file_path: str) -> Dict[str, List[str]]:
    """
    Parse JSON annotation file (COCO or LabelMe format).
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        Dictionary mapping class names to list of annotations
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        annotations = {}
        
        # Try COCO format first
        if 'categories' in data and 'annotations' in data:
            annotations = _parse_coco_format(data)
        # Try LabelMe format
        elif 'shapes' in data:
            annotations = _parse_labelme_format(data)
        # Try single image COCO format
        elif isinstance(data, dict) and any(key in data for key in ['image', 'annotations']):
            annotations = _parse_single_coco_format(data)
        
        return annotations
    
    except Exception as e:
        print(f"Error parsing JSON file {file_path}: {e}")
        return {}


def _parse_coco_format(data: dict) -> Dict[str, List[str]]:
    """Parse COCO dataset format."""
    annotations = {}
    
    # Build category mapping
    category_map = {}
    for cat in data.get('categories', []):
        category_map[cat['id']] = cat['name']
    
    # Process annotations
    for ann in data.get('annotations', []):
        category_id = ann.get('category_id')
        if category_id in category_map:
            class_name = category_map[category_id]
            
            # Get bbox if available
            bbox_info = ""
            if 'bbox' in ann:
                bbox = ann['bbox']
                if len(bbox) >= 4:
                    bbox_info = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
            
            if class_name not in annotations:
                annotations[class_name] = []
            annotations[class_name].append(bbox_info)
    
    return annotations


def _parse_single_coco_format(data: dict) -> Dict[str, List[str]]:
    """Parse single image COCO format."""
    annotations = {}
    
    for ann in data.get('annotations', []):
        class_name = ann.get('category', ann.get('label', 'unknown'))
        
        bbox_info = ""
        if 'bbox' in ann:
            bbox = ann['bbox']
            if len(bbox) >= 4:
                bbox_info = f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}"
        
        if class_name not in annotations:
            annotations[class_name] = []
        annotations[class_name].append(bbox_info)
    
    return annotations


def _parse_labelme_format(data: dict) -> Dict[str, List[str]]:
    """Parse LabelMe format."""
    annotations = {}
    
    for shape in data.get('shapes', []):
        class_name = shape.get('label', 'unknown')
        
        # Get points if available
        bbox_info = ""
        if 'points' in shape:
            points = shape['points']
            if len(points) >= 2:
                # Convert points to bbox
                xs = [p[0] for p in points]
                ys = [p[1] for p in points]
                bbox_info = f"{min(xs)},{min(ys)},{max(xs)},{max(ys)}"
        
        if class_name not in annotations:
            annotations[class_name] = []
        annotations[class_name].append(bbox_info)
    
    return annotations


def is_json_file(file_path: str) -> bool:
    """Check if file is a JSON file."""
    return Path(file_path).suffix.lower() == '.json'
