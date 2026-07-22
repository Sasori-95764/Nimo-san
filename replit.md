# Goat Bot V2 — Chatbot Messenger

A Facebook Messenger chatbot using an unofficial Facebook Chat API. Built with Node.js 18.x.

## Project overview

- **Entry point**: `index.js`
- **Main bot logic**: `bot/` directory
- **Web dashboard**: `dashboard/` (runs on port 3001)
- **Commands**: `scripts/cmds/`
- **Events**: `scripts/events/`
- **Languages**: `languages/`
- **Database**: SQLite by default (configurable to MongoDB)

## Stack

- Node.js 18.x
- Express.js (dashboard)
- Socket.io
- Sequelize + SQLite (or MongoDB)
- Passport.js (dashboard auth)

## Running the bot

```
npm start
```

The dashboard will be accessible on port 3001.

## Configuration

- Copy `config.dev.json` to `config.json` and fill in your credentials.
- Copy `account.dev.txt` to `account.txt` and paste your Facebook cookie JSON.

## Language files

Language files live in `languages/`. Currently supported:

| Code | Language |
|------|----------|
| `en` | English |
| `vi` | Vietnamese |
| `ar` | Arabic |

To switch language, set `"language": "ar"` (or `"en"`, `"vi"`) in `config.json`.

Each language has three files:
- `languages/<code>.lang` — system messages
- `languages/cmds/<code>.js` — command descriptions and responses
- `languages/events/<code>.js` — event messages

## User preferences

- Translate only language/text strings files; never touch core system, configuration, or functional code files.
