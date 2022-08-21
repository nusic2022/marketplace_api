import { Router } from 'express';
import { connection } from '../utils/connection';
import passport from 'passport';

var router = Router();

// JWT generation and verification
const jwt = require('jsonwebtoken');

router.get('/', (req, res) => {
	const sql = `SELECT * FROM nfts`;
	connection.query(sql, (err, results, fields) => {
		console.log(results)
		if(results === undefined || results.length === 0) {
			return res.status(404).json({
				success: false,
				msg: "categories not found",
			});
		} else {
			res.status(200).json({
				success: true,
			})
		}
	})
});

router.get('/get_categories', (req, res) => {
	const sql = `SELECT * FROM category`;
	connection.query(sql, (err, results, fields) => {
		let arr = []
		console.log(results)
		for(let i=0;i<results.length; i++) {
			let _resultObj = [results[i]["id"], results[i]["name"]]
			arr = arr.concat([_resultObj])
		}
		if(results === undefined || results.length === 0) {
			return res.status(404).json({
				success: false,
				msg: "categories not found",
			});
		} else {
			res.status(200).json({
				result: arr
			})
		}
	})
});

router.post('/add_items', passport.authenticate('jwt', {session: false}), (req, res) => {
	const chainId = req.body.chainId;
	const nftAddress = req.body.nftAddress;
	const tokenId = req.body.tokenId;
	const tokenURI = req.body.tokenURI;
	const owner = req.user.address;// req.body.owner;
	const collectionId = req.body.collectionId;
	const categoryId = req.body.categoryId;
	// console.log(req.body)
	const sql = `
	INSERT INTO nfts 
	VALUES(default, ${chainId}, '${nftAddress.toLowerCase()}', ${tokenId}, '${tokenURI}', '${owner.toLowerCase()}', unix_timestamp(), ${collectionId}, ${categoryId}, 0, 0)
	`
	// console.log(sql)
	connection.execute(sql, (err, results, fields) => {
		if(results === undefined || results.length === 0) {
			return res.json({
				success: false,
			});
		} else {
			return res.json({
				success: true,
			})
		}
	})

})

/**
 * @method GET
 * @route GET api/items/count_comments_by_nft/:chainId/:nftAddress/:tokenId
 * @desc Get count for nft-tokenId
 * @access Public
 * @param chainId
 * @param nftAddress
 * @param tokenId
*/

router.get('/count_comments_by_nft/:chainId/:nftAddress/:tokenId', (req, res) => {
	const sql = `SELECT count(*) as num from comments where chainId = '${req.params.chainId}' and lower(nftAddress) = '${req.params.nftAddress.toLowerCase()}' and tokenId = ${req.params.tokenId} limit 1`;
	connection.query(sql, (err, results, fields) => {
		if(results === undefined || results.length === 0) {
			return res.status(200).json({
				success: false,
				msg: "address is not found.",
			});
		} else {
			return res.status(200).json({
				success: true,
				chainId: req.params.chainId,
				nftAddress: req.params.nftAddress,
				tokenId: req.params.tokenId,
				count: results[0].num
			})
		}
	})
});

/**
 * @method GET
 * @route GET api/items/get_comments_by_nft/:chainId/:nftAddress/:tokenId/:offset/:rows
 * @desc Get all comments for nft-tokenId
 * @access Public
 * @param chainId
 * @param nftAddress
 * @param tokenId
 * @param offset The first rows of query data from database 
 * @param rows rows of query
 */
router.get('/get_comments_by_nft/:chainId/:nftAddress/:tokenId/:offset/:rows', (req, res) => {
	const offset = req.params.offset;
	const rows = req.query.rows;
	const sql = `SELECT * FROM comments 
							 WHERE chainId = ${req.params.chainId} lower(nftAddress) = '${req.params.nftAddress.toLowerCase()}' 
							 and tokenId = ${req.params.tokenId}
							 ${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
	connection.query(sql, (err, results) => {
		if(results === undefined || results.length === 0) {
			return res.status(200).json({
				success: false,
				msg: "no comments",
			})
		} else {
			res.status(200).json({
				success: true,
				chainId: req.params.chainId,
				nftAddress: req.params.nftAddress,
				tokenId: req.params.tokenId,
				list: results,
			})
		}
	})
})

/**
 * @method POST
 * @route POST api/items/add_comment
 * @desc Add a new comment for nft-tokenId
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param tokenId
 * @param content
 */
router.post('/add_comment', passport.authenticate('jwt', {session: false}), (req, res) => {
	const chainId = req.body.chainId;
	const nftAddress = req.body.nftAddress;
	const tokenId = req.body.tokenId;
	const content = req.body.content;
	const sql = `INSERT INTO comments (chainId, nftAddress, tokenId, content, fromAddress, createAt) VALUES(${chainId}, '${nftAddress.toLowerCase()}', ${tokenId}, '${content}', '${req.user.address.toLowerCase()}', now())`;
	connection.execute(sql, (err, results, fields) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Add comment fail'
		}) 
		return res.status(200).json({
			success: true,
			chainId,
			nftAddress,
			tokenId,
			id: results.insertId,
			msg: 'Add comment successfully'
		})
	})
})

/**
 * @method POST
 * @route POST api/items/remove_comment
 * @desc Remove comment by comment Id
 * @access Private
 * @auth JWT
 * @param chainId
 * @param id comment Id
 */
router.post('/remove_comment', passport.authenticate('jwt', {session: false}), (req, res) => {
	const sql = `DELETE FROM comments where chainId = ${req.body.chainId} and lower(fromAddress) = '${req.user.address.toLowerCase()}' and id = '${req.body.id}'`;
	connection.execute(sql, (err, results, fields) => {
		if(err || results.affectedRows === 0) return res.status(200).json({
			success: false,
			msg: 'Remove comment fail',
		})
		return res.status(200).json({
			success: true,
			chainId: req.body.chainId,
			id: req.body.id,
			msg: 'Remove comment successfully'
		})
	})
})

/**
 * @method GET
 * @route GET api/items/count_favour_by_nft/:nftAddress/:tokenId
 * @desc Get total favour for nft-tokenId
 * @access Public
 * @param chainId
 * @param nftAddress
 * @param tokenId
 */
router.get('/count_favour_by_nft/:chainId/:nftAddress/:tokenId', (req, res) => {
	const sql = `SELECT count(*) as num from favour where chainId = ${req.params.chainId} and lower(nftAddress) = '${req.params.nftAddress.toLowerCase()}' and tokenId = ${req.params.tokenId}`;
	connection.query(sql, (err, results) => {
		if(results === undefined || results.length === 0) {
			return res.status(200).json({
				success: false,
				msg: "token is not found.",
			});
		} else {
			res.status(200).json({
				success: true,
				chainId: req.params.chainId,
				nftAddress: req.params.nftAddress,
				tokenId: req.params.tokenId,
				count: results[0].num
			})
		}
	})
})

router.post('/get_my_favours', passport.authenticate('jwt', {session: false}), (req, res) => {
	const chainId = req.body.chainId;
	const nftAddress = req.body.nftAddress;
	const sql = `select * from favour where chainId = ${chainId} and lower(nftAddress) = '${nftAddress}' 
							 and lower(fromAddress) = '${req.body.address.toLowerCase()}'`;
	console.log(sql);
	connection.query(sql, (err, results, fields) => {
		let tokenIds = [];
		for(let i = 0; i < results.length; i++) tokenIds.push(results[i].tokenId);
		return res.status(200).json({
			success: true,
			tokenIds
		})
	})
})

/**
 * @method POST
 * @route POST api/items/add_favour
 * @desc add favourite nft to my collection
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param tokenId
 */
router.post('/add_favour', passport.authenticate('jwt', {session: false}), (req, res) => {
	const chainId = req.body.chainId;
	const nftAddress = req.body.nftAddress;
	const tokenId = req.body.tokenId;
	const sql = `SELECT * from favour where chainId = ${chainId} and lower(nftAddress) = '${nftAddress.toLowerCase()}' and tokenId = ${tokenId} and lower(fromAddress) = '${req.user.address.toLowerCase()}' limit 1`;
	connection.query(sql, (err, results) => {
		if(results !== undefined && results.length === 1) return res.status(200).json({
			success: false,
			msg: 'This nft is in your favour list'
		})
		else {
			const sql = `INSERT INTO favour(chainId, nftAddress, tokenId, fromAddress) VALUES(${chainId}, '${nftAddress.toLowerCase()}', ${tokenId}, '${req.user.address.toLowerCase()}')`;
			connection.execute(sql, (err, results, fields) => {
				if(err) return res.status(200).json({
					success: false,
					msg: 'Add favour fail'
				}) 
				const sql = `update nfts set favour = favour + 1 where chainId = ${chainId} and lower(nftAddress) = '${nftAddress.toLowerCase()}' and tokenId = ${tokenId}`;
				// console.log(sql);
				connection.execute(sql, (err, results, fields) => {
					if(err) return res.status(200).json({
						success: false,
						msg: 'Add like fail'
					})
					return res.status(200).json({
						success: true,
						chainId, nftAddress, tokenId,
						id: results.insertId,
						msg: 'Add favour successfully'
					})
				})
			})		
		}
	})
})

/**
 * @method POST
 * @route POST api/items/remove_favour
 * @desc Remove favourite nft from my collection
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param tokenId
 */
router.post('/remove_favour', passport.authenticate('jwt', {session: false}), (req, res) => {
	const chainId = req.body.chainId;
	const nftAddress = req.body.nftAddress;
	const tokenId = req.body.tokenId;
	const sql = `SELECT * from favour where chainId = ${chainId} and nftAddress = '${nftAddress.toLowerCase()}' and tokenId = ${tokenId} and lower(fromAddress) = '${req.user.address.toLowerCase()}' limit 1`;
	connection.query(sql, (err, results) => {
		if(results !== undefined && results.length === 0) return res.status(200).json({
			success: false,
			msg: 'This nft is not in your favour list'
		})
		else {
			const sql = `DELETE FROM favour where chainId = ${chainId} and  lower(nftAddress) = '${nftAddress.toLowerCase()}' and tokenId = ${tokenId} and lower(fromAddress) = '${req.user.address.toLowerCase()}'`;
			connection.execute(sql, (err, results, fields) => {
				if(err) return res.status(200).json({
					success: false,
					msg: 'Remove favour fail'
				}) 
				const sql = `update nfts set favour = favour - 1 where favour > 0 and chainId = ${chainId} and lower(nftAddress) = '${nftAddress.toLowerCase()}' and tokenId = ${tokenId}`;
				connection.query(sql, (err, results, fields) => {
					if(err) return res.status(200).json({
						success: false,
						msg: 'Remove like fail'
					})
					return res.status(200).json({
						success: true,
						chainId, nftAddress, tokenId,
						msg: 'Remove favour successfully'
					})
				})
			})
		}
	})
})

/**
 * @method POST
 * @route POST api/items/set_like
 * @desc add like to nft-tokenId
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param tokenId
 * @param action "add" - like, "del" - unlike
 */
//  router.post('/set_like', passport.authenticate('jwt', {session: false}), (req, res) => {
// 	const chainId = req.body.chainId;
// 	const nftAddress = req.body.nftAddress;
// 	const tokenId = req.body.tokenId;
// 	const action = req.body.action;
// 	const sql = `SELECT * from nfts where chainId = ${chainId} and lower(nftAddress) = '${nftAddress.toLowerCase()}' and tokenId = ${tokenId} limit 1`;
// 	connection.query(sql, (err, results) => {
// 		if(results === undefined || results.length === 0) return res.status(200).json({
// 			success: false,
// 			msg: 'NFT is not exist'
// 		})
// 		else {
// 			let sql = '';
// 			if(action === 'add') sql = `Update nfts set like = like + 1 where chainId = ${chainId} and lower(nftAddress) = '${nftAddress.toLowerCase()}' and tokenId = ${tokenId}`;
// 			else if(action === 'del') sql = `Update nfts set like = like - 1 where chainId = ${chainId} and lower(nftAddress) = '${nftAddress.toLowerCase()}' and tokenId = ${tokenId} and like > 0`;
// 			connection.execute(sql, (err, results, fields) => {
// 				if(err) return res.status(200).json({
// 					success: false,
// 					msg: 'Update like fail'
// 				}) 
// 				return res.status(200).json({
// 					success: true,
// 					chainId, 
// 					nftAddress, 
// 					tokenId, action,
// 					msg: 'Update like successfully'
// 				})
// 			})		
// 		}
// 	})
// })

/**
 * @method GET
 * @route GET api/items/get_my_all_nfts/:chainId/:nftAddress
 * @desc get all of my nft for nft contract
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param offset
 * @param rows
 */
router.get('/get_my_all_nfts/:chainId/:nftAddress', passport.authenticate('jwt', {session: false}), (req, res) => {
	const offset = req.params.offset;
	const rows = req.query.rows;
	const sql = `SELECT * from nfts 
							 WHERE chainId = ${req.params.chainId} and lower(nftAddress) = '${req.params.nftAddress.toLowerCase()}' 
							 and lower(owner) = '${req.user.address.toLowerCase()}'
							 ${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
	connection.query(sql, (err, results, fields) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Fetch all nfts fail'
		})
		else {
			return res.status(200).json({
				success: true,
				count: results.length,
				list: results
			})
		}
	})
})

/**
 * @method GET
 * @route GET api/items/get_my_unlist_nfts/:chainId/:nftAddress
 * @desc get all of my unlisted nft for nft contract
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param offset
 * @param rows
 */
 router.get('/get_my_unlist_nfts/:chainId/:nftAddress', passport.authenticate('jwt', {session: false}), (req, res) => {
	const offset = req.params.offset;
	const rows = req.query.rows;
	const sql = `SELECT * from nfts 
							 WHERE chainId = ${req.params.chainId} and lower(nftAddress) = '${req.params.nftAddress.toLowerCase()}' 
							 and lower(owner) = '${req.user.address.toLowerCase()}' and status = 0
							 ${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
		connection.query(sql, (err, results, fields) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Fetch unlisted nfts fail'
		})
		else {
			return res.status(200).json({
				success: true,
				count: results.length,
				list: results
			})
		}
	})
})

/**
 * @method GET
 * @route GET api/items/get_my_listable_nfts/:chainId/:nftAddress
 * @desc get all of my listable nft for nft contract
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param offset
 * @param rows
 */
 router.get('/get_my_listable_nfts/:chainId/:nftAddress', passport.authenticate('jwt', {session: false}), (req, res) => {
	const offset = req.params.offset;
	const rows = req.query.rows;
	const sql = `SELECT * from nfts 
							 WHERE chainId = ${req.params.chainId} and lower(nftAddress) = '${req.params.nftAddress.toLowerCase()}' 
							 and lower(owner) = '${req.user.address.toLowerCase()}' and status = 1
							 ${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
	connection.query(sql, (err, results, fields) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Fetch listable nfts fail'
		})
		else {
			return res.status(200).json({
				success: true,
				count: results.length,
				list: results
			})
		}
	})
})

/**
 * @method GET
 * @route GET api/items/get_my_listed_nfts/:chainId/:contractAddress/:nftAddress
 * @desc get all of my nft for nft contract
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param contractAddress Address of marketplace smart contract
 * @param offset
 * @param rows
 */
 router.get('/get_my_listed_nfts/:chainId/:contractAddress/:nftAddress', passport.authenticate('jwt', {session: false}), (req, res) => {
	const offset = req.params.offset;
	const rows = req.query.rows;
	const sql = `SELECT * from nfts as n left join orders as o 
							on n.chainId = o.chainId and lower(n.nftAddress) = lower(o.nftAddress) and n.tokenId = o.tokenId
							WHERE n.chainId = ${req.params.chainId} and lower(n.nftAddress) = '${req.params.nftAddress.toLowerCase()}' 
							and lower(o.sellerAddress) = '${req.user.address.toLowerCase()}' and isNull(o.buyerAddress) 
							and lower(n.owner) = '${req.user.address.toLowerCase()}' and lower(o.contractAddress) = '${req.params.contractAddress.toLowerCase()}' 
							and o.cancelSale = 0
							${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
	// console.log(sql);
	connection.query(sql, (err, results, fields) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Fetch all listed nfts fail'
		})
		else {
			return res.status(200).json({
				success: true,
				count: results.length,
				list: results
			})
		}
	})
})

/** 
 * @method GET
 * @route GET api/items/get_my_sold_nfts/:chainId/:contractAddress/:nftAddress
 * @desc get all of my sold nft for nft contract
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param contractAddress Address of marketplace smart contract
 * @param offset
 * @param rows
 */
 router.get('/get_my_sold_nfts/:chainId/:contractAddress/:nftAddress', passport.authenticate('jwt', {session: false}), (req, res) => {
	const offset = req.params.offset;
	const rows = req.query.rows;
	const sql = `SELECT * from nfts n left join orders o
							on n.chainId = o.chainId and lower(n.nftAddress) = lower(o.nftAddress) and n.tokenId = o.tokenId
							where n.chainId = ${req.params.chainId} and lower(n.nftAddress) = '${req.params.nftAddress.toLowerCase()}' 
							and lower(o.sellerAddress) = '${req.user.address.toLowerCase()}' and not isNull(o.buyerAddress) 
							and lower(n.owner) = '${req.user.address.toLowerCase()}' and lower(o.contractAddress) = '${req.params.contractAddress.toLowerCase()}'
							${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
	// console.log(sql)
	connection.query(sql, (err, results, fields) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Fetch all sold nfts fail'
		})
		else {
			return res.status(200).json({
				success: true,
				count: results.length,
				list: results
			})
		}
	})
})

/**
 * @method GET
 * @route GET api/items/get_my_favour_nfts/:chainId/:nftAddress
 * @desc Get all my favourite nft details
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param offset
 * @param rows
 */
router.get('/get_my_favour_nfts/:chainId/:nftAddress', passport.authenticate('jwt', {session: false}), (req, res) => {
	const offset = req.params.offset;
	const rows = req.query.rows;
	const sql = `select * from favour f left join nfts n 
							on lower(n.nftAddress) = lower(f.nftAddress) and n.tokenId = f.tokenId and n.chainId = f.chainId 
							where lower(f.fromAddress) = '${req.user.address.toLowerCase()}' and lower(f.nftAddress) = '${req.params.nftAddress.toLowerCase()}' and f.chainId = ${req.params.chainId}
							${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
	connection.query(sql, (err, results, fields) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Fetch all of my favourite nfts fail'
		})
		else {
			return res.status(200).json({
				success: true,
				count: results.length,
				list: results
			})
		}
	})
})

/**
 * @method GET
 * @route GET api/items/get_my_staking_nfts/:chainId/:nftAddress
 * @desc Get all my staking nft details
 * @access Private
 * @auth JWT
 * @param chainId
 * @param nftAddress
 * @param offset
 * @param rows
 */
 router.get('/get_my_staking_nfts/:chainId/:nftAddress', passport.authenticate('jwt', {session: false}), (req, res) => {
	const offset = req.params.offset;
	const rows = req.query.rows;
	const sql = `select * from staking s left join nfts n 
							on lower(n.nftAddress) = lower(s.nftAddress) and n.tokenId = s.tokenId and n.chainId = s.chainId 
							where lower(s.fromAddress) = '${req.user.address.toLowerCase()}' and lower(s.nftAddress) = '${req.params.nftAddress.toLowerCase()}' and s.chainId = ${req.params.chainId}
							${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
	connection.query(sql, (err, results, fields) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Fetch all of my staking nfts fail'
		})
		else {
			return res.status(200).json({
				success: true,
				count: results.length,
				list: results
			})
		}
	})
})

// ======================= Below is Marketplace API ============================
/**
 * @method GET
 * @route GET api/items/get_nfts_order_by_create_time/:chainId/:nftAddress/:desc/:offset/:rows
 * @desc  Get nfts order by create time
 * @access Public
 * @param chainId
 * @param nftAddress
 * @param desc order by desc
 * @param offset
 * @param rows
 */
// router.get('/get_nfts_order_by_create_time/:chainId/:nftAddress/:desc/:offset/:rows', (req, res) => {
// 	const desc = req.params.desc === undefined ? '' : req.params.desc;
// 	const chainId = req.params.chainId;
// 	const nftAddress = req.params.nftAddress;
// 	const offset = req.params.offset;
// 	const rows = req.query.rows;
// 	const sql = `Select * from nfts where chainId = ${chainId} and lower(nftAddress) = '${nftAddress.toLowerCase()}' 
// 							 order by createAt ${desc} 
// 							 ${offset === undefined || rows === undefined ? '' : `limit ${offset}, ${rows}`}`;
// 	connection.query(sql, (err, results) => {
// 		if(err) return res.status(200).json({
// 			success: false,
// 			msg: 'Fetch NFTs order by create time fail'
// 		}) 
// 		else {
// 			return res.status(200).json({
// 				success: true,
// 				count: results.length,
// 				list: results
// 			})
// 		}
// 	})
// })

/**
 * @method POST
 * @route POST api/items/get_nfts/
 * @desc  Get nfts order by create time
 * @access Public
 * @param chainId
 * @param nftAddress
 * @param collection search by collection, optioned, set 1 to be available
 * @param category search by category, optioned, set 1 to be available
 * @param owner search by owner, optioned, set 1 to be available
 * @param status search by status, optioned, set 1 to be available
 * @param createAt order by create time, optioned, set 1 to be available
 * @param createAtDesc order by create time desc, optioned, set 1 to be available
 * @param price order by price, optioned, set 1 to be available
 * @param priceDesc order by price desc, optioned, set 1 to be available
 * @param staking order by staking, optioned, set 1 to be available
 * @param stakingDesc order by staking desc, optioned, set 1 to be available
 * @param like order by like, optioned, set 1 to be available
 * @param likeDesc order by like desc, optioned, set 1 to be available
 * @param tokenIdDesc order by tokenId desc, optioned, set 1 to be available
 * @param offset
 * @param rows
 * Default order by tokenId
 */
 router.post('/get_nfts', (req, res) => {
	// chainId, nftAddress
	// where: collection, category, owner, status
	// order by : createAt, price, staking, like, tokenId
	// Desc by: createAtDesc, priceDesc, stakingDesc, likeDesc, tokenIdDesc
	console.log("/get_nfts");
	let sql = 
		`select n.*, 
		o.auctionId, o.count, o.paymentToken, o.amount, o.sellerAddress, o.blockNumber, 
		o.transactionHash, o.action, o.createdAt, o.startingPrice, o.startDate, o.buyerAmount, 
		o.buyerAddress, o.buyerBlockNumber, o.buyerTransactionHash, o.buyerAction, o.buyerTimestamp, 
		o.cancelSale,
		s.amount as staking from nfts n 
		left join orders o 
		on n.chainId = o.chainId and lower(n.nftAddress) = lower(o.nftAddress) and n.tokenId = o.tokenId
		left join staking s
		on n.chainId = s.chainId and lower(n.nftAddress) = lower(s.nftAddress) and n.tokenId = s.tokenId
		where n.chainId = ${req.body.chainId} and lower(n.nftAddress) = '${req.body.nftAddress.toLowerCase()}' 
		${req.body.collection === undefined ? '' : `and n.collectionId = ${req.body.collection}`}
		${req.body.category === undefined ? '' : `and n.categoryId = ${req.body.category}`}
		${req.body.owner === undefined ? '' : `and n.owner = '${req.body.owner}'`}
		${req.body.status === undefined ? '' : `and n.status = ${req.body.status}`}
		order by 
		${req.body.createAt === undefined ? '' : `n.createAt * 1 ${req.body.createAtDesc === undefined ? '' : 'desc'},`}
		${req.body.price === undefined ? '' : `o.startingPrice * 1 ${req.body.priceDesc === undefined ? '' : 'desc'},`}
		${req.body.staking === undefined ? '' : `staking ${req.body.stakingDesc === undefined ? '' : 'desc'},`}
		${req.body.like === undefined ? '' : `n.favour ${req.body.likeDesc === undefined ? '' : 'desc'},`}
		n.tokenId ${req.body.tokenIdDesc === undefined ? '' : 'desc'}
		${req.body.offset === undefined || req.body.rows === undefined ? '' : `limit ${req.body.offset}, ${req.body.rows}`}`;
	// console.log(sql);
	connection.query(sql, (err, results) => {
		if(err) return res.status(200).json({
			success: false,
			msg: 'Fetch NFTs fail'
		}) 
		else {
			return res.status(200).json({
				success: true,
				count: results.length,
				list: results
			})
		}
	})
})

module.exports = router;