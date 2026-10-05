const dns = require('dns').promises;
const https = require('https');
const net = require('net');

const MAX_RESPONSE_BYTES = 1024 * 1024;
const MAX_ARTICLE_CHARACTERS = 30000;
const REQUEST_TIMEOUT_MS = 8000;

const isPublicIpv4 = (address) => {
  if (net.isIP(address) !== 4) return false;
  const octets = address.split('.').map(Number);
  const [first, second, third] = octets;
  if (
    first === 0 || first === 10 || first === 127 || first >= 224 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 88 && third === 99) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113)
  ) {
    return false;
  }
  return true;
};

const resolvePublicIpv4 = async (hostname) => {
  if (net.isIP(hostname) === 4) {
    if (isPublicIpv4(hostname)) return hostname;
    throw Object.assign(new Error('Unsafe article host.'), { code: 'ARTICLE_HOST_BLOCKED' });
  }
  if (net.isIP(hostname) === 6) {
    throw Object.assign(new Error('IPv6 article hosts are not supported by safe retrieval.'), { code: 'ARTICLE_IPV6_UNSUPPORTED' });
  }

  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  if (!records.length || records.some((record) => !isPublicIpv4(record.address))) {
    throw Object.assign(new Error('Article host did not resolve only to public addresses.'), { code: 'ARTICLE_HOST_BLOCKED' });
  }
  return records[0].address;
};

const decodeHtml = (text) => text
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&#(\d+);/g, (_, value) => String.fromCodePoint(Number(value)))
  .replace(/&#x([0-9a-f]+);/gi, (_, value) => String.fromCodePoint(parseInt(value, 16)));

const extractArticleText = (html) => {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtml(titleMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()) : '';
  const text = decodeHtml(
    html
      .replace(/<(script|style|noscript|svg|nav|header|footer|form)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(?:br|\/p|\/div|\/article|\/section|\/h[1-6]|\/li)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim().slice(0, MAX_ARTICLE_CHARACTERS);

  return { title, text };
};

const fetchArticleContent = async (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error('Article URL is invalid.'), { code: 'ARTICLE_URL_INVALID' });
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443')
  ) {
    throw Object.assign(new Error('Only public HTTPS article URLs can be retrieved.'), { code: 'ARTICLE_URL_BLOCKED' });
  }

  const pinnedAddress = await resolvePublicIpv4(url.hostname);
  const response = await new Promise((resolve, reject) => {
    const request = https.request(url, {
      method: 'GET',
      headers: {
        accept: 'text/html, text/plain;q=0.9',
        'accept-encoding': 'identity',
        'user-agent': 'TrustLens-SafeArticleFetcher/1.0'
      },
      lookup: (hostname, options, callback) => {
        if (options?.all) {
          callback(null, [{ address: pinnedAddress, family: 4 }]);
        } else {
          callback(null, pinnedAddress, 4);
        }
      }
    }, (res) => {
      const chunks = [];
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_RESPONSE_BYTES) {
          request.destroy(Object.assign(new Error('Article response exceeded the size limit.'), { code: 'ARTICLE_TOO_LARGE' }));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => resolve({
        statusCode: res.statusCode || 0,
        contentType: String(res.headers['content-type'] || '').toLowerCase(),
        body: Buffer.concat(chunks).toString('utf8')
      }));
      res.on('error', reject);
    });
    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(Object.assign(new Error('Article fetch timed out.'), { code: 'ARTICLE_TIMEOUT' }));
    });
    request.on('error', reject);
    request.end();
  });

  if (response.statusCode >= 300 && response.statusCode < 400) {
    throw Object.assign(new Error('Article redirects are not followed for safety.'), { code: 'ARTICLE_REDIRECT_BLOCKED' });
  }
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw Object.assign(new Error('Article server returned an unsuccessful response.'), { code: 'ARTICLE_HTTP_ERROR' });
  }
  if (!response.contentType.includes('text/html') && !response.contentType.includes('text/plain')) {
    throw Object.assign(new Error('Article URL did not return HTML or plain text.'), { code: 'ARTICLE_CONTENT_TYPE_UNSUPPORTED' });
  }

  const extracted = response.contentType.includes('text/html')
    ? extractArticleText(response.body)
    : { title: '', text: response.body.slice(0, MAX_ARTICLE_CHARACTERS).trim() };

  return {
    ...extracted,
    sourceUrl: `${url.origin}${url.pathname}`,
    sourceType: 'retrieved'
  };
};

module.exports = {
  fetchArticleContent,
  extractArticleText,
  isPublicIpv4
};
