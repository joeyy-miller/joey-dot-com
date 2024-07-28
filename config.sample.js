// config.sample.js

module.exports = {
    openWeatherMapApiKey: 'your_openweathermap_api_key_here', // needed for fetching weather data
    databaseConfig: { // needed for connecting to the database
        host: 'localhost',
        user: 'your_database_user',
        password: 'your_database_password',
        database: 'your_database_name',
    },
    jwtSecret: 'your_jwt_secret_here', // needed for password hasing
    emailConfig: { // not needed. not used in current iteration
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'your_email@example.com',
          pass: 'your_email_password'
        }
      }
};