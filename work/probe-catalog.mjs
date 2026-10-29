for (const url of [
  'https://gutendex.com/books?topic=history&languages=en',
  'https://www.gutenberg.org/ebooks/search/?query=history',
]) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    console.log(JSON.stringify({ url, status: response.status, contentType: response.headers.get('content-type'), body: (await response.text()).slice(0, 1200) }));
  } catch (error) { console.log(JSON.stringify({ url, error: error.message })); }
}
