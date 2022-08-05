import { Router } from 'express'
import { connection } from '../utils/connection';
import passport from 'passport'

var router = Router();
// Used to perfrom signature authentication
var ethUtil = require('ethereumjs-util');

// JWT generation and verification
const jwt = require('jsonwebtoken');

/**
 * @method GET
 * @route GET api/wallet/:chainId/:address/status
 * @desc Check if user exists
 * @access Public
 * @param chainId
 * @param nftAddress
*/
router.get('/:chainId/:address/status', (req, res) => {
	connection.query(`SELECT * from user where chainId = ${req.params.chainId} and address = '${req.params.address.toLowerCase()}' limit 1`, (err, results, fields) => {
		if(results === undefined || results.length === 0) {
			return res.status(200).json({
				msg: "address is not found.",
				chainId: req.params.chainId,
				address: req.params.address,
				success: false
			});
		} else {
			res.status(200).json({
				success: true,
				chainId: req.params.chainId,
				address: req.params.address,
				nonce: results[0].nonce
			})
		}
	})
});

/**
 * @method GET
 * @route GET api/wallet/:chainId/:address/nonce
 * @desc Get user nonce for registered user, or register new user if not registered
 * @access Public
 * @param chainId
 * @param nftAddress
*/
router.get('/:chainId/:address/nonce', (req, res) => {
	const sql = `SELECT * from user where chainId = ${req.params.chainId} and address = '${req.params.address.toLowerCase()}' limit 1`;
	connection.query(sql, async (err, results, fields) => {
		if (results === undefined || results.length === 0) 
			await connection.execute(`INSERT INTO user (chainId, address) values(${req.params.chainId}, '${req.params.address.toLowerCase()}')`);
		const nonce = Math.floor(Math.random() * 1000000);
		await connection.execute(`UPDATE user set nonce = ${nonce} where chainId = ${req.params.chainId} and address = '${req.params.address.toLowerCase()}'`);

		res.status(200).json({
			success: true,
			nonce,
			chainId: req.params.chainId,
			address: req.params.address,
			msg: "You have got a random nonce"
		})
	})
});

/**
 * @method POST
 * @route POST api/wallet/:chainId/:address/signature
 * @desc Process signed message
 * @access Public
 * @params chainId
 * @params address user's address of ethereum blockchain
 * @params signature signature of nonce by metamask
*/
router.post('/:chainId/:address/signature', (req, res) => {
	// Get user from db
	const sql = `SELECT * from user where chainId = ${req.params.chainId} and address = '${req.params.address.toLowerCase()}' limit 1`;
	connection.query(sql, (err, results, fields) => {
		if (results !== undefined || results.length > 0) {
			const user = results[0];
			const msg = `Nonce: ${user.nonce}`;
			// Convert msg to hex string
			const msgHex = ethUtil.bufferToHex(Buffer.from(msg));
			
			// Check if signature is valid
			const msgBuffer = ethUtil.toBuffer(msgHex);
			const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
			const signatureBuffer = ethUtil.toBuffer(req.body.signature);
			const signatureParams = ethUtil.fromRpcSig(signatureBuffer);
			const publicKey = ethUtil.ecrecover(
				msgHash,
				signatureParams.v,
				signatureParams.r,
				signatureParams.s
			);
			const addresBuffer = ethUtil.publicToAddress(publicKey);
			const address = ethUtil.bufferToHex(addresBuffer);
			
			// Check if address matches
			if (address.toLowerCase() === req.params.address.toLowerCase()) {
				// Change user nonce
				// Set jwt token
				const payload = {
					id: user.id,
					address: user.address
				};
				jwt.sign(payload, process.env.JWT_SECRET, {
					expiresIn: 21600
				}, (err, token) => {
					if(err) console.log(err);
					else res.status(200).json({
						success: true,
						token: `Bearer ${token}`,
						user: user,
						msg: "You are now logged in."
					});	
				})
			} else {
				// User is not authenticated
				res.status(200).send({
					success: false,
					msg: 'Invalid credentials'
				});
			}
		} else {
			res.status(200).send({
				success: false,
				msg: 'User does not exist'
			});
		}
	})
});

/**
 * @method POST
 * @route POST api/wallet/profile
 * @desc Return the registered user's profile by Bearer token
 * @access Private
 * @auth JWT
*/
router.get('/profile/', passport.authenticate('jwt', {
	session: false
}), (req, res) => {
	return res.json({
		success: true,
		user: req.user
	});
});

/**
 * @method POST
 * @route POST api/wallet/update_avatar
 * @desc Update user avatar
 * @access Private
 * @auth JWT
 * @param chainId
 * @param url avatar's url
 */
router.post('/update_avatar', passport.authenticate('jwt', {session: false}), (req, res) => {
	const url = req.body.url;
	const chainId = req.body.chainId;
	const sql = `Update user set avatar = '${url}' where chainId = ${chainId} and address = '${req.user.address.toLowerCase()}'`;
	connection.execute(sql, (err, results, fields) => res.json({
		success: true,
		msg: 'Avatar updated'
	}))
});

/**
 * @method POST
 * @route POST api/wallet/update_profile
 * @desc Update user profile
 * @access Private
 * @auth JWT
 * @param chainId
 * @param name
 * @param email
 * @param twitter
 * @param facebook
 * @param wechat
 * @param ins
 */
router.post('/update_profile', passport.authenticate('jwt', {session: false}), (req, res) => {
	const chainId = req.body.chainId;
	const sql = `Update user set name = '${req.body.name}', email = '${req.body.email}', twitter = '${req.body.twitter}', facebook = '${req.body.facebook}', wechat = '${req.body.wechat}', ins = '${req.body.ins}' where chainId = '${chainId}' and address = '${req.user.address.toLowerCase()}'`;
	connection.execute(sql, (err, results, fields) => res.json({
		success: true,
		msg: 'Profile updated'
	}))
})

module.exports = router;