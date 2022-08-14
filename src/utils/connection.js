const mysql = require('mysql2');

export let connection;

export const setConnection = () => {
	connection = mysql.createConnection({
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE
	});
	connection.connect(function(err) {
		if (err) {
		  console.error('error connecting: ', err);
		  return;
		}
	});
}


