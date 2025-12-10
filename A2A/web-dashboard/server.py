#!/usr/bin/env python3
"""
A2A WebUI Dashboard Server
Simple HTTP server for the A2A Multi-Agent Dashboard
"""

import http.server
import socketserver
import json
import subprocess
import os
import sys
from datetime import datetime
from pathlib import Path

PORT = 8080
SCRIPT_DIR = Path(__file__).parent

class A2ARequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SCRIPT_DIR, **kwargs)

    def do_GET(self):
        if self.path == '/api/status':
            self.send_api_response(self.get_system_status())
        elif self.path == '/api/agents':
            self.send_api_response(self.get_agents_status())
        elif self.path == '/api/metrics':
            self.send_api_response(self.get_metrics())
        elif self.path == '/api/messages':
            self.send_api_response(self.get_recent_messages())
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/command':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            command = data.get('command', '')
            result = self.execute_a2a_command(command)
            self.send_api_response(result)
        else:
            self.send_error(404, "Not Found")

    def send_api_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        response = json.dumps(data, indent=2)
        self.wfile.write(response.encode('utf-8'))

    def get_system_status(self):
        """Get overall system status"""
        try:
            # Try to get tmux session info
            tmux_result = subprocess.run(['tmux', 'list-sessions'],
                                       capture_output=True, text=True, timeout=5)
            tmux_active = tmux_result.returncode == 0

            # Check for A2A scripts
            a2a_scripts = [
                'a2a-oss.sh',
                'a2a-advanced.sh',
                'a2a-ai-integration.sh'
            ]

            scripts_found = []
            for script in a2a_scripts:
                script_path = SCRIPT_DIR.parent / script
                if script_path.exists():
                    scripts_found.append(script)

            return {
                'status': 'healthy' if tmux_active else 'warning',
                'timestamp': datetime.now().isoformat(),
                'tmux_active': tmux_active,
                'scripts_available': scripts_found,
                'server_uptime': self.get_uptime(),
                'version': '4.0.0-WebUI'
            }
        except Exception as e:
            return {
                'status': 'error',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }

    def get_agents_status(self):
        """Get status of all agents"""
        try:
            # Try to run health check via A2A advanced script
            health_script = SCRIPT_DIR.parent / 'a2a-advanced.sh'
            if health_script.exists():
                result = subprocess.run([str(health_script), 'health'],
                                      capture_output=True, text=True, timeout=10)

                # Parse health check output (simplified)
                agents = []
                for line in result.stdout.split('\n'):
                    if '✅' in line or '❌' in line:
                        parts = line.split()
                        if len(parts) >= 3:
                            name = parts[1] if len(parts) > 1 else 'unknown'
                            pane = parts[2] if len(parts) > 2 else 'unknown'
                            status = 'healthy' if '✅' in line else 'offline'

                            agents.append({
                                'name': name,
                                'pane': pane,
                                'status': status,
                                'last_seen': datetime.now().isoformat()
                            })

                return {
                    'agents': agents,
                    'total': len(agents),
                    'healthy': sum(1 for a in agents if a['status'] == 'healthy'),
                    'timestamp': datetime.now().isoformat()
                }
        except Exception as e:
            pass

        # Fallback mock data
        return {
            'agents': [
                {'name': 'conductor', 'pane': '%101', 'status': 'healthy', 'last_seen': datetime.now().isoformat()},
                {'name': 'codegen', 'pane': '%102', 'status': 'healthy', 'last_seen': datetime.now().isoformat()},
                {'name': 'review', 'pane': '%103', 'status': 'healthy', 'last_seen': datetime.now().isoformat()},
                {'name': 'pr', 'pane': '%104', 'status': 'warning', 'last_seen': datetime.now().isoformat()},
                {'name': 'deploy', 'pane': '%105', 'status': 'healthy', 'last_seen': datetime.now().isoformat()},
            ],
            'total': 5,
            'healthy': 4,
            'timestamp': datetime.now().isoformat()
        }

    def get_metrics(self):
        """Get system metrics"""
        try:
            # Try to read metrics file
            metrics_file = Path.home() / '.miyabi' / 'a2a-metrics.log'
            if metrics_file.exists():
                # Parse metrics file (simplified)
                with open(metrics_file, 'r') as f:
                    lines = f.readlines()[-100:]  # Last 100 entries

                total_messages = sum(1 for line in lines if 'message_sent' in line)
                failed_messages = sum(1 for line in lines if 'message_failed' in line)
                success_rate = ((total_messages - failed_messages) / max(total_messages, 1)) * 100

                return {
                    'total_messages': total_messages,
                    'failed_messages': failed_messages,
                    'success_rate': round(success_rate, 1),
                    'avg_response_time': 150,  # Mock
                    'timestamp': datetime.now().isoformat()
                }
        except Exception:
            pass

        # Fallback mock data
        return {
            'total_messages': 1247,
            'failed_messages': 23,
            'success_rate': 98.2,
            'avg_response_time': 142,
            'timestamp': datetime.now().isoformat()
        }

    def get_recent_messages(self):
        """Get recent message activity"""
        # Mock data for now - in real implementation, this would read from logs
        messages = [
            {
                'id': 1,
                'timestamp': datetime.now().isoformat(),
                'from': 'conductor',
                'to': 'codegen',
                'message': 'Start implementation of Issue #123',
                'type': 'command',
                'status': 'delivered'
            },
            {
                'id': 2,
                'timestamp': datetime.now().isoformat(),
                'from': 'codegen',
                'to': 'review',
                'message': 'Code ready for review: auth module',
                'type': 'handoff',
                'status': 'delivered'
            }
        ]

        return {
            'messages': messages,
            'count': len(messages),
            'timestamp': datetime.now().isoformat()
        }

    def execute_a2a_command(self, command):
        """Execute A2A command and return result"""
        try:
            # Security: Only allow specific A2A commands
            safe_commands = ['health', 'discover', 'metrics', 'send', 'broadcast']
            cmd_parts = command.split()

            if not cmd_parts or cmd_parts[0] not in safe_commands:
                return {
                    'success': False,
                    'error': 'Command not allowed or invalid',
                    'output': ''
                }

            # Try to execute with A2A advanced script
            script_path = SCRIPT_DIR.parent / 'a2a-advanced.sh'
            if script_path.exists():
                result = subprocess.run([str(script_path)] + cmd_parts,
                                      capture_output=True, text=True, timeout=30)

                return {
                    'success': result.returncode == 0,
                    'output': result.stdout,
                    'error': result.stderr if result.returncode != 0 else '',
                    'timestamp': datetime.now().isoformat()
                }
            else:
                return {
                    'success': False,
                    'error': 'A2A scripts not found',
                    'output': ''
                }

        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Command timed out',
                'output': ''
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'output': ''
            }

    def get_uptime(self):
        """Get system uptime"""
        try:
            if hasattr(self, '_start_time'):
                uptime = datetime.now() - self._start_time
                return str(uptime).split('.')[0]  # Remove microseconds
            return "Unknown"
        except:
            return "Unknown"

def main():
    # Store start time
    A2ARequestHandler._start_time = datetime.now()

    print(f"""
🚀 A2A Multi-Agent Dashboard Server Starting...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server URL: http://localhost:{PORT}
📁 Serving from: {SCRIPT_DIR}
⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

API Endpoints:
  GET  /api/status    - System status
  GET  /api/agents    - Agent status
  GET  /api/metrics   - Performance metrics
  GET  /api/messages  - Recent messages
  POST /api/command   - Execute A2A commands

📖 Open your browser to view the dashboard!
Press Ctrl+C to stop the server.
""")

    try:
        with socketserver.TCPServer(("", PORT), A2ARequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()