const express = require('express');
const mysql = require('mysql2/promise');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// Import the configuration
const config = require('./config');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.cookies.jwt;
    console.log('JWT Token:', token);
    if (!token) {
        console.log('No token found, redirecting to login');
        return res.redirect('/login');
    }

    jwt.verify(token, config.jwtSecret, (err, user) => {
        if (err) {
        console.error('JWT verification failed:', err);
        res.clearCookie('jwt');
        return res.redirect('/login');
        }
        console.log('User authenticated:', user);
        req.user = user;
        next();
    });
};

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');

// Database connection
const pool = mysql.createPool(config.database);

app.get('/', (req, res) => {
    res.render('index', { title: 'Welcome to WeatherApp', user: res.locals.user });
});
  
// Weather route
app.get('/weather', async (req, res) => {
    const city = req.query.city;
    const apiKey = config.openWeatherMapApiKey;
    
    if (!city) {
      return res.render('weather-form', { title: 'Weather', user: req.user });
    }
    
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: city,
          appid: apiKey,
          units: 'metric'
        }
      });
      const weatherData = response.data;
      res.render('weather', { title: 'Weather Results', user: req.user, weatherData, city });
    } catch (error) {
      console.error('OpenWeatherMap API Error:', error.response ? error.response.data : error.message);
      if (error.response && error.response.status === 401) {
        res.status(500).render('weather-error', { 
          title: 'Weather Error', 
          user: req.user, 
          message: 'Error: Invalid API key. Please check your OpenWeatherMap API key.', 
          city 
        });
      } else if (error.response && error.response.status === 404) {
        res.status(404).render('weather-error', { 
          title: 'City Not Found', 
          user: req.user, 
          message: 'City not found', 
          city 
        });
      } else {
        res.status(500).render('weather-error', { 
          title: 'Weather Error', 
          user: req.user, 
          message: 'Error fetching weather data', 
          city 
        });
      }
    }
});


// Middleware to check if the user is logged in
const checkUser = async (req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
      try {
        const decodedToken = jwt.verify(token, config.jwtSecret);
        res.locals.user = { id: decodedToken.id, username: decodedToken.username };
      } catch (error) {
        console.error('JWT verification failed:', error);
        res.locals.user = null;
      }
    } else {
      res.locals.user = null;
    }
    next();
  };
  
  // Use this middleware for all routes
  app.use(checkUser);


app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await promisePool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '1h' });  // Use the JWT secret from config
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error logging in' });
  }
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'Login', error: null });
});

app.post('/login', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [req.body.username]);
      if (rows.length === 0) {
        return res.render('login', { title: 'Login', error: 'Invalid username or password' });
      }
      const user = rows[0];
      const passwordMatch = await bcrypt.compare(req.body.password, user.password);
      if (passwordMatch) {
        const token = jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, { expiresIn: '1h' });
        res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 }); // 1 hour
        return res.redirect('/');
      } else {
        return res.render('login', { title: 'Login', error: 'Invalid username or password' });
      }
    } catch (error) {
      console.error(error);
      res.render('login', { title: 'Login', error: 'An error occurred during login' });
    }
});
  
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});
  
  app.post('/register', async (req, res) => {
    try {
      const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [req.body.username]);
      
      if (existingUsers.length > 0) {
        return res.render('register', { title: 'Register', error: 'Username already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      console.log('Hashed password:', hashedPassword); // Log the hashed password
  
      await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [req.body.username, hashedPassword]);
      
      res.redirect('/login');
    } catch (error) {
      console.error(error);
      res.render('register', { title: 'Register', error: 'An error occurred during registration' });
    }
});
  
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password', { title: 'Forgot Password' });
});

app.get('/joey-chat', authenticateToken, (req, res) => {
    res.render('joey-chat', { title: 'Joey Chat', user: req.user });
  });
  
app.post('/forgot-password', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [req.body.username]);
      if (rows.length === 0) {
        return res.render('forgot-password', { title: 'Forgot Password', error: 'User not found' });
      }
      const user = rows[0];
      const token = jwt.sign({ id: user.id }, config.jwtSecret, { expiresIn: '1h' });
      
      // Send password reset email
      const transporter = nodemailer.createTransport(config.emailConfig);
      await transporter.sendMail({
        from: config.emailConfig.auth.user,
        to: user.username,
        subject: 'Password Reset',
        text: `To reset your password, click on this link: http://localhost:3000/reset-password/${token}`
      });
  
      res.render('forgot-password', { title: 'Forgot Password', message: 'Password reset link sent to your email' });
    } catch (error) {
      console.error(error);
      res.render('forgot-password', { title: 'Forgot Password', error: 'An error occurred' });
    }
});
  
app.get('/reset-password/:token', (req, res) => {
    res.render('reset-password', { title: 'Reset Password', token: req.params.token });
});
  
app.post('/reset-password/:token', async (req, res) => {
    try {
      const { id } = jwt.verify(req.params.token, config.jwtSecret);
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
      res.redirect('/login');
    } catch (error) {
      console.error(error);
      res.render('reset-password', { title: 'Reset Password', token: req.params.token, error: 'Invalid or expired token' });
    }
});

// 404 handler
app.use((req, res, next) => {
    res.status(404).render('404', { title: '404 - Page Not Found', user: req.user });
  });
  
app.get('/logout', (req, res) => {
    res.clearCookie('jwt');
    res.locals.user = null;
    res.redirect('/login');
});



// OLD ROUTES
// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', userId: req.user.userId });
});

// Route to get all items
app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT * FROM items');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching items' });
    }
});

// Route to add a new item
app.post('/api/items', async (req, res) => {
    try {
        const { name, description } = req.body;
        const [result] = await promisePool.query(
            'INSERT INTO items (name, description) VALUES (?, ?)',
            [name, description]
        );
        res.status(201).json({ id: result.insertId, name, description });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error adding item' });
    }
});

app.get('/old', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'item.html'));
});

// END OLD ROUTES

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected');
  
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });