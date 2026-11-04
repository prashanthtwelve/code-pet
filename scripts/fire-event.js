const type = process.argv[2];

if (!type) {
  console.error('Usage: npm run fire-event -- <type>');
  process.exit(1);
}

fetch('http://127.0.0.1:4747/event', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ type }),
})
  .then(async (response) => {
    const body = await response.text();
    if (!response.ok) {
      console.error(`Event rejected (${response.status}): ${body}`);
      process.exitCode = 1;
      return;
    }
    console.log(body);
  })
  .catch((error) => {
    console.error(`Could not reach Code Pet at 127.0.0.1:4747: ${error.message}`);
    process.exitCode = 1;
  });
