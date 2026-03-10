const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Ensure data files exist
const configPath = path.join(DATA_DIR, 'config.json');
const newsPath = path.join(DATA_DIR, 'news.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(configPath)) fs.writeFileSync(configPath, JSON.stringify({}));
if (!fs.existsSync(newsPath)) fs.writeFileSync(newsPath, JSON.stringify([]));

app.get('/api/config', (req, res) => {
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.status(500).json({ error: 'Failed to read config' });
    }
});

app.post('/api/config', (req, res) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save config' });
    }
});

app.get('/api/news', (req, res) => {
    try {
        const data = fs.readFileSync(newsPath, 'utf8');
        res.json(JSON.parse(data));
    } catch (e) {
        res.status(500).json({ error: 'Failed to read news' });
    }
});

app.post('/api/news', (req, res) => {
    try {
        fs.writeFileSync(newsPath, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to save news' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arena Manager API running on http://0.0.0.0:${PORT}`);
});
