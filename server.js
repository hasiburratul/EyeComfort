const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let originalHtml = '';  // Store the original HTML

app.get('/fetch-website', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const response = await axios.get(url);
        originalHtml = response.data;  // Store the original HTML

        // Parse the HTML
        const $ = cheerio.load(originalHtml);

        // Remove scripts for safety
        $('script').remove();

        // Convert relative URLs to absolute
        $('a, img, link').each((i, elem) => {
            const attr = $(elem).attr('href') ? 'href' : 'src';
            const attrValue = $(elem).attr(attr);
            if (attrValue && !attrValue.startsWith('http')) {
                $(elem).attr(attr, new URL(attrValue, url).href);
            }
        });

        // Send the modified HTML
        res.send($.html());
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to fetch and process the website' });
    }
});

app.get('/reset', (req, res) => {
    if (originalHtml) {
        res.send(originalHtml);
    } else {
        res.status(400).json({ error: 'No website has been loaded yet' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});