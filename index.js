const {send, json} = require(`micro`);
const fetch = require(`node-fetch`);

// gather config.
const client_id = process.env.GH_CLIENT_ID;
const client_secret = process.env.GH_CLIENT_SECRET;
const apps = process.env.APPS && JSON.parse(process.env.APPS);

// validate config
if (!client_id) throw new Error('process.env.GH_CLIENT_ID required');
if (!client_secret) throw new Error('process.env.GH_CLIENT_SECRET required');
if (!apps) throw new Error('process.env.APPS required');

if (process.env.DEBUG) {
  console.log('test_url');
  console.log(`https://github.com/login/oauth/authorize?client_id=${process.env.GH_CLIENT_ID}&scope=repo,user&redirect_uri=${encodeURIComponent('http://localhost:3000/?app_id=default')}`);
}

// help function for parsing urls. 
function parseURI(req) {
  const uri = { path: null, qs: null, pairs: null, query: {} };
  [uri.path, uri.qs]  = req.url.split(`?`);
  if (!uri.qs) return uri;
  uri.pairs = uri.qs.split(`&`);
  uri.pairs.forEach((pair) => {
    if (!pair) return;
    const [key, value] = pair.split(`=`);
    uri.query[key] = value;
  });
  return uri;
}

module.exports = async (req, res) => { 
  // we only respond to groot!  (oh so cute...)
  if (req.url != `/` && req.url.substring(0,2) != '/?') return send(res, 404, "404 NOT FOUND");

  // access control headers, 
  res.setHeader(`Access-Control-Allow-Origin`, `*`); 
	res.setHeader(`Access-Control-Allow-Methods`, `GET, OPTIONS`); 
  res.setHeader(`Access-Control-Allow-Headers`, `Content-Type`);
  if (req.method == `OPTIONS`) return send(res, 200);

  const uri = parseURI(req);
  if (!uri.query.code) return send(res, 400, `400 code QUERY PARAM IS REQUIRED`);
  if (!uri.query.app_id) return send(res, 400, `400 app_id QUERY PARAM IS REQUIRED`);
  if (!apps[uri.query.app_id]) return send(res, 404, `404 app_id(${uri.query.app_id}) NOT FOUND`)

  const response = await fetch(`https://github.com/login/oauth/access_token`, { 
    method: `POST`, 
    body: JSON.stringify({ client_id, client_secret, code: uri.query.code}),
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (response.status != 200) return send(res, response.status, response.statusText);
  
  const token = await response.text();
  res.setHeader(`Location`, `${apps[uri.query.app_id].callback}?${token}`)
  send(res, 302, { token, uri });
}