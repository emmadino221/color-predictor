
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/database.db');

db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS draws`);
  
    db.run(`CREATE TABLE draws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      red INTEGER NOT NULL,
      blue INTEGER NOT NULL,
      green INTEGER NOT NULL
    )`);
  });
  
  

module.exports = db;
  

const express = require('express');
const bodyParser = require('body-parser');
// const db = require('./db/database');




const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  db.all('SELECT * FROM draws', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error occurred while fetching data.');
    } else {
      res.render('index', { draws: rows });
    }
  });
});

app.post('/submit', (req, res) => {
    const { red, blue, green } = req.body;
    
    console.log(`Received values - Red: ${red}, Blue: ${blue}, Green: ${green}`);
  
    db.run('INSERT INTO draws (red, blue, green) VALUES (?, ?, ?)', [red, blue, green], (err) => {
      if (err) {
        console.error('Error inserting data into database:', err.message);
        res.status(500).send('Error occurred while submitting data.');
      } else {
        res.redirect('/');
      }
    });
  });
  
  app.post('/predict', (req, res) => {
    db.all('SELECT * FROM draws', (err, rows) => {
      if (err) {
        console.error('Error occurred while predicting:', err.message);
        res.status(500).send('Error occurred while predicting.');
      } else {
        // Check if there are enough rows in the database
        if (rows.length < 3) {  // Minimum 3 draws required
          return res.render('index', {
            draws: rows,
            prediction: 'Not enough data to make a prediction. Please input at least 3 draws.'
          });
        }
  
        // Calculate the total counts for each color
        let totalRed = 0;
        let totalBlue = 0;
        let totalGreen = 0;
        let totalDraws = rows.length;
  
        rows.forEach(row => {
          totalRed += row.red;
          totalBlue += row.blue;
          totalGreen += row.green;
        });
  
        // Calculate the average for each color
        let averageRed = totalRed / totalDraws;
        let averageBlue = totalBlue / totalDraws;
        let averageGreen = totalGreen / totalDraws;
  
        console.log(`Averages - Red: ${averageRed}, Blue: ${averageBlue}, Green: ${averageGreen}`);
  
        // Initialize prediction variables
        let predictedColor = null;
        let highestAverage = 2; // Start with the threshold of 2
  
        // Determine the color most likely to appear more than 2 times
        if (averageRed > highestAverage && averageRed > averageBlue && averageRed > averageGreen) {
          predictedColor = 'red';
          highestAverage = averageRed;
        }
        if (averageBlue > highestAverage && averageBlue > averageRed && averageBlue > averageGreen) {
          predictedColor = 'blue';
          highestAverage = averageBlue;
        }
        if (averageGreen > highestAverage && averageGreen > averageRed && averageGreen > averageBlue) {
          predictedColor = 'green';
          highestAverage = averageGreen;
        }
  
        console.log(`Predicted Color: ${predictedColor}`);
  
        // Render the prediction result
        res.render('index', {
          draws: rows,
          prediction: predictedColor ? `The color predicted to show up more than 2 times is ${predictedColor}.` : 'No color is predicted to show up more than 2 times.'
        });
      }
    });
  });
  
  
  
  
  

app.post('/clear', (req, res) => {
  db.run('DELETE FROM draws', (err) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Error occurred while clearing data.');
    } else {
      res.redirect('/');
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
