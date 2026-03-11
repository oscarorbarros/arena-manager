require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase. Read from environment variables.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

app.get('/api/config', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('config')
            .select('data')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Supabase error reading config:', error);
            // If table/row not found, return empty object
            return res.json({});
        }

        res.json(data ? data.data : {});
    } catch (e) {
        console.error('Failed to read config:', e);
        res.status(500).json({ error: 'Failed to read config' });
    }
});

app.post('/api/config', async (req, res) => {
    try {
        const { error } = await supabase
            .from('config')
            .upsert([{ id: 1, data: req.body }]);

        if (error) {
            console.error('Supabase error saving config:', error);
            return res.status(500).json({ error: 'Failed to save config' });
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Failed to save config:', e);
        res.status(500).json({ error: 'Failed to save config' });
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('news')
            .select('data')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Supabase error reading news:', error);
            // If table/row not found, return empty array
            return res.json([]);
        }

        res.json(data ? data.data : []);
    } catch (e) {
        console.error('Failed to read news:', e);
        res.status(500).json({ error: 'Failed to read news' });
    }
});

app.post('/api/news', async (req, res) => {
    try {
        const { error } = await supabase
            .from('news')
            .upsert([{ id: 1, data: req.body }]);

        if (error) {
            console.error('Supabase error saving news:', error);
            return res.status(500).json({ error: 'Failed to save news' });
        }

        res.json({ success: true });
    } catch (e) {
        console.error('Failed to save news:', e);
        res.status(500).json({ error: 'Failed to save news' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arena Manager API running on http://0.0.0.0:${PORT}`);
});
