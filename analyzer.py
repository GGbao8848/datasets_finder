"""
Dataset analyzer - traverses directories and analyzes annotation files.
"""

import os
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict

from parsers.xml_parser import parse_xml, is_xml_file
from parsers.json_parser import parse_json, is_json_file
from parsers.txt_parser import parse_txt, is_txt_file, find_class_names_file, load_class_names


class DatasetAnalyzer:
    """Analyzes dataset directories and extracts annotation statistics."""
    
    def __init__(self, root_path: str):
        """
        Initialize analyzer.
        
        Args:
            root_path: Root directory to analyze
        """
        self.root_path = Path(root_path).resolve()
        self.class_stats = defaultdict(lambda: {
            'count': 0,
            'files': set(),
            'locations': set(),
            'types': set()
        })
        self.yolo_class_names = None
        
    def analyze(self) -> Dict[str, Any]:
        """
        Analyze the dataset directory.
        
        Returns:
            Dictionary containing analysis results
        """
        # Note: Class names file lookup removed as per user request
        
        # Traverse directory
        self._traverse_directory(self.root_path)
        
        # Format results
        results = self._format_results()
        return results
    
    def _traverse_directory(self, directory: Path):
        """Recursively traverse directory and process annotation files."""
        try:
            for item in directory.iterdir():
                if item.is_file():
                    self._process_file(item)
                elif item.is_dir():
                    # Skip hidden directories and common non-data directories
                    if not item.name.startswith('.') and item.name not in ['__pycache__', 'node_modules']:
                        self._traverse_directory(item)
        except PermissionError:
            print(f"Permission denied: {directory}")
        except Exception as e:
            print(f"Error traversing {directory}: {e}")
    
    def _process_file(self, file_path: Path):
        """Process a single annotation file."""
        annotations = {}
        file_type = "Unknown"
        
        # Determine file type and parse
        if is_xml_file(str(file_path)):
            annotations = parse_xml(str(file_path))
            file_type = "XML"
        elif is_json_file(str(file_path)):
            annotations = parse_json(str(file_path))
            file_type = "JSON"
        elif is_txt_file(str(file_path)):
            # Skip class names files
            if file_path.name in ['classes.txt', 'obj.names', 'class.names', 'labels.txt']:
                return
            # Pass None for class_names to use raw indices
            annotations = parse_txt(str(file_path), None)
            file_type = "TXT"
        
        # Update statistics
        if annotations:
            # Use absolute location
            location = str(file_path.parent.resolve())
            
            for class_name, bbox_list in annotations.items():
                self.class_stats[class_name]['count'] += len(bbox_list)
                self.class_stats[class_name]['files'].add(str(file_path))
                self.class_stats[class_name]['locations'].add(location)
                self.class_stats[class_name]['types'].add(file_type)
    
    def _get_relative_location(self, directory: Path) -> str:
        """Get relative path from root."""
        try:
            return str(directory.relative_to(self.root_path))
        except ValueError:
            return str(directory)
    
    def _format_results(self) -> Dict[str, Any]:
        """Format analysis results for API response."""
        results = []
        
        for class_name, stats in sorted(self.class_stats.items()):
            results.append({
                'class_name': class_name,
                'annotations': stats['count'],
                'files': len(stats['files']),
                'locations': sorted(list(stats['locations'])),
                'types': sorted(list(stats['types']))
            })
        
        return {
            'total_classes': len(self.class_stats),
            'total_annotations': sum(s['count'] for s in self.class_stats.values()),
            'total_files': len(set(f for s in self.class_stats.values() for f in s['files'])),
            'classes': results,
            'root_path': str(self.root_path)
        }


def analyze_dataset(root_path: str) -> Dict[str, Any]:
    """
    Analyze a dataset directory.
    
    Args:
        root_path: Root directory path
        
    Returns:
        Analysis results dictionary
    """
    analyzer = DatasetAnalyzer(root_path)
    return analyzer.analyze()
