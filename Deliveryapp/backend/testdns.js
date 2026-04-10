const https = require('https');
https.get('https://dns.google/resolve?name=_mongodb._tcp.amudhu-ice.tnpziik.mongodb.net&type=SRV', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const fs = require('fs');
    fs.writeFileSync('dns_log.txt', data);
  });
});
https.get('https://dns.google/resolve?name=amudhu-ice.tnpziik.mongodb.net&type=TXT', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const fs = require('fs');
    fs.writeFileSync('dns_log_txt.txt', data);
  });
});
