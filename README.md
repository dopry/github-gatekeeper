# Micro GateKeeper

This service enables the authentication of SPA's against Github. 

## Security

This application proxies your github credentials. Be mindul to alway run this behind and SSL proxy, 
lest an enterprising hacker hijack your github account. 

I'll package this and corresponding https server as soon as I get a chance, in the mean time here is an example. 

```
const https = require('https')
const { run, send } = require('micro')
const gatekeeper = require('https://github.com/dopry/micro-gatekeeper#master');
const cert = require('openssl-self-signed-certificate')

const PORT = process.env.PORT || 3443

const options = {
  key: cert.key,
  cert: cert.cert,
  passphrase: cert.passphrase
}

const microHttps = fn => https.createServer(options, (req, res) => run(req, res, fn))

const server = microHttps(gatekeeper);

server.listen(PORT)
console.log(`Listening on https://localhost:${PORT}`)
```

## Configuration
1. Create a Github OAuth App.
2. Set the Github OAuth callback url to your gatekeeper URL.
3. Setup the local environment variables for micro gatekeeper.

```
GH_CLIENT_ID=... 
GH_CLIENT_SECRET =... 
APPS={ 
        app_id: {
            "callback": "https://app_id/callback_url" // url we want user to land on when completed. 
        }
} 
```

## OAuth 2.0 Implicit Flow Proxy 

1. SPA GET https://github.com/login/oauth/authorize?client_id=${process.env.GH_CLIENT_ID}&scope=${req.query.scope || 'repo,user'}&redirect_uri=urlEncodeComponent(http://${gatekeeper}/auth/github/callback?app_id=${app_id})
1. Github AUTHENICATES user
1. Github REDIRECTS to //${gatekeeper}/?app_id=${app_id}&code=${code}
1. GateKeeper FETCHES token with code.
1. GateKeeper REDIRECTS to ${APP[app_id].callback}?access_token=${token}&scope=${scope}&token_type=${token_type}
