"""
Dataset Finder - Flask Application
A lightweight dataset management tool for deep learning engineers.
"""

from flask import Flask, render_template, request, jsonify, send_file
import os
from pathlib import Path
from datetime import datetime
import argparse

from analyzer import analyze_dataset
from exporter import export_to_excel

app = Flask(__name__, static_folder='static', template_folder='static')

import platform

# Create exports directory
EXPORTS_DIR = Path('exports')
EXPORTS_DIR.mkdir(exist_ok=True)


@app.route('/')
def index():
    """Serve the main application page."""
    return render_template('index.html')


@app.route('/api/list_dirs', methods=['POST'])
def list_dirs():
    """
    List subdirectories for a given path.
    
    Expected JSON payload:
    {
        "path": "/optional/path"
    }
    
    Returns:
        JSON with current_path, parent_path, and directories list
    """
    try:
        data = request.get_json() or {}
        current_path_str = data.get('path')
        
        # Default to home directory or current directory if no path provided
        if not current_path_str:
            current_path = Path.home()
        else:
            current_path = Path(current_path_str)
            
        if not current_path.exists():
             current_path = Path.home()
        
        # Resolve to absolute
        current_path = current_path.resolve()
        
        # Get parent
        parent = current_path.parent
        
        # List directories
        directories = []
        try:
            for item in current_path.iterdir():
                if item.is_dir() and not item.name.startswith('.'):
                    directories.append({
                        'name': item.name,
                        'path': str(item),
                        'is_accessible': True # Simplified permission check
                    })
        except PermissionError:
            return jsonify({'error': 'Permission denied'}), 403
            
        # Sort directories by name
        directories.sort(key=lambda x: x['name'].lower())
        
        return jsonify({
            'success': True,
            'current_path': str(current_path),
            'parent_path': str(parent) if parent != current_path else None,
            'directories': directories,
            'sep': os.sep,
            'is_windows': platform.system() == 'Windows'
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Analyze a dataset directory.
    
    Expected JSON payload:
    {
        "path": "/path/to/dataset"
    }
    
    Returns:
        JSON with analysis results
    """
    try:
        data = request.get_json()
        dataset_path = data.get('path')
        
        if not dataset_path:
            return jsonify({'error': 'No path provided'}), 400
        
        if not os.path.exists(dataset_path):
            return jsonify({'error': 'Path does not exist'}), 400
        
        if not os.path.isdir(dataset_path):
            return jsonify({'error': 'Path is not a directory'}), 400
        
        # Analyze dataset
        results = analyze_dataset(dataset_path)
        
        return jsonify({
            'success': True,
            'data': results
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/export', methods=['POST'])
def export():
    """
    Export analysis results to Excel.
    
    Expected JSON payload:
    {
        "results": {...},  # Analysis results
        "filename": "optional_custom_name"
    }
    
    Returns:
        Excel file download
    """
    try:
        data = request.get_json()
        results = data.get('results')
        custom_filename = data.get('filename', '')
        
        if not results:
            return jsonify({'error': 'No results provided'}), 400
        
        # Generate filename
        if custom_filename:
            filename = f"{custom_filename}.xlsx"
        else:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"dataset_analysis_{timestamp}.xlsx"
        
        output_path = EXPORTS_DIR / filename
        
        # Export to Excel
        export_to_excel(results, str(output_path))
        
        # Send file
        return send_file(
            output_path,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0'
    })


def get_local_ip():
    """Get local IP address for LAN access."""
    import socket
    try:
        # Create a socket to get the local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "localhost"


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Dataset Finder - Dataset Management Tool')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0 for LAN access)')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind to (default: 5000)')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    # Display startup information
    local_ip = get_local_ip()
    print("\n" + "="*60)
    print("  Dataset Finder - Dataset Management Tool")
    print("="*60)
    print(f"\n  🌐 Local access:    http://localhost:{args.port}")
    print(f"  🌐 LAN access:      http://{local_ip}:{args.port}")
    print(f"\n  📁 Supported formats: YOLO, COCO, Pascal VOC")
    print(f"  🔒 Privacy: All processing is local")
    print("\n" + "="*60 + "\n")
    
    app.run(
        host=args.host,
        port=args.port,
        debug=args.debug
    )
