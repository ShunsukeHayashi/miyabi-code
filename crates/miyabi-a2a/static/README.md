# Miyabi A2A - Live API Testing Interface

Interactive web UI for testing the Miyabi A2A REST API (Agent-to-Agent Protocol v0.3.0).

## Features

### 📨 Messages Tab
- Send messages to create tasks
- Specify role (user/agent/system)
- Add context IDs for task grouping
- Real-time response display

### 📋 Tasks Tab
- List all tasks with status filtering
- View detailed task information
- Cancel running tasks
- Real-time task status updates
- Filter by status: submitted, working, completed, failed, cancelled

### 🤖 Agent Cards Tab
- Browse available agents
- View agent capabilities and skills
- Inspect Agent Card JSON
- Discover agents from `.well-known/` directory

## Quick Start

### 1. Start the Server

```bash
cd crates/miyabi-a2a
cargo run --example ui_server
```

### 2. Open the UI

Navigate to: http://localhost:8080/

### 3. Configure API Settings

- **API Base URL**: Default is `http://localhost:8080`
- **API Key**: Optional, for authenticated requests

Settings are saved in localStorage.

## API Endpoints

The UI interacts with these REST endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/message:send` | Send message and create task |
| GET | `/v1/tasks` | List tasks with filtering |
| GET | `/v1/tasks/{id}` | Get task details |
| POST | `/v1/tasks/{id}/cancel` | Cancel a task |
| GET | `/.well-known/agent-card-*.json` | Get Agent Card |

## Usage Examples

### Send a Message

1. Go to **Messages** tab
2. Select role: `user`
3. Enter content: `"Implement a new feature for user authentication"`
4. (Optional) Add context ID: `"ctx-123"`
5. Click **Send Message**
6. Task ID will be displayed, and you'll be redirected to Tasks tab

### View Tasks

1. Go to **Tasks** tab
2. (Optional) Filter by status using the dropdown
3. Click **Refresh** to reload tasks
4. Click on any task card to view details

### Cancel a Task

1. Go to **Tasks** tab
2. Click on a task to view details
3. Click **Cancel Task** button
4. Confirm cancellation

### Browse Agent Cards

1. Go to **Agent Cards** tab
2. Click **Refresh** to load available agents
3. View agent metadata, skills, and capabilities
4. Click **View JSON** to inspect the full Agent Card

## Known Agents

The UI attempts to load Agent Cards for these agents:

**Coding Agents**:
- `coordinator-agent` - Task decomposition and DAG scheduling
- `codegen-agent` - Code generation with Claude Sonnet 4
- `review-agent` - Code quality review and scoring
- `issue-agent` - Issue analysis and labeling
- `pr-agent` - Pull Request creation
- `deployment-agent` - CI/CD deployment automation

**Business Agents**:
- `ai-entrepreneur-agent` - Business planning and strategy

## Technical Details

### Stack
- **Frontend**: Vanilla JavaScript (ES6+)
- **UI**: CSS Grid + Flexbox
- **API**: Fetch API with async/await
- **Storage**: localStorage for settings

### Browser Support
- Modern browsers with ES6+ support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Security
- API keys are stored in localStorage (client-side only)
- CORS enabled for development
- No sensitive data in URL parameters

## Customization

### Change API URL

Update the API URL in the settings panel at the top of the page.

### Add Custom Agent Types

Edit `index.html` line ~900 to add new agent types to the `knownAgents` array:

```javascript
const knownAgents = [
    'coordinator-agent',
    'codegen-agent',
    // Add your custom agents here
    'my-custom-agent',
];
```

## Troubleshooting

### "No agent cards found"

- Ensure Agent Cards are generated: `cargo run --bin agent_card_gen`
- Check `agent-cards/` directory exists
- Verify server config: `agent_cards_dir` is set

### "Failed to connect to API"

- Verify server is running: `cargo run --example ui_server`
- Check API URL in settings matches server address
- Check browser console for CORS errors

### Tasks not updating

- Click **Refresh** button to reload
- Check browser console for errors
- Verify server is responding to `/v1/tasks`

## Development

### File Structure

```
static/
├── index.html    # Main UI (single-file app)
└── README.md     # This file
```

### Modify the UI

Edit `index.html` directly. The file contains:
- HTML structure
- CSS styles (embedded in `<style>` tag)
- JavaScript logic (embedded in `<script>` tag)

### Add New Features

1. Add HTML elements in the appropriate tab
2. Add CSS styles in the `<style>` section
3. Add JavaScript logic in the `<script>` section
4. Test locally before committing

## License

MIT License - See project root for details

## Links

- **Miyabi Repository**: https://github.com/ShunsukeHayashi/Miyabi
- **A2A Protocol Spec**: `crates/miyabi-a2a/openapi.yaml`
- **Agent Card Spec**: A2A Protocol v0.3.0
