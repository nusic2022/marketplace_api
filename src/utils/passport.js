// import models from '../models'
import { connection } from './connection';
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
// const mongoose = require('mongoose');

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

module.exports = passport => {
	passport.use(
		new JwtStrategy(opts, (jwt_payload, done) => {
			connection.query(`select * from user where id = '${jwt_payload.id}' limit 1`, (err, results) => {
				if(err) return done(null, false);
				else if (results !== undefined && results.length > 0) return done(null, results[0]);
				else return done(null, false);				
			})
		}
	));
};