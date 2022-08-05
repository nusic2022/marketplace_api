### Requirements for front-end calling APIs

## Brief Description
This is a nft marketplace for music NFT and music player.

The author will upload his misic(MP3) and mint an NFT, but the minted NFTs can not be transferable right now untill some condition is satisfied.

Users can click the button to listen the music, if he like the music, he can click `like` button, save as favour, write comments and stake a token(named `CPT`). 

More like, more comments, and more staking, the score of the NFTs will be more higher. Untill the score touch a given number, the NFT will be transferable.

After the music NFTs are transferable, they can be listed to the marketplace with some given price and start to be exchanged. 

We use not only metamask to login on the blockchain, but also login with server.(All of the server side and APIs are done). So, the like, comments and favour data will be stored in the server's database(Mysql).

## 1. Framework
![](https://tva1.sinaimg.cn/large/e6c9d24egy1h4t9ugb85lj20uu0u0myq.jpg)
* Blue color: Done
* Green color: Will do.

## 2. About APIs
### 2.1 API BaseURI
* https: https://api.nusic.pro:8444
* http: http://api.nusic.pro:8089

### 2.2 Login with wallet
We are using `metamask` to login. Meanwhile, we also use `Bearer token` from the server after signing with `metamask` to get user's authentication to visit server.

So, there are 2 kinds of APIs, one is open for everyone, the other is only for the user's own account witch is loged in by `metamask` wallet.

The demo of login by `metamask` is: https://github.com/jackygu2006/wallet_login_sample, and demo Dapp: [vercel.com](https://wallet-login-sample.vercel.app/).

In the front-end code, the key code is in `/src/services/walletLogin`, and the API source code is: https://github.com/jackygu2006/nusic_nft_api.

### 2.3 Smart contracts have been deployed on testnet `Kovan`, chainId is `42`.
* NFTCore contract: `0xa5135c6e3C796DEb1413456a536Cc1Bb25B7Ad9a`

  source code: https://github.com/jackygu2006/nusic_contracts/blob/main/contracts/NusicNFTCore.sol

* NFTMarketplace: `0x70822a88b4F787AFD1073Bbd5d800f344BFf0c3B`

	cource code: https://github.com/jackygu2006/nusic_contracts/blob/main/contracts/NFTMarketplace.sol

* Staking token: `0xcAd78BFCE45549214EA2F68dc1f3E6DB9D8F8792`

  It's a standard ERC20.

## 3. Front-end page requirements
The core pages are: 
* 1- Home page: `/src/App.js`.
* 2- Create NFT page: `/src/pages/CreateItem/index.js`
* 3- Discovery marketplace page: `/src/pages/DiscoveryThree/index.js`, the users can choose NFTs by listed NFTs, unlisted NFTs, categories and collection. API of `get_nfts` will help to do this. After clicking the NFT, will open the `Item details page`.
* 4- My NFT page: 
  * Manager my minted NFTs, including unlisted and listed NFTs. Functions including listing NFTs, change listed NFTs' price, unlisting NFTs etc.
  * Manager my bought NFTs, the owner can re-sell these NFTs.
  * The operations of listing, changing price, unlisting or re-sell can not be done on the list. The user should click the nft, and open the item details page, and do all the operations.
* 5- Item details page: After click the NFT in the discovery page, will show this page. 
  * Users can see the status of NFT, such as name, description, cover image of musci, comments list, quantity of like, quantity of saving as favour, and staking list, the most important is score. 
  * And users can also buy NFT(if the NFT is already listed), see the history of exchange(if the NFT is already listed), listen the NFT music(Wherever it is listed or not), add like, save as favour, add comments, share the NFT page, and staking his own ERC20 tokens to support this NFT.
  * The buttons of different operation will be shown or hidden according to situation. For example: 
    * If the nft(not transferable/unlist) is owned by the user, show the buttons of `Share`.
    * If the nft(transferable) is owned by the user and not listed, show the buttons of `List`, `Share`. 
    * If the nft is owned by the user and already listed, show the buttons of `Change price` and `Unlist`, `Share`. 
    * If the nft(not transferable/unlisted) is not owned by the user, show the buttons of `Staking`, `Like`, `Comment`, `Save as favour`, and `Share`.
    * If the nft(transferable) is not owned by the user, show the buttons of `Buy`, `Staking`, `Like`, `Comment`, `Save as favour`, and `Share`.


These pages are just templates, we need to add or remvoe come componets as requirements. And these pages are core, we need some support pages also.

### 3.1 Create page
#### 3.1.1 UI update
## Workflow of creating NFT.
  * 1- Uploading `cover image` and `mp3` file to IPFS, get IPFS CID(hash).
  * 2- Fill all the details, like author, music name, description etc.(no price)
  * 3- Combining the hash of image and mp3, together with all details information to a JSON metadata.
  * 4- Uploading the metadata to IPFS, and get hash for this metadata.
  * 5- Call the `updateTokenURI` function in smart contract, and save the metadata hash to blockchain.
  * 6- Call API `/items/add_item` to save all above data to server.

## Area 1: Uploading 

![](https://tva1.sinaimg.cn/large/e6c9d24egy1h4udr6su9dj21pd0u0n1s.jpg)
* Cancel `Multiple images`, leave `Single image`, upload the image to IPFS, and save it as `image` tag in metadata json.
* `Upload file` for uploading `mp3` file to IPFS, and save it as `audio` tag in metadata json.
* While uploading image and audio file, show a Process bar.
* Before uploading the image, show a default image on the right side Image box.
* After uploaded the image, show it on the right side Image box.
* While uploading the image, check the size of file, less than 5M. And ratio of image is 500 * 368.
* While uploading audio files, check the size of MP3, less than 10M.
* After uploaded MP3, show a player components below the Image box. That means can try to listen the audio.
* Using `nft.storage` service for uploading images and audio files to IPFS.

## Area 2: Filling details

![](https://tva1.sinaimg.cn/large/e6c9d24egy1h4uebxjckbj20u00xtq44.jpg)
* The details information:
  * Music name: TextField, one line
  * Music description: TextField, multiple lines
  * Author name: TextField, one line
  * collection A select box, just show `Nusic`, and value is `1`
  * category A select box, get categories by API `/items/get_categories`
  * Singer: TextField, optioned
  * Lyricist: TextField, optioned
  * Composer: TextField, optioned
  * Lyrics: TextField, optioned
  * Royality: TextField, default is 5%

## JSON metadata data structure
```
{
	"name": "Music name",
	"description": "Music description",
	"attributes":[
		"author": "Author name",
		"collection": "collection name",
		"category": "Category name",
		"singer": "Singer name",
		"lyricist: "Lyricist name",
		"composer": "Composer",
		"lyrics": "Lyrics",
	],
	"royality": "Royality"
	"image": "IPFS hash url of cover image",
	"audio": "IPFS hash url of mp3"
}
```

## Key code of Uploading to IPFS 
Using `nft.storage` API by `yarn add nft.storage`

```
import { NFTStorage, File } from 'nft.storage'
const client = new NFTStorage({ token: NFT_STORAGE_TOKEN });

const imageFile = dataURLtoFile(base64, 'image.png');

const dataURLtoFile = (dataurl, filename) => { 
	var arr = dataurl.split(','),
		mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]), 
		n = bstr.length,
		u8arr = new Uint8Array(n);
	while(n--){
			u8arr[n] = bstr.charCodeAt(n);
	}
	return new File([u8arr], filename, {type: mime});
}

const uploadNFT = async(
	imageFile, 
	metadata, 
	royality
) => {
	const metadata = await client.store({
		name: NFT_NAME + ' #' + tokenId,
		description: NFT_DESCRIPTION,
		image: imageFile,
		image_url: imageFile,
		external_url: "https://nusic.pro",
		royality,
		attributes: metadata,
	})
}
```

### 3.2 Discovery page

### 3.3 Home page

### 3.4 Item details page

### 3.5 My NFT page

## Schedule
* All of aboved pages should be done before Aug.17, and we need another one week to test and see what we need to improve.
* This project is planed to be launched Aug.25.
  