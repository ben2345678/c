const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directories exist
['uploads/oiseaux', 'uploads/elevage'].forEach(dir => {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/oiseaux', require('./routes/oiseaux'));
app.use('/api/nichees', require('./routes/nichees'));
app.use('/api/elevage', require('./routes/elevage'));
app.use('/api/pedigree', require('./routes/pedigree'));
app.use('/api/backup', require('./routes/backup'));

// Fallback → SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log('\n🐦 BudgiBook Local démarré !');
  console.log(`   → http://localhost:${PORT}\n`);
});
