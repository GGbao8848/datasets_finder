"""
YOLO TXT format parser.
Parses YOLO format annotation files with class mapping support.
"""

from pathlib import Path
from typing import Dict, List, Optional


def parse_txt(file_path: str, class_names: Optional[List[str]] = None) -> Dict[str, List[str]]:
    """
    Parse YOLO format TXT file.
    
    Args:
        file_path: Path to the TXT file
        class_names: List of class names (index corresponds to class_id)
        
    Returns:
        Dictionary mapping class names to list of annotations
    """
    try:
        annotations = {}
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            parts = line.split()
            if len(parts) >= 5:  # class_id x_center y_center width height
                try:
                    class_id = int(parts[0])
                    
                    # Get class name
                    if class_names and 0 <= class_id < len(class_names):
                        class_name = class_names[class_id]
                    else:
                        class_name = f"class_{class_id}"
                    
                    # Store bbox info
                    bbox_info = f"{parts[1]},{parts[2]},{parts[3]},{parts[4]}"
                    
                    if class_name not in annotations:
                        annotations[class_name] = []
                    annotations[class_name].append(bbox_info)
                
                except (ValueError, IndexError):
                    continue
        
        return annotations
    
    except Exception as e:
        print(f"Error parsing TXT file {file_path}: {e}")
        return {}


def find_class_names_file(directory: str) -> Optional[str]:
    """
    Find classes.txt or obj.names file in directory or parent directories.
    
    Args:
        directory: Starting directory path
        
    Returns:
        Path to class names file if found, None otherwise
    """
    dir_path = Path(directory)
    
    # Common class file names
    class_file_names = ['classes.txt', 'obj.names', 'class.names', 'labels.txt']
    
    # Search in current directory and up to 3 parent directories
    for _ in range(4):
        for class_file_name in class_file_names:
            class_file = dir_path / class_file_name
            if class_file.exists():
                return str(class_file)
        
        # Move to parent directory
        parent = dir_path.parent
        if parent == dir_path:  # Reached root
            break
        dir_path = parent
    
    return None


def load_class_names(class_file_path: str) -> List[str]:
    """
    Load class names from file.
    
    Args:
        class_file_path: Path to class names file
        
    Returns:
        List of class names
    """
    try:
        with open(class_file_path, 'r', encoding='utf-8') as f:
            class_names = [line.strip() for line in f.readlines() if line.strip()]
        return class_names
    except Exception as e:
        print(f"Error loading class names from {class_file_path}: {e}")
        return []


def is_txt_file(file_path: str) -> bool:
    """Check if file is a TXT file."""
    return Path(file_path).suffix.lower() == '.txt'
