# Joey.com

## Description
Joey.com is a fun, Joey-themed web application featuring weather information, user authentication, and a real-time chat system.

## Features
- User registration and authentication
- Weather information lookup
- Joey-themed chat room
- Responsive design

## Installation
1. Clone the repository
2. Run `npm install` to install dependencies
3. Set up your MySQL database
4. Configure environment variables
5. Run `npm start` to start the server
6. Create this MySQL table:
`CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`

## Technologies Used
- Node.js
- Express.js
- MySQL
- Socket.IO
- EJS templating

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)